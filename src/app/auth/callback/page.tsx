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

        // OAuth 콜백에서 세션 처리
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('인증 콜백 처리 실패:', error)
          setStatus('error')
          setMessage('인증에 실패했습니다.')
          
          setTimeout(() => {
            router.push('/login?error=auth_failed')
          }, 2000)
          return
        }

        if (data.session) {
          console.log('인증 성공, 사용자 ID:', data.session.user.id)
          
          // 사용자 정보가 users 테이블에 있는지 확인하고 없으면 생성
          const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.session.user.id)
            .single()

          if (userCheckError || !existingUser) {
            console.log('새 사용자 정보를 생성합니다:', data.session.user.id)
            
            const userData = {
              id: data.session.user.id,
              email: data.session.user.email || '',
              name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || '사용자',
              last_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            console.log('생성할 사용자 데이터:', userData)
            
            const { data: insertData, error: insertError } = await supabase
              .from('users')
              .upsert(userData, {
                onConflict: 'id'
              })
              .select()

            console.log('Insert 결과:', { insertData, insertError })

            if (insertError) {
              console.error('사용자 정보 생성 실패:', {
                error: insertError,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint,
                code: insertError.code
              })
              
              // RLS 정책 문제인 경우 구체적인 메시지 표시
              if (insertError.code === '42501') {
                console.error('권한 오류: RLS 정책을 확인하세요.')
              }
              
              // 사용자 정보 생성 실패해도 메인 페이지로 이동
            } else {
              console.log('사용자 정보가 성공적으로 생성되었습니다.')
            }
          } else {
            console.log('기존 사용자 로그인')
          }

          setStatus('success')
          setMessage('로그인 성공!')
          
          // 성공 후 메인 페이지로 리다이렉트
          setTimeout(() => {
            router.push('/')
          }, 1000)
        } else {
          setStatus('error')
          setMessage('세션을 찾을 수 없습니다.')
          
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
