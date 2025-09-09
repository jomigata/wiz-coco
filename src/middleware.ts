import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 경로들
const protectedPaths = {
  counselor: ['/counselor'],
  admin: ['/admin']
};

// 공개 경로들 (인증 없이 접근 가능)
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/tests',
  '/counseling',
  '/ai-mind-assistant',
  '/features',
  '/mypage'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 공개 경로는 통과
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 상담사 경로 보호
  if (protectedPaths.counselor.some(path => pathname.startsWith(path))) {
    // 쿠키에서 사용자 정보 확인
    const userEmail = request.cookies.get('user_email')?.value;
    
    if (!userEmail) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 상담사 인증 확인 (실제 구현에서는 데이터베이스에서 확인)
    const verifiedCounselors = [
      'counselor1@example.com',
      'counselor2@example.com',
      'jomigata@gmail.com',
      'wizcocoai@gmail.com'
    ];

    if (!verifiedCounselors.includes(userEmail)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 관리자 경로 보호
  if (protectedPaths.admin.some(path => pathname.startsWith(path))) {
    // 쿠키에서 사용자 정보 확인
    const userEmail = request.cookies.get('user_email')?.value;
    
    if (!userEmail) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // 관리자 권한 확인
    const adminEmails = [
      'jomigata@gmail.com',
      'wizcocoai@gmail.com'
    ];

    if (!adminEmails.includes(userEmail)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
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
