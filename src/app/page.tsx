'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StockCard } from '@/components/stock/stock-card';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { MOCK_STOCK_DETAILS, MOCK_ALERT_HISTORY } from '@/constants/mock-data';
import { StockDetail, AddStockFormData, StockSubscription } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useStockPrices } from '@/hooks/use-stock-prices';
import { AuthGuard } from '@/components/auth/auth-guard';
import { UserDropdown } from '@/components/auth/user-dropdown';
import { CacheInvalidateButton } from '@/components/ui/cache-invalidate-button';
import { supabase } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockDetail[]>(MOCK_STOCK_DETAILS);
  const { user } = useAuth();
  
  // 실시간 주가 데이터를 가져오는 훅 사용
  const { 
    stocks: realStocks, 
    loading, 
    error, 
    cached,
    invalidateCache
  } = useStockPrices();

  const handleAddStock = (data: AddStockFormData) => {
    // 주식 등록 완료
    console.log('주식 등록 완료:', data);
    // 페이지 새로고침으로 최신 데이터 표시
    window.location.reload();
  };

  const handleViewDetails = (stockId: string) => {
    router.push(`/conditions/${stockId}`);
  };

  const handleAddCondition = (stockCode: string) => {
    console.log('설정 페이지로 이동:', stockCode);
    router.push(`/conditions/${stockCode}`);
  };

  const handleCacheInvalidate = async () => {
    await invalidateCache();
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          {/* 사용자 드롭다운 */}
          <div className="flex justify-start items-center mb-6">
            <UserDropdown />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              StockAlert
            </h1>
            <p className="text-muted-foreground">
              관심 주식의 등락률 조건을 설정하고 자동으로 알림을 받아보세요.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <AddStockDialog onAddStock={handleAddStock} />
            </div>
            
            {/* 목업 데이터 섹션 */}
            {stocks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-muted-foreground">
                  샘플 데이터
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {stocks.map((stock) => {
                    const stockAlertHistory = MOCK_ALERT_HISTORY.filter(
                      history => history.subscription_id === stock.subscription.id
                    );
                    
                    return (
                      <StockCard
                        key={stock.subscription.id}
                        stock={stock}
                        onViewDetails={handleViewDetails}
                        onAddCondition={handleAddCondition}
                        alertHistory={stockAlertHistory}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* 실제 데이터 섹션 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">
                  내 주식 구독
                </h2>
                {cached && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      캐시됨
                    </span>
                    <CacheInvalidateButton onInvalidate={handleCacheInvalidate} />
                  </div>
                )}
              </div>
              
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <p className="text-sm text-muted-foreground">
                    페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                  </p>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">주식 데이터를 불러오는 중...</p>
                </div>
              ) : realStocks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    아직 구독된 주식이 없습니다. 주식을 추가해보세요!
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {realStocks.map((stock) => {
                    const stockAlertHistory = MOCK_ALERT_HISTORY.filter(
                      history => history.subscription_id === stock.subscription.id
                    );
                    
                    return (
                      <StockCard
                        key={stock.subscription.id}
                        stock={stock}
                        onViewDetails={handleViewDetails}
                        onAddCondition={handleAddCondition}
                        alertHistory={stockAlertHistory}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
