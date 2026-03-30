/**
 * Firestore 데이터 모델 타입 정의
 * 상담사 중심 검사 코드 플랫폼: assessments, testResults 컬렉션
 */

import type { Timestamp } from 'firebase/firestore';

/** 대상 구분: 개인 또는 그룹 */
export type TargetAudience = '개인' | '그룹';

/** assessment 상태 */
export type AssessmentStatus = 'active' | 'archived';

/** 검사 목록 항목 (검사코드 세트에 포함된 개별 검사) */
export interface AssessmentTestItem {
  testId: string;
  name: string;
}

/**
 * assessments 컬렉션 문서
 * 경로: /assessments/{assessmentId}
 */
export interface Assessment {
  /** 유일 검사코드 (신규: CVC+숫자 3자리~, 구형: 영숫자 6자리) */
  accessCode: string;
  /** 내담자 접속용 4자리 비밀번호 bcrypt 해시 */
  joinPinHash?: string;
  /** 상담사 확인용 평문 4자리(저장 시; 공개 API에는 미포함) */
  joinPin?: string;
  /** 상담사 Firebase UID */
  counselorId: string;
  /** 검사코드 세트 안내 제목 */
  title: string;
  /** 대상: 개인 | 그룹 */
  targetAudience: TargetAudience;
  /** 내담자 환영/안내 메시지 */
  welcomeMessage: string;
  /** 수행할 검사 목록 */
  testList: AssessmentTestItem[];
  /** 생성 시각 */
  createdAt: Timestamp | { _seconds: number; _nanoseconds: number };
  /** 마지막 수정 시각 (서버 기록) */
  updatedAt?: Timestamp | { _seconds: number; _nanoseconds: number };
  /** 보관(삭제) 시각 */
  archivedAt?: Timestamp | { _seconds: number; _nanoseconds: number };
  /** 상태: active | archived */
  status: AssessmentStatus;
}

/** Firestore에 저장 시 id가 포함된 Assessment (조회 결과용) */
export interface AssessmentDocument extends Assessment {
  id: string;
}

/** assessment 생성 시 클라이언트가 보내는 입력 (createdAt, status는 서버에서 설정) */
export type AssessmentCreateInput = Omit<Assessment, 'createdAt' | 'status'> & {
  status?: AssessmentStatus;
};

// ---------------------------------------------------------------------------

/** testResult 상태 */
export type TestResultStatus = 'in-progress' | 'completed';

/**
 * testResults 컬렉션 문서
 * 경로: /testResults/{resultId}
 */
export interface TestResult {
  /** 검사코드 (assessments.accessCode와 동일 규칙) */
  accessCode: string;
  /** assessment 문서 ID */
  assessmentId: string;
  /** 검사 ID */
  testId: string;
  /** 내담자 이메일 */
  clientEmail: string;
  /** 진행 상태: in-progress | completed */
  status: TestResultStatus;
  /** 문항별 응답 (제출/수정 시) */
  responses: Record<string, unknown> | unknown[];
  /** 채점/해석 결과 데이터 */
  resultData?: Record<string, unknown>;
  /** 4자리 비밀번호 bcrypt 해시 (평문 저장 금지) */
  passwordHash: string;
  /** 완료 시각 (completed 시 설정) */
  completedAt?: Timestamp | { _seconds: number; _nanoseconds: number } | null;
}

/** Firestore 조회 결과용 (id 포함) */
export interface TestResultDocument extends TestResult {
  id: string;
}

/** 결과 제출 시 클라이언트가 보내는 입력 (passwordHash, completedAt는 서버에서 설정) */
export type TestResultCreateInput = Omit<TestResult, 'passwordHash' | 'completedAt'> & {
  /** 제출 시 비밀번호는 평문으로 전달, 서버에서 해시 후 저장 */
  password?: string;
};

// ---------------------------------------------------------------------------

/** 컬렉션 이름 상수 (오타 방지 및 규칙/코드 일치) */
export const FIRESTORE_COLLECTIONS = {
  ASSESSMENTS: 'assessments',
  TEST_RESULTS: 'testResults',
} as const;
