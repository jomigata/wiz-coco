import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// 정적 내보내기를 위한 generateStaticParams
export async function generateStaticParams() {
  return [];
}

// 회원가입 API
export async function POST(request: NextRequest) {
  // 정적 배포 환경에서는 Firebase Authentication 사용 안내
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_INIT === 'true') {
    return NextResponse.json({
      success: false,
      error: '정적 배포 환경에서는 Firebase Authentication을 직접 사용하여 회원가입을 처리합니다.',
      message: '클라이언트 사이드에서 Firebase Auth를 사용하세요.',
      environment: 'static-export'
    }, { status: 501 });
  }

  try {
    const { email, password, name } = await request.json();

    console.log('[Register API] 요청 데이터:', { email, name, passwordLength: password?.length });

    // 입력값 검증
    if (!email || !password || !name) {
      console.log('[Register API] 입력값 누락:', { email: !!email, password: !!password, name: !!name });
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[Register API] 이메일 형식 오류:', email);
      return NextResponse.json(
        { error: '유효한 이메일 주소를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      console.log('[Register API] 비밀번호 길이 부족:', password.length);
      return NextResponse.json(
        { error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // Firebase Admin SDK가 초기화되지 않은 경우
    if (!adminAuth) {
      console.error('[Register API] Firebase Admin SDK가 초기화되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    console.log('[Register API] Firebase 사용자 생성 시도:', { email, name });

    // Firebase Auth로 사용자 생성
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false,
    });

    console.log('[Register API] Firebase 사용자 생성 성공:', userRecord.uid);

    // Firestore에 사용자 정보 저장
    if (adminDb) {
      try {
        await adminDb.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userRecord.email,
          name: name,
          displayName: name,
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: false,
          role: 'user', // 기본 역할
          status: 'active', // 기본 상태
        });

        console.log('[Register API] Firestore 사용자 정보 저장 성공');
      } catch (firestoreError) {
        console.error('[Register API] Firestore 저장 오류:', firestoreError);
        // Firestore 저장 실패 시에도 사용자는 생성되었으므로 성공으로 처리
      }
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name: name,
      }
    });

  } catch (error: any) {
    console.error('[Register API] 회원가입 오류:', error);

    // Firebase Auth 오류 처리
    if (error.code === 'auth/email-already-exists') {
      console.log('[Register API] 이미 존재하는 이메일:', error.code);
      return NextResponse.json(
        { error: '이미 사용 중인 이메일 주소입니다.' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/invalid-email') {
      console.log('[Register API] 유효하지 않은 이메일:', error.code);
      return NextResponse.json(
        { error: '유효하지 않은 이메일 주소입니다.' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/weak-password') {
      console.log('[Register API] 약한 비밀번호:', error.code);
      return NextResponse.json(
        { error: '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.' },
        { status: 400 }
      );
    }

    if (error.code === 'auth/operation-not-allowed') {
      console.log('[Register API] 이메일/비밀번호 로그인 비활성화:', error.code);
      return NextResponse.json(
        { error: '이메일/비밀번호 로그인이 비활성화되어 있습니다.' },
        { status: 400 }
      );
    }

    // 기타 Firebase 오류
    if (error.code && error.code.startsWith('auth/')) {
      console.log('[Register API] Firebase Auth 오류:', error.code);
      return NextResponse.json(
        { error: '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
        { status: 400 }
      );
    }

    // 기타 오류
    console.error('[Register API] 알 수 없는 오류:', error);
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
} 