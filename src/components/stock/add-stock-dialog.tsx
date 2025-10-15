'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { AddStockFormData } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface AddStockDialogProps {
  onAddStock: (data: AddStockFormData) => void;
}

export function AddStockDialog({ onAddStock }: AddStockDialogProps) {
  const [open, setOpen] = useState(false);
  const [stockUrl, setStockUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidStockUrl = (url: string) => {
    // 네이버 주식 URL인지만 확인 (정규식 검사 제거)
    return url.includes('m.stock.naver.com') && url.includes('/total');
  };

  const extractStockCode = (url: string) => {
    // 모든 패턴에서 주식 코드 추출 (슬래시 사이의 모든 문자)
    const patterns = [
      /\/domestic\/stock\/([^\/]+)\/total$/,
      /\/worldstock\/stock\/([^\/]+)\/total$/,
      /\/worldstock\/etf\/([^\/]+)\/total$/,
      /\/worldstock\/index\/([^\/]+)\/total$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      // URL 형식 검증
      if (!isValidStockUrl(stockUrl)) {
        throw new Error('올바른 네이버 주식 URL 형식을 입력해주세요.\n예: https://m.stock.naver.com/domestic/stock/005930/total');
      }

      // 주식 코드 추출
      const stockCode = extractStockCode(stockUrl);
      if (!stockCode) {
        throw new Error('주식 코드를 추출할 수 없습니다.');
      }

      // 현재 사용자 세션 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('로그인이 필요합니다.');
      }

      // API 호출
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ stockUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '주식 등록에 실패했습니다.');
      }

      // 성공 시 부모 컴포넌트에 알림
      onAddStock({ stockCode, stockName: result.data.stock_name });
      setStockUrl('');
      setOpen(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '주식 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
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
            네이버 주식 URL을 입력하여 관심 주식을 추가하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="stockUrl" className="text-sm font-medium">
              네이버 주식 URL
            </label>
            <Input
              id="stockUrl"
              placeholder="https://m.stock.naver.com/domestic/stock/005930/total"
              value={stockUrl}
              onChange={(e) => setStockUrl(e.target.value)}
              className={`transition-colors ${!isValidStockUrl(stockUrl) && stockUrl ? 'border-red-500 dark:border-red-400' : ''}`}
            />
            {!isValidStockUrl(stockUrl) && stockUrl && (
              <p className="text-sm text-red-500 dark:text-red-400">
                올바른 네이버 주식 URL 형식을 입력해주세요.
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-10">
              * 네이버페이 증권 페이지의 URL을 입력해주세요.
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
              {error}
            </div>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button 
              type="submit" 
              disabled={!isValidStockUrl(stockUrl) || !stockUrl || isLoading}
            >
              {isLoading ? '등록 중...' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
