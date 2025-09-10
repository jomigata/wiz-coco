import { NextRequest, NextResponse } from 'next/server';

// GET /api/users/[id] - 특정 사용자 정보 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 실제 구현에서는 데이터베이스에서 사용자 조회
    // 현재는 샘플 데이터 반환
    const sampleUser = {
      id,
      name: '김사용자',
      email: 'user@example.com',
      role: 'user',
      createdAt: '2024-01-15T00:00:00Z',
      lastLoginAt: '2024-01-20T10:30:00Z',
      status: 'active',
      phone: '010-1234-5678',
      birthDate: '1990-01-01',
      gender: 'male',
      occupation: '개발자',
      bio: '안녕하세요!',
      preferences: {
        notifications: true,
        emailNotifications: false
      }
    };

    return NextResponse.json({
      success: true,
      data: sampleUser
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '사용자 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - 사용자 정보 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // 실제 구현에서는 데이터베이스에서 사용자 정보 업데이트
    const updatedUser = {
      id,
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: '사용자 정보가 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('사용자 정보 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '사용자 정보 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 실제 구현에서는 데이터베이스에서 사용자 삭제
    return NextResponse.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '사용자 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
}
