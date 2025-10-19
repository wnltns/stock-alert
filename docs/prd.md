# StockAlert 프로젝트 요구사항 명세서 (PRD)

## 프로젝트 개요

**StockAlert**는 사용자가 관심 있는 주식을 등록하고, 지정한 등락률 조건을 만족했을 때 자동으로 알림을 보내주는 주식 모니터링 앱입니다.

### 핵심 가치
- **자동화**: 매일 주가를 일일이 확인하지 않아도 자동으로 알림 수신
- **효율성**: 설정한 조건에 따라 스마트한 주식 관리
- **연속성**: 알림 발송 후에도 지속적인 모니터링으로 반복 알림 제공

---

# 핵심 기능

## 1. 주식 구독 관리
사용자는 관심 있는 주식을 구독 목록에 추가하여 모니터링할 수 있습니다.

**기능 상세**
- 주식 코드 입력을 통한 종목 추가
- 국내/해외 주식 구분 (nation_type: 'KOR' | 'FOREIGN')
- API 정보 저장으로 실시간 주가 조회 준비
- 구독 활성화/비활성화 관리

## 2. 알림 조건 설정
주가 변동 조건을 설정하여 자동 알림을 받을 수 있습니다.

**조건 설정 항목**
- **조건 유형**: 상승(rise) 또는 하락(drop)
- **임계값**: 등락률 기준 (0.1% ~ 100%)
- **추적 기간**: 모니터링 기간 (1일 ~ 30일)
- **누적 변동률**: 일일 변동률을 누적하여 계산

**초기화 규칙**
- 조건 등록/수정 시 `cumulative_change_rate` 자동 초기화
- 알림 발송 시 자동 초기화로 새로운 추적 기간 시작
- 사용자 수동 초기화 기능 제공

## 3. 자동 모니터링 시스템
매일 정기적으로 주가를 조회하고 조건을 검사합니다.

**모니터링 스케줄**
- **국내 주식**: 매일 오전 9시 (KST)
- **해외 주식**: 매일 오후 11시 (KST)

**모니터링 프로세스**
1. 활성화된 주식 구독 조회 (국내/해외 필터링)
2. 각 주식의 API 정보를 통해 `fluctuationsRatio` 조회
3. 일일 변동률을 `cumulative_change_rate`에 누적
4. 추적 종료일까지 누적된 변동률이 임계점 초과 시 알림 발송

## 4. 푸시 알림 시스템
조건 충족 시 즉시 푸시 알림을 발송하고 연속 모니터링을 제공합니다.

**알림 특징**
- 실시간 푸시 알림 발송
- 누적 변동률과 당일 변동률 정보 포함
- 알림 발송 후 자동 초기화로 새로운 추적 기간 시작
- 지속적인 모니터링으로 반복 알림 가능

**알림 메시지 예시**
- "삼성전자 상승 알림: 누적 5.2% 상승 (오늘: 2.1%)"
- "애플 하락 알림: 누적 -3.8% 하락 (오늘: -1.5%)"

## 5. 추적 관리
사용자는 조건 추적을 수동으로 관리할 수 있습니다.

**초기화 유형**
- **자동 초기화**: 알림 발송 시 자동으로 새로운 추적 기간 시작
- **수동 초기화**: 사용자가 원하는 시점에 수동으로 초기화

**초기화 내용**
- `tracking_started_at`: 현재 시점으로 재설정
- `tracking_ended_at`: 새로운 추적 기간으로 재계산
- `cumulative_change_rate`: 0으로 리셋

---

# 기술 스택

## 프론트엔드
- **Next.js 15**: App Router, API Routes
- **React 19**: UI 컴포넌트
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **shadcn/ui**: UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘

## 백엔드
- **Supabase**: PostgreSQL, Auth, Scheduled Functions, Edge Functions
- **Firebase Cloud Messaging (FCM)**: 푸시 알림

## 개발 도구
- **Zod**: 데이터 검증
- **ESLint / Prettier**: 코드 품질 관리

---

# 시스템 아키텍처

## 데이터베이스 구조

### 핵심 테이블
- **users**: 사용자 정보
- **stock_subscriptions**: 주식 구독 정보
- **alert_conditions**: 알림 조건 설정
- **notifications**: 알림 발송 기록
- **fcm_tokens**: 푸시 알림 토큰 관리

### 주요 필드
- `cumulative_change_rate`: 누적 변동률 (DECIMAL)
- `tracking_started_at`: 추적 시작일
- `tracking_ended_at`: 추적 종료일
- `nation_type`: 국가 타입 ('KOR' | 'FOREIGN')
- `api_info`: API 정보 (JSON)

## 시스템 플로우

### 일일 모니터링 프로세스
1. **스케줄링**: Supabase Scheduled Function 실행
2. **필터링**: 시간대별 국내/해외 주식 구분
3. **데이터 조회**: 활성화된 구독 및 조건 조회
4. **API 호출**: 주식별 API에서 변동률 조회
5. **조건 검사**: 누적 변동률과 임계값 비교
6. **알림 발송**: 조건 충족 시 푸시 알림 발송
7. **초기화**: 알림 발송 후 새로운 추적 기간 시작

---

# 구현 가이드

## Supabase Scheduled Function

```typescript
// /supabase/functions/check-stocks/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 알림 주기 상수
const KOREAN_MARKET_CHECK_TIME = "09:00";
const FOREIGN_MARKET_CHECK_TIME = "23:00";

async function checkConditions() {
  console.log("🔄 정기적 주가 조회 및 조건 체크 시작...");
  
  const currentTime = new Date().toLocaleTimeString('ko-KR', { 
    hour12: false, 
    timeZone: 'Asia/Seoul' 
  }).slice(0, 5);
  
  // 현재 시간에 따라 국내/해외 주식 필터링
  const nationType = currentTime === KOREAN_MARKET_CHECK_TIME ? 'KOR' : 'FOREIGN';
  
  // 활성화된 주식 구독 조회
  const { data: subscriptions, error: subError } = await supabase
    .from("stock_subscriptions")
    .select(`
      id, user_id, stock_code, stock_name, nation_type, api_info,
      alert_conditions!inner(
        id, condition_type, threshold, period_days,
        tracking_started_at, tracking_ended_at,
        cumulative_change_rate, is_active
      )
    `)
    .eq("is_active", true)
    .eq("nation_type", nationType)
    .eq("alert_conditions.is_active", true);

  if (subError) {
    console.error("구독 조회 오류:", subError);
    return;
  }

  for (const subscription of subscriptions ?? []) {
    try {
      // API 정보에서 URL 추출하여 주가 조회
      const apiInfo = subscription.api_info as any;
      if (!apiInfo?.url) {
        console.warn(`주식 ${subscription.stock_code}의 API 정보가 없습니다.`);
        continue;
      }

      const stockResponse = await fetch(apiInfo.url);
      const stockData = await stockResponse.json();
      const fluctuationsRatio = parseFloat(stockData.fluctuationsRatio);
      const currentPrice = parseFloat(stockData.closePrice);

      // 각 조건 검사
      for (const condition of subscription.alert_conditions) {
        if (!condition.is_active) continue;

        // 추적 기간이 종료된 조건은 건너뛰기
        const trackingEndedAt = new Date(condition.tracking_ended_at);
        if (new Date() > trackingEndedAt) {
          console.log(`조건 ${condition.id}의 추적 기간이 종료되었습니다.`);
          continue;
        }

        // 누적 변동률 업데이트
        const newCumulativeRate = (condition.cumulative_change_rate || 0) + fluctuationsRatio;
        
        // 조건 충족 여부 확인
        const isConditionMet = checkConditionThreshold(condition, newCumulativeRate);
        
        if (isConditionMet) {
          // 조건 충족 시 알림 생성 및 발송
          await createNotification(subscription, condition, fluctuationsRatio, newCumulativeRate, currentPrice);
          
          // 알림 발송 후 조건 초기화 (새로운 추적 기간 시작)
          const now = new Date();
          const newTrackingStartedAt = now.toISOString();
          const newTrackingEndedAt = new Date(now.getTime() + condition.period_days * 24 * 60 * 60 * 1000).toISOString();
          
          await supabase
            .from("alert_conditions")
            .update({ 
              tracking_started_at: newTrackingStartedAt,
              tracking_ended_at: newTrackingEndedAt,
              cumulative_change_rate: 0.0,
              last_checked_at: new Date().toISOString()
            })
            .eq("id", condition.id);
        } else {
          // 누적 변동률만 업데이트
          await supabase
            .from("alert_conditions")
            .update({ 
              last_checked_at: new Date().toISOString(),
              cumulative_change_rate: newCumulativeRate
            })
            .eq("id", condition.id);
        }
      }
    } catch (error) {
      console.error(`주식 ${subscription.stock_code} 처리 오류:`, error);
    }
  }
}

function checkConditionThreshold(condition: any, cumulativeRate: number): boolean {
  const { condition_type, threshold } = condition;
  
  switch (condition_type) {
    case "rise":
      return cumulativeRate >= threshold;
    case "drop":
      return cumulativeRate <= -threshold;
    default:
      return false;
  }
}

async function createNotification(subscription: any, condition: any, dailyRate: number, cumulativeRate: number, currentPrice: number) {
  const { data: fcmTokens } = await supabase
    .from("fcm_tokens")
    .select("token")
    .eq("user_id", subscription.user_id)
    .eq("is_active", true);

  if (!fcmTokens || fcmTokens.length === 0) return;

  const conditionTypeLabel = condition.condition_type === 'rise' ? '상승' : '하락';
  const notification = {
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    condition_id: condition.id,
    triggered_price: currentPrice,
    sent_at: new Date().toISOString(),
    delivery_confirmed_at: false
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
            title: `${subscription.stock_name} ${conditionTypeLabel} 알림`,
            body: `누적 ${cumulativeRate.toFixed(2)}% ${conditionTypeLabel} (오늘: ${dailyRate.toFixed(2)}%)`
          }
        })
      });

      // 전달 확인 상태 업데이트
      await supabase
        .from("notifications")
        .update({ 
          delivery_confirmed_at: true
        })
        .eq("id", notificationRecord.id);
    } catch (error) {
      console.error("FCM 전송 오류:", error);
    }
  }
}

serve(async () => {
  await checkConditions();
  return new Response("Stock check completed!", { status: 200 });
});
```

## 실행 설정

### 스케줄링
- **국내 주식**: 매일 오전 9시 (KST)
- **해외 주식**: 매일 오후 11시 (KST)

### 환경 변수
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: 서비스 역할 키
- `FCM_SERVER_KEY`: Firebase Cloud Messaging 서버 키

---

# 프로젝트 구조

```
/stock-alert-app
├── /src
│   ├── /app                    # Next.js App Router
│   │   ├── /api               # API Routes
│   │   │   ├── /auth          # 인증 API
│   │   │   ├── /stocks        # 주식 API
│   │   │   └── /conditions    # 조건 API
│   │   ├── /auth              # 인증 페이지
│   │   ├── /conditions        # 조건 관리 페이지
│   │   └── page.tsx           # 메인 페이지
│   ├── /components            # UI 컴포넌트
│   │   ├── /ui               # shadcn/ui 기본 컴포넌트
│   │   ├── /auth             # 인증 컴포넌트
│   │   ├── /stock            # 주식 컴포넌트
│   │   └── /condition        # 조건 컴포넌트
│   ├── /lib                   # 유틸리티 및 설정
│   │   ├── /supabase         # Supabase 클라이언트
│   │   ├── /stock-api.ts     # 주식 API 서비스
│   │   └── /utils.ts         # 유틸리티 함수
│   ├── /types                 # TypeScript 타입 정의
│   ├── /hooks                 # 커스텀 React 훅
│   └── /constants            # 상수 정의
├── /supabase
│   ├── /functions            # Supabase Edge Functions
│   │   └── /check-stocks     # 주가 체크 함수
│   └── /migrations          # 데이터베이스 마이그레이션
└── package.json
```

---

# 주요 특징

## 연속 모니터링
- 알림 발송 후에도 조건이 계속 활성화되어 지속적인 모니터링
- 새로운 추적 기간을 자동으로 시작하여 반복 알림 가능

## 스마트 스케줄링
- 국내/해외 주식의 시장 시간을 고려한 차별화된 모니터링
- 효율적인 리소스 사용을 위한 시간대별 필터링

## 데이터 무결성
- 누적 변동률의 정확한 추적
- 추적 기간 관리로 조건 만료 처리
- 알림 기록을 통한 추적 가능성

이 문서는 StockAlert 프로젝트의 완전한 구현 가이드로, 개발자가 시스템을 이해하고 구현할 수 있도록 모든 필요한 정보를 포함하고 있습니다.
