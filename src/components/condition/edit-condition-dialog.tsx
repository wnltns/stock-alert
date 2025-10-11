'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCondition, AddConditionFormData } from '@/types';
import { MIN_THRESHOLD, MAX_THRESHOLD, MIN_PERIOD, MAX_PERIOD } from '@/constants/mock-data';

interface EditConditionDialogProps {
  condition: AlertCondition;
  stockPrice: number;
  onEditCondition: (condition: AlertCondition) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditConditionDialog({ 
  condition, 
  stockPrice, 
  onEditCondition, 
  open, 
  onOpenChange 
}: EditConditionDialogProps) {
  const [formData, setFormData] = useState<AddConditionFormData>({
    type: condition.type,
    threshold: condition.threshold,
    period: condition.period,
  });

  const [errors, setErrors] = useState<Partial<AddConditionFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AddConditionFormData> = {};

    if (!formData.threshold || formData.threshold < MIN_THRESHOLD || formData.threshold > MAX_THRESHOLD) {
      newErrors.threshold = `임계값은 ${MIN_THRESHOLD}%에서 ${MAX_THRESHOLD}% 사이여야 합니다.`;
    }

    if (!formData.period || formData.period < MIN_PERIOD || formData.period > MAX_PERIOD) {
      newErrors.period = `기간은 ${MIN_PERIOD}일에서 ${MAX_PERIOD}일 사이여야 합니다.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const updatedCondition: AlertCondition = {
      ...condition,
      type: formData.type,
      threshold: formData.threshold,
      period: formData.period,
      basePrice: stockPrice, // 현재 주가로 기준가 업데이트
    };

    onEditCondition(updatedCondition);
  };

  const getConditionTypeOptions = () => {
    const options = [
      { value: 'drop', label: '하락' },
      { value: 'rise', label: '상승' },
    ];
    return options;
  };

  const getTargetPrice = () => {
    return formData.type.includes('drop') 
      ? Math.round(stockPrice * (1 - formData.threshold / 100))
      : Math.round(stockPrice * (1 + formData.threshold / 100));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>조건 수정</DialogTitle>
          <DialogDescription>
            알림 조건을 수정합니다. 현재 주가: {stockPrice.toLocaleString()}원
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 조건 유형 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">조건 유형</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AlertCondition['type'] }))}
              className="w-full p-2 border border-input bg-background rounded-md"
            >
              {getConditionTypeOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 임계값 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">임계값 (%)</label>
            <Input
              type="number"
              step="0.1"
              min={MIN_THRESHOLD}
              max={MAX_THRESHOLD}
              value={formData.threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }))}
              placeholder="예: 4.0"
            />
            {errors.threshold && (
              <p className="text-sm text-red-500">{errors.threshold}</p>
            )}
          </div>

          {/* 기간 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">기간 (일)</label>
            <Input
              type="number"
              min={MIN_PERIOD}
              max={MAX_PERIOD}
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: parseInt(e.target.value) || 1 }))}
              placeholder="예: 3"
            />
            {errors.period && (
              <p className="text-sm text-red-500">{errors.period}</p>
            )}
          </div>

          {/* 목표가 미리보기 */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              목표가: <span className="font-medium">{getTargetPrice().toLocaleString()}원</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formData.type === 'rise' ? '상승' : '하락'} {formData.threshold}% 
              ({formData.period}일간)
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              취소
            </Button>
            <Button type="submit" className="flex-1">
              수정
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
