import { NextResponse } from 'next/server';

// CORS 및 보안 헤더를 위한 미들웨어
export function middleware(request) {
  // 정적 내보내기 환경에서는 미들웨어 비활성화
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_INIT === 'true') {
    return NextResponse.next();
  }
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  
  // CORS 헤더 설정
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // 보안 헤더 설정
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 관리자 페이지 접근 제한
  if (pathname.startsWith('/admin')) {
    // 쿠키에서 인증 정보 확인
    const authToken = request.cookies.get('auth_token')?.value;
    const userRole = request.cookies.get('user_role')?.value;
    
    // 인증이 없거나 관리자가 아닌 경우 로그인 페이지로 리디렉션
    if (!authToken || userRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url));
    }
  }
  
  return response;
}

// 미들웨어 실행 경로 지정
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
}; 