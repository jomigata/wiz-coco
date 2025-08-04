import { NextRequest, NextResponse } from 'next/server';

// 정적 내보내기용 테스트 데이터 API
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: '정적 배포 환경에서는 클라이언트 사이드에서 데이터를 처리합니다.',
    environment: 'static-export'
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  return NextResponse.json({
    success: true,
    message: '정적 배포 환경에서 실행 중입니다.',
    code: code || 'unknown',
    environment: 'static-export'
  });
} 