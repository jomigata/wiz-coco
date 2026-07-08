import { FieldValue } from 'firebase-admin/firestore'
import { AI_REPORTS_COLLECTION } from '../types'
import type { TestRecommendationItem } from '../gemini/testRecommendation'
import { db } from './session'

export type AiReportFeature = 'assessment_interpret' | 'test_recommendation'

export type AiReportRecord = {
  counselorUid: string
  resultId: string
  portalId?: string
  feature: AiReportFeature
  title: string
  content: string
  modelId?: string
  creditsCharged: number
  testType?: string
  clientLabel?: string
  metadata?: {
    recommendations?: TestRecommendationItem[]
    summary?: string
  }
  createdAt?: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
}

export async function findCachedAiReport(
  counselorUid: string,
  resultId: string,
  feature: AiReportFeature
): Promise<(AiReportRecord & { id: string }) | null> {
  const snap = await db()
    .collection(AI_REPORTS_COLLECTION)
    .where('counselorUid', '==', counselorUid)
    .where('resultId', '==', resultId)
    .where('feature', '==', feature)
    .limit(1)
    .get()

  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...(doc.data() as AiReportRecord) }
}

export async function saveAiReport(
  payload: Omit<AiReportRecord, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await db().collection(AI_REPORTS_COLLECTION).add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return ref.id
}

/** @deprecated use findCachedAiReport(..., 'assessment_interpret') */
export async function findCachedInterpretReport(
  counselorUid: string,
  resultId: string
): Promise<(AiReportRecord & { id: string }) | null> {
  return findCachedAiReport(counselorUid, resultId, 'assessment_interpret')
}

/** @deprecated use saveAiReport */
export async function saveInterpretReport(
  payload: Omit<AiReportRecord, 'createdAt' | 'updatedAt'>
): Promise<string> {
  return saveAiReport(payload)
}
