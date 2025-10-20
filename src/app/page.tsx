'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StockCard } from '@/components/stock/stock-card';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { StockDetail, AddStockFormData, StockSubscription } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useStockPrices } from '@/hooks/use-stock-prices';
import { AuthGuard } from '@/components/auth/auth-guard';
import { UserDropdown } from '@/components/auth/user-dropdown';
import { CacheInvalidateButton } from '@/components/ui/cache-invalidate-button';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 실시간 주가 데이터를 가져오는 훅 사용
  const { 
    stocks: realStocks, 
    loading, 
    error, 
    cached,
    lastFetchedAt,
    invalidateCache,
    refreshStocks
  } = useStockPrices();


  const handleAddStock = async (data: AddStockFormData) => {
    // 주식 등록 완료
    console.log('주식 등록 완료:', data);
    // 캐시 무효화하여 최신 데이터 표시
    await refreshStocks();
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

  const handleTestMonitoring = async () => {
    try {
      // 현재 사용자의 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        alert('인증이 필요합니다.');
        return;
      }

      const response = await fetch('/api/test-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          testMode: false, // 실제 DB 사용
          forceCheck: true, // 시간 제한 우회
          nationType: 'KOR' // 기본적으로 국내 주식 테스트
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`모니터링 완료!\n처리된 구독: ${result.results.processed}개\n알림 발송: ${result.results.notificationsSent}개`);
      } else {
        alert(`모니터링 실패: ${result.error || result.message}`);
      }
    } catch (error) {
      console.error('모니터링 오류:', error);
      alert('모니터링 중 오류가 발생했습니다.');
    }
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
            

            <div className="mb-8">
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    구독한 주식
                  </h2>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* 마지막 데이터 조회 시간 표시 */}
                    {lastFetchedAt && (
                      <span className="text-xs text-muted-foreground">
                        마지막 조회: {lastFetchedAt.toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {cached && (
                        <>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            캐시됨
                          </span>
                          <CacheInvalidateButton onInvalidate={handleCacheInvalidate} />
                        </>
                      )}
                      
                      {/* 개발자 테스트 버튼 */}
                      {process.env.NODE_ENV === 'development' && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleTestMonitoring}
                          className="text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          테스트
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
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
                  <div className="flex justify-center">
                    <CacheInvalidateButton onInvalidate={handleCacheInvalidate} />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                  {realStocks.map((stock) => {
                    return (
                      <StockCard
                        key={stock.subscription.id}
                        stock={stock}
                        onViewDetails={handleViewDetails}
                        onAddCondition={handleAddCondition}
                        alertHistory={[]}
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
