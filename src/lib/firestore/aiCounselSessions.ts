import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { initializeFirebase } from '@/lib/firebase'
import {
  AI_COUNSEL_SESSIONS_COLLECTION,
  type AiCounselMessageDoc,
} from '@/types/aiCounsel'

export function subscribeAiCounselMessages(
  sessionId: string,
  onMessages: (messages: (AiCounselMessageDoc & { id: string })[]) => void,
  onError?: (error: Error) => void
) {
  const { db } = initializeFirebase()
  const q = query(
    collection(db, AI_COUNSEL_SESSIONS_COLLECTION, sessionId, 'messages'),
    orderBy('createdAt', 'asc')
  )

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as AiCounselMessageDoc),
      }))
      onMessages(messages)
    },
    (err) => onError?.(err)
  )
}
