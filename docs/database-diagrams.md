# StockAlert 데이터베이스 관계도

## 전체 시스템 아키텍처

```mermaid
graph TB
    subgraph "Frontend"
        A[React/Next.js App]
        B[PWA Service Worker]
    end
    
    subgraph "Backend API"
        C[Next.js API Routes]
        D[Supabase Edge Functions]
    end
    
    subgraph "Database"
        E[(PostgreSQL)]
        F[Real-time Subscriptions]
    end
    
    subgraph "External Services"
        G[Stock Price API]
        H[Firebase Cloud Messaging]
    end
    
    A --> C
    A --> D
    B --> H
    C --> E
    D --> E
    D --> G
    D --> H
    E --> F
    F --> A
```

## 데이터베이스 테이블 관계도

```mermaid
erDiagram
    users ||--o{ stock_subscriptions : "구독"
    users ||--o{ notifications : "알림받음"
    users ||--o{ fcm_tokens : "토큰보유"
    users ||--o{ app_settings : "설정보유"
    
    stock_subscriptions ||--o{ alert_conditions : "조건설정"
    stock_subscriptions ||--o{ notifications : "알림발송"
    
    alert_conditions ||--o{ notifications : "조건충족"
    
    
    users {
        uuid id PK
        varchar email UK
        varchar name
        timestamp created_at
        timestamp updated_at
        boolean is_active
        timestamp last_login_at
        varchar timezone
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
        timestamp condition_met_at
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

## API 연동 데이터 플로우

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant API as API Server
    participant DB as Database
    participant SP as Naver Stock API
    participant FCM as Firebase FCM
    
    Note over U,FCM: 주식 구독 및 조건 설정 플로우
    
    U->>A: 주식 추가
    A->>API: POST /api/subscriptions
    API->>SP: GET /api/stock/{code}/basic
    SP-->>API: StockInfo 데이터
    API->>DB: INSERT stock_subscriptions
    
    U->>A: 알림 조건 설정
    A->>API: POST /api/conditions
    API->>DB: INSERT alert_conditions
    
    Note over U,FCM: 자동 주가 체크 및 알림 플로우
    
    loop 매일 오후 6시
        API->>SP: 주가 데이터 조회
        SP-->>API: NaverStockApiResponse
        API->>API: normalizeStockData()
        
        API->>DB: SELECT alert_conditions
        DB-->>API: 활성 조건 목록
        
        loop 각 조건 체크
            API->>API: 조건 충족 여부 계산
            
            alt 조건 충족
                API->>DB: INSERT notifications
                API->>FCM: 푸시 알림 발송
                FCM-->>U: 알림 수신
            end
        end
    end
```

## 데이터 변환 플로우

```mermaid
graph LR
    subgraph "External API"
        A[Naver Stock API]
        B[Raw Response Data]
    end
    
    subgraph "Data Processing"
        C[parsePrice Function]
        D[mapMarketStatus Function]
        E[normalizeStockData Function]
    end
    
    subgraph "App Data Model"
        F[StockInfo Interface]
        G[StockDetail Interface]
    end
    
    subgraph "Database"
        H[stock_subscriptions]
        I[alert_conditions]
    end
    
    A --> B
    B --> C
    B --> D
    C --> E
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    F --> J
```

## 조건 타입 단순화 다이어그램

```mermaid
graph TD
    subgraph "이전 구조 (복잡)"
        A1[daily_drop]
        A2[daily_rise]
        A3[period_drop]
        A4[period_rise]
    end
    
    subgraph "현재 구조 (단순)"
        B1[rise]
        B2[drop]
        B3[period_days 필드]
    end
    
    A1 --> B2
    A2 --> B1
    A3 --> B2
    A4 --> B1
    
    B1 --> B3
    B2 --> B3
    
    style A1 fill:#ffcccc
    style A2 fill:#ffcccc
    style A3 fill:#ffcccc
    style A4 fill:#ffcccc
    style B1 fill:#ccffcc
    style B2 fill:#ccffcc
    style B3 fill:#ccffcc
```

## 시스템 컴포넌트 다이어그램

```mermaid
graph LR
    subgraph "Client Side"
        A[StockAlert PWA]
        B[Service Worker]
        C[FCM SDK]
    end
    
    subgraph "Server Side"
        D[Next.js App Router]
        E[API Routes]
        F[Supabase Edge Functions]
    end
    
    subgraph "Database Layer"
        G[PostgreSQL]
        H[Real-time Subscriptions]
        I[Row Level Security]
    end
    
    subgraph "External APIs"
        J[Stock Price API]
        K[Firebase FCM]
    end
    
    A --> D
    A --> E
    B --> C
    C --> K
    E --> G
    F --> G
    F --> J
    F --> K
    G --> H
    H --> A
    G --> I
```

## 인덱스 전략 다이어그램

```mermaid
graph TD
    subgraph "Primary Indexes"
        A[users.email]
        B[stock_subscriptions.user_id]
        C[alert_conditions.subscription_id]
    end
    
    subgraph "Performance Indexes"
        E[notifications.user_sent]
        F[fcm_tokens.user_active]
        G[app_settings.user_key]
        H[alert_conditions.last_checked]
    end
    
    subgraph "Composite Indexes"
        I[subscriptions_user_stock]
        J[notifications_status]
        K[settings_user_key]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
```

## 보안 및 접근 제어 다이어그램

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[Supabase Auth]
        B[JWT Tokens]
        C[Row Level Security]
    end
    
    subgraph "Data Access Control"
        D[User Data Isolation]
        E[Subscription Ownership]
        F[Condition Ownership]
    end
    
    subgraph "API Security"
        G[Rate Limiting]
        H[Input Validation]
        I[CORS Policy]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    G --> H
    H --> I
```

## 확장성 아키텍처 다이어그램

```mermaid
graph TB
    subgraph "Load Balancer"
        A[CDN/Edge]
    end
    
    subgraph "Application Layer"
        B[Next.js App Instances]
        C[Supabase Edge Functions]
    end
    
    subgraph "Database Layer"
        D[Primary Database]
        E[Read Replicas]
        F[Connection Pool]
    end
    
    subgraph "Caching Layer"
        G[Redis Cache]
        H[CDN Cache]
    end
    
    subgraph "Monitoring"
        I[Performance Monitoring]
        J[Error Tracking]
        K[Log Aggregation]
    end
    
    A --> B
    A --> C
    B --> D
    B --> E
    C --> D
    D --> F
    E --> F
    B --> G
    A --> H
    B --> I
    C --> J
    D --> K
```

