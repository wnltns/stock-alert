'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('인증 처리 중...')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading')
        setMessage('인증 처리 중...')

        // URL 해시 프래그먼트에서 토큰 처리
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('인증 콜백 처리 실패:', error)
          setStatus('error')
          setMessage('인증에 실패했습니다.')
          
          // 2초 후 로그인 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/login?error=auth_failed')
          }, 2000)
          return
        }

        if (data.session) {
          // 인증 성공 - 즉시 메인 페이지로 리다이렉트
          router.push('/')
        } else {
          setStatus('error')
          setMessage('세션을 찾을 수 없습니다.')
          
          // 2초 후 로그인 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/login')
          }, 2000)
        }
      } catch (error) {
        console.error('인증 콜백 처리 중 오류:', error)
        setStatus('error')
        setMessage('예상치 못한 오류가 발생했습니다.')
        
        setTimeout(() => {
          router.push('/login?error=auth_failed')
        }, 2000)
      }
    }

    // 약간의 지연을 두고 실행 (Supabase가 URL 해시를 처리할 시간을 줌)
    const timer = setTimeout(handleAuthCallback, 100)
    
    return () => clearTimeout(timer)
  }, [router])

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-primary'
    }
  }

  // 성공 상태일 때는 아무것도 렌더링하지 않음 (즉시 리다이렉트)
  if (status === 'success') {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        {getStatusIcon()}
        <h2 className={`text-lg font-semibold ${getStatusColor()}`}>
          {message}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {status === 'loading' && '잠시만 기다려주세요. 곧 메인 페이지로 이동합니다.'}
          {status === 'error' && '로그인 페이지로 이동합니다...'}
        </p>
      </div>
    </div>
  )
}
