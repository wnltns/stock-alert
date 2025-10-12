'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Loader2, AlertCircle } from 'lucide-react'

interface LoginButtonProps {
  className?: string
  children?: React.ReactNode
}

export function LoginButton({ className, children }: LoginButtonProps) {
  const { signInWithGoogle, error, clearError } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      clearError() // 이전 에러 클리어
      await signInWithGoogle()
    } catch (error) {
      // 에러는 useAuth에서 처리됨
      console.error('구글 로그인 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center space-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 dark:text-red-300 dark:hover:text-red-100"
            aria-label="에러 메시지 닫기"
          >
            ×
          </button>
        </div>
      )}
      
      <Button
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className={className}
        variant="outline"
        aria-label="구글 계정으로 로그인"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            로그인 중...
          </>
        ) : (
          <>
            <svg 
              className="mr-2 h-4 w-4" 
              viewBox="0 0 24 24" 
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {children || 'Google로 로그인'}
          </>
        )}
      </Button>
    </div>
  )
}
