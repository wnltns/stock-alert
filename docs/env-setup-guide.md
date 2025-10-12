# 환경 변수 설정 안내

## 문제 원인
`.env.local` 파일이 없어서 Supabase 클라이언트가 제대로 초기화되지 않았습니다.

## 해결 방법

### 1. .env.local 파일 생성
프로젝트 루트 디렉토리(`/Users/psh/Documents/stock-alert/`)에 `.env.local` 파일을 생성하세요.

### 2. 환경 변수 내용 추가
`.env.local` 파일에 다음 내용을 추가하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://pbhiwfesnjxqyilnuprv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google OAuth 설정
NEXT_PUBLIC_GOOGLE_CLIENT_ID=228555193105-hn0lo6qghg0jkvcib66o59e7elec98bv.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 3. Supabase Anon Key 확인
Supabase 프로젝트 대시보드에서 실제 `anon key`를 확인하고 `your_supabase_anon_key_here` 부분을 실제 키로 교체하세요.

### 4. 개발 서버 재시작
환경 변수 설정 후 개발 서버를 재시작하세요:

```bash
pnpm dev
```

## 확인 방법
1. 브라우저 개발자 도구 콘솔에서 오류 메시지 확인
2. `http://localhost:3000` 접속 시 로그인 페이지로 리다이렉트되는지 확인
3. 구글 로그인 버튼 클릭 시 정상적으로 구글 인증 페이지로 이동하는지 확인

## 추가 디버깅
만약 여전히 문제가 있다면:
1. 브라우저 콘솔에서 오류 메시지 확인
2. Supabase 프로젝트에서 Google OAuth 제공자가 활성화되어 있는지 확인
3. Google Cloud Console에서 리다이렉션 URI가 올바르게 설정되어 있는지 확인
