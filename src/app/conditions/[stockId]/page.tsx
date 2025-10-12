'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { MOCK_STOCK_DETAILS } from '@/constants/mock-data';
import { StockDetail, AlertCondition, AddConditionFormData } from '@/types';
import { AddConditionDialog } from '@/components/condition/add-condition-dialog';
import { EditConditionDialog } from '@/components/condition/edit-condition-dialog';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ConditionManagementPage() {
  const params = useParams();
  const router = useRouter();
  const stockId = params.stockId as string;
  
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<AlertCondition | null>(null);
  const { confirm: showConfirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    const foundStock = MOCK_STOCK_DETAILS.find(s => s.subscription.id === stockId);
    if (foundStock) {
      setStock(foundStock);
    } else {
      // 주식이 없으면 홈으로 리다이렉트
      router.push('/');
    }
  }, [stockId, router]);

  const handleAddCondition = (data: AddConditionFormData) => {
    if (!stock) return;

    const newCondition: AlertCondition = {
      id: Date.now().toString(),
      subscriptionId: stock.subscription.id,
      type: data.type,
      threshold: data.threshold,
      period: data.period,
      basePrice: stock.price.currentPrice,
      createdAt: new Date(),
      isActive: true,
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
      description: `${stock?.subscription.stockName} 주식의 알림을 ${actionText}하시겠습니까?`,
      confirmText: actionText,
      cancelText: '취소',
      onConfirm: () => {
        setStock(prev => prev ? {
          ...prev,
          subscription: {
            ...prev.subscription,
            isActive
          }
        } : null);
      },
    });
  };

  const handleResetConditionTracking = (conditionId: string) => {
    const condition = stock?.conditions.find(c => c.id === conditionId);
    const conditionType = condition ? getConditionTypeLabel(condition.type) : '';
    
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
              ? { ...condition, createdAt: new Date() }
              : condition
          )
        } : null);
      },
    });
  };

  const getConditionTypeLabel = (type: AlertCondition['type']) => {
    const labels = {
      drop: '하락',
      rise: '상승',
    };
    return labels[type];
  };

  const getConditionIcon = (type: AlertCondition['type']) => {
    if (type === 'rise') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getTargetPrice = (condition: AlertCondition) => {
    return condition.type === 'drop' 
      ? Math.round(condition.basePrice * (1 - condition.threshold / 100))
      : Math.round(condition.basePrice * (1 + condition.threshold / 100));
  };

  const isConditionMet = (condition: AlertCondition) => {
    if (!stock) return false;
    const targetPrice = getTargetPrice(condition);
    
    if (condition.type === 'rise') {
      return stock.price.currentPrice >= targetPrice;
    } else {
      return stock.price.currentPrice <= targetPrice;
    }
  };

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
              <h1 className="text-3xl font-bold">{stock.subscription.stockName}</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">알림</span>
                <Switch
                  checked={stock.subscription.isActive}
                  onCheckedChange={handleToggleActive}
                  className="h-4 w-8 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-4"
                />
              </div>
            </div>
            <p className="text-muted-foreground mb-4">{stock.subscription.stockCode}</p>
            
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stock.price.currentPrice.toLocaleString()}원</div>
                <div className={`text-sm ${stock.price.changeRate > 0 ? 'text-green-600' : stock.price.changeRate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {stock.price.changeRate > 0 ? '+' : ''}{stock.price.changeRate.toFixed(2)}%
                </div>
              </div>
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
                          {getConditionIcon(condition.type)}
                        <div>
                          <CardTitle className="text-lg">
                            {getConditionTypeLabel(condition.type)} {condition.threshold}%
                          </CardTitle>
                          <CardDescription>
                            기준가: {condition.basePrice.toLocaleString()}원 · {condition.period}일간
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
                          <span className="ml-2 font-medium">{condition.period}일</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">목표가:</span>
                          <span className="ml-2 font-medium">{targetPrice.toLocaleString()}원</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">현재가:</span>
                          <span className="ml-2 font-medium">{stock.price.currentPrice.toLocaleString()}원</span>
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
          stockName={stock.subscription.stockName}
          stockPrice={stock.price.currentPrice}
          onAddCondition={handleAddCondition}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />

        {/* 조건 수정 다이얼로그 */}
        {editingCondition && (
          <EditConditionDialog
            condition={editingCondition}
            stockPrice={stock.price.currentPrice}
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
