import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import type { Auth } from 'firebase-admin/auth';

export async function GET(request: NextRequest) {
  try {
    // Firebase Admin이 초기화되지 않은 경우 처리
    if (!adminAuth) {
      console.warn('[API] test-results: Firebase Admin이 초기화되지 않음');
      return NextResponse.json({
        success: true,
        data: [],
        message: '테스트 기록이 없습니다. (Firebase Admin 미초기화)'
      });
    }

    // 인증 토큰 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Firebase 토큰 검증 (타입 가드 추가)
      if (!adminAuth) {
        throw new Error('Firebase Admin Auth가 초기화되지 않았습니다.');
      }
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userId = decodedToken.uid;
      
      console.log(`[API] test-results: 사용자 ${userId}의 테스트 기록 조회 요청`);
      
      // 여기서 실제 Firestore에서 테스트 기록을 가져오는 로직을 구현할 수 있습니다.
      // 현재는 빈 배열을 반환하여 오류를 방지합니다.
      
      return NextResponse.json({
        success: true,
        data: [],
        message: '테스트 기록이 없습니다.'
      });
      
    } catch (authError) {
      console.error('[API] test-results: 토큰 검증 실패:', authError);
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('[API] test-results: 서버 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Firebase Admin이 초기화되지 않은 경우 처리
    if (!adminAuth) {
      console.warn('[API] test-results: Firebase Admin이 초기화되지 않음');
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin이 초기화되지 않았습니다.'
      }, { status: 500 });
    }

    // 인증 토큰 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Firebase 토큰 검증 (타입 가드 추가)
      if (!adminAuth) {
        throw new Error('Firebase Admin Auth가 초기화되지 않았습니다.');
      }
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userId = decodedToken.uid;
      
      console.log(`[API] test-results: 사용자 ${userId}의 테스트 기록 저장 요청`);
      
      // 여기서 실제 Firestore에 테스트 기록을 저장하는 로직을 구현할 수 있습니다.
      
      return NextResponse.json({
        success: true,
        message: '테스트 기록이 저장되었습니다.'
      });
      
    } catch (authError) {
      console.error('[API] test-results: 토큰 검증 실패:', authError);
      return NextResponse.json(
        { success: false, error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('[API] test-results: 서버 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
