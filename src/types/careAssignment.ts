/**
 * 케어 할당(careAssignments) · 진행(careProgress) Firestore 스키마
 * Wave 2 — T-2-01
 *
 * 상담사가 내담자 포털에 추가검사·치료프로그램·일기 과제를 push하는 단위.
 * 포털 사용자는 Firebase Auth가 아닌 portalToken이므로 읽기/쓰기는 Flask API 전용.
 */

export const CARE_ASSIGNMENT_SCHEMA_VERSION = 1;

/** 할당 유형 */
export type CareAssignmentType =
  | 'additional_assessment'
  | 'treatment_program'
  | 'daily_record'
  | 'custom_task';

/** 할당 상태 */
export type CareAssignmentStatus = 'active' | 'completed' | 'cancelled' | 'expired';

/** 할당 생성 출처 */
export type CareAssignmentSource = 'manual' | 'ai_recommendation' | 'assessment_result';

/** 알림 발송 상태 */
export type CareNotifyStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type CareAssignmentPriority = 'low' | 'medium' | 'high';

export type CareAssignmentTestItem = {
  testId: string;
  name: string;
};

/**
 * careAssignments/{assignmentId}
 */
export type CareAssignment = {
  schemaVersion: number;
  counselorId: string;
  portalId: string;
  /** 목록 UI용 비정규화 */
  portalDisplayName?: string;
  type: CareAssignmentType;
  status: CareAssignmentStatus;
  title: string;
  description?: string;
  instructions?: string;
  priority: CareAssignmentPriority;
  /** treatment_program — T-2-02 카탈로그 programId */
  programId?: string;
  /** additional_assessment — 기존 검사코드 연결 */
  assessmentId?: string;
  /** additional_assessment — 신규 미니 검사 세트(assessmentId 없을 때) */
  testList?: CareAssignmentTestItem[];
  startAt?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  notifyOnAssign: boolean;
  notifyStatus?: CareNotifyStatus;
  notifyError?: string | null;
  notifyAt?: string | null;
  source: CareAssignmentSource;
  /** AI 리포트·검사결과 등 참조 ID */
  sourceRefId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy: string;
};

export type CareAssignmentDocument = CareAssignment & { id: string };

/** 상담사 할당 생성 요청 (T-2-04) */
export type CreateCareAssignmentInput = {
  portalIds: string[];
  type: CareAssignmentType;
  title: string;
  description?: string;
  instructions?: string;
  priority?: CareAssignmentPriority;
  programId?: string;
  assessmentId?: string;
  testList?: CareAssignmentTestItem[];
  startAt?: string;
  dueAt?: string;
  notify?: boolean;
  source?: CareAssignmentSource;
  sourceRefId?: string;
  metadata?: Record<string, unknown>;
};

export type CreateCareAssignmentResult = {
  schemaVersion: number;
  assigned: number;
  skipped: number;
  failed: number;
  notify: {
    sent: number;
    failed: number;
    skipped: number;
  };
  assignments: CareAssignmentDocument[];
  details: Array<{
    portalId: string;
    assignmentId?: string;
    status: 'assigned' | 'skipped' | 'failed';
    message?: string;
  }>;
};

/** 상담사 목록 조회 필터 */
export type ListCareAssignmentsParams = {
  portalId?: string;
  status?: CareAssignmentStatus | 'all';
  type?: CareAssignmentType;
  cohortId?: string;
  q?: string;
  limit?: number;
};

export type CounselorCareAssignmentListItem = CareAssignmentDocument & {
  progress?: CareProgressSummary;
};

export type ListCareAssignmentsResult = {
  items: CounselorCareAssignmentListItem[];
  total: number;
  summary: {
    active: number;
    completed: number;
    cancelled: number;
    expired: number;
  };
};

// ---------------------------------------------------------------------------
// careProgress — 내담자 치료·과제 완료 기록 (T-2-06에서 상세 구현)
// ---------------------------------------------------------------------------

export type CareProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

export type CareProgressEntryKind = 'session' | 'journal' | 'check_in' | 'note' | 'assessment';

export type CareProgressEntry = {
  id: string;
  kind: CareProgressEntryKind;
  title?: string;
  content?: string;
  moodScore?: number;
  stressLevel?: number;
  energyLevel?: number;
  completedAt?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * careProgress/{progressId}
 * assignmentId당 포털 1건 (1:1)
 */
export type CareProgress = {
  schemaVersion: number;
  assignmentId: string;
  portalId: string;
  counselorId: string;
  assignmentType: CareAssignmentType;
  status: CareProgressStatus;
  progressPercent: number;
  entries: CareProgressEntry[];
  lastActivityAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type CareProgressDocument = CareProgress & { id: string };

export type CareProgressSummary = {
  progressId: string;
  status: CareProgressStatus;
  progressPercent: number;
  entryCount: number;
  lastActivityAt?: string | null;
  completedAt?: string | null;
};

/** 포털 대시보드용 요약 (T-2-05) */
export type PortalCareAssignmentItem = {
  assignmentId: string;
  type: CareAssignmentType;
  status: CareAssignmentStatus;
  title: string;
  description?: string;
  instructions?: string;
  priority: CareAssignmentPriority;
  programId?: string;
  assessmentId?: string;
  dueAt?: string | null;
  progress: CareProgressSummary | null;
};

export type PortalCareAssignmentsResult = {
  active: PortalCareAssignmentItem[];
  completed: PortalCareAssignmentItem[];
  summary: {
    activeCount: number;
    completedCount: number;
    overdueCount: number;
  };
};
