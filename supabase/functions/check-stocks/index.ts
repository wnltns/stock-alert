import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Supabase 클라이언트 초기화
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID');
const firebaseClientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');
const firebasePrivateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');

interface StockApiResponse {
  stockEndType: string;
  itemCode: string;
  stockName: string;
  closePrice: string;
  fluctuationsRatio: string;
  marketStatus: string;
  localTradedAt: string;
}

interface AlertCondition {
  id: string;
  subscription_id: string;
  condition_type: 'rise' | 'drop';
  threshold: number;
  period_days: number;
  cumulative_change_rate: number;
  tracking_started_at: string;
  tracking_ended_at: string;
  is_active: boolean;
  stock_subscriptions: {
    stock_code: string;
    stock_name: string;
    nation_type: string;
    user_id: string;
  };
}

interface NotificationData {
  user_id: string;
  subscription_id: string;
  condition_id: string;
  triggered_price: number;
  cumulative_change_rate: number;
}

// -----------------------------
// Firebase HTTP v1 Auth Helpers
// -----------------------------
const OAUTH_TOKEN_URI = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

let cachedAccessToken: { token: string; expiresAtMs: number } | null = null;

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string): string {
  let bytes: Uint8Array;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    bytes = input;
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function parsePkcs8Pem(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .trim();
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const keyData = parsePkcs8Pem(pem);
  return await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function createJwt(clientEmail: string, scope: string): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope,
    aud: OAUTH_TOKEN_URI,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  } as Record<string, unknown>;

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  if (!firebasePrivateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY 환경 변수가 설정되지 않았습니다.');
  }

  // Supabase 시크릿에 저장할 때 \n 이스케이프가 있을 수 있으므로 복원
  const normalizedPem = firebasePrivateKey.replace(/\\n/g, '\n');
  const privateKey = await importPrivateKey(normalizedPem);
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(unsignedToken)
  );
  const encodedSignature = base64UrlEncode(signature);
  return `${unsignedToken}.${encodedSignature}`;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAtMs - 60_000 > now) {
    return cachedAccessToken.token;
  }
  if (!firebaseClientEmail) {
    throw new Error('FIREBASE_CLIENT_EMAIL 환경 변수가 설정되지 않았습니다.');
  }
  const assertion = await createJwt(firebaseClientEmail, FCM_SCOPE);
  const res = await fetch(OAUTH_TOKEN_URI, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth 토큰 발급 실패: ${res.status} ${text}`);
  }
  const json = await res.json() as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: json.access_token,
    expiresAtMs: now + (json.expires_in * 1000),
  };
  return json.access_token;
}

async function sendFcmV1(token: string, title: string, body: string): Promise<void> {
  if (!firebaseProjectId) {
    throw new Error('FIREBASE_PROJECT_ID 환경 변수가 설정되지 않았습니다.');
  }
  const accessToken = await getAccessToken();
  const endpoint = `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM 전송 실패: ${res.status} ${text}`);
  }
}

/**
 * 주식 가격 조회 함수
 */
async function fetchStockPrice(stockCode: string): Promise<StockApiResponse | null> {
  try {
    const response = await fetch(
      `https://polling.finance.naver.com/api/realtime/domestic/stock/${stockCode}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    if (!response.ok) {
      console.error(`주식 가격 조회 실패: ${stockCode}, 상태: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`주식 가격 조회 오류: ${stockCode}`, error);
    return null;
  }
}

/**
 * 주식 가격 정규화 함수
 */
function normalizeStockData(apiResponse: StockApiResponse) {
  const currentPrice = parseFloat(apiResponse.closePrice);
  const changeRate = parseFloat(apiResponse.fluctuationsRatio);
  
  return {
    currentPrice,
    changeRate,
    marketStatus: apiResponse.marketStatus,
    lastTradedAt: new Date(apiResponse.localTradedAt)
  };
}

/**
 * 알림 발송 함수
 */
async function sendNotification(notificationData: NotificationData): Promise<boolean> {
  try {
    // 알림 기록 저장
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: notificationData.user_id,
        subscription_id: notificationData.subscription_id,
        condition_id: notificationData.condition_id,
        triggered_price: notificationData.triggered_price,
        cumulative_change_rate: notificationData.cumulative_change_rate,
        sent_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('알림 기록 저장 오류:', insertError);
      return false;
    }

    // FCM 토큰 조회
    const { data: fcmTokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token, device_type')
      .eq('user_id', notificationData.user_id)
      .eq('is_active', true);

    if (tokenError || !fcmTokens || fcmTokens.length === 0) {
      console.log('FCM 토큰이 없습니다:', notificationData.user_id);
      return true; // 알림 기록은 저장되었으므로 성공으로 처리
    }

    // FCM HTTP v1 발송
    const title = '주가 알림';
    const body = `누적 변동률 ${notificationData.cumulative_change_rate.toFixed(2)}%`;
    for (const t of fcmTokens) {
      try {
        await sendFcmV1(t.token, title, body);
      } catch (e) {
        console.error('FCM 전송 오류:', e);
      }
    }

    return true;
  } catch (error) {
    console.error('알림 발송 오류:', error);
    return false;
  }
}

/**
 * 조건 충족 여부 확인 및 처리
 */
async function checkAndProcessCondition(condition: AlertCondition): Promise<void> {
  try {
    const stockCode = condition.stock_subscriptions.stock_code;
    const stockName = condition.stock_subscriptions.stock_name;
    
    // 주식 가격 조회
    const stockData = await fetchStockPrice(stockCode);
    if (!stockData) {
      console.error(`주식 가격 조회 실패: ${stockCode}`);
      return;
    }

    const normalizedData = normalizeStockData(stockData);
    const currentPrice = normalizedData.currentPrice;
    const dailyChangeRate = normalizedData.changeRate;

    // 누적 변동률 업데이트
    const newCumulativeRate = condition.cumulative_change_rate + dailyChangeRate;
    
    // 조건 충족 여부 확인
    let conditionMet = false;
    if (condition.condition_type === 'rise' && newCumulativeRate >= condition.threshold) {
      conditionMet = true;
    } else if (condition.condition_type === 'drop' && newCumulativeRate <= -condition.threshold) {
      conditionMet = true;
    }

    // 누적 변동률 업데이트
    const { error: updateError } = await supabase
      .from('alert_conditions')
      .update({
        cumulative_change_rate: newCumulativeRate,
        last_checked_at: new Date().toISOString()
      })
      .eq('id', condition.id);

    if (updateError) {
      console.error('조건 업데이트 오류:', updateError);
      return;
    }

    // 조건 충족 시 알림 발송
    if (conditionMet) {
      console.log(`조건 충족: ${stockName} (${stockCode}) - ${condition.condition_type} ${condition.threshold}%`);
      
      const notificationSent = await sendNotification({
        user_id: condition.stock_subscriptions.user_id,
        subscription_id: condition.subscription_id,
        condition_id: condition.id,
        triggered_price: currentPrice,
        cumulative_change_rate: newCumulativeRate
      });

      if (notificationSent) {
        // 알림 발송 후 조건 초기화
        await supabase
          .from('alert_conditions')
          .update({
            cumulative_change_rate: 0,
            tracking_started_at: new Date().toISOString(),
            tracking_ended_at: new Date(Date.now() + condition.period_days * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('id', condition.id);
      }
    } else {
      console.log(`조건 미충족: ${stockName} (${stockCode}) - 현재 누적: ${newCumulativeRate.toFixed(2)}%`);
    }

  } catch (error) {
    console.error('조건 처리 오류:', error);
  }
}

/**
 * 메인 핸들러 함수
 */
Deno.serve(async (req: Request) => {
  try {
    const { nationType } = await req.json();
    
    if (!nationType || !['KOR', 'FOREIGN'].includes(nationType)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 nationType입니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${nationType} 주식 모니터링 시작`);

    // 활성화된 알림 조건 조회
    const { data: conditions, error: conditionsError } = await supabase
      .from('alert_conditions')
      .select(`
        id,
        subscription_id,
        condition_type,
        threshold,
        period_days,
        cumulative_change_rate,
        tracking_started_at,
        tracking_ended_at,
        is_active,
        stock_subscriptions!inner(
          stock_code,
          stock_name,
          nation_type,
          user_id
        )
      `)
      .eq('is_active', true)
      .eq('stock_subscriptions.nation_type', nationType)
      .lte('tracking_ended_at', new Date().toISOString()); // 추적 기간이 끝난 조건들

    if (conditionsError) {
      console.error('조건 조회 오류:', conditionsError);
      return new Response(
        JSON.stringify({ error: '조건 조회에 실패했습니다.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!conditions || conditions.length === 0) {
      console.log('처리할 조건이 없습니다.');
      return new Response(
        JSON.stringify({ message: '처리할 조건이 없습니다.', processed: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`${conditions.length}개의 조건을 처리합니다.`);

    // 각 조건을 병렬로 처리
    await Promise.all(conditions.map(condition => checkAndProcessCondition(condition)));

    return new Response(
      JSON.stringify({ 
        message: `${nationType} 주식 모니터링 완료`,
        processed: conditions.length 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('모니터링 함수 오류:', error);
    return new Response(
      JSON.stringify({ error: '모니터링 중 오류가 발생했습니다.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
