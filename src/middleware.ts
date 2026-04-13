import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Firebase 인증/역할은 클라이언트 및 백엔드 API에서 확인합니다.
// Edge middleware에서는 Firebase ID 토큰 검증을 수행하지 않으므로,
// 여기서는 접근을 막지 않고 통과시킵니다.
const publicPaths = ['/' ];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 공개 경로는 통과
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return NextResponse.next();
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
