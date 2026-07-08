/**
 * AI 크레딧·토큰 사용 원장 (aiUsageLedger, counselorAiCredits)
 * Wave 3 — T-3-01
 *
 * 검사 크레딧(counselorCredits)과 분리된 AI 전용 지갑.
 * 모든 읽기/쓰기는 Flask API(Admin SDK) 또는 Cloud Functions 전용.
 */

export const AI_USAGE_SCHEMA_VERSION = 1;

/** AI 기능별 과금 단위 */
export type AiUsageFeature =
  | 'counsel_message'
  | 'session_summary'
  | 'assessment_interpret'
  | 'test_recommendation'
  | 'report_generate'
  | 'admin_grant'
  | 'admin_adjustment'
  | 'commerce_purchase'
  | 'refund';

export type AiUsageReason =
  | 'counsel_message'
  | 'session_summary'
  | 'assessment_interpret'
  | 'test_recommendation'
  | 'report_generate'
  | 'admin_grant'
  | 'admin_adjustment'
  | 'commerce_purchase'
  | 'refund'
  | 'pilot_grant';

/**
 * counselorAiCredits/{counselorUid}
 */
export type CounselorAiCreditsDoc = {
  counselorUid: string;
  balance: number;
  updatedAt?: string | null;
};

/**
 * aiUsageLedger/{entryId} — append-only
 */
export type AiUsageLedgerEntry = {
  counselorUid: string;
  feature: AiUsageFeature;
  delta: number;
  balanceAfter: number;
  reason: AiUsageReason | string;
  tokensPrompt?: number;
  tokensCompletion?: number;
  tokensTotal?: number;
  modelId?: string;
  sessionId?: string;
  portalId?: string;
  resultId?: string;
  reportId?: string;
  clientId?: string;
  actorUid?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string | null;
};

export type AiUsageLedgerDocument = AiUsageLedgerEntry & { id: string };

/**
 * aiReports/{reportId} — T-4에서 사용 (스키마만 정의)
 */
export type AiReportDoc = {
  counselorUid: string;
  portalId?: string;
  resultId?: string;
  feature: 'assessment_interpret' | 'test_recommendation' | 'report_generate';
  title: string;
  content: string;
  modelId?: string;
  creditsCharged: number;
  testType?: string;
  clientLabel?: string;
  metadata?: {
    sections?: { heading: string; lines: string[] }[];
    counselorNotes?: string;
    recommendedTreatment?: string;
    accessCode?: string;
    status?: string;
    recommendations?: unknown[];
  };
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ComprehensiveReportResponse = {
  reportId: string;
  title: string;
  summary: string;
  sections: { heading: string; lines: string[] }[];
  counselorNotes: string;
  recommendedTreatment: string;
  cached: boolean;
  creditsCharged: number;
  modelId: string | null;
  testType?: string;
  clientLabel?: string;
  accessCode?: string;
};

export type AiUsageSchemaResponse = {
  schemaVersion: number;
  collections: {
    counselorAiCredits: string;
    aiUsageLedger: string;
    aiReports: string;
  };
  enums: {
    features: AiUsageFeature[];
    reasons: AiUsageReason[];
  };
  featureLabels: Record<string, string>;
  walletPolicy: 'separate' | 'unified';
  creditUnit: string;
  pilotFreeAiCredits: number;
  enforceCredits: boolean;
  docs: string;
  implementedEndpoints: string[];
};

export type CounselorAiCreditsMeResponse = {
  counselorUid: string;
  balance: number;
  enforceCredits: boolean;
  pilotFreeAiCredits: number;
  ledger: AiUsageLedgerDocument[];
};

export type AiUsageFeatureStat = {
  feature: string;
  label: string;
  count: number;
  creditsConsumed: number;
  creditsGranted: number;
  tokens: number;
};

export type AiAdminUsageSummary = {
  month: string | null;
  entryCount: number;
  activeCounselors: number;
  creditsGranted: number;
  creditsConsumed: number;
  tokensTotal: number;
  walletCount: number;
  totalWalletBalance: number;
  byFeature: Record<string, AiUsageFeatureStat>;
  topWallets: { counselorUid: string; balance: number }[];
};

export type AiAdminCounselorDetail = {
  counselorUid: string;
  email?: string | null;
  balance: number;
  ledger: AiUsageLedgerDocument[];
};
