import { HttpsError } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAuth } from './session'

const COUNSELOR_ROLES = new Set(['counselor', 'admin'])

export async function requireCounselor<T>(request: CallableRequest<T>): Promise<string> {
  const uid = requireAuth(request)
  const userDoc = await getFirestore().collection('users').doc(uid).get()
  const role = userDoc.data()?.role
  if (!role || !COUNSELOR_ROLES.has(role)) {
    throw new HttpsError('permission-denied', '상담사 또는 관리자만 실행할 수 있습니다.')
  }
  return uid
}

export async function counselorOwnsTestResult(
  counselorUid: string,
  resultData: FirebaseFirestore.DocumentData
): Promise<boolean> {
  if ((resultData.counselorId as string) === counselorUid) {
    return true
  }
  const assessmentId = String(resultData.assessmentId || '').trim()
  if (!assessmentId) return false
  const ass = await getFirestore().collection('assessments').doc(assessmentId).get()
  if (!ass.exists) return false
  return ass.data()?.counselorId === counselorUid
}
