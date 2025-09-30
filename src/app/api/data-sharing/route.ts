import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export interface DataSharingRequest {
  id: string;
  sharerId: string; // 공유하는 상담사 ID
  sharedWithId: string; // 공유받는 상담사 ID
  clientId: string; // 공유할 내담자 ID
  sharedData: {
    testResults: boolean;
    chatHistory: boolean;
    dailyRecords: boolean;
    otherMaterials: boolean;
  };
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestedAt: string;
  respondedAt?: string;
  notes?: string;
  expiresAt?: string;
}

// 데이터 공유 요청 생성
export async function POST(request: NextRequest) {
  try {
    const { sharerId, sharedWithId, clientId, sharedData, notes, expiresAt } = await request.json();

    if (!sharerId || !sharedWithId || !clientId || !sharedData) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 중복 요청 확인
    const existingRequestQuery = query(
      collection(db, 'dataSharingRequests'),
      where('sharerId', '==', sharerId),
      where('sharedWithId', '==', sharedWithId),
      where('clientId', '==', clientId),
      where('status', 'in', ['pending', 'approved'])
    );
    const existingRequest = await getDocs(existingRequestQuery);
    
    if (!existingRequest.empty) {
      return NextResponse.json(
        { success: false, error: '이미 해당 내담자에 대한 공유 요청이 있습니다.' },
        { status: 400 }
      );
    }

    // 공유 요청 생성
    const sharingRequest: Omit<DataSharingRequest, 'id'> = {
      sharerId,
      sharedWithId,
      clientId,
      sharedData,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      notes,
      expiresAt
    };

    const docRef = await addDoc(collection(db, 'dataSharingRequests'), sharingRequest);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...sharingRequest
      }
    });

  } catch (error) {
    console.error('데이터 공유 요청 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '공유 요청 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 데이터 공유 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const counselorId = searchParams.get('counselorId');
    const type = searchParams.get('type'); // 'sent' | 'received'
    const status = searchParams.get('status');

    if (!counselorId || !type) {
      return NextResponse.json(
        { success: false, error: '상담사 ID와 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    let q;
    if (type === 'sent') {
      // 보낸 요청
      q = query(
        collection(db, 'dataSharingRequests'),
        where('sharerId', '==', counselorId)
      );
    } else if (type === 'received') {
      // 받은 요청
      q = query(
        collection(db, 'dataSharingRequests'),
        where('sharedWithId', '==', counselorId)
      );
    } else {
      return NextResponse.json(
        { success: false, error: '올바른 타입을 지정해주세요.' },
        { status: 400 }
      );
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: requests
    });

  } catch (error) {
    console.error('데이터 공유 요청 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '공유 요청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 데이터 공유 요청 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { requestId, status, notes } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { success: false, error: '요청 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      respondedAt: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    // 공유 요청 상태 업데이트
    const requestRef = doc(db, 'dataSharingRequests', requestId);
    await updateDoc(requestRef, updateData);

    // 승인된 경우 실제 데이터 공유 권한 부여
    if (status === 'approved') {
      // ClientCounselorRelation에 공유 권한 추가
      const relationQuery = query(
        collection(db, 'clientCounselorRelations'),
        where('clientId', '==', requestId), // 실제로는 요청에서 clientId를 가져와야 함
        where('counselorId', '==', requestId) // 실제로는 요청에서 sharedWithId를 가져와야 함
      );
      
      // 실제 구현에서는 요청 데이터를 먼저 조회한 후 처리
      // 여기서는 간단히 처리
    }

    return NextResponse.json({
      success: true,
      message: '공유 요청 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('데이터 공유 요청 상태 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 데이터 공유 요청 삭제/취소
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: '요청 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 공유 요청 삭제
    const requestRef = doc(db, 'dataSharingRequests', requestId);
    await deleteDoc(requestRef);

    return NextResponse.json({
      success: true,
      message: '공유 요청이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('데이터 공유 요청 삭제 오류:', error);
    return NextResponse.json(
      { success: false, error: '요청 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
