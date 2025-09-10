import { NextRequest, NextResponse } from 'next/server';

// GET /api/user-tests - 사용자 테스트 결과 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에서 사용자 테스트 결과 조회
    // 현재는 샘플 데이터 반환
    const sampleTests = [
      {
        id: '1',
        userId,
        testType: 'mbti',
        testCode: 'MB24-ABCD1',
        result: 'INTJ',
        score: 85,
        completedAt: '2024-01-20T10:30:00Z',
        createdAt: '2024-01-20T10:00:00Z'
      },
      {
        id: '2',
        userId,
        testType: 'enneagram',
        testCode: 'EG24-EFGH2',
        result: 'Type 5',
        score: 78,
        completedAt: '2024-01-19T15:45:00Z',
        createdAt: '2024-01-19T15:30:00Z'
      }
    ];

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTests = sampleTests.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedTests,
      pagination: {
        page,
        limit,
        total: sampleTests.length,
        totalPages: Math.ceil(sampleTests.length / limit)
      }
    });
  } catch (error) {
    console.error('사용자 테스트 결과 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '테스트 결과를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/user-tests - 테스트 결과 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, testType, testCode, result, score } = body;

    if (!userId || !testType || !testCode || !result) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 실제 구현에서는 데이터베이스에 테스트 결과 저장
    const newTest = {
      id: Date.now().toString(),
      userId,
      testType,
      testCode,
      result,
      score: score || 0,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newTest,
      message: '테스트 결과가 성공적으로 저장되었습니다.'
    });
  } catch (error) {
    console.error('테스트 결과 저장 오류:', error);
    return NextResponse.json(
      { success: false, error: '테스트 결과 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}
