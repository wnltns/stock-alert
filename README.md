# StockAlert

주식 구독 및 알림 조건 설정 앱입니다. 사용자가 관심 있는 주식을 등록하고, 지정한 등락률 조건을 만족했을 때 자동으로 알림을 보내주는 앱입니다.

## 주요 기능

- **주식 구독**: 관심 주식을 추가하고 관리
- **알림 조건 설정**: 등락률 조건을 설정하여 자동 알림 받기
- **실시간 주가 모니터링**: 설정된 조건에 따른 자동 체크
- **푸시 알림**: 조건 충족 시 즉시 알림 발송

## 기술 스택

- **Next.js 15**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘 라이브러리
- **Supabase**: 백엔드 서비스 (PostgreSQL, Auth, Functions)

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기본 컴포넌트
│   ├── stock/            # 주식 관련 컴포넌트
│   └── condition/        # 조건 관련 컴포넌트
├── lib/                  # 유틸리티 함수
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
- 설정된 조건 개수 표시
- 상세보기 및 조건 추가 버튼

### AddStockDialog
새로운 주식을 추가하는 다이얼로그 컴포넌트입니다.
- 주식 코드 (6자리 숫자) 입력
- 주식명 입력
- 입력 유효성 검사

### AddConditionDialog
알림 조건을 추가하는 다이얼로그 컴포넌트입니다.
- 조건 유형 선택 (하루/기간, 상승/하락)
- 등락률 및 기간 설정
- 조건 미리보기

## 데이터 모델

### StockSubscription
```typescript
interface StockSubscription {
  id: string;
  userId: string;
  stockCode: string;        // 예: "005930" (삼성전자)
  stockName: string;        // 예: "삼성전자"
  addedAt: Date;
  isActive: boolean;
}
```

### AlertCondition
```typescript
interface AlertCondition {
  id: string;
  subscriptionId: string;
  type: 'daily_drop' | 'daily_rise' | 'period_drop' | 'period_rise';
  threshold: number;        // 퍼센트 값 (예: 4.0 = 4%)
  period: number;          // 일수 (예: 3 = 3일)
  basePrice: number;       // 기준 가격
  createdAt: Date;
  isActive: boolean;
}
```

## 개발 규칙

- **Supabase 연동**: 데이터베이스 타입 정의 완료, 실제 API 연동은 추후 진행
- **TypeScript**: 모든 컴포넌트와 함수에 타입 정의
- **shadcn/ui**: 모든 UI 컴포넌트는 shadcn/ui 기반
- **반응형 디자인**: 모바일 우선 설계
- **접근성**: Radix UI 기반으로 접근성 고려
- **Mock 데이터 사용**: 현재는 개발용 가짜 데이터 사용, 추후 Supabase 연동 예정

## 라이선스

MIT License

