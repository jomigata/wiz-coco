import { NextRequest, NextResponse } from 'next/server';

// 정적 내보내기용 로그아웃 API
export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: '정적 배포 환경에서는 클라이언트 사이드에서 로그아웃을 처리합니다.',
    environment: 'static-export'
  });
} 