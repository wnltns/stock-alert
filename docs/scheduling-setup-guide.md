# Supabase 스케줄링 설정 가이드

## 1. 환경 변수 설정

Supabase 프로젝트의 Edge Functions에 다음 환경 변수를 설정해야 합니다:

```bash
# Supabase 설정
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase Cloud Messaging 설정
FCM_SERVER_KEY=your_fcm_server_key

# 모니터링 스케줄 설정 (PRD에 명시된 시간, 한국 시간대 기준)
KOREAN_MARKET_CHECK_TIME=09:00
FOREIGN_MARKET_CHECK_TIME=23:00
MONITORING_TIMEZONE=Asia/Seoul
```

## 2. Supabase CLI를 통한 환경 변수 설정

```bash
# 환경 변수 설정
supabase secrets set SUPABASE_URL=your_supabase_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key
supabase secrets set KOREAN_MARKET_CHECK_TIME=09:00
supabase secrets set FOREIGN_MARKET_CHECK_TIME=23:00
supabase secrets set MONITORING_TIMEZONE=Asia/Seoul
```

## 3. 스케줄링 설정

### 방법 1: Supabase Dashboard에서 설정

1. Supabase Dashboard → Database → Cron Jobs
2. 다음 cron 작업들을 추가:

**국내 주식 모니터링 (매일 오전 9시 KST)**
```sql
-- 매일 오전 9시 (KST) - 데이터베이스가 한국 시간대로 설정됨
SELECT cron.schedule(
  'korean-stock-monitoring',
  '0 9 * * *',
  'SELECT net.http_post(
    url:=''https://your-project-ref.supabase.co/functions/v1/check-stocks'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}''::jsonb,
    body:=''{"nationType": "KOR"}''::jsonb
  );'
);
```

**해외 주식 모니터링 (매일 오후 11시 KST)**
```sql
-- 매일 오후 11시 (KST) - 데이터베이스가 한국 시간대로 설정됨
SELECT cron.schedule(
  'foreign-stock-monitoring',
  '0 23 * * *',
  'SELECT net.http_post(
    url:=''https://your-project-ref.supabase.co/functions/v1/check-stocks'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}''::jsonb,
    body:=''{"nationType": "FOREIGN"}''::jsonb
  );'
);
```

### 방법 2: SQL 마이그레이션으로 설정

다음 SQL을 마이그레이션 파일로 생성:

```sql
-- pg_cron 확장 활성화
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 국내 주식 모니터링 스케줄 (매일 오전 9시 KST)
SELECT cron.schedule(
  'korean-stock-monitoring',
  '0 0 * * *',
  'SELECT net.http_post(
    url:=''https://your-project-ref.supabase.co/functions/v1/check-stocks'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}''::jsonb,
    body:=''{"nationType": "KOR"}''::jsonb
  );'
);

-- 해외 주식 모니터링 스케줄 (매일 오후 11시 KST)
SELECT cron.schedule(
  'foreign-stock-monitoring',
  '0 14 * * *',
  'SELECT net.http_post(
    url:=''https://your-project-ref.supabase.co/functions/v1/check-stocks'',
    headers:=''{"Content-Type": "application/json", "Authorization": "Bearer your-anon-key"}''::jsonb,
    body:=''{"nationType": "FOREIGN"}''::jsonb
  );'
);
```

## 4. Edge Function 배포

```bash
# Edge Function 배포
supabase functions deploy check-stocks

# 로컬 테스트
supabase functions serve check-stocks
```

## 5. 테스트 방법

### 수동 테스트
```bash
# 테스트 API 엔드포인트 호출
curl -X POST http://localhost:3000/api/test-monitoring \
  -H "Content-Type: application/json" \
  -d '{"testMode": true, "nationType": "KOR"}'
```

### 스케줄링 테스트
```sql
-- 스케줄된 작업 확인
SELECT * FROM cron.job;

-- 스케줄된 작업 실행 로그 확인
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

## 6. 모니터링 및 디버깅

### 로그 확인
```bash
# Edge Function 로그 확인
supabase functions logs check-stocks

# 실시간 로그 모니터링
supabase functions logs check-stocks --follow
```

### 데이터베이스 모니터링
```sql
-- 알림 조건 상태 확인
SELECT 
  ss.stock_name,
  ss.stock_code,
  ac.condition_type,
  ac.threshold,
  ac.cumulative_change_rate,
  ac.tracking_started_at,
  ac.tracking_ended_at,
  ac.last_checked_at
FROM alert_conditions ac
JOIN stock_subscriptions ss ON ac.subscription_id = ss.id
WHERE ac.is_active = true
ORDER BY ac.last_checked_at DESC;

-- 최근 알림 기록 확인
SELECT 
  n.*,
  ss.stock_name,
  ss.stock_code
FROM notifications n
JOIN stock_subscriptions ss ON n.subscription_id = ss.id
ORDER BY n.sent_at DESC
LIMIT 10;
```

## 7. 문제 해결

### 일반적인 문제들

1. **스케줄이 실행되지 않는 경우**
   - pg_cron 확장이 활성화되어 있는지 확인
   - cron 작업이 올바르게 등록되었는지 확인
   - Edge Function이 배포되었는지 확인

2. **FCM 알림이 발송되지 않는 경우**
   - FCM 서버 키가 올바르게 설정되었는지 확인
   - 사용자의 FCM 토큰이 등록되어 있는지 확인
   - 브라우저 알림 권한이 허용되어 있는지 확인

3. **주가 데이터를 가져올 수 없는 경우**
   - 네이버 API 엔드포인트가 올바른지 확인
   - User-Agent 헤더가 설정되어 있는지 확인
   - API 응답 형식이 변경되지 않았는지 확인

### 로그 레벨 조정
```bash
# 상세 로깅 활성화
supabase secrets set LOG_LEVEL=debug
supabase secrets set ENABLE_DETAILED_LOGGING=true
```
