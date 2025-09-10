import { NextRequest, NextResponse } from 'next/server';

// PUT /api/users/[id]/role - 사용자 역할 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'counselor', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 역할입니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에서 사용자 역할 업데이트
    const updatedUser = {
      id,
      role,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '사용자 역할이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('사용자 역할 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '사용자 역할 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
