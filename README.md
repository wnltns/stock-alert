# StockAlert

주식 구독 및 알림 조건 설정 앱입니다. 사용자가 관심 있는 주식을 등록하고, 지정한 등락률 조건을 만족했을 때 자동으로 알림을 보내주는 앱입니다.

## 주요 기능

- **주식 구독**: 관심 주식을 추가하고 관리 ✅ 완성
- **알림 조건 설정**: 등락률 조건을 설정하여 자동 알림 받기 ✅ 완성
- **자동 모니터링**: Supabase Scheduled Functions를 통한 정기적 주가 모니터링 ✅ 완성
- **푸시 알림**: Firebase Cloud Messaging을 통한 실시간 알림 발송 ⚠️ 설정 필요
- **연속 모니터링**: 알림 발송 후에도 지속적인 모니터링으로 반복 알림 제공 ✅ 완성
- **알림 히스토리**: 과거 알림 발송 기록 조회 ✅ 완성

## 기술 스택

- **Next.js 15**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘 라이브러리
- **Supabase**: 백엔드 서비스 (PostgreSQL, Auth, Scheduled Functions, Edge Functions)
- **Firebase Cloud Messaging**: 푸시 알림 서비스
- **네이버 주식 API**: 실시간 주가 데이터

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   ├── auth/              # 인증 관련 페이지
│   ├── conditions/        # 조건 관리 페이지
│   └── api/               # API 엔드포인트
│       ├── fcm-tokens/    # FCM 토큰 관리 API
│       └── test-monitoring/ # 테스트용 모니터링 API
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── auth/             # 인증 관련 컴포넌트
│   ├── stock/            # 주식 관련 컴포넌트
│   └── condition/        # 조건 관련 컴포넌트
├── lib/                  # 유틸리티 함수
│   ├── supabase/         # Supabase 클라이언트
│   └── stock-api.ts      # 주식 API 연동
├── types/               # TypeScript 타입 정의
├── constants/           # 상수 및 Mock 데이터
└── hooks/               # 커스텀 React 훅
    ├── use-auth.ts      # 인증 훅
    ├── use-stock-prices.ts # 주가 조회 훅
    └── use-fcm.ts       # FCM 토큰 관리 훅

supabase/
├── functions/           # Supabase Edge Functions
│   └── check-stocks/    # 주가 모니터링 함수
├── migrations/          # 데이터베이스 마이그레이션
└── config.toml         # Supabase 설정
```

## 개발 환경 설정

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Supabase 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Firebase Cloud Messaging 설정
NEXT_PUBLIC_FCM_VAPID_KEY=your-fcm-vapid-key
```

Supabase 프로젝트에서 URL과 Anon Key를 확인하는 방법:
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > API에서 URL과 anon public key 확인

### 3. 알림 모니터링 설정

#### Edge Function 배포
```bash
# Supabase CLI 설치 및 로그인
npm install -g supabase
supabase login

# 프로젝트 초기화 (이미 완료된 경우 생략)
supabase init

# Edge Function 배포
supabase functions deploy check-stocks
```

#### 환경 변수 설정
```bash
# Supabase Edge Functions 환경 변수 설정
supabase secrets set SUPABASE_URL=your_supabase_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key
```

#### 스케줄링 설정
```bash
# 데이터베이스 마이그레이션 적용
supabase db push

# 스케줄링 설정 확인
supabase db reset
```

자세한 설정 방법은 [스케줄링 설정 가이드](./docs/scheduling-setup-guide.md)를 참조하세요.

### 4. 개발 서버 실행

```bash
pnpm dev
```

### 5. 빌드

```bash
pnpm build
```

## 알림 모니터링 시스템

### 자동 모니터링 스케줄

- **국내 주식**: 매일 오전 9시 (KST) 모니터링
- **해외 주식**: 매일 오후 11시 (KST) 모니터링

### 모니터링 프로세스

1. **스케줄링**: Supabase Scheduled Function이 정기적으로 실행
2. **필터링**: 시간대별로 국내/해외 주식 구분
3. **데이터 조회**: 활성화된 주식 구독 및 알림 조건 조회
4. **API 호출**: 각 주식의 네이버 API에서 변동률 조회
5. **누적 계산**: 일일 변동률을 누적 변동률에 추가
6. **조건 검사**: 누적 변동률이 임계값 초과 시 알림 발송
7. **자동 초기화**: 알림 발송 후 새로운 추적 기간 시작

### 테스트 방법

#### 수동 테스트
```bash
# 테스트 API 엔드포인트 호출
curl -X POST http://localhost:3000/api/test-monitoring \
  -H "Content-Type: application/json" \
  -d '{"testMode": true, "nationType": "KOR"}'
```

#### 스케줄링 테스트
```sql
-- 스케줄 상태 확인
SELECT * FROM check_monitoring_schedules();

-- 스케줄 통계 확인
SELECT * FROM get_monitoring_stats();

-- 최근 실행 로그 확인
SELECT * FROM monitoring_logs LIMIT 10;
```

## 주요 컴포넌트

### StockCard
주식 정보를 카드 형태로 표시하는 컴포넌트입니다.
- 현재 가격 및 등락률 표시
- 설정된 조건 개수 및 충족 상태 표시
- 상세보기 및 조건 추가 버튼
- 알림 히스토리 조회

### AddStockDialog
새로운 주식을 추가하는 다이얼로그 컴포넌트입니다.
- 주식 코드 (6자리 숫자) 입력
- 주식명 입력
- 입력 유효성 검사

### AddConditionDialog
알림 조건을 추가하는 다이얼로그 컴포넌트입니다.
- 조건 유형 선택 (상승/하락)
- 등락률 및 기간 설정
- 조건 미리보기

## 데이터 모델

### StockSubscription
```typescript
interface StockSubscription {
  id: string;
  user_id: string;
  stock_code: string;        // 예: "005930" (삼성전자)
  stock_name: string;        // 예: "삼성전자"
  market: string;            // 예: "KOSPI"
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### AlertCondition
```typescript
interface AlertCondition {
  id: string;
  subscription_id: string;
  condition_type: 'rise' | 'drop';  // 상승 또는 하락
  threshold: number;                // 퍼센트 값 (예: 4.0 = 4%)
  period_days: number;              // 일수 (예: 3 = 3일)
  target_price: number;             // 목표 가격 (계산된 값)
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_checked_at: string | null;
  condition_met_at: string | null;
}
```

### StockInfo
```typescript
interface StockInfo {
  code: string;               // 주식 코드
  name: string;               // 주식명
  logoUrl: string;            // 로고 URL
  currentPrice: number;        // 현재가
  changeAmount: number;        // 변동금액
  changeRate: number;         // 등락률 (%)
  marketStatus: 'OPEN' | 'CLOSE' | 'PRE_MARKET' | 'AFTER_MARKET';
  marketName: string;         // 시장명
  lastTradedAt: Date;         // 마지막 거래 시간
  isRising: boolean;          // 상승 여부
  volume?: number;            // 거래량
  highPrice?: number;         // 고가
  lowPrice?: number;          // 저가
  openPrice?: number;         // 시가
}
```

## API 연동

### 네이버 주식 API
- **엔드포인트**: `https://m.stock.naver.com/api/stock/{주식코드}/basic`
- **응답 처리**: 원본 API 응답을 `StockInfo` 타입으로 정규화
- **에러 처리**: 네트워크 오류 및 잘못된 주식 코드 처리
- **성능 최적화**: 여러 주식 정보 일괄 조회 지원

### 주요 함수
```typescript
// 단일 주식 정보 조회
getStockInfo(stockCode: string): Promise<StockInfo>

// 여러 주식 정보 일괄 조회
getMultipleStockInfos(stockCodes: string[]): Promise<StockInfo[]>

// API 응답 정규화
normalizeStockData(apiResponse: NaverStockApiResponse): StockInfo

// 주식 코드 유효성 검사
isValidStockCode(stockCode: string): boolean
```

## 개발 규칙

- **Supabase 연동**: 데이터베이스 타입 정의 완료, 실제 API 연동 준비 완료
- **TypeScript**: 모든 컴포넌트와 함수에 엄격한 타입 정의
- **shadcn/ui**: 모든 UI 컴포넌트는 shadcn/ui 기반
- **반응형 디자인**: 모바일 우선 설계
- **접근성**: Radix UI 기반으로 접근성 고려
- **API 연동**: 네이버 주식 API를 통한 실시간 데이터 조회
- **에러 처리**: 네트워크 오류 및 데이터 검증 처리

## 📊 현재 구현 상태

**전체 구현률: 약 90%** 🎯

### ✅ 완전히 구현된 기능들
- **인증 시스템** (100%): Google OAuth, Supabase Auth, 보호된 라우트
- **주식 구독 관리** (100%): 주식 추가, 실시간 주가 조회, DB 연동
- **알림 조건 설정** (100%): 조건 추가/수정, 누적 변동률, 추적 기간 관리
- **데이터베이스 구조** (100%): 모든 테이블, RLS 정책, 외래키 관계
- **백엔드 로직** (100%): Edge Function, 모니터링 프로세스, 조건 체크
- **프론트엔드 UI** (100%): 메인 페이지, 조건 관리, 사용자 인터페이스
- **알림 히스토리 시스템** (100%): 알림 기록 조회, 전달 확인, UI 연동
- **테스트 및 개발자 도구** (100%): 테스트 버튼, 모니터링 API

### ⚠️ 부분적으로 구현된 기능들
- **수동 초기화 기능** (50%): 백엔드 로직 완료, UI 버튼 필요
- **FCM 토큰 관리** (60%): 테이블 및 API 완료, Firebase 설정 필요

### ❌ 미구현된 기능들
- **실제 알림 발송** (0%): Firebase 설정, FCM 토큰 등록, Service Worker
- **스케줄링 배포** (0%): Edge Function 배포, pg_cron 설정, 환경 변수

### 🔧 다음 단계
1. **Firebase 프로젝트 설정** 및 FCM 활성화
2. **Supabase Edge Function 배포** 및 스케줄링 설정
3. **수동 초기화 UI** 버튼 추가 (선택사항)
4. **프로덕션 배포** 설정

자세한 구현 상태는 [PRD 문서](./docs/prd.md)를 참조하세요.

## 문서

- [프로젝트 요구사항 명세서 (PRD)](./docs/prd.md) - **현재 구현 상태 포함**
- [데이터베이스 스키마](./docs/database-schema.md)
- [데이터베이스 다이어그램](./docs/database-diagrams.md)
- [환경 설정 가이드](./docs/env-setup-guide.md)
- [스케줄링 설정 가이드](./docs/scheduling-setup-guide.md)
- [Google 인증 구현](./docs/google-auth-implementation.md)

## 라이선스

MIT License

