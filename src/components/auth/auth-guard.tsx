'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { loading, isAuthenticated, error } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // 로딩 중일 때
  if (loading) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">인증 확인 중...</p>
            {error && (
              <p className="text-xs text-red-500 text-center max-w-sm">
                {error}
              </p>
            )}
          </div>
        </div>
      )
    )
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return null // useEffect에서 리다이렉트 처리
  }

  // 인증된 경우
  return <>{children}</>
}
