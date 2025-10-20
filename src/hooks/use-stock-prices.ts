import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { StockDetail } from '@/types';

interface UseStockPricesReturn {
  stocks: StockDetail[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  lastFetchedAt: Date | null;
  invalidateCache: () => Promise<void>;
  refreshStocks: () => Promise<void>;
}

export function useStockPrices(): UseStockPricesReturn {
  const [stocks, setStocks] = useState<StockDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  // localStorage에서 캐시된 데이터 로드
  const loadCachedData = () => {
    try {
      const cachedData = localStorage.getItem('stock-prices-cache');
      
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        const cacheAge = now - timestamp;
        
        // 1시간 이내의 캐시만 사용
        if (cacheAge < 60 * 60 * 1000) {
          setStocks(data);
          setCached(true);
          setLastFetchedAt(new Date(timestamp));
          return true;
        }
      }
    } catch (error) {
      console.warn('캐시 데이터 로드 실패:', error);
    }
    return false;
  };

  // localStorage에 데이터 저장
  const saveCachedData = (data: StockDetail[]) => {
    try {
      localStorage.setItem('stock-prices-cache', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('캐시 데이터 저장 실패:', error);
    }
  };

  const fetchStockPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('인증이 필요합니다.');
      }

      // 주가 데이터 API 호출
      const response = await fetch('/api/stocks/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '주가 데이터를 가져올 수 없습니다.');
      }

      const result = await response.json();
      
      // 캐시 상태 업데이트 (서버에서 캐시 사용 여부 확인)
      setCached(result.cached || false);
      
      // 알림 조건 데이터도 함께 조회
      const stockCodes = result.data.map((item: any) => item.subscription.stock_code);
      
      if (stockCodes.length > 0) {
        const { data: conditions, error: conditionsError } = await supabase
          .from('alert_conditions')
          .select('*')
          .in('subscription_id', result.data.map((item: any) => item.subscription.id));

        if (conditionsError) {
          console.warn('알림 조건 조회 중 오류:', conditionsError);
        }

        // 주가 데이터와 조건 데이터를 결합
        const stocksWithConditions = result.data.map((item: any) => ({
          ...item,
          conditions: conditions?.filter(condition => 
            condition.subscription_id === item.subscription.id
          ) || []
        }));

        setStocks(stocksWithConditions);
        saveCachedData(stocksWithConditions);
        setLastFetchedAt(new Date());
      } else {
        setStocks([]);
        setLastFetchedAt(new Date());
      }

    } catch (err) {
      console.error('주가 데이터 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 캐시 무효화 함수
  const invalidateCache = async () => {
    try {
      // 서버 사이드 캐시 무효화
      const response = await fetch('/api/stocks/prices/invalidate', {
        method: 'POST',
      });
      
      if (response.ok) {
        // 클라이언트 사이드 캐시 무효화
        localStorage.removeItem('stock-prices-cache');
        // 즉시 최신 데이터 가져오기
        await fetchStockPrices();
      } else {
        console.error('캐시 무효화 실패');
      }
    } catch (error) {
      console.error('캐시 무효화 요청 실패:', error);
    }
  };

  // 강제 새로고침 함수 (캐시 무시)
  const refreshStocks = async () => {
    try {
      // 서버 사이드 캐시 무효화
      const response = await fetch('/api/stocks/prices/invalidate', {
        method: 'POST',
      });
      
      if (response.ok) {
        // 클라이언트 사이드 캐시 무효화
        localStorage.removeItem('stock-prices-cache');
        setCached(false);
        // 최신 데이터 가져오기
        await fetchStockPrices();
      } else {
        console.error('서버 캐시 무효화 실패');
        // 서버 캐시 무효화가 실패해도 클라이언트 캐시는 무효화하고 데이터 가져오기
        localStorage.removeItem('stock-prices-cache');
        setCached(false);
        await fetchStockPrices();
      }
    } catch (error) {
      console.error('주식 목록 새로고침 실패:', error);
      // 에러가 발생해도 클라이언트 캐시는 무효화하고 데이터 가져오기
      localStorage.removeItem('stock-prices-cache');
      setCached(false);
      await fetchStockPrices();
    }
  };

  useEffect(() => {
    // 먼저 캐시된 데이터 로드 시도
    const hasCachedData = loadCachedData();
    
    // 캐시된 데이터가 없거나 오래된 경우에만 API 호출
    if (!hasCachedData) {
      fetchStockPrices();
    }
  }, []);

  return {
    stocks,
    loading,
    error,
    cached,
    lastFetchedAt,
    invalidateCache,
    refreshStocks,
  };
}
