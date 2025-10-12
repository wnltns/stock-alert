# 구글 로그인 구현 계획서

## 개요
StockAlert 프로젝트에 구글 OAuth 로그인 기능을 구현하여 사용자가 구글 계정으로 간편하게 로그인할 수 있도록 합니다.

## 구현 목표
1. 메인 페이지 진입 전 구글 로그인 필수
2. Supabase Auth와 구글 OAuth 연동
3. 로그인 상태 관리 및 보호된 라우트 구현
4. 효율적인 인증 플로우 구축

## 기술 스택
- **Frontend**: Next.js 15, React 19, TypeScript
- **인증**: Supabase Auth + Google OAuth
- **UI**: shadcn/ui 컴포넌트
- **상태 관리**: Supabase Auth Helpers

## 환경 설정

### 1. Google Cloud Console 설정
- **클라이언트 ID**: `228555193105-hn0lo6qghg0jkvcib66o59e7elec98bv.apps.googleusercontent.com`
- **클라이언트 시크릿**: `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`
- **승인된 자바스크립트 원본**: `http://localhost:3000`
- **승인된 리다이렉션 URI**: 
  - `http://localhost:3000/auth/callback`
  - `https://pbhiwfesnjxqyilnuprv.supabase.co/auth/v1/callback`

### 2. 환경 변수 설정 (.env.local)
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://pbhiwfesnjxqyilnuprv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth 설정
NEXT_PUBLIC_GOOGLE_CLIENT_ID=228555193105-hn0lo6qghg0jkvcib66o59e7elec98bv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 구현 단계

### 1단계: 환경 설정 및 의존성 설치
- [ ] `.env.local` 파일 생성 및 환경 변수 설정
- [ ] 필요한 Supabase Auth 패키지 확인 및 설치

### 2단계: Supabase 클라이언트 설정 업데이트
- [ ] `src/lib/supabase/client.ts` 업데이트
- [ ] 서버 사이드 클라이언트 설정 추가

### 3단계: 인증 관련 컴포넌트 구현
- [ ] `src/components/auth/login-button.tsx` - 구글 로그인 버튼
- [ ] `src/components/auth/auth-guard.tsx` - 인증 가드 컴포넌트
- [ ] `src/hooks/use-auth.ts` - 인증 상태 관리 훅

### 4단계: 라우트 설정
- [ ] `src/app/auth/callback/page.tsx` - OAuth 콜백 처리
- [ ] `src/app/login/page.tsx` - 로그인 페이지
- [ ] 미들웨어 설정으로 보호된 라우트 구현

### 5단계: 메인 레이아웃 업데이트
- [ ] `src/app/layout.tsx`에 인증 가드 적용
- [ ] 로그인 상태에 따른 UI 조건부 렌더링

## 파일 구조
```
src/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── page.tsx          # OAuth 콜백 처리
│   ├── login/
│   │   └── page.tsx              # 로그인 페이지
│   ├── layout.tsx                # 루트 레이아웃 (인증 가드 적용)
│   └── page.tsx                  # 메인 페이지
├── components/
│   └── auth/
│       ├── login-button.tsx       # 구글 로그인 버튼
│       └── auth-guard.tsx        # 인증 가드 컴포넌트
├── hooks/
│   └── use-auth.ts               # 인증 상태 관리 훅
└── lib/
    └── supabase/
        ├── client.ts             # 클라이언트 사이드 클라이언트
        └── server.ts             # 서버 사이드 클라이언트
```

## 인증 플로우

### 1. 로그인 플로우
1. 사용자가 로그인 페이지 접근
2. 구글 로그인 버튼 클릭
3. Supabase Auth를 통한 구글 OAuth 인증 시작
4. 구글 인증 완료 후 콜백 페이지로 리다이렉트
5. Supabase에서 세션 생성 및 토큰 발급
6. 메인 페이지로 리다이렉트

### 2. 세션 관리
- Supabase Auth Helpers를 통한 자동 세션 관리
- 클라이언트 사이드에서 세션 상태 실시간 감지
- 토큰 만료 시 자동 갱신

### 3. 보호된 라우트
- 미들웨어를 통한 인증 검증
- 미인증 사용자는 로그인 페이지로 리다이렉트
- 인증된 사용자만 메인 페이지 접근 가능

## 보안 고려사항
1. **환경 변수 보안**: 민감한 정보는 서버 사이드에서만 사용
2. **HTTPS 사용**: 프로덕션 환경에서 HTTPS 필수
3. **토큰 관리**: Supabase Auth Helpers를 통한 안전한 토큰 관리
4. **CSRF 보호**: Supabase Auth의 내장 CSRF 보호 활용

## 테스트 계획
1. **로컬 개발 환경**: `http://localhost:3000`에서 구글 로그인 테스트
2. **콜백 처리**: OAuth 콜백 정상 처리 확인
3. **세션 관리**: 로그인/로그아웃 상태 정상 동작 확인
4. **보호된 라우트**: 미인증 시 리다이렉트 동작 확인

## 배포 고려사항
1. **프로덕션 환경 변수**: Vercel 환경 변수 설정
2. **도메인 설정**: 프로덕션 도메인을 Google Cloud Console에 추가
3. **Supabase 설정**: 프로덕션 Supabase 프로젝트 설정 확인

## 구현 완료 상태 ✅

### 완료된 작업
- [x] 환경 설정 및 의존성 설치
- [x] Supabase 클라이언트 설정 업데이트
- [x] 인증 관련 컴포넌트 구현 (로그인 버튼, 인증 가드)
- [x] 인증 상태 관리 훅 구현
- [x] OAuth 콜백 라우트 구현
- [x] 로그인 페이지 구현
- [x] 미들웨어 설정으로 보호된 라우트 구현
- [x] 메인 레이아웃에 인증 가드 적용
- [x] 메인 페이지에 사용자 정보 및 로그아웃 기능 추가

### 실제 소요 시간
- 환경 설정: 30분
- 컴포넌트 구현: 1시간
- 라우트 설정: 30분
- 테스트 및 디버깅: 30분
- **총 소요 시간**: 2시간 30분

## 다음 단계
구현 완료 후 다음 기능들을 고려할 수 있습니다:
- 프로필 관리 페이지
- 로그아웃 기능
- 사용자 정보 표시
- 에러 처리 및 사용자 피드백
