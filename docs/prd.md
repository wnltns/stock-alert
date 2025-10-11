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

- **Next.js**: 웹앱 및 PWA 구현 (페이지 라우팅, API 라우트)  
- **React**: UI 컴포넌트 구성  
- **Firebase Cloud Messaging (FCM)**: 푸시 알림 발송 및 수신 (Service Worker와 연계)  
- **Supabase JS SDK**: DB, 인증(Auth), Edge Functions 호출  
- **Workbox** (선택): PWA Service Worker 유틸  
- **TypeScript**: 안정적인 타입 관리  
- **ESLint / Prettier**: 코드 품질 관리  

> ⚠ 서버리스 환경에서는 Node-cron이나 Redis 없이 **Supabase Scheduled Functions**를 사용하여 알림 스케줄링을 처리합니다.

---

# 코드 예시 (주가 조회 및 조건 체크 — Supabase Edge Function)

```typescript
// /apps/edge-functions/check-stocks/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { sendPushNotification } from "@common-lib/fcmClient";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConditions() {
  const { data: subscriptions } = await supabase.from("subscriptions").select("*");

  for (const sub of subscriptions ?? []) {
    const res = await fetch(`https://api.stock.com/${sub.stock_code}`);
    const stock = await res.json();
    const currentPrice = stock.close;

    const { data: conditions } = await supabase
      .from("conditions")
      .select("*")
      .eq("subscription_id", sub.id);

    for (const cond of conditions ?? []) {
      if (validateCondition(cond, currentPrice)) {
        await sendPushNotification(sub.user_id, {
          title: `${sub.stock_name} 알림`,
          body: `${cond.description} 조건 충족 (${currentPrice}원)`
        });
      }
    }
  }
}

function validateCondition(cond: any, price: number) {
  if (cond.type === "daily_drop" && cond.threshold) {
    return price <= cond.base_price * (1 - cond.threshold / 100);
  }
  return false;
}

serve(async () => {
  await checkConditions();
  return new Response("Stock check done!", { status: 200 });
});
````

* **실행 주기**: Supabase Scheduled Functions 설정 → 매일 18시 실행
* **데이터 흐름**:

  1. `subscriptions` → 사용자가 구독한 종목 조회
  2. 외부 주가 API → 최신 주가 가져오기
  3. `conditions` → 조건 검사
  4. `fcm_tokens` → 사용자 디바이스 토큰 조회 후 알림 발송

---

# Current File Structure (모노레포 기반)

```
/stock-alert-app
 ├── /public
 │    ├── firebase-messaging-sw.js   # FCM Service Worker
 │    ├── manifest.json              # PWA 매니페스트
 │    └── icons/                     # PWA 아이콘 리소스
 ├── /src
 │    ├── /components                # UI 컴포넌트 (버튼, 카드 등)
 │    ├── /pages
 │    │    ├── index.tsx             # 홈 화면 (구독 목록)
 │    │    ├── stock/[id].tsx        # 개별 주식 상세
 │    │    ├── conditions.tsx         # 알림 조건 설정
 │    │    └── api/subscribe.ts      # API Route (구독 추가)
 │    ├── /lib
 │    │    ├── supabaseClient.ts     # Supabase 클라이언트 초기화
 │    │    ├── fcmClient.ts          # FCM 클라이언트 연동
 │    │    └── pwa.ts                # PWA 관련 유틸 (Service Worker 등록 등)
 │    └── app.tsx                    # Next.js 메인 엔트리
 ├── /supabase
 │    ├── /functions
 │    │    └── check-stocks/index.ts # Supabase Edge Function (조건 검사 + 알림)
 │    └── schema.sql                 # DB 테이블 정의 (subscriptions, conditions, fcm_tokens)
 ├── package.json
 ├── tsconfig.json
 └── README.md

```

* **/public/firebase-messaging-sw.js** → 브라우저 푸시 알림 처리용 Service Worker
* **/supabase/functions/check-stocks** → 매일 조건 검사 및 알림 발송 함수 (Scheduled Function)
* **/lib/supabaseClient.ts** → 앱에서 DB/인증 접근용
* **/lib/fcmClient.ts** → 사용자 디바이스 등록 및 토큰 관리

```
