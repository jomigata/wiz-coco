import type { Timestamp } from 'firebase/firestore'

export type RiskLevel = 'none' | 'low' | 'medium' | 'high'
export type AiCounselSessionStatus = 'active' | 'ended' | 'escalated'
export type AiCounselMessageRole = 'user' | 'assistant' | 'system' | 'counselor'

export const AI_COUNSEL_SESSIONS_COLLECTION = 'aiCounselSessions'

export interface AiCounselSessionDoc {
  clientId: string
  type: 'ai'
  status: AiCounselSessionStatus
  title?: string
  summary?: string
  riskLevel: RiskLevel
  messageCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
  endedAt?: Timestamp
}

export interface AiCounselMessageDoc {
  role: AiCounselMessageRole
  content: string
  model?: string
  createdAt: Timestamp
  flagged?: boolean
}

export interface StartAiSessionRequest {
  title?: string
}

export interface StartAiSessionResponse {
  sessionId: string
}

export interface SendCounselMessageRequest {
  sessionId: string
  content: string
}

export interface SendCounselMessageResponse {
  reply: string
  riskLevel: RiskLevel
  escalated: boolean
  messageId: string
}

export interface EndAiSessionRequest {
  sessionId: string
}

export interface EndAiSessionResponse {
  summary: string
}
