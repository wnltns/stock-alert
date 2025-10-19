'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp, TrendingDown, RotateCcw, RotateCcwSquare } from 'lucide-react';
import { MOCK_STOCK_DETAILS } from '@/constants/mock-data';
import { StockDetail, AlertCondition, AddConditionFormData, StockSubscription } from '@/types';
import { AddConditionDialog } from '@/components/condition/add-condition-dialog';
import { EditConditionDialog } from '@/components/condition/edit-condition-dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { AuthGuard } from '@/components/auth/auth-guard';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export default function ConditionManagementPage() {
  const params = useParams();
  const router = useRouter();
  const stockCode = params.stockId as string; // 실제로는 stock_code
  
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<AlertCondition | null>(null);
  const [loading, setLoading] = useState(true);
  const { confirm: showConfirm, ConfirmDialog } = useConfirmDialog();
  const { user } = useAuth();

  useEffect(() => {
    const fetchStockData = async () => {
      if (!user) return;
      
      try {
        // 먼저 목업 데이터에서 찾기
        const mockStock = MOCK_STOCK_DETAILS.find(s => s.subscription.stock_code === stockCode);
        if (mockStock) {
          setStock(mockStock);
          setLoading(false);
          return;
        }

        // 캐시된 데이터에 없으면 실제 데이터베이스에서 주식 구독 정보 조회
        const { data: subscriptions, error } = await supabase
          .from('stock_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('stock_code', stockCode);

        if (error) {
          console.error('주식 구독 조회 오류:', error);
          setLoading(false);
          return;
        }

        const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        if (subscription) {
          // 알림 조건 조회
          const { data: conditions, error: conditionsError } = await supabase
            .from('alert_conditions')
            .select('*')
            .eq('subscription_id', subscription.id);

          if (conditionsError) {
            console.warn('알림 조건 조회 중 오류:', conditionsError);
          }

          // StockDetail로 변환 (주가 정보 없이)
          const stockDetail: StockDetail = {
            subscription: subscription,
            stockInfo: {
              code: subscription.stock_code,
              name: subscription.stock_name,
              logoUrl: '',
              currentPrice: 0,
              changeAmount: 0,
              changeRate: 0,
              marketStatus: 'CLOSE' as const,
              marketName: subscription.market,
              lastTradedAt: new Date(),
              isRising: false,
            },
            conditions: conditions || [],
          };
          
          setStock(stockDetail);
        } else {
          // 주식이 없으면 홈으로 리다이렉트
          router.push('/');
        }
      } catch (error) {
        console.error('주식 데이터 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [stockCode, user, router]);

  const handleAddCondition = async () => {
    if (!stock || !user) return;

    try {
      // 알림 조건을 DB에서 다시 조회
      const { data: conditions, error } = await supabase
        .from('alert_conditions')
        .select('*')
        .eq('subscription_id', stock.subscription.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('조건 조회 오류:', error);
        return;
      }

      // 조건 목록 업데이트
      setStock(prev => prev ? {
        ...prev,
        conditions: conditions || []
      } : null);

    } catch (error) {
      console.error('조건 새로고침 중 오류:', error);
    }
  };

  const handleEditCondition = async (updatedCondition: AlertCondition) => {
    if (!user) return;

    try {
      // Supabase에 조건 업데이트
      const { data, error } = await supabase
        .from('alert_conditions')
        .update({
          condition_type: updatedCondition.condition_type,
          threshold: updatedCondition.threshold,
          period_days: updatedCondition.period_days,
          tracking_started_at: updatedCondition.tracking_started_at,
          tracking_ended_at: updatedCondition.tracking_ended_at,
          cumulative_change_rate: 0.0, // 누적 변동률 초기화
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedCondition.id)
        .select()
        .single();

      if (error) {
        console.error('조건 수정 오류:', error);
        throw new Error('조건 수정에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      setStock(prev => prev ? {
        ...prev,
        conditions: prev.conditions.map(condition => 
          condition.id === updatedCondition.id ? data : condition
        )
      } : null);

      setEditingCondition(null);
      
    } catch (error) {
      console.error('조건 수정 중 오류 발생:', error);
      throw error; // EditConditionDialog에서 에러 처리할 수 있도록 re-throw
    }
  };

  const handleDeleteCondition = (conditionId: string) => {
    showConfirm({
      title: '삭제',
      description: '조건을 삭제하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
      variant: 'destructive',
      onConfirm: async () => {
        if (!user) return;

        try {
          // Supabase에서 조건 삭제
          const { error } = await supabase
            .from('alert_conditions')
            .delete()
            .eq('id', conditionId);

          if (error) {
            console.error('조건 삭제 오류:', error);
            // 에러 처리 (토스트 메시지 등)
            return;
          }

          // 로컬 상태 업데이트
          setStock(prev => prev ? {
            ...prev,
            conditions: prev.conditions.filter(condition => condition.id !== conditionId)
          } : null);

        } catch (error) {
          console.error('조건 삭제 중 오류 발생:', error);
        }
      },
    });
  };

  const handleToggleActive = (isActive: boolean) => {
    const actionText = isActive ? '활성화' : '비활성화';
    
    showConfirm({
      title: `알림 ${actionText}`,
      description: `${stock?.subscription.stock_name} 주식의 알림을 ${actionText}하시겠습니까?`,
      confirmText: actionText,
      cancelText: '취소',
      onConfirm: async () => {
        if (!user || !stock) return;

        try {
          // 데이터베이스에서 구독 상태 업데이트
          const { error } = await supabase
            .from('stock_subscriptions')
            .update({ 
              is_active: isActive,
              updated_at: new Date().toISOString()
            })
            .eq('id', stock.subscription.id)
            .eq('user_id', user.id);

          if (error) {
            console.error('알림 상태 업데이트 오류:', error);
            // 에러 처리 (토스트 메시지 등)
            return;
          }

          // 로컬 상태 업데이트
          setStock(prev => prev ? {
            ...prev,
            subscription: {
              ...prev.subscription,
              is_active: isActive
            }
          } : null);

        } catch (error) {
          console.error('알림 상태 변경 중 오류 발생:', error);
        }
      },
    });
  };

  const handleResetAllConditionTracking = () => {
    if (!stock || stock.conditions.length === 0) return;
    
    showConfirm({
      title: '전체 초기화',
      description: '모든 조건의 추적일을 초기화하시겠습니까? 모든 조건의 추적 시작일과 종료일이 현재 시점 기준으로 다시 계산됩니다.',
      confirmText: '확인',
      cancelText: '취소',
      variant: 'destructive',
      onConfirm: async () => {
        if (!user || !stock) return;

        try {
          const now = new Date();
          
          // 모든 조건의 추적일을 한번에 업데이트
          const updatePromises = stock.conditions.map(condition => {
            const trackingStartedAt = now.toISOString();
            const trackingEndedAt = new Date(now.getTime() + condition.period_days * 24 * 60 * 60 * 1000).toISOString();
            
            return supabase
              .from('alert_conditions')
              .update({
                tracking_started_at: trackingStartedAt,
                tracking_ended_at: trackingEndedAt,
                cumulative_change_rate: 0.0, // 누적 변동률 초기화
                updated_at: new Date().toISOString(),
              })
              .eq('id', condition.id)
              .select()
              .single();
          });

          const results = await Promise.all(updatePromises);
          
          // 에러가 있는지 확인
          const hasError = results.some(result => result.error);
          if (hasError) {
            console.error('일부 조건 초기화 오류 발생');
            return;
          }

          // 로컬 상태 업데이트
          const updatedConditions = results.map(result => result.data).filter(Boolean);
          setStock(prev => prev ? {
            ...prev,
            conditions: prev.conditions.map(condition => {
              const updated = updatedConditions.find(updated => updated && updated.id === condition.id);
              return updated ? { ...condition, ...updated } : condition;
            })
          } : null);

        } catch (error) {
          console.error('전체 조건 초기화 중 오류 발생:', error);
        }
      },
    });
  };

  const handleResetConditionTracking = (conditionId: string) => {
    const condition = stock?.conditions.find(c => c.id === conditionId);
    const conditionType = condition ? getConditionTypeLabel(condition.condition_type) : '';
    
    showConfirm({
      title: '초기화',
      description: '추적일을 초기화하시겠습니까? 추적 시작일과 종료일이 현재 시점 기준으로 다시 계산됩니다.',
      confirmText: '확인',
      cancelText: '취소',
      variant: 'destructive',
      onConfirm: async () => {
        if (!user || !condition) return;

        try {
          // 현재 날짜를 기준으로 추적 시작일과 종료일 재계산
          const now = new Date();
          const trackingStartedAt = now.toISOString();
          const trackingEndedAt = new Date(now.getTime() + condition.period_days * 24 * 60 * 60 * 1000).toISOString();

          // Supabase에 조건 업데이트
          const { data, error } = await supabase
            .from('alert_conditions')
            .update({
              tracking_started_at: trackingStartedAt,
              tracking_ended_at: trackingEndedAt,
              cumulative_change_rate: 0.0, // 누적 변동률 초기화
              updated_at: new Date().toISOString(),
            })
            .eq('id', conditionId)
            .select()
            .single();

          if (error) {
            console.error('조건 초기화 오류:', error);
            return;
          }

          // 로컬 상태 업데이트
          setStock(prev => prev ? {
            ...prev,
            conditions: prev.conditions.map(condition => 
              condition.id === conditionId 
                ? { ...condition, ...data }
                : condition
            )
          } : null);

        } catch (error) {
          console.error('조건 초기화 중 오류 발생:', error);
        }
      },
    });
  };

  const getConditionTypeLabel = (type: AlertCondition['condition_type']) => {
    const labels: Record<string, string> = {
      drop: '하락',
      rise: '상승',
    };
    return labels[type] || type;
  };

  const getConditionIcon = (type: AlertCondition['condition_type']) => {
    if (type === 'rise') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const isConditionMet = (condition: AlertCondition) => {
    // 설정 페이지에서는 실시간 주가 정보가 없으므로 항상 '대기' 상태로 표시
    return false;
  };

  const formatPrice = (price: number) => {
    const isKorean = stock?.subscription.nation_type === 'KOREA' || stock?.subscription.nation_type === 'KOR';
    if (isKorean) {
      return price.toLocaleString() + '원';
    } else {
      return price.toFixed(2);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">주식 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">주식을 찾을 수 없습니다.</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-background transition-colors duration-300">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* 헤더 */}
            <div className="mb-8">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="mb-8"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                뒤로가기
              </Button>
              
              {/* 주식 정보 헤더 */}
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold mb-2 truncate">
                      {stock.subscription.stock_name}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                      <span className="text-muted-foreground text-base sm:text-lg">
                        {stock.subscription.stock_code}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">알림</span>
                        <Switch
                          checked={stock.subscription.is_active ?? false}
                          onCheckedChange={handleToggleActive}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {stock.conditions.length}개의 조건이 설정되어 있습니다
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {stock.conditions.length > 0 && (
                        <Button 
                          variant="outline" 
                          onClick={handleResetAllConditionTracking}
                          className="gap-2 w-full sm:w-auto"
                        >
                          <RotateCcwSquare className="h-4 w-4" />
                          <span className="hidden sm:inline">전체 초기화</span>
                          <span className="sm:hidden">전체 초기화</span>
                        </Button>
                      )}
                      <Button 
                        onClick={() => setIsAddDialogOpen(true)} 
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4" />
                        조건 추가
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* 조건 목록 */}
          {stock.conditions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  아직 설정된 조건이 없습니다.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {stock.conditions.map((condition) => {
                const isMet = isConditionMet(condition);
                
                return (
                  <Card key={condition.id} className="transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {getConditionIcon(condition.condition_type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="font-medium text-sm sm:text-base">
                                {getConditionTypeLabel(condition.condition_type)} {condition.threshold}%
                              </span>
                              <Badge variant="outline" className="text-xs w-fit">
                                {condition.period_days}일
                              </Badge>
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {condition.tracking_started_at && condition.tracking_ended_at ? (
                                <>
                                  추적일: {new Date(condition.tracking_started_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })} ~ {new Date(condition.tracking_ended_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
                                </>
                              ) : (
                                <>
                                  {condition.created_at ? new Date(condition.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : '날짜 없음'} 설정
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
                          <Badge variant={isMet ? "default" : "outline"} className={isMet ? "bg-green-500" : ""}>
                            {isMet ? "충족" : "대기"}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingCondition(condition)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleResetConditionTracking(condition.id)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            >
                              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCondition(condition.id)}
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </div>

        {/* 조건 추가 다이얼로그 */}
        <AddConditionDialog
          subscriptionId={stock.subscription.id}
          onAddCondition={handleAddCondition}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />

        {/* 조건 수정 다이얼로그 */}
        {editingCondition && (
          <EditConditionDialog
            condition={editingCondition}
            onEditCondition={handleEditCondition}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setEditingCondition(null);
              }
            }}
          />
        )}
      
      {/* 확인 다이얼로그 */}
      {ConfirmDialog}
    </main>
    </AuthGuard>
  );
}
