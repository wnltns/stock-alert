# Project Overview

**간단한 설명**
StockAlert는 사용자가 관심 있는 주식을 등록하고, 지정한 등락률 조건을 만족했을 때 자동으로 알림을 보내주는 앱입니다.
사용자는 매일 주가를 일일이 확인하지 않아도, 설정한 조건에 따라 자동으로 알림을 받아 효율적으로 주식을 관리할 수 있습니다.

**핵심 기능 요약**
- 사용자가 주식을 구독하고 알림 조건을 설정할 수 있음
- 시스템이 매일 주가를 자동으로 조회하여 조건을 체크
- 조건 충족 시 앱 푸시 알림 발송

---

# Core Functionalities

### 1. 주식 구독하기
- 사용자는 앱 내에서 원하는 주식을 추가할 수 있습니다.
- 구독된 주식은 내 리스트에 표시됩니다. (메인화면)

**구체적인 설명**
- 행동: 사용자가 등록창에서 "삼성전자" 코드 수동입력 → 주식명 → "추가" 버튼 클릭
- 반응: 시스템은 해당 종목을 사용자 관심목록에 저장하고, 추적 시작

---

### 2. 알림 조건 설정하기
- 사용자는 주가 변동 조건(상승/하락 %, 기간 등)을 등록할 수 있습니다.
- 예시: "하루만에 4% 이상 하락", "3일 내 8% 상승"

**구체적인 설명**
- 행동: 사용자가 "조건 추가" 버튼 클릭 → 기준(기간, 등락률, 상승/하락 여부) 입력 → 저장
- 반응: 시스템은 조건을 DB에 저장하고, 매일 조건에 따라 자동 계산

---

### 3. 자동 조회 및 조건 체크
- 시스템은 하루에 한 번(예: 장 마감 후) 모든 구독 종목의 주가를 자동으로 조회
- 각 주식에 대해 설정된 조건을 확인하여 충족 여부를 판별

**구체적인 설명**
- 행동: 서버에서 매일 오후 6시에 주가 API 호출
- 반응: 조건 충족 시 이벤트를 생성하고 푸시 알림 대기열에 등록

---

### 4. 자동 조회 설정하기
- 시스템이 몇 시에 구독 종목의 주가를 조회할지 설정
- 한국, 미국 장 오픈하는 시기가 다르므로 각각 다르게 설정

---

### 5. 앱 푸시 알림 발송
- 조건 충족 시 앱으로 즉시 푸시 알림 발송
- 알림 메시지 예시:
  - "삼성전자: 하루 -4.2% 하락"
  - "네이버: 최근 3일간 +9% 상승"

---

### 6. 추적일 초기화
- 사용자는 특정 종목의 조건 추적을 초기화할 수 있습니다.
- 예: "삼성전자 3일 상승 조건" → 초기화하면 1일부터 다시 카운트

**구체적인 설명**
- 행동: 사용자가 "초기화" 버튼 클릭
- 반응: 시스템은 해당 종목의 조건 추적 기록을 삭제하고 새로 시작

---

# Documentation

# 필요한 패키지와 라이브러리

- **Next.js 15**: 웹앱 및 PWA 구현 (App Router, API Routes)  
- **React 19**: UI 컴포넌트 구성  
- **Supabase**: 백엔드 서비스 (PostgreSQL, Auth, Scheduled Functions, Edge Functions)
  - `@supabase/supabase-js`: Supabase 클라이언트
  - `@supabase/auth-helpers-nextjs`: Next.js 인증 헬퍼
- **Firebase Cloud Messaging (FCM)**: 푸시 알림 발송 및 수신 (Service Worker와 연계)  
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Tailwind CSS**: 스타일링 프레임워크
- **Lucide React**: 아이콘 라이브러리
- **Zod**: 데이터 검증 스키마
- **TypeScript**: 안정적인 타입 관리  
- **ESLint / Prettier**: 코드 품질 관리  

> ⚠ 서버리스 환경에서는 Node-cron이나 Redis 없이 **Supabase Scheduled Functions**를 사용하여 정기적 주가 조회 및 알림 스케줄링을 처리합니다.

---

# 코드 예시 (주가 조회 및 조건 체크 — Supabase Scheduled Function)

```typescript
// /supabase/functions/check-stocks/index.ts
// 매일 설정된 시간에 실행되는 Scheduled Function
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConditions() {
  console.log("🔄 정기적 주가 조회 및 조건 체크 시작...");
  
  // 활성화된 주식 구독 조회
  const { data: subscriptions, error: subError } = await supabase
    .from("stock_subscriptions")
    .select(`
      id,
      user_id,
      stock_code,
      stock_name,
      alert_conditions!inner(
        id,
        condition_type,
        threshold,
        period_days,
        is_active
      )
    `)
    .eq("is_active", true);

  if (subError) {
    console.error("구독 조회 오류:", subError);
    return;
  }

  for (const subscription of subscriptions ?? []) {
    try {
      // 외부 주가 API에서 현재 가격 조회
      const stockResponse = await fetch(`https://api.example.com/stocks/${subscription.stock_code}`);
      const stockData = await stockResponse.json();
      const currentPrice = stockData.price;

      // 각 조건 검사
      for (const condition of subscription.alert_conditions) {
        if (!condition.is_active) continue;

        const isConditionMet = validateCondition(condition, currentPrice);
        
        if (isConditionMet) {
          // 조건 충족 시 알림 생성
          await createNotification(subscription, condition, currentPrice);
          
          // 조건 충족 시간 업데이트
          await supabase
            .from("alert_conditions")
            .update({ 
              condition_met_at: new Date().toISOString(),
              last_checked_at: new Date().toISOString()
            })
            .eq("id", condition.id);
        } else {
          // 조건 체크 시간만 업데이트
          await supabase
            .from("alert_conditions")
            .update({ last_checked_at: new Date().toISOString() })
            .eq("id", condition.id);
        }
      }
    } catch (error) {
      console.error(`주식 ${subscription.stock_code} 처리 오류:`, error);
    }
  }
}

function validateCondition(condition: any, currentPrice: number): boolean {
  const { condition_type, threshold } = condition;
  
  switch (condition_type) {
    case "drop":
      // 하락 조건 로직 (실제로는 기간별 가격 히스토리 필요)
      return true; // 임시로 항상 true 반환
    case "rise":
      // 상승 조건 로직 (실제로는 기간별 가격 히스토리 필요)
      return true; // 임시로 항상 true 반환
    default:
      return false;
  }
}

async function createNotification(subscription: any, condition: any, currentPrice: number) {
  const { data: fcmTokens } = await supabase
    .from("fcm_tokens")
    .select("token")
    .eq("user_id", subscription.user_id)
    .eq("is_active", true);

  if (!fcmTokens || fcmTokens.length === 0) return;

  const notification = {
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    condition_id: condition.id,
    notification_type: "push",
    title: `${subscription.stock_name} 알림`,
    message: `${condition.condition_type} 조건 충족`,
    sent_at: new Date().toISOString(),
    delivery_status: "pending"
  };

  // 알림 기록 저장
  const { data: notificationRecord } = await supabase
    .from("notifications")
    .insert(notification)
    .select()
    .single();

  // FCM 푸시 알림 발송
  for (const tokenData of fcmTokens) {
    try {
      await fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Authorization": `key=${Deno.env.get("FCM_SERVER_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: tokenData.token,
          notification: {
            title: notification.title,
            body: notification.message
          }
        })
      });

      // 전달 상태 업데이트
      await supabase
        .from("notifications")
        .update({ 
          delivery_status: "sent",
          delivery_confirmed_at: new Date().toISOString()
        })
        .eq("id", notificationRecord.id);
    } catch (error) {
      console.error("FCM 전송 오류:", error);
      await supabase
        .from("notifications")
        .update({ 
          delivery_status: "failed",
          error_message: error.message
        })
        .eq("id", notificationRecord.id);
    }
  }
}

serve(async () => {
  await checkConditions();
  return new Response("Stock check completed!", { status: 200 });
});
```

* **실행 주기**: Supabase Scheduled Functions 설정 → 매일 18시 실행
* **데이터 흐름**:

  1. `stock_subscriptions` → 사용자가 구독한 종목 조회
  2. 외부 주가 API → 최신 주가 가져오기
  3. `alert_conditions` → 조건 검사
  4. `notifications` → 알림 기록 저장
  5. `fcm_tokens` → 사용자 디바이스 토큰 조회 후 알림 발송

---

# Current File Structure (Supabase 연동)

```
/stock-alert-app
 ├── /public
 │    ├── firebase-messaging-sw.js   # FCM Service Worker
 │    ├── manifest.json              # PWA 매니페스트
 │    └── icons/                     # PWA 아이콘 리소스
 ├── /src
 │    ├── /app                       # Next.js App Router
 │    │    ├── /api                  # API Routes
 │    │    │    ├── /auth             # 인증 관련 API
 │    │    │    ├── /subscriptions    # 구독 관련 API
 │    │    │    └── /conditions       # 조건 관련 API
 │    │    ├── /auth                 # 인증 페이지
 │    │    │    ├── login/            # 로그인 페이지
 │    │    │    └── signup/           # 회원가입 페이지
 │    │    ├── /dashboard            # 대시보드 페이지
 │    │    ├── /settings             # 설정 페이지
 │    │    ├── globals.css            # 전역 스타일
 │    │    ├── layout.tsx             # 루트 레이아웃
 │    │    └── page.tsx               # 메인 페이지
 │    ├── /components                # UI 컴포넌트
 │    │    ├── /ui                   # shadcn/ui 기본 컴포넌트
 │    │    ├── /auth                 # 인증 관련 컴포넌트
 │    │    ├── /stock                # 주식 관련 컴포넌트
 │    │    └── /condition            # 조건 관련 컴포넌트
 │    ├── /lib                       # 유틸리티 함수 및 설정
 │    │    ├── /supabase             # Supabase 클라이언트
 │    │    │    ├── client.ts        # 클라이언트 사이드 클라이언트
 │    │    │    ├── server.ts         # 서버 사이드 클라이언트
 │    │    │    └── middleware.ts     # 미들웨어 클라이언트
 │    │    ├── /validations          # Zod 검증 스키마
 │    │    ├── /utils.ts             # 유틸리티 함수
 │    │    └── /auth.ts              # 인증 헬퍼 함수
 │    ├── /types                     # TypeScript 타입 정의
 │    │    ├── /database.ts          # 데이터베이스 타입
 │    │    ├── /auth.ts              # 인증 타입
 │    │    └── /api.ts               # API 타입
 │    ├── /hooks                     # 커스텀 React 훅
 │    │    ├── /supabase             # Supabase 관련 훅
 │    │    │    ├── use-user.ts      # 사용자 상태 훅
 │    │    │    ├── use-subscriptions.ts # 구독 관리 훅
 │    │    │    └── use-conditions.ts    # 조건 관리 훅
 │    │    └── /auth.ts              # 인증 관련 훅
 │    └── /constants                 # 상수 정의
 ├── /supabase
 │    ├── /functions                 # Supabase Edge Functions
 │    │    ├── /check-stocks/        # 주가 체크 함수
 │    │    └── /send-notifications/ # 알림 발송 함수
 │    ├── /migrations               # 데이터베이스 마이그레이션
 │    ├── /seed.sql                 # 초기 데이터
 │    └── config.toml               # Supabase 설정
 ├── .env.local                     # 환경 변수
 ├── package.json
 ├── tsconfig.json
 ├── tailwind.config.js
 └── README.md
```

* **/src/lib/supabase/client.ts** → 클라이언트 사이드 Supabase 클라이언트
* **/src/lib/supabase/server.ts** → 서버 사이드 Supabase 클라이언트  
* **/supabase/functions/check-stocks** → 매일 정기적 주가 조회 및 조건 검사 함수
* **/src/hooks/supabase/** → Supabase 데이터 관리를 위한 커스텀 훅
* **/src/app/api/** → Next.js API Routes (Supabase 연동)

```
