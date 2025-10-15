'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
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
        const { data: subscription, error } = await supabase
          .from('stock_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('stock_code', stockCode)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('주식 구독 조회 오류:', error);
          return;
        }

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

  const handleAddCondition = (data: AddConditionFormData) => {
    if (!stock) return;

    const newCondition: AlertCondition = {
      id: Date.now().toString(),
      subscription_id: stock.subscription.id,
      condition_type: data.type,
      threshold: data.threshold,
      period_days: data.period,
      base_price: stock.stockInfo.currentPrice,
      target_price: data.type === 'drop' 
        ? Math.round(stock.stockInfo.currentPrice * (1 - data.threshold / 100))
        : Math.round(stock.stockInfo.currentPrice * (1 + data.threshold / 100)),
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_checked_at: null,
      condition_met_at: null,
    };

    setStock(prev => prev ? {
      ...prev,
      conditions: [...prev.conditions, newCondition]
    } : null);

    setIsAddDialogOpen(false);
  };

  const handleEditCondition = (updatedCondition: AlertCondition) => {
    setStock(prev => prev ? {
      ...prev,
      conditions: prev.conditions.map(condition => 
        condition.id === updatedCondition.id ? updatedCondition : condition
      )
    } : null);

    setEditingCondition(null);
  };

  const handleDeleteCondition = (conditionId: string) => {
    showConfirm({
      title: '조건 삭제',
      description: '정말로 이 조건을 삭제하시겠습니까? 삭제된 조건은 복구할 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
      onConfirm: () => {
        setStock(prev => prev ? {
          ...prev,
          conditions: prev.conditions.filter(condition => condition.id !== conditionId)
        } : null);
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
      onConfirm: () => {
        setStock(prev => prev ? {
          ...prev,
          subscription: {
            ...prev.subscription,
            is_active: isActive
          }
        } : null);
      },
    });
  };

  const handleResetConditionTracking = (conditionId: string) => {
    const condition = stock?.conditions.find(c => c.id === conditionId);
    const conditionType = condition ? getConditionTypeLabel(condition.condition_type) : '';
    
    showConfirm({
      title: '조건 추적일 초기화',
      description: `${conditionType} ${condition?.threshold}% 조건의 추적일을 초기화하시겠습니까?`,
      confirmText: '초기화',
      cancelText: '취소',
      variant: 'destructive',
      onConfirm: () => {
        setStock(prev => prev ? {
          ...prev,
          conditions: prev.conditions.map(condition => 
            condition.id === conditionId 
              ? { ...condition, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
              : condition
          )
        } : null);
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

  const getTargetPrice = (condition: AlertCondition) => {
    return condition.condition_type === 'drop' 
      ? Math.round(condition.base_price * (1 - condition.threshold / 100))
      : Math.round(condition.base_price * (1 + condition.threshold / 100));
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
        {/* 헤더 */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로가기
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h1 className="text-3xl font-bold leading-tight">
                {stock.subscription.stock_name}
              </h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-muted-foreground">알림</span>
                <Switch
                  checked={stock.subscription.is_active ?? false}
                  onCheckedChange={handleToggleActive}
                  className="h-4 w-8 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-4"
                />
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{stock.subscription.stock_code}</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <Badge variant="outline">{stock.conditions.length}개 조건</Badge>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* 조건 추가 버튼 */}
          <div className="mb-6 text-center">
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              조건 추가
            </Button>
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
                const targetPrice = getTargetPrice(condition);
                const isMet = isConditionMet(condition);
                
                return (
                  <Card key={condition.id} className="transition-all duration-300 hover:shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getConditionIcon(condition.condition_type)}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight">
                            {getConditionTypeLabel(condition.condition_type)} {condition.threshold}%
                          </CardTitle>
                          <CardDescription className="leading-tight">
                            기준가: {formatPrice(condition.base_price)} · {condition.period_days}일간
                          </CardDescription>
                        </div>
                        </div>
                        <Badge variant={isMet ? "default" : "outline"} className={isMet ? "bg-green-500" : ""}>
                          {isMet ? "충족" : "대기"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">임계값:</span>
                          <span className="ml-2 font-medium">{condition.threshold}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">기간:</span>
                          <span className="ml-2 font-medium">{condition.period_days}일</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">목표가:</span>
                          <span className="ml-2 font-medium">{formatPrice(targetPrice)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">현재가:</span>
                          <span className="ml-2 font-medium">{formatPrice(stock.stockInfo.currentPrice)}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingCondition(condition)}
                          className="flex-1 gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          수정
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResetConditionTracking(condition.id)}
                          className="flex-1 gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          초기화
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteCondition(condition.id)}
                          className="flex-1 gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 조건 추가 다이얼로그 */}
        <AddConditionDialog
          stockName={stock.subscription.stock_name}
          stockPrice={stock.stockInfo.currentPrice}
          onAddCondition={handleAddCondition}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />

        {/* 조건 수정 다이얼로그 */}
        {editingCondition && (
          <EditConditionDialog
            condition={editingCondition}
            stockPrice={stock.stockInfo.currentPrice}
            onEditCondition={handleEditCondition}
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setEditingCondition(null);
              }
            }}
          />
        )}
      </div>
      
      {/* 확인 다이얼로그 */}
      {ConfirmDialog}
    </main>
    </AuthGuard>
  );
}
