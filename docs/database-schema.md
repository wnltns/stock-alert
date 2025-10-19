# StockAlert 데이터베이스 스키마 설계

## 개요
StockAlert 앱의 데이터베이스 스키마 설계 문서입니다. 주식 구독, 알림 조건, 사용자 관리 등의 핵심 기능을 지원하는 테이블 구조와 관계를 정의합니다.

## 테이블 목록
1. **users** - 사용자 정보 (Supabase Auth 연동)
2. **stock_subscriptions** - 주식 구독 정보
3. **alert_conditions** - 알림 조건
4. **notifications** - 알림 발송 기록 (향후 구현)
5. **fcm_tokens** - 푸시 알림 토큰 관리 (향후 구현)
6. **app_settings** - 앱 설정 (향후 구현)

---

## 1. users 테이블
사용자 기본 정보를 저장합니다. **Supabase Auth와 연동되어 자동으로 관리됩니다.**

```sql
-- Supabase Auth에서 자동 생성되는 테이블
-- auth.users 테이블을 참조하여 사용자 정보 관리
```

### 필드 설명 (Supabase Auth 연동)
- `id`: 사용자 고유 식별자 (UUID) - Supabase Auth에서 제공
- `email`: 이메일 주소 (로그인 ID) - Supabase Auth에서 제공
- `created_at`: 계정 생성일 - Supabase Auth에서 제공
- `updated_at`: 정보 수정일 - Supabase Auth에서 제공

---

## 2. stock_subscriptions 테이블
사용자가 구독한 주식 정보를 저장합니다.

```sql
CREATE TABLE stock_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stock_code VARCHAR(10) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    market VARCHAR(20) NOT NULL, -- 'KOSPI', 'KOSDAQ', 'NASDAQ', 'NYSE'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, stock_code)
);
```

### 필드 설명
- `id`: 구독 고유 식별자
- `user_id`: 사용자 ID (외래키)
- `stock_code`: 주식 코드 (예: "005930")
- `stock_name`: 주식명 (예: "삼성전자")
- `market`: 시장 구분
- `is_active`: 구독 활성화 상태

---

## 3. alert_conditions 테이블
알림 조건 설정을 저장합니다.

```sql
CREATE TABLE alert_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES stock_subscriptions(id) ON DELETE CASCADE,
    condition_type VARCHAR(10) NOT NULL, -- 'rise', 'drop'
    threshold DECIMAL(5,2) NOT NULL, -- 등락률 (%)
    period_days INTEGER NOT NULL DEFAULT 1, -- 기간 (일)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    tracking_started_at TIMESTAMP WITH TIME ZONE, -- 추적 시작일
    tracking_ended_at TIMESTAMP WITH TIME ZONE, -- 추적 종료일
    
    CHECK (threshold > 0 AND threshold <= 100),
    CHECK (period_days > 0 AND period_days <= 30)
);
```

### 필드 설명
- `id`: 조건 고유 식별자
- `subscription_id`: 주식 구독 ID (외래키)
- `condition_type`: 조건 유형 ('rise': 상승, 'drop': 하락)
- `threshold`: 등락률 임계값 (%)
- `period_days`: 조건 적용 기간 (일)
- `is_active`: 조건 활성화 상태
- `last_checked_at`: 마지막 조건 체크 시간
- `tracking_started_at`: 추적 시작일 (조건 등록/수정/초기화 시점)
- `tracking_ended_at`: 추적 종료일 (tracking_started_at + period_days)

---

## 4. notifications 테이블 (향후 구현)
알림 발송 기록을 저장합니다. **현재는 구현되지 않았으며, 푸시 알림 기능 구현 시 추가될 예정입니다.**

```sql
-- 향후 구현 예정
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES stock_subscriptions(id) ON DELETE CASCADE,
    condition_id UUID NOT NULL REFERENCES alert_conditions(id) ON DELETE CASCADE,
    notification_type VARCHAR(20) NOT NULL DEFAULT 'push', -- 'push', 'email', 'sms'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    delivery_confirmed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);
```

### 필드 설명 (향후 구현)
- `id`: 알림 고유 식별자
- `user_id`: 사용자 ID (Supabase Auth 연동)
- `subscription_id`: 주식 구독 ID
- `condition_id`: 알림 조건 ID
- `notification_type`: 알림 유형
- `title`: 알림 제목
- `message`: 알림 메시지
- `sent_at`: 발송 시간
- `delivery_status`: 전달 상태
- `delivery_confirmed_at`: 전달 확인 시간
- `error_message`: 오류 메시지

---

## 5. fcm_tokens 테이블 (향후 구현)
Firebase Cloud Messaging 토큰을 관리합니다. **현재는 구현되지 않았으며, 푸시 알림 기능 구현 시 추가될 예정입니다.**

```sql
-- 향후 구현 예정
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- 'web', 'android', 'ios'
    device_info JSONB, -- 디바이스 정보
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, token)
);
```

### 필드 설명 (향후 구현)
- `id`: 토큰 고유 식별자
- `user_id`: 사용자 ID (Supabase Auth 연동)
- `token`: FCM 토큰
- `device_type`: 디바이스 유형
- `device_info`: 디바이스 정보 (JSON)
- `is_active`: 토큰 활성화 상태
- `last_used_at`: 마지막 사용 시간

---

## 6. app_settings 테이블 (향후 구현)
앱 설정 정보를 저장합니다. **현재는 구현되지 않았으며, 사용자 설정 기능 구현 시 추가될 예정입니다.**

```sql
-- 향후 구현 예정
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, setting_key)
);
```

### 필드 설명 (향후 구현)
- `id`: 설정 고유 식별자
- `user_id`: 사용자 ID (Supabase Auth 연동)
- `setting_key`: 설정 키
- `setting_value`: 설정 값
- `setting_type`: 설정 값 타입

### 주요 설정 키 (향후 구현)
- `auto_check_time`: 자동 조회 시간 (기본값: 18)
- `notification_enabled`: 알림 활성화 여부
- `email_notifications`: 이메일 알림 여부
- `timezone`: 사용자 시간대

---

## 데이터베이스 관계도

**현재 구현된 테이블들만 표시됩니다. 향후 구현 예정인 테이블들은 점선으로 표시됩니다.**

```mermaid
erDiagram
    auth_users ||--o{ stock_subscriptions : "구독"
    auth_users ||--o{ notifications : "알림받음(향후)"
    auth_users ||--o{ fcm_tokens : "토큰보유(향후)"
    auth_users ||--o{ app_settings : "설정보유(향후)"
    
    stock_subscriptions ||--o{ alert_conditions : "조건설정"
    stock_subscriptions ||--o{ notifications : "알림발송(향후)"
    
    alert_conditions ||--o{ notifications : "조건충족(향후)"
    
    auth_users {
        uuid id PK
        varchar email UK
        timestamp created_at
        timestamp updated_at
    }
    
    stock_subscriptions {
        uuid id PK
        uuid user_id FK
        varchar stock_code
        varchar stock_name
        varchar market
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    alert_conditions {
        uuid id PK
        uuid subscription_id FK
        varchar condition_type
        decimal threshold
        integer period_days
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp last_checked_at
        timestamp tracking_started_at
        timestamp tracking_ended_at
    }
    
    notifications {
        uuid id PK
        uuid user_id FK
        uuid subscription_id FK
        uuid condition_id FK
        varchar notification_type
        varchar title
        text message
        timestamp sent_at
        varchar delivery_status
        timestamp delivery_confirmed_at
        text error_message
    }
    
    fcm_tokens {
        uuid id PK
        uuid user_id FK
        varchar token
        varchar device_type
        jsonb device_info
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp last_used_at
    }
    
    app_settings {
        uuid id PK
        uuid user_id FK
        varchar setting_key
        text setting_value
        varchar setting_type
        timestamp created_at
        timestamp updated_at
    }
```

---

## 인덱스 설계

### 성능 최적화를 위한 인덱스

```sql
-- 사용자 관련 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- 주식 구독 관련 인덱스
CREATE INDEX idx_subscriptions_user_id ON stock_subscriptions(user_id);
CREATE INDEX idx_subscriptions_stock_code ON stock_subscriptions(stock_code);
CREATE INDEX idx_subscriptions_active ON stock_subscriptions(is_active);
CREATE INDEX idx_subscriptions_user_stock ON stock_subscriptions(user_id, stock_code);

-- 알림 조건 관련 인덱스
CREATE INDEX idx_conditions_subscription_id ON alert_conditions(subscription_id);
CREATE INDEX idx_conditions_active ON alert_conditions(is_active);
CREATE INDEX idx_conditions_last_checked ON alert_conditions(last_checked_at);
CREATE INDEX idx_conditions_tracking_started ON alert_conditions(tracking_started_at);
CREATE INDEX idx_conditions_tracking_ended ON alert_conditions(tracking_ended_at);


-- 알림 관련 인덱스
CREATE INDEX idx_notifications_user_sent ON notifications(user_id, sent_at);
CREATE INDEX idx_notifications_status ON notifications(delivery_status);
CREATE INDEX idx_notifications_subscription ON notifications(subscription_id);

-- FCM 토큰 관련 인덱스
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active);
CREATE INDEX idx_fcm_tokens_last_used ON fcm_tokens(last_used_at);

-- 앱 설정 관련 인덱스
CREATE INDEX idx_settings_user_key ON app_settings(user_id, setting_key);
```

---

## 데이터베이스 제약조건

### 체크 제약조건
```sql
-- 알림 조건 임계값 제한
ALTER TABLE alert_conditions 
ADD CONSTRAINT chk_threshold_range 
CHECK (threshold > 0 AND threshold <= 100);

-- 기간 제한
ALTER TABLE alert_conditions 
ADD CONSTRAINT chk_period_range 
CHECK (period_days > 0 AND period_days <= 30);


-- 알림 타입 제한
ALTER TABLE notifications 
ADD CONSTRAINT chk_notification_type 
CHECK (notification_type IN ('push', 'email', 'sms'));

-- 전달 상태 제한
ALTER TABLE notifications 
ADD CONSTRAINT chk_delivery_status 
CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed'));
```

---

## 샘플 데이터

### 사용자 데이터
```sql
INSERT INTO users (email, name, timezone) VALUES
('user1@example.com', '김철수', 'Asia/Seoul'),
('user2@example.com', '이영희', 'Asia/Seoul');
```

### 주식 구독 데이터
```sql
INSERT INTO stock_subscriptions (user_id, stock_code, stock_name, market) VALUES
((SELECT id FROM users WHERE email = 'user1@example.com'), '005930', '삼성전자', 'KOSPI'),
((SELECT id FROM users WHERE email = 'user1@example.com'), '035420', '네이버', 'KOSPI');
```

### 알림 조건 데이터
```sql
INSERT INTO alert_conditions (subscription_id, condition_type, threshold, period_days) VALUES
((SELECT id FROM stock_subscriptions WHERE stock_code = '005930'), 'drop', 4.0, 1),
((SELECT id FROM stock_subscriptions WHERE stock_code = '005930'), 'rise', 8.0, 3);
```

---

## 마이그레이션 전략

### 현재 구현 상태
- ✅ **Supabase Auth**: 사용자 인증 시스템 자동 제공
- ✅ **stock_subscriptions**: 주식 구독 관리 테이블
- ✅ **alert_conditions**: 알림 조건 설정 테이블
- ⏳ **notifications**: 알림 발송 기록 (향후 구현)
- ⏳ **fcm_tokens**: FCM 토큰 관리 (향후 구현)
- ⏳ **app_settings**: 앱 설정 (향후 구현)

### 1단계: 기본 테이블 생성 (완료)
1. ✅ Supabase Auth 활성화
2. ✅ stock_subscriptions 테이블 생성
3. ✅ alert_conditions 테이블 생성

### 2단계: 확장 테이블 생성 (향후 구현)
1. ⏳ notifications 테이블 생성
2. ⏳ fcm_tokens 테이블 생성
3. ⏳ app_settings 테이블 생성

### 3단계: 인덱스 및 제약조건 추가 (부분 완료)
1. ✅ 기본 인덱스 생성
2. ⏳ 성능 최적화 인덱스 추가 (향후 구현)
3. ✅ 데이터 무결성 제약조건 추가

### 4단계: 초기 데이터 설정 (향후 구현)
1. ⏳ 기본 설정값 삽입
2. ⏳ 테스트 데이터 생성

---

## 보안 고려사항

1. **데이터 암호화**: 민감한 정보는 암호화 저장
2. **접근 제어**: 사용자별 데이터 접근 권한 관리
3. **감사 로그**: 중요한 데이터 변경 이력 추적
4. **백업 전략**: 정기적인 데이터 백업 및 복구 계획

---

## 확장성 고려사항

1. **파티셔닝**: 대용량 데이터 처리를 위한 테이블 파티셔닝
2. **읽기 복제본**: 읽기 성능 향상을 위한 복제본 구성
3. **캐싱 전략**: 자주 조회되는 데이터의 캐싱
4. **모니터링**: 데이터베이스 성능 모니터링 및 알림

