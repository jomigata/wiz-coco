import { NextResponse } from 'next/server';

// 정적 내보내기용 헬스 체크 응답
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'static-export',
    version: '1.0.0',
    message: '정적 배포 환경에서 실행 중입니다.'
  });
} 