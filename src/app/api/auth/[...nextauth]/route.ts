// 정적 배포 환경에서는 NextAuth API 라우트를 사용할 수 없습니다.
// Firebase Authentication을 사용하거나 클라이언트 사이드 인증을 구현하세요.

import { NextRequest, NextResponse } from 'next/server';

// 정적 내보내기를 위한 generateStaticParams
export async function generateStaticParams() {
  return [
    { nextauth: ['signin'] },
    { nextauth: ['signout'] },
    { nextauth: ['callback'] },
    { nextauth: ['session'] },
    { nextauth: ['csrf'] },
    { nextauth: ['providers'] },
  ];
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Authentication API is not available in static export' },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Authentication API is not available in static export' },
    { status: 501 }
  );
} 