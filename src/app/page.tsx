'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StockCard } from '@/components/stock/stock-card';
import { AddStockDialog } from '@/components/stock/add-stock-dialog';
import { MOCK_STOCK_DETAILS, MOCK_ALERT_HISTORY } from '@/constants/mock-data';
import { StockDetail, AddStockFormData } from '@/types';

export default function Home() {
  const router = useRouter();
  const [stocks, setStocks] = useState<StockDetail[]>(MOCK_STOCK_DETAILS);

  const handleAddStock = (data: AddStockFormData) => {
    const newStock: StockDetail = {
      subscription: {
        id: Date.now().toString(),
        userId: 'user1',
        stockCode: data.stockCode,
        stockName: data.stockName,
        addedAt: new Date(),
        isActive: true,
      },
      price: {
        stockCode: data.stockCode,
        currentPrice: 0,
        changeRate: 0,
        changeAmount: 0,
        volume: 0,
        timestamp: new Date(),
      },
      conditions: [],
    };
    
    setStocks(prev => [...prev, newStock]);
  };

  const handleViewDetails = (stockId: string) => {
    // TODO: 상세 페이지로 이동
    console.log('View details for stock:', stockId);
  };

  const handleAddCondition = (stockId: string) => {
    router.push(`/conditions/${stockId}`);
  };

  return (
    <main className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
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
                  history => history.subscriptionId === stock.subscription.id
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
  );
}
