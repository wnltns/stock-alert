'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { AlertHistory } from '@/types';
import { useNotificationHistory } from '@/hooks/use-notification-history';
import { supabase } from '@/lib/supabase/client';

interface AlertHistoryDialogProps {
  stockName: string;
  stockCode: string;
  subscriptionId: string;
  alertHistory?: AlertHistory[]; // 기존 목업 데이터 (선택적)
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlertHistoryDialog({ 
  stockName, 
  stockCode, 
  subscriptionId,
  alertHistory: mockHistory = [], 
  open, 
  onOpenChange 
}: AlertHistoryDialogProps) {
  
  // 실제 알림 히스토리 훅 사용
  const { 
    notifications, 
    loading, 
    error, 
    total,
    hasMore,
    fetchNotifications,
    updateDeliveryStatus,
    clearNotifications
  } = useNotificationHistory();

  // 다이얼로그가 열릴 때 해당 주식의 알림 히스토리 조회
  useEffect(() => {
    if (open && subscriptionId) {
      fetchNotifications(subscriptionId, true);
    }
  }, [open, subscriptionId]); // fetchNotifications를 의존성에서 제거

  // 알림이 로드될 때 읽지 않은 알림들을 자동으로 읽음 처리 (백엔드만 업데이트)
  useEffect(() => {
    if (notifications.length > 0) {
      notifications.forEach(async (notification) => {
        // 읽지 않은 알림이면 자동으로 읽음 처리 (백엔드만 업데이트, 프론트엔드 상태는 변경하지 않음)
        if (!notification.delivery_confirmed_at) {
          try {
            // 직접 API 호출하여 백엔드만 업데이트
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              await fetch('/api/notifications', {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  notificationId: notification.id,
                  deliveryConfirmed: true
                }),
              });
            }
          } catch (error) {
            console.error('알림 읽음 처리 오류:', error);
          }
        }
      });
    }
  }, [notifications]);

  // 다이얼로그가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      // 다이얼로그가 닫힐 때 알림 히스토리 상태 초기화
      clearNotifications();
    }
  }, [open]); // clearNotifications를 의존성에서 제거

  const getConditionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      drop: '하락',
      rise: '상승',
    };
    return labels[type] || type;
  };

  const getConditionIcon = (type: string) => {
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


  // 실제 알림 데이터와 목업 데이터를 결합
  const allNotifications = notifications.length > 0 ? notifications : mockHistory;
  const unreadCount = allNotifications.filter(notification => {
    const isRead = 'delivery_confirmed_at' in notification 
      ? notification.delivery_confirmed_at 
      : notification.is_read;
    return !isRead;
  }).length;

  const handleRefresh = () => {
    if (subscriptionId) {
      fetchNotifications(subscriptionId, true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {stockName} 알림 히스토리
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{stockCode} • 총 {total || allNotifications.length}건의 알림</span>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}개 미읽음
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {error ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button variant="outline" onClick={handleRefresh}>
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">알림 히스토리를 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : allNotifications.length === 0 ? (
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
            allNotifications
              .sort((a, b) => {
                const rawA = ('sent_at' in a ? a.sent_at : (a as any).triggered_at) as string | null | undefined;
                const rawB = ('sent_at' in b ? b.sent_at : (b as any).triggered_at) as string | null | undefined;
                const timeA = rawA ? new Date(rawA).getTime() : 0;
                const timeB = rawB ? new Date(rawB).getTime() : 0;
                return timeB - timeA;
              })
              .map((notification) => {
                const isRead = 'delivery_confirmed_at' in notification 
                  ? notification.delivery_confirmed_at 
                  : notification.is_read;
                
                const conditionType = 'alert_conditions' in notification 
                  ? notification.alert_conditions?.condition_type 
                  : notification.condition_type;
                const threshold = 'alert_conditions' in notification 
                  ? notification.alert_conditions?.threshold 
                  : notification.threshold;
                const periodDays = 'alert_conditions' in notification 
                  ? notification.alert_conditions?.period_days 
                  : notification.period_days;
                
                const stockName = 'stock_subscriptions' in notification 
                  ? notification.stock_subscriptions?.stock_name 
                  : notification.stock_name;
                const sentAt = 'sent_at' in notification 
                  ? notification.sent_at 
                  : notification.triggered_at;
                
                return (
                  <Card key={notification.id} className={`transition-all duration-200 ${!isRead ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getConditionIcon(conditionType)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={conditionType === 'rise' ? 'default' : 'secondary'}>
                                {getConditionTypeLabel(conditionType)} {threshold}%
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {periodDays}일간
                              </Badge>
                              {!isRead && (
                                <Badge variant="destructive" className="text-xs">
                                  새 알림
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm font-medium mb-2">
                              {stockName} {getConditionTypeLabel(conditionType)} 알림
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span>발송가:</span>
                                <span className="ml-1 font-medium">{notification.triggered_price?.toLocaleString()}원</span>
                              </div>
                              <div>
                                <span>누적 변화율:</span>
                                <span className={`ml-1 font-medium ${(notification.cumulative_change_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {(notification.cumulative_change_rate || 0).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDateTime(new Date(sentAt))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isRead ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
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
