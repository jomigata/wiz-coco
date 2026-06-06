import { onCall } from 'firebase-functions/v2/https'
import { db, FieldValue, requireAuth } from '../utils/session'
import { AI_COUNSEL_SESSIONS_COLLECTION } from '../types'

interface StartAiSessionRequest {
  title?: string
}

export const startAiSession = onCall<StartAiSessionRequest>(
  { region: 'asia-northeast3' },
  async (request) => {
    const uid = requireAuth(request)
    const title = request.data?.title?.trim() || 'AI 상담'

    const active = await db()
      .collection(AI_COUNSEL_SESSIONS_COLLECTION)
      .where('clientId', '==', uid)
      .where('type', '==', 'ai')
      .where('status', '==', 'active')
      .limit(1)
      .get()

    if (!active.empty) {
      return { sessionId: active.docs[0].id }
    }

    const ref = await db().collection(AI_COUNSEL_SESSIONS_COLLECTION).add({
      clientId: uid,
      type: 'ai',
      status: 'active',
      title,
      riskLevel: 'none',
      messageCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { sessionId: ref.id }
  }
)
