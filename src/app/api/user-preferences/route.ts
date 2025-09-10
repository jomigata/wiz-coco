import { NextRequest, NextResponse } from 'next/server';

// GET /api/user-preferences - 사용자 환경설정 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에서 사용자 환경설정 조회
    // 현재는 샘플 데이터 반환
    const samplePreferences = {
      userId,
      notifications: true,
      emailNotifications: false,
      theme: 'dark',
      language: 'ko',
      timezone: 'Asia/Seoul',
      privacy: {
        profileVisibility: 'public',
        testResultsVisibility: 'private'
      },
      updatedAt: '2024-01-20T10:30:00Z'
    };

    return NextResponse.json({
      success: true,
      data: samplePreferences
    });
  } catch (error) {
    console.error('사용자 환경설정 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '환경설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT /api/user-preferences - 사용자 환경설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에서 사용자 환경설정 업데이트
    const updatedPreferences = {
      userId,
      ...preferences,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: '환경설정이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('사용자 환경설정 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '환경설정 업데이트에 실패했습니다.' },
      { status: 500 }
    );
  }
}
