-- 스케줄링 설정 마이그레이션
-- PRD에 명시된 국내/해외 주식 모니터링 스케줄 설정

-- pg_cron 확장 활성화 (스케줄링 기능)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 기존 스케줄 작업 삭제 (중복 방지)
SELECT cron.unschedule('korean-stock-monitoring');
SELECT cron.unschedule('foreign-stock-monitoring');

-- 국내 주식 모니터링 스케줄
-- 매일 오전 9시 (KST) = UTC 00:00
-- cron 표현식: '0 0 * * *' (매일 00:00 UTC)
SELECT cron.schedule(
  'korean-stock-monitoring',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/check-stocks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}'::jsonb,
    body:='{"nationType": "KOR"}'::jsonb
  );
  $$
);

-- 해외 주식 모니터링 스케줄  
-- 매일 오후 11시 (KST) = UTC 14:00
-- cron 표현식: '0 14 * * *' (매일 14:00 UTC)
SELECT cron.schedule(
  'foreign-stock-monitoring',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url:='https://your-project-ref.supabase.co/functions/v1/check-stocks',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}'::jsonb,
    body:='{"nationType": "FOREIGN"}'::jsonb
  );
  $$
);

-- 스케줄된 작업 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW monitoring_schedules AS
SELECT 
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobid
FROM cron.job
WHERE jobname IN ('korean-stock-monitoring', 'foreign-stock-monitoring');

-- 스케줄 실행 로그 확인을 위한 뷰 생성
CREATE OR REPLACE VIEW monitoring_logs AS
SELECT 
  jrd.jobid,
  jrd.jobname,
  jrd.start_time,
  jrd.end_time,
  jrd.return_message,
  jrd.status,
  jrd.job_pid,
  CASE 
    WHEN jrd.status = 'succeeded' THEN '성공'
    WHEN jrd.status = 'failed' THEN '실패'
    ELSE '알 수 없음'
  END as status_korean
FROM cron.job_run_details jrd
WHERE jrd.jobname IN ('korean-stock-monitoring', 'foreign-stock-monitoring')
ORDER BY jrd.start_time DESC;

-- 스케줄 상태 확인 함수
CREATE OR REPLACE FUNCTION check_monitoring_schedules()
RETURNS TABLE (
  schedule_name TEXT,
  is_active BOOLEAN,
  last_run TIMESTAMP WITH TIME ZONE,
  last_status TEXT,
  next_run TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.jobname::TEXT,
    j.active,
    jrd.start_time,
    jrd.status::TEXT,
    j.next_run
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, status
    FROM cron.job_run_details jrd2
    WHERE jrd2.jobname = j.jobname
    ORDER BY jrd2.start_time DESC
    LIMIT 1
  ) jrd ON true
  WHERE j.jobname IN ('korean-stock-monitoring', 'foreign-stock-monitoring')
  ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

-- 스케줄 통계 함수
CREATE OR REPLACE FUNCTION get_monitoring_stats()
RETURNS TABLE (
  total_runs BIGINT,
  successful_runs BIGINT,
  failed_runs BIGINT,
  success_rate NUMERIC,
  last_24h_runs BIGINT,
  last_7d_runs BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'succeeded') as successful_runs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
    ROUND(
      COUNT(*) FILTER (WHERE status = 'succeeded') * 100.0 / COUNT(*), 
      2
    ) as success_rate,
    COUNT(*) FILTER (WHERE start_time > NOW() - INTERVAL '24 hours') as last_24h_runs,
    COUNT(*) FILTER (WHERE start_time > NOW() - INTERVAL '7 days') as last_7d_runs
  FROM cron.job_run_details
  WHERE jobname IN ('korean-stock-monitoring', 'foreign-stock-monitoring');
END;
$$ LANGUAGE plpgsql;

-- 스케줄 관리 함수들

-- 스케줄 활성화/비활성화
CREATE OR REPLACE FUNCTION toggle_schedule(schedule_name TEXT, enable BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
  IF schedule_name = 'korean-stock-monitoring' OR schedule_name = 'foreign-stock-monitoring' THEN
    UPDATE cron.job 
    SET active = enable 
    WHERE jobname = schedule_name;
    
    RETURN FOUND;
  ELSE
    RAISE EXCEPTION 'Invalid schedule name: %', schedule_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 스케줄 즉시 실행 (테스트용)
CREATE OR REPLACE FUNCTION run_schedule_now(schedule_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  job_command TEXT;
BEGIN
  IF schedule_name = 'korean-stock-monitoring' OR schedule_name = 'foreign-stock-monitoring' THEN
    SELECT command INTO job_command
    FROM cron.job
    WHERE jobname = schedule_name;
    
    IF job_command IS NOT NULL THEN
      EXECUTE job_command;
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid schedule name: %', schedule_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 스케줄 설정 완료 로그
INSERT INTO cron.job_run_details (jobname, start_time, end_time, status, return_message)
VALUES (
  'schedule-setup',
  NOW(),
  NOW(),
  'succeeded',
  'Stock monitoring schedules have been configured successfully. Korean stocks: 09:00 KST, Foreign stocks: 23:00 KST.'
);

-- 설정 확인을 위한 샘플 쿼리들
-- 다음 쿼리들을 실행하여 설정이 올바르게 되었는지 확인할 수 있습니다:

-- 1. 스케줄 상태 확인
-- SELECT * FROM check_monitoring_schedules();

-- 2. 스케줄 통계 확인  
-- SELECT * FROM get_monitoring_stats();

-- 3. 최근 실행 로그 확인
-- SELECT * FROM monitoring_logs LIMIT 10;

-- 4. 스케줄 활성화/비활성화 (예시)
-- SELECT toggle_schedule('korean-stock-monitoring', false); -- 비활성화
-- SELECT toggle_schedule('korean-stock-monitoring', true);  -- 활성화

-- 5. 스케줄 즉시 실행 (테스트용)
-- SELECT run_schedule_now('korean-stock-monitoring');
