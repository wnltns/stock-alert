'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { AddStockFormData } from '@/types';

interface AddStockDialogProps {
  onAddStock: (data: AddStockFormData) => void;
}

export function AddStockDialog({ onAddStock }: AddStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<AddStockFormData>({
    stockCode: '',
    stockName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.stockCode && formData.stockName) {
      onAddStock(formData);
      setFormData({ stockCode: '', stockName: '' });
      setOpen(false);
    }
  };

  const isValidStockCode = (code: string) => {
    return /^\d{6}$/.test(code);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          주식 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>주식 추가</DialogTitle>
          <DialogDescription>
            관심 주식을 추가하여 알림 조건을 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="stockCode" className="text-sm font-medium">
              주식 코드 (6자리)
            </label>
            <Input
              id="stockCode"
              placeholder="예: 005930"
              value={formData.stockCode}
              onChange={(e) => setFormData(prev => ({ ...prev, stockCode: e.target.value }))}
              className={`transition-colors ${!isValidStockCode(formData.stockCode) && formData.stockCode ? 'border-red-500 dark:border-red-400' : ''}`}
            />
            {!isValidStockCode(formData.stockCode) && formData.stockCode && (
              <p className="text-sm text-red-500 dark:text-red-400">6자리 숫자를 입력해주세요.</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="stockName" className="text-sm font-medium">
              주식명
            </label>
            <Input
              id="stockName"
              placeholder="예: 삼성전자"
              value={formData.stockName}
              onChange={(e) => setFormData(prev => ({ ...prev, stockName: e.target.value }))}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={!isValidStockCode(formData.stockCode) || !formData.stockName}
            >
              추가
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
