import { HttpsError } from 'firebase-functions/v2/https'
import type { CallableRequest } from 'firebase-functions/v2/https'
import { getFirestore } from 'firebase-admin/firestore'
import { requireAuth } from './session'

export async function requireAdmin<T>(request: CallableRequest<T>): Promise<string> {
  const uid = requireAuth(request)
  const userDoc = await getFirestore().collection('users').doc(uid).get()
  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', '관리자만 실행할 수 있습니다.')
  }
  return uid
}
