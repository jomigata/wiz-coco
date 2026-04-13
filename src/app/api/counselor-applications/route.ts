import { NextRequest, NextResponse } from 'next/server';
// 주의:
// 본 프로젝트는 “상담사 신청 → 관리자 수동 승인”을 Firestore 보안 규칙으로 통제합니다.
// Next.js API Route에서 클라이언트 SDK로 Firestore를 직접 조작하면,
// 인증/권한 검증이 약해지거나 오해를 부를 수 있어 이 엔드포인트는 비활성화합니다.

// 상담사 지원 신청
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '이 엔드포인트는 더 이상 사용되지 않습니다. (Firestore 직접 처리)' },
    { status: 410 }
  );
}

// 상담사 지원 신청 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '이 엔드포인트는 더 이상 사용되지 않습니다. (Firestore 직접 처리)' },
    { status: 410 }
  );
}

// 상담사 지원 신청 상태 업데이트 (관리자용)
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: '이 엔드포인트는 더 이상 사용되지 않습니다. (Firestore 직접 처리)' },
    { status: 410 }
  );
}
