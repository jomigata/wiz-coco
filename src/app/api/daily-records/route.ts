import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { DailyRecord } from '@/types/counselor';

// 일상 기록 생성
export async function POST(request: NextRequest) {
  try {
    const { clientId, counselorId, recordType, content, moodScore, stressLevel, energyLevel, isShared } = await request.json();

    if (!clientId || !recordType || !content) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 일상 기록 생성
    const dailyRecord: Omit<DailyRecord, 'id'> = {
      clientId,
      counselorId: counselorId || '',
      recordType,
      content,
      moodScore,
      stressLevel,
      energyLevel,
      recordedAt: new Date().toISOString(),
      isShared: isShared || false
    };

    const docRef = await addDoc(collection(db, 'dailyRecords'), dailyRecord);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...dailyRecord
      }
    });

  } catch (error) {
    console.error('일상 기록 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '일상 기록 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 일상 기록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const counselorId = searchParams.get('counselorId');
    const recordType = searchParams.get('recordType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limitCount = parseInt(searchParams.get('limit') || '50');

    if (!clientId && !counselorId) {
      return NextResponse.json(
        { success: false, error: '클라이언트 ID 또는 상담사 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let q;
    if (clientId) {
      // 특정 내담자의 기록 조회
      q = query(
        collection(db, 'dailyRecords'),
        where('clientId', '==', clientId)
      );
    } else if (counselorId) {
      // 특정 상담사의 내담자들 기록 조회
      q = query(
        collection(db, 'dailyRecords'),
        where('counselorId', '==', counselorId)
      );
    }

    if (recordType) {
      q = query(q, where('recordType', '==', recordType));
    }

    if (startDate && endDate) {
      q = query(q, where('recordedAt', '>=', startDate), where('recordedAt', '<=', endDate));
    }

    q = query(q, orderBy('recordedAt', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: records
    });

  } catch (error) {
    console.error('일상 기록 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '일상 기록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 일상 기록 수정
export async function PUT(request: NextRequest) {
  try {
    const { recordId, content, moodScore, stressLevel, energyLevel, isShared, counselorNotes } = await request.json();

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: '기록 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (content !== undefined) updateData.content = content;
    if (moodScore !== undefined) updateData.moodScore = moodScore;
    if (stressLevel !== undefined) updateData.stressLevel = stressLevel;
    if (energyLevel !== undefined) updateData.energyLevel = energyLevel;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (counselorNotes !== undefined) updateData.counselorNotes = counselorNotes;

    // 일상 기록 수정
    const recordRef = doc(db, 'dailyRecords', recordId);
    await updateDoc(recordRef, updateData);

    return NextResponse.json({
      success: true,
      message: '일상 기록이 수정되었습니다.'
    });

  } catch (error) {
    console.error('일상 기록 수정 오류:', error);
    return NextResponse.json(
      { success: false, error: '일상 기록 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
