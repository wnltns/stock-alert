# StockAlert

주식 구독 및 알림 조건 설정 앱입니다. 사용자가 관심 있는 주식을 등록하고, 지정한 등락률 조건을 만족했을 때 자동으로 알림을 보내주는 앱입니다.

## 주요 기능

- **주식 구독**: 관심 주식을 추가하고 관리
- **알림 조건 설정**: 등락률 조건을 설정하여 자동 알림 받기
- **실시간 주가 모니터링**: 네이버 주식 API를 통한 실시간 주가 조회
- **푸시 알림**: 조건 충족 시 즉시 알림 발송
- **알림 히스토리**: 과거 알림 발송 기록 조회

## 기술 스택

- **Next.js 15**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘 라이브러리
- **Supabase**: 백엔드 서비스 (PostgreSQL, Auth, Functions)
- **네이버 주식 API**: 실시간 주가 데이터

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   ├── auth/              # 인증 관련 페이지
│   └── conditions/        # 조건 관리 페이지
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
```

## 개발 환경 설정

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Supabase 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Supabase 프로젝트에서 URL과 Anon Key를 확인하는 방법:
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > API에서 URL과 anon public key 확인

### 3. 개발 서버 실행

```bash
pnpm dev
```

### 4. 빌드

```bash
pnpm build
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
  added_at: string;         // ISO 문자열
  is_active: boolean;
  base_price: number | null; // 구독 시점 기준 가격
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
  base_price: number;              // 기준 가격
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

## 문서

- [데이터베이스 스키마](./docs/database-schema.md)
- [데이터베이스 다이어그램](./docs/database-diagrams.md)
- [환경 설정 가이드](./docs/env-setup-guide.md)
- [Google 인증 구현](./docs/google-auth-implementation.md)

## 라이선스

MIT License

