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
  const { subscription, price, conditions } = stock;
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  
  const getChangeIcon = () => {
    if (price.changeRate > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (price.changeRate < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = () => {
    if (price.changeRate > 0) return 'text-green-600 dark:text-green-400';
    if (price.changeRate < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card className="w-full transition-all duration-300 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{subscription.stockName}</CardTitle>
            <CardDescription>{subscription.stockCode}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline">{conditions.length}개 조건</Badge>
            {conditions.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {conditions.filter(condition => {
                  const targetPrice = condition.type === 'drop' 
                    ? Math.round(condition.basePrice * (1 - condition.threshold / 100))
                    : Math.round(condition.basePrice * (1 + condition.threshold / 100));
                  
                  if (condition.type === 'rise') {
                    return price.currentPrice >= targetPrice;
                  } else {
                    return price.currentPrice <= targetPrice;
                  }
                }).length}개 충족
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getChangeIcon()}
            <span className="text-2xl font-bold">{price.currentPrice.toLocaleString()}원</span>
          </div>
          <div className={`text-right ${getChangeColor()}`}>
            <div className="text-sm font-medium">
              {price.changeRate > 0 ? '+' : ''}{price.changeRate.toFixed(2)}%
            </div>
            <div className="text-xs">
              {price.changeAmount > 0 ? '+' : ''}{price.changeAmount.toLocaleString()}원
            </div>
          </div>
        </div>
        
        {/* 조건 목록 */}
        {conditions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">설정된 조건</div>
            <div className="space-y-1">
              {conditions.slice(0, 2).map((condition) => {
                const typeLabels = {
                  drop: '하락',
                  rise: '상승',
                };
                
                const targetPrice = condition.type === 'drop' 
                  ? Math.round(condition.basePrice * (1 - condition.threshold / 100))
                  : Math.round(condition.basePrice * (1 + condition.threshold / 100));
                
                const isMet = condition.type === 'rise'
                  ? price.currentPrice >= targetPrice
                  : price.currentPrice <= targetPrice;
                
                return (
                  <div key={condition.id} className="flex items-center justify-between text-xs bg-muted/50 dark:bg-muted/30 p-2 rounded transition-colors">
                    <span>{typeLabels[condition.type]} {condition.threshold}% ({condition.period}일)</span>
                    <Badge variant={isMet ? "success" : "outline"} className="text-xs">
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
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onAddCondition(subscription.id)}
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
        stockName={subscription.stockName}
        stockCode={subscription.stockCode}
        alertHistory={alertHistory}
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />
    </Card>
  );
}
