import { FieldValue } from 'firebase-admin/firestore'
import { AI_REPORTS_COLLECTION } from '../types'
import { db } from './session'

export type AiReportRecord = {
  counselorUid: string
  resultId: string
  portalId?: string
  feature: 'assessment_interpret'
  title: string
  content: string
  modelId?: string
  creditsCharged: number
  testType?: string
  clientLabel?: string
  createdAt?: FirebaseFirestore.Timestamp
  updatedAt?: FirebaseFirestore.Timestamp
}

export async function findCachedInterpretReport(
  counselorUid: string,
  resultId: string
): Promise<(AiReportRecord & { id: string }) | null> {
  const snap = await db()
    .collection(AI_REPORTS_COLLECTION)
    .where('counselorUid', '==', counselorUid)
    .where('resultId', '==', resultId)
    .limit(1)
    .get()

  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...(doc.data() as AiReportRecord) }
}

export async function saveInterpretReport(
  payload: Omit<AiReportRecord, 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = await db().collection(AI_REPORTS_COLLECTION).add({
    ...payload,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })
  return ref.id
}
