import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { CounselorApplication } from '@/types/counselor';

// 상담사 지원 신청
export async function POST(request: NextRequest) {
  try {
    // Firebase 초기화
    const { db } = initializeFirebase();
    
    const applicationData: Omit<CounselorApplication, 'id'> = await request.json();

    // 필수 필드 검증
    if (!applicationData.applicantId || !applicationData.personalInfo) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 중복 신청 확인
    const existingApplicationQuery = query(
      collection(db, 'counselorApplications'),
      where('applicantId', '==', applicationData.applicantId),
      where('status', 'in', ['pending', 'under_review', 'approved'])
    );
    const existingApplication = await getDocs(existingApplicationQuery);
    
    if (!existingApplication.empty) {
      return NextResponse.json(
        { success: false, error: '이미 상담사 지원 신청이 진행 중입니다.' },
        { status: 400 }
      );
    }

    // 지원 신청 생성
    const application: Omit<CounselorApplication, 'id'> = {
      ...applicationData,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'counselorApplications'), application);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...application
      },
      message: '상담사 지원 신청이 제출되었습니다.'
    });

  } catch (error) {
    console.error('상담사 지원 신청 오류:', error);
    return NextResponse.json(
      { success: false, error: '지원 신청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담사 지원 신청 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    // Firebase 초기화
    const { db } = initializeFirebase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicantId');

    let q;
    if (applicantId) {
      // 특정 사용자의 지원 신청 조회
      q = query(
        collection(db, 'counselorApplications'),
        where('applicantId', '==', applicantId)
      );
    } else if (status) {
      // 특정 상태의 지원 신청 조회
      q = query(
        collection(db, 'counselorApplications'),
        where('status', '==', status)
      );
    } else {
      // 모든 지원 신청 조회
      q = query(collection(db, 'counselorApplications'));
    }

    const querySnapshot = await getDocs(q);
    const applications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: applications
    });

  } catch (error) {
    console.error('상담사 지원 신청 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '지원 신청 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담사 지원 신청 상태 업데이트 (관리자용)
export async function PUT(request: NextRequest) {
  try {
    // Firebase 초기화
    const { db } = initializeFirebase();
    
    const { applicationId, status, reviewNotes, reviewerId } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json(
        { success: false, error: '지원 ID와 상태가 필요합니다.' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      reviewedAt: new Date().toISOString()
    };

    if (reviewNotes) {
      updateData.reviewNotes = reviewNotes;
    }

    if (reviewerId) {
      updateData.reviewerId = reviewerId;
    }

    // 지원 신청 상태 업데이트
    const applicationRef = doc(db, 'counselorApplications', applicationId);
    await updateDoc(applicationRef, updateData);

    // 승인된 경우 상담사 등록 및 인증코드 생성
    if (status === 'approved') {
      const applicationDoc = await getDocs(query(
        collection(db, 'counselorApplications'),
        where('__name__', '==', applicationId)
      ));
      
      if (!applicationDoc.empty) {
        const application = applicationDoc.docs[0].data();
        
        // 상담사 등록
        const counselorData = {
          id: application.applicantId,
          email: application.personalInfo.email,
          name: application.personalInfo.name,
          isActive: true,
          createdAt: new Date().toISOString(),
          profile: {
            specialization: application.personalInfo.specialization,
            experience: application.personalInfo.experience,
            bio: application.personalInfo.bio,
            phoneNumber: application.personalInfo.phone,
            license: application.documents?.license
          }
        };

        await addDoc(collection(db, 'counselors'), counselorData);

        // 기본 인증코드 생성
        const codeName = `${application.personalInfo.name}상담사`;
        const codeNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
        
        const counselorCode = {
          counselorId: application.applicantId,
          codeName,
          codeNumber,
          isActive: true,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'counselorCodes'), counselorCode);
      }
    }

    return NextResponse.json({
      success: true,
      message: '지원 신청 상태가 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('상담사 지원 신청 상태 업데이트 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
