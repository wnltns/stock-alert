import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  try {
    const supabase = createMiddlewareClient({ req, res })

    // 세션 확인
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    const { pathname } = req.nextUrl

    // 공개 경로 (인증 없이 접근 가능)
    const publicPaths = ['/login', '/auth/callback']
    const isPublicPath = publicPaths.includes(pathname)

    // 로그인 상태 확인
    const isLoggedIn = !!session?.user

    // 로그인된 사용자가 로그인 페이지에 접근하는 경우
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // 로그인되지 않은 사용자가 보호된 페이지에 접근하는 경우
    if (!isLoggedIn && !isPublicPath) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return res
  } catch (error) {
    console.error('미들웨어 실행 오류:', error)
    // 오류 발생 시 요청을 그대로 진행
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // 임시로 미들웨어 비활성화 - 무한 로딩 문제 해결
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
