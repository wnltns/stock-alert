'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCondition, AddConditionFormData } from '@/types';
import { MIN_THRESHOLD, MAX_THRESHOLD, MIN_PERIOD, MAX_PERIOD } from '@/constants/mock-data';

interface EditConditionDialogProps {
  condition: AlertCondition;
  onEditCondition: (condition: AlertCondition) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditConditionDialog({ 
  condition, 
  onEditCondition, 
  open, 
  onOpenChange 
}: EditConditionDialogProps) {
  const [formData, setFormData] = useState<AddConditionFormData>({
    type: condition.condition_type as 'rise' | 'drop',
    threshold: condition.threshold,
    period: condition.period_days,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const threshold = parseFloat(formData.threshold);
    const period = parseInt(formData.period);

    if (!formData.threshold || isNaN(threshold) || threshold < 0 || threshold > MAX_THRESHOLD) {
      newErrors.threshold = `임계값은 0%에서 ${MAX_THRESHOLD}% 사이여야 합니다.`;
    }

    if (!formData.period || isNaN(period) || period < 1 || period > MAX_PERIOD) {
      newErrors.period = `기간은 1일에서 ${MAX_PERIOD}일 사이여야 합니다.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // 숫자 값 변환
      const threshold = parseFloat(formData.threshold);
      const period = parseInt(formData.period);

      // 한국 시간대 기준으로 추적 시작일과 종료일 재계산
      const now = new Date();
      const kstNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      const trackingStartedAt = kstNow.toISOString();
      const trackingEndedAt = new Date(kstNow.getTime() + period * 24 * 60 * 60 * 1000).toISOString();

      const updatedCondition: AlertCondition = {
        ...condition,
        condition_type: formData.type,
        threshold: threshold,
        period_days: period,
        updated_at: new Date().toISOString(),
        tracking_started_at: trackingStartedAt,
        tracking_ended_at: trackingEndedAt,
        cumulative_change_rate: 0.0, // 누적 변동률 초기화
      };

      await onEditCondition(updatedCondition);
    } catch (error) {
      console.error('조건 수정 중 오류 발생:', error);
      setErrors({ general: '조건 수정 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionTypeOptions = () => {
    const options = [
      { value: 'drop', label: '하락' },
      { value: 'rise', label: '상승' },
    ];
    return options;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>조건 수정</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 일반 에러 메시지 */}
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {errors.general}
            </div>
          )}

          {/* 조건 유형 */}
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
                  onClick={() => setFormData(prev => ({ ...prev, type: option.value as 'rise' | 'drop' }))}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 기간 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">추적일</label>
            <Input
              type="number"
              min="0"
              max={MAX_PERIOD}
              value={formData.period}
              onChange={(e) => {
                const value = e.target.value;
                // 음수 입력 방지
                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                  setFormData(prev => ({ ...prev, period: value }));
                }
              }}
              placeholder="예: 3"
            />
            {errors.period && (
              <p className="text-sm text-red-500">{errors.period}</p>
            )}
          </div>

          {/* 임계값 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">등락률(%)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max={MAX_THRESHOLD}
              value={formData.threshold}
              onChange={(e) => {
                const value = e.target.value;
                // 음수 입력 방지
                if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                  setFormData(prev => ({ ...prev, threshold: value }));
                }
              }}
              placeholder="예: 4.0"
            />
            {errors.threshold && (
              <p className="text-sm text-red-500">{errors.threshold}</p>
            )}
          </div>

          {/* 조건 미리보기 */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              {formData.period || '?'}일간, 총 {formData.threshold || '?'}% 이상 {formData.type === 'rise' ? '상승' : '하락'}
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? '수정 중...' : '수정'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
