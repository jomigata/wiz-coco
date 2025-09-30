import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { TestAssignment } from '@/types/counselor';

// 검사 할당
export async function POST(request: NextRequest) {
  try {
    const { clientId, counselorId, testType, testName, priority = 'medium', notes } = await request.json();

    if (!clientId || !counselorId || !testType || !testName) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 중복 할당 확인
    const existingAssignmentQuery = query(
      collection(db, 'testAssignments'),
      where('clientId', '==', clientId),
      where('counselorId', '==', counselorId),
      where('testType', '==', testType),
      where('status', 'in', ['assigned', 'in_progress'])
    );
    const existingAssignment = await getDocs(existingAssignmentQuery);
    
    if (!existingAssignment.empty) {
      return NextResponse.json(
        { success: false, error: '이미 해당 검사가 할당되어 있습니다.' },
        { status: 400 }
      );
    }

    // 검사 할당 생성
    const assignment: Omit<TestAssignment, 'id'> = {
      clientId,
      counselorId,
      testType,
      testName,
      assignedAt: new Date().toISOString(),
      status: 'assigned',
      priority,
      notes
    };

    const docRef = await addDoc(collection(db, 'testAssignments'), assignment);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...assignment
      }
    });

  } catch (error) {
    console.error('검사 할당 오류:', error);
    return NextResponse.json(
      { success: false, error: '검사 할당 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 검사 할당 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const counselorId = searchParams.get('counselorId');
    const status = searchParams.get('status');

    let q;
    if (clientId) {
      // 특정 내담자의 할당된 검사 조회
      q = query(
        collection(db, 'testAssignments'),
        where('clientId', '==', clientId)
      );
    } else if (counselorId) {
      // 특정 상담사의 할당한 검사 조회
      q = query(
        collection(db, 'testAssignments'),
        where('counselorId', '==', counselorId)
      );
    } else {
      return NextResponse.json(
        { success: false, error: '클라이언트 ID 또는 상담사 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const assignments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('검사 할당 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '검사 할당 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 검사 할당 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { assignmentId, status, notes } = await request.json();

    if (!assignmentId || !status) {
      return NextResponse.json(
        { success: false, error: '할당 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }

    // 검사 할당 상태 업데이트
    const assignmentRef = doc(db, 'testAssignments', assignmentId);
    await updateDoc(assignmentRef, updateData);

    return NextResponse.json({
      success: true,
      message: '검사 할당 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('검사 할당 상태 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
