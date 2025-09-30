import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, orderBy } from 'firebase/firestore';

export interface CounselingAppointment {
  id: string;
  clientId: string;
  counselorId: string;
  appointmentType: 'individual' | 'family' | 'couple' | 'group';
  title: string;
  description: string;
  scheduledAt: string;
  duration: number; // 분 단위
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  location: 'online' | 'offline' | 'phone';
  meetingLink?: string;
  address?: string;
  phoneNumber?: string;
  notes?: string;
  counselorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// 상담 예약 생성
export async function POST(request: NextRequest) {
  try {
    const { 
      clientId, 
      counselorId, 
      appointmentType, 
      title, 
      description, 
      scheduledAt, 
      duration = 60, 
      location = 'online',
      meetingLink,
      address,
      phoneNumber,
      notes 
    } = await request.json();

    if (!clientId || !counselorId || !appointmentType || !title || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 예약 시간 중복 확인
    const existingAppointmentQuery = query(
      collection(db, 'counselingAppointments'),
      where('counselorId', '==', counselorId),
      where('scheduledAt', '==', scheduledAt),
      where('status', 'in', ['pending', 'confirmed'])
    );
    const existingAppointment = await getDocs(existingAppointmentQuery);
    
    if (!existingAppointment.empty) {
      return NextResponse.json(
        { success: false, error: '해당 시간에 이미 예약이 있습니다.' },
        { status: 400 }
      );
    }

    // 상담 예약 생성
    const appointment: Omit<CounselingAppointment, 'id'> = {
      clientId,
      counselorId,
      appointmentType,
      title,
      description,
      scheduledAt,
      duration,
      status: 'pending',
      location,
      meetingLink,
      address,
      phoneNumber,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'counselingAppointments'), appointment);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...appointment
      }
    });

  } catch (error) {
    console.error('상담 예약 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 예약 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담 예약 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const counselorId = searchParams.get('counselorId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!clientId && !counselorId) {
      return NextResponse.json(
        { success: false, error: '클라이언트 ID 또는 상담사 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let q;
    if (clientId) {
      // 특정 내담자의 예약 조회
      q = query(
        collection(db, 'counselingAppointments'),
        where('clientId', '==', clientId)
      );
    } else if (counselorId) {
      // 특정 상담사의 예약 조회
      q = query(
        collection(db, 'counselingAppointments'),
        where('counselorId', '==', counselorId)
      );
    }

    if (status && q) {
      q = query(q, where('status', '==', status));
    }

    if (startDate && endDate && q) {
      q = query(q, where('scheduledAt', '>=', startDate), where('scheduledAt', '<=', endDate));
    }

    if (q) {
      q = query(q, orderBy('scheduledAt', 'asc'));
    }

    if (!q) {
      return NextResponse.json(
        { success: false, error: '쿼리를 생성할 수 없습니다.' },
        { status: 400 }
      );
    }

    const querySnapshot = await getDocs(q);
    const appointments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('상담 예약 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '상담 예약 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담 예약 상태 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { appointmentId, status, counselorNotes } = await request.json();

    if (!appointmentId || !status) {
      return NextResponse.json(
        { success: false, error: '예약 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (counselorNotes) {
      updateData.counselorNotes = counselorNotes;
    }

    // 상담 예약 상태 업데이트
    const appointmentRef = doc(db, 'counselingAppointments', appointmentId);
    await updateDoc(appointmentRef, updateData);

    return NextResponse.json({
      success: true,
      message: '상담 예약 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('상담 예약 상태 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
