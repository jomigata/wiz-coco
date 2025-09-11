import { NextRequest, NextResponse } from 'next/server';

// GET /api/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // 실제 구현에서는 데이터베이스에서 사용자 목록을 조회
    // 현재는 샘플 데이터 반환
    const sampleUsers = [
      {
        id: '1',
        name: '김사용자',
        email: 'user1@example.com',
        role: 'user',
        createdAt: '2024-01-15T00:00:00Z',
        lastLoginAt: '2024-01-20T10:30:00Z',
        status: 'active'
      },
      {
        id: '2',
        name: '이상담사',
        email: 'counselor1@example.com',
        role: 'counselor',
        createdAt: '2024-01-10T00:00:00Z',
        lastLoginAt: '2024-01-20T09:15:00Z',
        status: 'active'
      },
      {
        id: '3',
        name: '박관리자',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        lastLoginAt: '2024-01-20T08:45:00Z',
        status: 'active'
      },
      {
        id: '4',
        name: '최심리사',
        email: 'psychologist@example.com',
        role: 'counselor',
        createdAt: '2024-01-05T00:00:00Z',
        lastLoginAt: '2024-01-19T14:20:00Z',
        status: 'active'
      },
      {
        id: '5',
        name: '정일반인',
        email: 'user2@example.com',
        role: 'user',
        createdAt: '2024-01-12T00:00:00Z',
        lastLoginAt: '2024-01-18T16:45:00Z',
        status: 'active'
      },
      {
        id: '6',
        name: '한테스터',
        email: 'tester@example.com',
        role: 'user',
        createdAt: '2024-01-08T00:00:00Z',
        lastLoginAt: '2024-01-17T11:30:00Z',
        status: 'active'
      }
    ];

    // 검색 필터링
    let filteredUsers = sampleUsers;
    if (search) {
      filteredUsers = sampleUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '사용자 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/users - 새 사용자 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role = 'user' } = body;

    // 실제 구현에서는 데이터베이스에 사용자 생성
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      status: 'active'
    };

    return NextResponse.json({
      success: true,
      data: newUser,
      message: '사용자가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('사용자 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '사용자 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
