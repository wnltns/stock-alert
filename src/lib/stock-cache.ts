import { unstable_cache } from 'next/cache';
import { getMultipleStockInfos } from '@/lib/stock-api';
import type { Database, StockDetail } from '@/types';
import { createClient } from '@supabase/supabase-js';

// 서버 사이드 Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// 캐시된 주가 데이터 조회 함수
async function getCachedStockPrices(userId: string): Promise<StockDetail[]> {
  // 사용자의 주식 구독 목록 조회 (최근 등록된 순으로 정렬)
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from('stock_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (subscriptionsError || !subscriptions || subscriptions.length === 0) {
    return [];
  }

  // 각 주식에 대해 저장된 API 정보를 사용하여 주가 데이터 가져오기
  const stockDetails = [];
  
  for (const subscription of subscriptions) {
    try {
      // 저장된 API 정보가 있는지 확인
      const apiInfo = subscription.api_info as any;
      
      if (!apiInfo || !apiInfo.endpoint) {
        console.warn(`주식 ${subscription.stock_code}의 API 정보가 없습니다.`);
        // API 정보가 없으면 기본값으로 설정
        const { data: conditions } = await supabase
          .from('alert_conditions')
          .select('*')
          .eq('subscription_id', subscription.id)
          .eq('is_active', true);

        stockDetails.push({
          subscription,
          stockInfo: {
            code: subscription.stock_code,
            name: subscription.stock_name,
            logoUrl: '',
            currentPrice: 0,
            changeAmount: 0,
            changeRate: 0,
            marketStatus: 'CLOSE' as const,
            marketName: subscription.market,
            lastTradedAt: new Date(),
            isRising: false,
          },
          conditions: conditions || []
        });
        continue;
      }

      // 저장된 API 엔드포인트로 주가 데이터 조회
      const response = await fetch(apiInfo.endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': 'https://m.stock.naver.com/',
          'Origin': 'https://m.stock.naver.com',
        },
      });

      if (!response.ok) {
        console.warn(`주식 ${subscription.stock_code} API 호출 실패: ${response.status}`);
        // API 호출 실패 시 기본값으로 설정
        const { data: conditions } = await supabase
          .from('alert_conditions')
          .select('*')
          .eq('subscription_id', subscription.id)
          .eq('is_active', true);

        stockDetails.push({
          subscription,
          stockInfo: {
            code: subscription.stock_code,
            name: subscription.stock_name,
            logoUrl: '',
            currentPrice: 0,
            changeAmount: 0,
            changeRate: 0,
            marketStatus: 'CLOSE' as const,
            marketName: subscription.market,
            lastTradedAt: new Date(),
            isRising: false,
          },
          conditions: conditions || []
        });
        continue;
      }

      const apiData = await response.json();
      
      // API 응답을 StockInfo 형태로 변환
      const stockInfo = {
        code: apiData.itemCode || subscription.stock_code,
        name: apiData.stockName || apiData.indexName || subscription.stock_name,
        logoUrl: apiData.itemLogoUrl || '',
        currentPrice: parseFloat((apiData.closePrice || '0').replace(/,/g, '')) || 0,
        changeAmount: parseFloat((apiData.compareToPreviousClosePrice || '0').replace(/,/g, '')) || 0,
        changeRate: parseFloat(apiData.fluctuationsRatio || '0') || 0,
        marketStatus: apiData.marketStatus === 'OPEN' ? 'OPEN' as const : 'CLOSE' as const,
        marketName: apiData.stockExchangeType?.nameKor || subscription.market,
        lastTradedAt: new Date(apiData.localTradedAt || new Date()),
        isRising: apiData.compareToPreviousPrice?.code === '2',
      };

      // 해당 구독의 알림 조건들 가져오기
      const { data: conditions } = await supabase
        .from('alert_conditions')
        .select('*')
        .eq('subscription_id', subscription.id)
        .eq('is_active', true);

      stockDetails.push({
        subscription,
        stockInfo,
        conditions: conditions || []
      });

      // API 호출 성공 시 마지막 호출 시간 업데이트
      await supabase
        .from('stock_subscriptions')
        .update({
          api_info: {
            ...apiInfo,
            last_successful_call: new Date().toISOString(),
          }
        })
        .eq('id', subscription.id);

    } catch (error) {
      console.error(`주식 ${subscription.stock_code} 처리 중 오류:`, error);
      // 에러 발생 시 기본값으로 설정
      const { data: conditions } = await supabase
        .from('alert_conditions')
        .select('*')
        .eq('subscription_id', subscription.id)
        .eq('is_active', true);

      stockDetails.push({
        subscription,
        stockInfo: {
          code: subscription.stock_code,
          name: subscription.stock_name,
          logoUrl: '',
          currentPrice: 0,
          changeAmount: 0,
          changeRate: 0,
          marketStatus: 'CLOSE' as const,
          marketName: subscription.market,
          lastTradedAt: new Date(),
          isRising: false,
        },
        conditions: conditions || []
      });
    }
  }

  return stockDetails;
}

// 캐시 설정 함수
function getCacheConfig() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0: 일요일, 6: 토요일
  
  // 주말 체크
  const isWeekend = day === 0 || day === 6;
  
  // 거래 시간 체크 (한국 시간 기준)
  const isTradingHours = hour >= 9 && hour < 16;
  
  if (isWeekend) {
    // 주말: 1시간 캐시
    return { revalidate: 3600, tags: ['stock-prices'] };
  } else if (isTradingHours) {
    // 거래 시간: 30초 캐시
    return { revalidate: 30, tags: ['stock-prices'] };
  } else {
    // 거래 종료 후: 5분 캐시
    return { revalidate: 300, tags: ['stock-prices'] };
  }
}

// 캐시된 주가 데이터 조회 함수 (unstable_cache 적용)
export const getCachedStockPricesWithCache = unstable_cache(
  async (userId: string) => {
    console.log(`캐시에서 주가 데이터 조회: ${userId}`);
    return getCachedStockPrices(userId);
  },
  ['stock-prices'],
  getCacheConfig()
);

// 캐시 무효화 함수
export async function invalidateStockPriceCache() {
  const { revalidateTag } = await import('next/cache');
  revalidateTag('stock-prices');
  console.log('주가 데이터 캐시 무효화 완료');
}
