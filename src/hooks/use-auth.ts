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

    // 초기 세션 가져오기
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
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

          // 초기 세션에서도 사용자 정보 생성
          if (session?.user) {
            await ensureUserExists(session.user);
          }
        }
      } catch (error) {
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

    // 사용자 정보를 users 테이블에 생성하는 함수
    const ensureUserExists = async (user: User) => {
      try {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (checkError || !existingUser) {
          console.log('사용자 정보를 users 테이블에 생성합니다:', user.id);
          
          const { error: insertError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자',
              last_login_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (insertError) {
            console.error('사용자 정보 생성 실패:', insertError);
          } else {
            console.log('사용자 정보가 성공적으로 생성되었습니다.');
          }
        }
      } catch (error) {
        console.error('사용자 정보 확인/생성 중 오류:', error);
      }
    };

    // 인증 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session,
            loading: false,
            error: null
          })

          // 로그인 시 사용자 정보 생성
          if (event === 'SIGNED_IN' && session?.user) {
            await ensureUserExists(session.user);
          }
        }
      }
    )

    return () => {
      mounted = false
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
