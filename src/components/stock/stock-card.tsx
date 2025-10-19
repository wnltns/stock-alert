import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StockDetail, AlertHistory } from '@/types';
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

  const isConditionMet = (condition: any) => {
    if (!condition.is_active) return false;
    
    // 실제 조건 충족 로직 구현
    // 현재는 단순히 활성 상태만 확인하지만, 실제로는 주가 변화율과 비교해야 함
    // 예시: 상승 조건의 경우 현재 주가가 임계값 이상 상승했는지 확인
    // 예시: 하락 조건의 경우 현재 주가가 임계값 이상 하락했는지 확인
    
    // 임시 로직: 활성 상태인 조건을 모두 충족된 것으로 표시
    // 실제 구현에서는 주가 히스토리와 비교하여 정확한 충족 여부를 판단해야 함
    return condition.is_active;
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
            {conditions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {conditions.filter(condition => isConditionMet(condition)).length}개 충족
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getChangeIcon()}
            <span className="text-2xl font-bold">{formatPrice(stockInfo.currentPrice)}</span>
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
              {conditions.slice(0, 2).map((condition) => {
                const typeLabels: Record<string, string> = {
                  rise: '상승',
                  drop: '하락',
                };
                
                const isMet = isConditionMet(condition);
                
                return (
                  <div key={condition.id} className="flex items-start justify-between text-xs bg-muted/50 dark:bg-muted/30 p-2 rounded transition-colors gap-2">
                    <span className="flex-1 leading-tight">{typeLabels[condition.condition_type]} {condition.threshold}% ({condition.period_days}일)</span>
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
        alertHistory={alertHistory}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />
    </Card>
  );
}
