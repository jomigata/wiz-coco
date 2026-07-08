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

export interface ClientPortalBulkJobResult extends BulkPortalJobStatus {
  created: ClientPortalBulkRow[];
}
