import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

// 환경 변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.')
}

// 클라이언트 사이드 Supabase 클라이언트
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // PKCE 플로우 사용으로 보안 강화
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})
