'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StockCard } from '@/components/stock/stock-card';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { MOCK_STOCK_DETAILS, MOCK_ALERT_HISTORY } from '@/constants/mock-data';
import { StockDetail, AddStockFormData } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { AuthGuard } from '@/components/auth/auth-guard';
import { UserDropdown } from '@/components/auth/user-dropdown';

export default function Home() {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockDetail[]>(MOCK_STOCK_DETAILS);

  const handleAddStock = (data: AddStockFormData) => {
    const newStock: StockDetail = {
      subscription: {
        id: Date.now().toString(),
        user_id: 'user1',
        stock_code: data.stockCode,
        stock_name: data.stockName,
        market: 'KOSPI',
        added_at: new Date().toISOString(),
        is_active: true,
        base_price: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      stockInfo: {
        code: data.stockCode,
        name: data.stockName,
        logoUrl: '',
        currentPrice: 0,
        changeAmount: 0,
        changeRate: 0,
        marketStatus: 'CLOSE',
        marketName: 'KOSPI',
        lastTradedAt: new Date(),
        isRising: false,
      },
      conditions: [],
    };
    
    setStocks(prev => [...prev, newStock]);
  };

  const handleViewDetails = (stockId: string) => {
    router.push(`/conditions/${stockId}`);
  };

  const handleAddCondition = (stockId: string) => {
    router.push(`/conditions/${stockId}`);
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
            
            {stocks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  아직 구독된 주식이 없습니다. 주식을 추가해보세요!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
