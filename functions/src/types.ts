export type RiskLevel = 'none' | 'low' | 'medium' | 'high'
export type SessionStatus = 'active' | 'ended' | 'escalated'

/** WizCoCo 전용 AI 상담 세션 컬렉션 (AiCoCo sessions 이식) */
export const AI_COUNSEL_SESSIONS_COLLECTION = 'aiCounselSessions'

/** Wave 3 — AI 크레딧·토큰 원장 (T-3-01) */
export const COUNSELOR_AI_CREDITS_COLLECTION = 'counselorAiCredits'
export const AI_USAGE_LEDGER_COLLECTION = 'aiUsageLedger'
export const AI_REPORTS_COLLECTION = 'aiReports'

export type AiUsageFeature =
  | 'counsel_message'
  | 'session_summary'
  | 'assessment_interpret'
  | 'test_recommendation'
  | 'report_generate'

export type GeminiUsage = {
  tokensPrompt?: number
  tokensCompletion?: number
  tokensTotal?: number
}
