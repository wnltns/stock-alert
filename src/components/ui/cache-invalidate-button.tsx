'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface CacheInvalidateButtonProps {
  onInvalidate: () => Promise<void>;
  disabled?: boolean;
}

export function CacheInvalidateButton({ onInvalidate, disabled = false }: CacheInvalidateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleInvalidate = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onInvalidate();
    } catch (error) {
      console.error('캐시 무효화 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInvalidate}
      disabled={disabled || isLoading}
      className="h-7 px-2 text-xs"
    >
      <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? '새로고침 중...' : '새로고침'}
    </Button>
  );
}
