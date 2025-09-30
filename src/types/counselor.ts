// 상담사 및 인증코드 관련 타입 정의

export interface Counselor {
  id: string;
  email: string;
  name: string;
  codeName: string; // 상담사가 설정한 개별코드명 (변경 가능)
  codeNumber: string; // 자동 생성되는 개별코드번호 (변경 불가)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: {
    specialization: string[];
    experience: number;
    bio: string;
    phoneNumber?: string;
    license?: string;
  };
}

export interface CounselorCode {
  id: string;
  counselorId: string;
  codeName: string;
  codeNumber: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface ClientCounselorRelation {
  id: string;
  clientId: string;
  counselorId: string;
  counselorCode: string;
  assignedAt: string;
  isActive: boolean;
  sharedData: {
    testResults: boolean;
    chatHistory: boolean;
    dailyRecords: boolean;
    otherMaterials: boolean;
  };
}

export interface CounselorApplication {
  id: string;
  applicantId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewerId?: string;
  documents: {
    resume: string;
    license: string;
    portfolio: string[];
    other: string[];
  };
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    specialization: string[];
    experience: number;
    education: string;
    bio: string;
  };
  reviewNotes?: string;
}

export interface TestAssignment {
  id: string;
  clientId: string;
  counselorId: string;
  testType: string;
  testName: string;
  assignedAt: string;
  completedAt?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface DailyRecord {
  id: string;
  clientId: string;
  counselorId: string;
  recordType: 'daily_mood' | 'weekly_check' | 'monthly_review' | 'emotion_diary';
  content: string;
  moodScore?: number;
  stressLevel?: number;
  energyLevel?: number;
  recordedAt: string;
  isShared: boolean;
  counselorNotes?: string;
}
