import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { geminiApiKey } from '../config/secrets'
import {
  assertSessionClient,
  FieldValue,
  loadRecentMessages,
  requireAuth,
} from '../utils/session'
import { generateSessionSummary } from '../gemini/client'

interface EndAiSessionRequest {
  sessionId: string
}

export const endAiSession = onCall<EndAiSessionRequest>(
  { region: 'asia-northeast3', secrets: [geminiApiKey] },
  async (request) => {
    process.env.GEMINI_API_KEY = geminiApiKey.value().trim()
    const uid = requireAuth(request)
    const sessionId = request.data?.sessionId
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'sessionId가 필요합니다.')
    }

    const { ref: sessionRef } = await assertSessionClient(sessionId, uid)
    const messages = await loadRecentMessages(sessionId, 50)
    const transcript = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')

    let summary = '상담이 종료되었습니다. 오늘 나눈 이야기를 소중히 돌아보세요.'
    try {
      if (transcript.trim()) {
        summary = await generateSessionSummary(transcript)
      }
    } catch {
      // 요약 실패 시 기본 문구 유지
    }

    await sessionRef.update({
      status: 'ended',
      summary,
      endedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return { summary }
  }
)
