import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StockDetail, AlertHistory, Notification, AlertConditionWithStatus } from '@/types';
import { AlertHistoryDialog } from './alert-history-dialog';
import { useState } from 'react';

interface StockCardProps {
  stock: StockDetail;
  onViewDetails: (stockId: string) => void;
  onAddCondition: (stockId: string) => void;
  alertHistory?: AlertHistory[];
}

export function StockCard({ stock, onViewDetails, onAddCondition, alertHistory = [] }: StockCardProps) {
  const { subscription, stockInfo, conditions } = stock;
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const getChangeIcon = () => {
    if (stockInfo.changeRate > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (stockInfo.changeRate < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = () => {
    if (stockInfo.changeRate > 0) return 'text-green-600 dark:text-green-400';
    if (stockInfo.changeRate < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatPrice = (price: number) => {
    const isKorean = subscription.nation_type === 'KOREA' || subscription.nation_type === 'KOR';
    if (isKorean) {
      return price.toLocaleString() + '원';
    } else {
      return price.toFixed(2);
    }
  };

  const formatChangeAmount = (amount: number) => {
    const isKorean = subscription.nation_type === 'KOREA' || subscription.nation_type === 'KOR';
    if (isKorean) {
      return (amount > 0 ? '+' : '') + amount.toLocaleString() + '원';
    } else {
      return (amount > 0 ? '+' : '') + amount.toFixed(2);
    }
  };

  return (
    <Card className="w-full h-full flex flex-col transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/10">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">
              {subscription.stock_name}
            </CardTitle>
            <CardDescription className="truncate">{subscription.stock_code}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <Badge variant={"outline"}>
              {subscription.is_active ? "ON" : "OFF"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getChangeIcon()}
            <span className="text-xl sm:text-2xl font-bold">{formatPrice(stockInfo.currentPrice)}</span>
          </div>
          <div className={`text-right ${getChangeColor()}`}>
            <div className="text-sm font-medium">
              {stockInfo.changeRate > 0 ? '+' : ''}{stockInfo.changeRate.toFixed(2)}%
            </div>
            <div className="text-xs">
              {formatChangeAmount(stockInfo.changeAmount)}
            </div>
          </div>
        </div>
        {/* 조건 목록 */}
        <div className="space-y-2 flex-1">
          <div className="text-sm font-medium text-muted-foreground">설정된 조건</div>
          {conditions.length > 0 ? (
            <div className="space-y-1">
              {conditions.slice(0, 2).map((condition: AlertConditionWithStatus) => {
                const typeLabels: Record<string, string> = {
                  rise: '상승',
                  drop: '하락',
                };
                
                // 백엔드에서 계산된 조건 충족 상태 사용
                const isMet = condition.is_condition_met || false;
                
                // 디버깅 로그 (개발 환경에서만)
                if (process.env.NODE_ENV === 'development') {
                  console.log(`프론트엔드 조건 상태:`, {
                    conditionId: condition.id,
                    conditionType: condition.condition_type,
                    threshold: condition.threshold,
                    is_condition_met: condition.is_condition_met,
                    isMet: isMet
                  });
                }
                
                return (
                  <div key={condition.id} className="flex items-center justify-between text-xs bg-muted/50 dark:bg-muted/30 p-2 rounded transition-colors gap-2">
                    <div className="flex-1 leading-tight">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <span className="break-words">{typeLabels[condition.condition_type]} {condition.threshold}% ({condition.period_days}일)</span>
                        {condition.cumulative_change_rate !== undefined && condition.cumulative_change_rate !== null && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {condition.cumulative_change_rate > 0 ? '+' : ''}{condition.cumulative_change_rate.toFixed(2)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={isMet ? "default" : "outline"} className={`text-xs flex-shrink-0 ${isMet ? "bg-green-500" : ""}`}>
                      {isMet ? "충족" : "대기"}
                    </Badge>
                  </div>
                );
              })}
              {conditions.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{conditions.length - 2}개 더
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center py-2">
              조건이 없습니다
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 mt-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAddCondition(subscription.stock_code)}
            className="flex-1"
          >
            설정
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsHistoryDialogOpen(true)}
            className="flex-1"
          >
            히스토리
          </Button>
        </div>
      </CardContent>
      
      {/* 알림 히스토리 다이얼로그 */}
      <AlertHistoryDialog
        stockName={subscription.stock_name}
        stockCode={subscription.stock_code}
        subscriptionId={subscription.id}
        alertHistory={alertHistory}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />
    </Card>
  );
}
