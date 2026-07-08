import { FieldValue } from 'firebase-admin/firestore'
import {
  AI_USAGE_LEDGER_COLLECTION,
  COUNSELOR_AI_CREDITS_COLLECTION,
  type AiUsageFeature,
  type GeminiUsage,
} from '../types'
import { db } from './session'

const AI_CREDITS_ENFORCE = process.env.AI_CREDITS_ENFORCE === 'true'

/** counsel_message 1회당 차감 AI 크레딧 (T-3-04 단가표와 동기화 예정) */
export const COUNSEL_MESSAGE_CREDIT_COST = 0

/** 검사 결과 AI 해석 1건 (T-3-05) */
export const ASSESSMENT_INTERPRET_CREDIT_COST = 4

/** 맞춤 검사 추천 1건 (T-3-06) */
export const TEST_RECOMMENDATION_CREDIT_COST = 1

export type RecordAiUsageInput = {
  counselorUid?: string
  clientId?: string
  feature: AiUsageFeature
  reason: string
  delta?: number
  sessionId?: string
  portalId?: string
  resultId?: string
  reportId?: string
  modelId?: string
  usage?: GeminiUsage
  actorUid?: string
  metadata?: Record<string, unknown>
}

async function getAiBalance(counselorUid: string): Promise<number> {
  const snap = await db().collection(COUNSELOR_AI_CREDITS_COLLECTION).doc(counselorUid).get()
  if (!snap.exists) return 0
  const balance = snap.data()?.balance
  return typeof balance === 'number' ? Math.max(0, balance) : 0
}

async function applyAiCreditDelta(
  counselorUid: string,
  delta: number
): Promise<number> {
  const ref = db().collection(COUNSELOR_AI_CREDITS_COLLECTION).doc(counselorUid)
  const snap = await ref.get()
  const current = snap.exists ? Math.max(0, Number(snap.data()?.balance) || 0) : 0
  const next = Math.max(0, current + delta)
  await ref.set(
    {
      counselorUid,
      balance: next,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
  return next
}

/**
 * Gemini 호출 후 토큰·크레딧 원장 기록.
 * counselorUid가 있고 delta < 0 이면 잔액 차감 (AI_CREDITS_ENFORCE 시 부족하면 예외).
 */
export async function recordAiUsage(input: RecordAiUsageInput): Promise<void> {
  const delta = input.delta ?? 0
  const counselorUid = input.counselorUid?.trim()

  if (counselorUid && delta < 0) {
    const required = Math.abs(delta)
    const balance = await getAiBalance(counselorUid)
    if (balance < required) {
      if (AI_CREDITS_ENFORCE) {
        throw new Error(`insufficient_ai_credits:${balance}:${required}`)
      }
      return
    }
  }

  let balanceAfter = 0
  if (counselorUid && delta !== 0) {
    balanceAfter = await applyAiCreditDelta(counselorUid, delta)
  } else if (counselorUid) {
    balanceAfter = await getAiBalance(counselorUid)
  }

  const entry: Record<string, unknown> = {
    feature: input.feature,
    reason: input.reason,
    delta,
    balanceAfter,
    createdAt: FieldValue.serverTimestamp(),
  }

  if (counselorUid) entry.counselorUid = counselorUid
  if (input.clientId) entry.clientId = input.clientId
  if (input.sessionId) entry.sessionId = input.sessionId
  if (input.portalId) entry.portalId = input.portalId
  if (input.resultId) entry.resultId = input.resultId
  if (input.reportId) entry.reportId = input.reportId
  if (input.modelId) entry.modelId = input.modelId
  if (input.actorUid) entry.actorUid = input.actorUid
  if (input.metadata) entry.metadata = input.metadata

  const usage = input.usage
  if (usage?.tokensPrompt != null) entry.tokensPrompt = usage.tokensPrompt
  if (usage?.tokensCompletion != null) entry.tokensCompletion = usage.tokensCompletion
  if (usage?.tokensTotal != null) entry.tokensTotal = usage.tokensTotal

  await db().collection(AI_USAGE_LEDGER_COLLECTION).add(entry)
}

export async function assertCounselorAiCredits(
  counselorUid: string,
  required: number
): Promise<void> {
  if (required <= 0) return
  const balance = await getAiBalance(counselorUid)
  if (balance < required && AI_CREDITS_ENFORCE) {
    throw new Error(`insufficient_ai_credits:${balance}:${required}`)
  }
}
