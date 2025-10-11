'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddConditionFormData } from '@/types';

interface AddConditionDialogProps {
  stockName: string;
  stockPrice: number;
  onAddCondition: (data: AddConditionFormData) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddConditionDialog({ 
  stockName, 
  stockPrice, 
  onAddCondition,
  open = true,
  onOpenChange
}: AddConditionDialogProps) {
  const [formData, setFormData] = useState<AddConditionFormData>({
    type: 'drop',
    threshold: 4.0,
    period: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCondition(formData);
    setFormData({ type: 'drop', threshold: 4.0, period: 1 });
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setFormData({ type: 'drop', threshold: 4.0, period: 1 });
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const getConditionDescription = () => {
    const typeLabels = {
      drop: '하락',
      rise: '상승',
    };
    
    return `${formData.period}일 ${typeLabels[formData.type]} ${formData.threshold}%`;
  };

  const getConditionPrice = () => {
    const multiplier = formData.type.includes('drop') ? (1 - formData.threshold / 100) : (1 + formData.threshold / 100);
    return Math.round(stockPrice * multiplier);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{stockName} 알림 조건 추가</DialogTitle>
          <DialogDescription>
            현재 가격: {stockPrice.toLocaleString()}원
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">조건 유형</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'drop', label: '하락' },
                  { value: 'rise', label: '상승' },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={formData.type === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, type: option.value as any }))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="threshold" className="text-sm font-medium">
                  등락률 (%)
                </label>
                <Input
                  id="threshold"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={formData.threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="period" className="text-sm font-medium">
                  기간 (일)
                </label>
                <Input
                  id="period"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">조건 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">조건:</span>
                <span className="text-sm font-medium">{getConditionDescription()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">알림 가격:</span>
                <span className="font-medium">{getConditionPrice().toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button type="submit">
              조건 추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}