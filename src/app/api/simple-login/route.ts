import { NextRequest, NextResponse } from 'next/server';

// 정적 내보내기용 간단 로그인 API
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    isLoggedIn: false, 
    message: '정적 배포 환경에서는 Firebase Authentication을 사용합니다.',
    environment: 'static-export'
  });
} 