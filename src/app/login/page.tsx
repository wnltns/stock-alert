'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { LoginButton } from '@/components/auth/login-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

function LoginContent() {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  // 로그인된 사용자를 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      router.replace('/')
    }
  }, [isAuthenticated, loading, user, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 이미 로그인된 경우 로딩 화면 표시 (리다이렉트 중)
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">메인 페이지로 이동 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            StockAlert
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            주식 알림 서비스에 오신 것을 환영합니다
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">로그인</CardTitle>
            <CardDescription className="text-center">
              구글 계정으로 간편하게 로그인하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {error === 'auth_failed' 
                    ? '인증에 실패했습니다. 다시 시도해주세요.' 
                    : '로그인 중 오류가 발생했습니다.'}
                </span>
              </div>
            )}
            
            <LoginButton className="w-full">
              Google로 계속하기
            </LoginButton>

            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              로그인하면{' '}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                서비스 이용약관
              </a>
              과{' '}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                개인정보처리방침
              </a>
              에 동의하는 것으로 간주됩니다.
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          <p>주식 구독 및 알림 조건을 설정하고</p>
          <p>자동으로 알림을 받아보세요</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}