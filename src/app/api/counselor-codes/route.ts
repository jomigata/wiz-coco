import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Counselor, CounselorCode } from '@/types/counselor';

// 상담사 인증코드 생성
export async function POST(request: NextRequest) {
  try {
    const { counselorId, codeName } = await request.json();

    if (!counselorId || !codeName) {
      return NextResponse.json(
        { success: false, error: '상담사 ID와 코드명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 코드명 중복 확인
    const existingCodesQuery = query(
      collection(db, 'counselorCodes'),
      where('codeName', '==', codeName),
      where('isActive', '==', true)
    );
    const existingCodes = await getDocs(existingCodesQuery);
    
    if (!existingCodes.empty) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 코드명입니다.' },
        { status: 400 }
      );
    }

    // 고유한 코드번호 생성 (8자리 숫자)
    const codeNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

    // 인증코드 생성
    const counselorCode: Omit<CounselorCode, 'id'> = {
      counselorId,
      codeName,
      codeNumber,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'counselorCodes'), counselorCode);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...counselorCode
      }
    });

  } catch (error) {
    console.error('상담사 인증코드 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '인증코드 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담사 인증코드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const counselorId = searchParams.get('counselorId');

    let q;
    if (counselorId) {
      q = query(
        collection(db, 'counselorCodes'),
        where('counselorId', '==', counselorId),
        where('isActive', '==', true)
      );
    } else {
      q = query(
        collection(db, 'counselorCodes'),
        where('isActive', '==', true)
      );
    }

    const querySnapshot = await getDocs(q);
    const codes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: codes
    });

  } catch (error) {
    console.error('상담사 인증코드 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '인증코드 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담사 인증코드 수정 (코드명만 변경 가능)
export async function PUT(request: NextRequest) {
  try {
    const { codeId, codeName } = await request.json();

    if (!codeId || !codeName) {
      return NextResponse.json(
        { success: false, error: '코드 ID와 새로운 코드명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 코드명 중복 확인
    const existingCodesQuery = query(
      collection(db, 'counselorCodes'),
      where('codeName', '==', codeName),
      where('isActive', '==', true)
    );
    const existingCodes = await getDocs(existingCodesQuery);
    
    if (!existingCodes.empty && existingCodes.docs[0].id !== codeId) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 코드명입니다.' },
        { status: 400 }
      );
    }

    // 코드명 업데이트
    const codeRef = doc(db, 'counselorCodes', codeId);
    await updateDoc(codeRef, {
      codeName,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: '코드명이 성공적으로 변경되었습니다.'
    });

  } catch (error) {
    console.error('상담사 인증코드 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '인증코드 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담사 인증코드 비활성화
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('codeId');

    if (!codeId) {
      return NextResponse.json(
        { success: false, error: '코드 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 코드 비활성화 (완전 삭제 대신)
    const codeRef = doc(db, 'counselorCodes', codeId);
    await updateDoc(codeRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: '인증코드가 비활성화되었습니다.'
    });

  } catch (error) {
    console.error('상담사 인증코드 비활성화 오류:', error);
    return NextResponse.json(
      { success: false, error: '인증코드 비활성화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
