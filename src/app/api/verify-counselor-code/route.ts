import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { ClientCounselorRelation } from '@/types/counselor';

// 인증코드 검증 및 내담자-상담사 연결
export async function POST(request: NextRequest) {
  try {
    const { clientId, counselorCode } = await request.json();

    if (!clientId || !counselorCode) {
      return NextResponse.json(
        { success: false, error: '클라이언트 ID와 상담사 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 인증코드로 상담사 찾기
    const codesQuery = query(
      collection(db, 'counselorCodes'),
      where('codeName', '==', counselorCode),
      where('isActive', '==', true)
    );
    const codesSnapshot = await getDocs(codesQuery);

    if (codesSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증코드입니다.' },
        { status: 404 }
      );
    }

    const counselorCodeData = codesSnapshot.docs[0].data();
    const counselorId = counselorCodeData.counselorId;

    // 이미 연결된 관계가 있는지 확인
    const existingRelationQuery = query(
      collection(db, 'clientCounselorRelations'),
      where('clientId', '==', clientId),
      where('counselorId', '==', counselorId),
      where('isActive', '==', true)
    );
    const existingRelationSnapshot = await getDocs(existingRelationQuery);

    if (!existingRelationSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: '이미 해당 상담사와 연결되어 있습니다.' },
        { status: 400 }
      );
    }

    // 새로운 내담자-상담사 관계 생성
    const relationData: Omit<ClientCounselorRelation, 'id'> = {
      clientId,
      counselorId,
      counselorCode,
      assignedAt: new Date().toISOString(),
      isActive: true,
      sharedData: {
        testResults: true,
        chatHistory: true,
        dailyRecords: true,
        otherMaterials: true
      }
    };

    const relationRef = await addDoc(collection(db, 'clientCounselorRelations'), relationData);

    // 상담사 정보 조회
    const counselorQuery = query(
      collection(db, 'counselors'),
      where('id', '==', counselorId)
    );
    const counselorSnapshot = await getDocs(counselorQuery);
    
    let counselorInfo = null;
    if (!counselorSnapshot.empty) {
      counselorInfo = counselorSnapshot.docs[0].data();
    }

    return NextResponse.json({
      success: true,
      data: {
        relationId: relationRef.id,
        counselorId,
        counselorCode,
        counselorInfo,
        message: '상담사와 성공적으로 연결되었습니다.'
      }
    });

  } catch (error) {
    console.error('인증코드 검증 오류:', error);
    return NextResponse.json(
      { success: false, error: '인증코드 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 내담자의 상담사 연결 상태 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: '클라이언트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 내담자의 활성 상담사 관계 조회
    const relationQuery = query(
      collection(db, 'clientCounselorRelations'),
      where('clientId', '==', clientId),
      where('isActive', '==', true)
    );
    const relationSnapshot = await getDocs(relationQuery);

    if (relationSnapshot.empty) {
      return NextResponse.json({
        success: true,
        data: {
          isConnected: false,
          message: '연결된 상담사가 없습니다.'
        }
      });
    }

    const relation = relationSnapshot.docs[0].data();
    const counselorId = relation.counselorId;

    // 상담사 정보 조회
    const counselorQuery = query(
      collection(db, 'counselors'),
      where('id', '==', counselorId)
    );
    const counselorSnapshot = await getDocs(counselorQuery);
    
    let counselorInfo = null;
    if (!counselorSnapshot.empty) {
      counselorInfo = counselorSnapshot.docs[0].data();
    }

    return NextResponse.json({
      success: true,
      data: {
        isConnected: true,
        relationId: relationSnapshot.docs[0].id,
        counselorId,
        counselorCode: relation.counselorCode,
        counselorInfo,
        assignedAt: relation.assignedAt,
        sharedData: relation.sharedData
      }
    });

  } catch (error) {
    console.error('상담사 연결 상태 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담사 연결 상태 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
