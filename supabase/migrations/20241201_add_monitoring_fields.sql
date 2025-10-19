-- 알림 모니터링 기능을 위한 필드 추가
-- PRD에 따른 누적 변동률 및 추적 기간 관리

-- alert_conditions 테이블에 누적 변동률 및 추적 기간 필드 추가
ALTER TABLE alert_conditions 
ADD COLUMN IF NOT EXISTS cumulative_change_rate DECIMAL(5,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS tracking_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_ended_at TIMESTAMP WITH TIME ZONE;

-- stock_subscriptions 테이블에 국가 타입 및 API 정보 필드 추가
ALTER TABLE stock_subscriptions 
ADD COLUMN IF NOT EXISTS nation_type VARCHAR(10) DEFAULT 'KOR' CHECK (nation_type IN ('KOR', 'FOREIGN')),
ADD COLUMN IF NOT EXISTS api_info JSONB,
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);

-- notifications 테이블 구조 업데이트 (PRD에 맞게)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS triggered_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS delivery_confirmed_at BOOLEAN DEFAULT FALSE;

-- fcm_tokens 테이블에 디바이스 정보 필드 추가
ALTER TABLE fcm_tokens 
ADD COLUMN IF NOT EXISTS device_info JSONB,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_conditions_cumulative_rate ON alert_conditions(cumulative_change_rate);
CREATE INDEX IF NOT EXISTS idx_conditions_tracking_started ON alert_conditions(tracking_started_at);
CREATE INDEX IF NOT EXISTS idx_conditions_tracking_ended ON alert_conditions(tracking_ended_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_nation_type ON stock_subscriptions(nation_type);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_last_used ON fcm_tokens(last_used_at);

-- 제약조건 추가
ALTER TABLE alert_conditions 
ADD CONSTRAINT IF NOT EXISTS chk_cumulative_rate_range 
CHECK (cumulative_change_rate >= -100 AND cumulative_change_rate <= 100);

-- 기존 데이터에 대한 기본값 설정
UPDATE alert_conditions 
SET tracking_started_at = created_at,
    tracking_ended_at = created_at + INTERVAL '1 day' * period_days
WHERE tracking_started_at IS NULL;

-- 주식 구독에 기본 API 정보 설정 (예시)
UPDATE stock_subscriptions 
SET api_info = jsonb_build_object(
    'url', 'https://polling.finance.naver.com/api/realtime/domestic/stock/' || stock_code,
    'type', 'naver'
)
WHERE api_info IS NULL AND nation_type = 'KOR';
