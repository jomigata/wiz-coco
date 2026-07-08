/**
 * 내담자 포털 — 1인 1 검사코드+PIN (Firebase Auth와 분리)
 * Firestore: clientPortals/{portalId}
 */

export type ClientPortalStatus = 'active' | 'archived';

export interface ClientPortalAssessmentRef {
  assessmentId: string;
  title?: string;
  accessCode?: string;
}

export interface ClientPortal {
  id: string;
  accessCode: string;
  counselorId: string;
  displayName: string;
  email?: string;
  phone?: string;
  cohortId?: string;
  cohortName?: string;
  assignedAssessmentIds: string[];
  status: ClientPortalStatus;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

/** 로그인 API 응답 (PIN·토큰은 클라이언트에만 일시 노출) */
export interface ClientPortalLoginResult {
  portalToken: string;
  rememberDays: number;
  portal: {
    id: string;
    accessCode: string;
    displayName: string;
    counselorId: string;
    assignedAssessments: ClientPortalAssessmentRef[];
  };
}

export interface ClientPortalBulkRow {
  displayName: string;
  email?: string;
  phone?: string;
  /** 검사 시작용 공유 검사코드 */
  joinAccessCode?: string;
  /** 내 검사실 나의코드 */
  accessCode: string;
  myCode?: string;
  pin: string;
  portalId: string;
  magicPath?: string;
  magicUrl?: string;
}

export interface ClientPortalBulkCreateResult {
  async?: boolean;
  jobId?: string;
  cohortId: string;
  cohortName: string;
  assessmentId?: string;
  joinAccessCode?: string;
  created?: ClientPortalBulkRow[];
  notifySent?: number;
  notifyFailed?: number;
  notifyQueued: number;
  scheduledAt?: string | null;
}

export type BulkPortalJobStatus = {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  createdCount: number;
  notifyQueued: number;
  progressPct: number;
  cohortId?: string;
  cohortName?: string;
  assessmentId?: string;
  joinAccessCode?: string;
  queueNotify?: boolean;
  scheduledAt?: string | null;
  error?: string | null;
  completedAt?: string | null;
};

export type ClientPortalProgressLabel = 'completed' | 'in_progress' | 'not_started' | 'no_tests';

export type CounselorClientPortalListItem = {
  portalId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  accessCode: string;
  cohortId?: string | null;
  cohortName?: string | null;
  status: ClientPortalStatus;
  assignedAssessmentCount: number;
  assessments: { assessmentId: string; title: string }[];
  notifyStatus: string;
  notifyError?: string | null;
  notifyAt?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  progress: {
    totalTests: number;
    completedTests: number;
    percent: number;
    label: ClientPortalProgressLabel;
  };
};

export type CounselorClientPortalCohort = {
  cohortId: string;
  cohortName: string;
};

export type CounselorClientPortalListResult = {
  items: CounselorClientPortalListItem[];
  total: number;
  cohorts: CounselorClientPortalCohort[];
};

export type CounselorPortalTestAssignmentStatus = 'not_started' | 'in_progress' | 'completed';

export type CounselorPortalTestAssignmentRow = {
  portalId: string;
  displayName: string;
  email?: string | null;
  accessCode: string;
  cohortId?: string | null;
  cohortName?: string | null;
  portalStatus: ClientPortalStatus;
  assessmentId: string;
  assessmentTitle: string;
  joinAccessCode: string;
  testId: string;
  testName: string;
  status: CounselorPortalTestAssignmentStatus;
  completedAt?: string | null;
  resultId?: string | null;
};

export type CounselorPortalTestAssignmentAssessment = {
  assessmentId: string;
  title: string;
};

export type CounselorPortalTestAssignmentListResult = {
  items: CounselorPortalTestAssignmentRow[];
  total: number;
  cohorts: CounselorClientPortalCohort[];
  assessments: CounselorPortalTestAssignmentAssessment[];
};

export type CounselorPushAssessmentDetail = {
  portalId: string;
  status: 'assigned' | 'skipped' | 'failed';
  displayName?: string;
  message?: string;
  notify?: {
    status: string;
    message?: string;
    pendingCount?: number;
    magicUrl?: string;
    sentVia?: string | null;
  };
};

export type CounselorPushAssessmentResult = {
  assessmentId: string;
  assessmentTitle: string;
  joinAccessCode: string;
  assigned: number;
  skipped: number;
  failed: number;
  notify: {
    sent: number;
    failed: number;
    skipped: number;
  };
  details: CounselorPushAssessmentDetail[];
  credits?: {
    counselorUid: string;
    balance: number;
    consumed: number;
    warning?: string;
    required?: number;
  };
};

export type CounselorClientPortalAssessmentDetail = {
  assessmentId: string;
  title: string;
  joinAccessCode: string;
  cohortName?: string;
  usageEndDate?: string | null;
  welcomeMessage?: string;
  testList: { testId: string; name: string }[];
  testStatus: 'completed' | 'in_progress' | 'not_started';
  completedCount: number;
  requiredCount: number;
  tests: {
    testId: string;
    testName: string;
    status: 'completed' | 'in_progress' | 'not_started';
    completedAt: string | null;
    resultId: string | null;
  }[];
};

export type CounselorClientPortalDetailResult = {
  portal: {
    portalId: string;
    displayName: string;
    email?: string | null;
    phone?: string | null;
    accessCode: string;
    cohortId?: string | null;
    cohortName?: string | null;
    status: ClientPortalStatus;
    createdAt?: string | null;
    updatedAt?: string | null;
    lastLoginAt?: string | null;
    notifyStatus: string;
    notifyError?: string | null;
    notifyAt?: string | null;
    notifySentVia?: string;
  };
  progress: {
    totalTests: number;
    completedTests: number;
    percent: number;
    label: ClientPortalProgressLabel;
  };
  assessments: CounselorClientPortalAssessmentDetail[];
  recentResults: {
    resultId: string;
    assessmentId: string;
    testId: string;
    testType: string;
    status: string;
    completedAt?: string | null;
    createdAt?: string | null;
  }[];
  linkedPortals: { portalId: string; accessCode: string; displayName?: string }[];
};

export interface ClientPortalBulkJobResult extends BulkPortalJobStatus {
  created: ClientPortalBulkRow[];
}
