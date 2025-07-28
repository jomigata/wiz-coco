import { NextRequest, NextResponse } from 'next/server';

// 정적 내보내기용 회원가입 API
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '정적 배포 환경에서는 Firebase Authentication을 사용하여 회원가입을 처리합니다.',
    environment: 'static-export'
  });
} 