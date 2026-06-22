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
}

export interface ClientPortalBulkCreateResult {
  cohortId: string;
  cohortName: string;
  created: ClientPortalBulkRow[];
  notifyQueued: number;
  scheduledAt?: string | null;
}
