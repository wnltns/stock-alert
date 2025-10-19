'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';
import { AlertHistory } from '@/types';

interface AlertHistoryDialogProps {
  stockName: string;
  stockCode: string;
  alertHistory: AlertHistory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertHistoryDialog({ 
  stockName, 
  stockCode, 
  alertHistory, 
  open, 
  onOpenChange 
}: AlertHistoryDialogProps) {
  const [readHistory, setReadHistory] = useState<Set<string>>(new Set());

  const getConditionTypeLabel = (type: AlertHistory['condition_type']) => {
    const labels: Record<string, string> = {
      drop: '하락',
      rise: '상승',
    };
    return labels[type];
  };

  const getConditionIcon = (type: AlertHistory['condition_type']) => {
    if (type === 'rise') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString() + '원';
  };

  const handleMarkAsRead = (historyId: string) => {
    setReadHistory(prev => new Set([...prev, historyId]));
  };

  const unreadCount = alertHistory.filter(history => !history.is_read && !readHistory.has(history.id)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {stockName} 알림 히스토리
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{stockCode} • 총 {alertHistory.length}건의 알림</span>
            {unreadCount > 0 && (
              <Badge variant="destructive">
                {unreadCount}개 미읽음
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {alertHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  아직 알림 히스토리가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  조건이 충족되면 여기에 알림이 표시됩니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            alertHistory
              .sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())
              .map((history) => {
                const isRead = history.is_read || readHistory.has(history.id);
                
                return (
                  <Card key={history.id} className={`transition-all duration-200 ${!isRead ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getConditionIcon(history.condition_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={history.condition_type === 'rise' ? 'default' : 'secondary'}>
                                {getConditionTypeLabel(history.condition_type)} {history.threshold}%
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {history.period_days}일간
                              </Badge>
                              {!isRead && (
                                <Badge variant="destructive" className="text-xs">
                                  새 알림
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm font-medium mb-2">{history.message}</p>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span>등락률:</span>
                                <span className="ml-1 font-medium">{history.threshold}%</span>
                              </div>
                              <div>
                                <span>발생가:</span>
                                <span className="ml-1 font-medium">{formatPrice(history.triggered_price)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(new Date(history.triggered_at))}
                            </div>
                          </div>
                        </div>
                        
                        {!isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(history.id)}
                            className="ml-2 shrink-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
