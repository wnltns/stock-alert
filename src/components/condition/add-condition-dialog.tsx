'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddConditionFormData, AlertConditionInsert } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface AddConditionDialogProps {
  subscriptionId: string;
  onAddCondition: () => void; // 조건 추가 후 콜백 (새로고침용)
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddConditionDialog({ 
  subscriptionId,
  onAddCondition,
  open = true,
  onOpenChange
}: AddConditionDialogProps) {
  const [formData, setFormData] = useState<AddConditionFormData>({
    type: 'drop',
    threshold: '',
    period: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const threshold = parseFloat(formData.threshold);
    const period = parseInt(formData.period);

    if (!formData.threshold || isNaN(threshold) || threshold < 0 || threshold > 100) {
      newErrors.threshold = '등락률은 0% ~ 100% 범위로 입력해주세요.';
    }

    if (!formData.period || isNaN(period) || period < 1 || period > 30) {
      newErrors.period = '추적일은 1일 ~ 30일 범위로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setErrors({ general: '로그인이 필요합니다.' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // 조건 타입을 DB 형식으로 변환 (데이터베이스 제약조건에 맞게 수정)
      const conditionType = formData.type === 'drop' ? 'drop' : 'rise';
      
      // 숫자 값 변환
      const threshold = parseFloat(formData.threshold);
      const period = parseInt(formData.period);
      
      // 한국 시간대 기준으로 추적 시작일과 종료일 계산
      const now = new Date();
      const kstNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      const trackingStartedAt = kstNow.toISOString();
      const trackingEndedAt = new Date(kstNow.getTime() + period * 24 * 60 * 60 * 1000).toISOString();
      
      // DB에 저장할 데이터 준비
      const conditionData: AlertConditionInsert = {
        subscription_id: subscriptionId,
        condition_type: conditionType,
        threshold: threshold,
        period_days: period,
        tracking_started_at: trackingStartedAt,
        tracking_ended_at: trackingEndedAt,
        cumulative_change_rate: 0.0, // 누적 변동률 초기화
      };

      // Supabase에 조건 저장
      const { data, error } = await supabase
        .from('alert_conditions')
        .insert(conditionData)
        .select()
        .single();

      if (error) {
        console.error('조건 저장 오류:', error);
        
        // 구체적인 에러 메시지 제공
        if (error.code === '23505') {
          setErrors({ general: '이미 동일한 조건이 존재합니다.' });
        } else if (error.code === '23503') {
          setErrors({ general: '주식 구독 정보를 찾을 수 없습니다.' });
        } else {
          setErrors({ general: '조건 저장에 실패했습니다. 다시 시도해주세요.' });
        }
        return;
      }

      console.log('조건이 성공적으로 저장되었습니다:', data);
      
      // 폼 초기화
      setFormData({ type: 'drop', threshold: '', period: '' });
      
      // 다이얼로그 닫기
      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // 상위 컴포넌트에 새로고침 요청
      onAddCondition();
      
    } catch (error) {
      console.error('조건 저장 중 오류 발생:', error);
      setErrors({ general: '조건 저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ type: 'drop', threshold: '', period: '' });
    setErrors({});
    if (onOpenChange) {
      onOpenChange(false);
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
          <DialogTitle>조건 추가</DialogTitle>
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

          {/* 추적일 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">추적일</label>
            <Input
              type="number"
              min="0"
              max="30"
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

          {/* 등락률 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">등락률(%)</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
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
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1" disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? '등록 중...' : '등록'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}