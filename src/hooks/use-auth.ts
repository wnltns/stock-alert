'use client'

import { useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null
  })

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }))
  }, [])

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // 초기 세션 가져오기 (단순화)
    const getInitialSession = async () => {
      try {
        // 타임아웃 설정 (3초로 단축)
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('세션 로딩 타임아웃 - 기본값으로 설정')
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null
            })
          }
        }, 3000)

        const { data: { session }, error } = await supabase.auth.getSession()
        
        // 타임아웃 클리어
        clearTimeout(timeoutId)
        
        if (error) {
          console.error('세션 가져오기 실패:', error)
          if (mounted) {
            setAuthState(prev => ({ 
              ...prev, 
              error: error.message,
              loading: false 
            }))
          }
          return
        }
        
        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        clearTimeout(timeoutId)
        console.error('초기 세션 처리 오류:', error)
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
          })
        }
      }
    }

    getInitialSession()

    // 인증 상태 변화 감지 (단순화)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            error: null
          })
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  // 구글 로그인 함수
  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, error: null }))
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      if (error) {
        throw error
      }
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : '구글 로그인 중 오류가 발생했습니다.'
      
      setAuthState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  // 로그아웃 함수
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, error: null }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : '로그아웃 중 오류가 발생했습니다.'
      
      setAuthState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [])

  return {
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    signInWithGoogle,
    signOut,
    clearError,
    isAuthenticated: !!authState.user
  }
}
