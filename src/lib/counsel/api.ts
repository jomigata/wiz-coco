import { httpsCallable } from 'firebase/functions'
import { initializeFirebase } from '@/lib/firebase'
import type {
  EndAiSessionRequest,
  EndAiSessionResponse,
  SendCounselMessageRequest,
  SendCounselMessageResponse,
  StartAiSessionRequest,
  StartAiSessionResponse,
} from '@/types/aiCounsel'

function getFunctionsInstance() {
  const { functions } = initializeFirebase()
  if (!functions) {
    throw new Error('Firebase Functions가 초기화되지 않았습니다.')
  }
  return functions
}

export async function startAiSession(title?: string) {
  const fn = httpsCallable<StartAiSessionRequest, StartAiSessionResponse>(
    getFunctionsInstance(),
    'startAiSession'
  )
  const { data } = await fn({ title })
  return data
}

export async function sendCounselMessage(sessionId: string, content: string) {
  const fn = httpsCallable<SendCounselMessageRequest, SendCounselMessageResponse>(
    getFunctionsInstance(),
    'sendCounselMessage'
  )
  const { data } = await fn({ sessionId, content })
  return data
}

export async function endAiSession(sessionId: string) {
  const fn = httpsCallable<EndAiSessionRequest, EndAiSessionResponse>(
    getFunctionsInstance(),
    'endAiSession'
  )
  const { data } = await fn({ sessionId })
  return data
}
