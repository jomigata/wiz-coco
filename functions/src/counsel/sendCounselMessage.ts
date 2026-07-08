import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { geminiApiKey } from '../config/secrets'
import {
  assertSessionOwner,
  db,
  FieldValue,
  loadRecentMessages,
  requireAuth,
  Timestamp,
  toGeminiHistory,
} from '../utils/session'
import { detectRisk } from '../safety/crisis'
import {
  classifyGeminiFailure,
  DEFAULT_COUNSEL_MODEL,
  generateCounselReply,
} from '../gemini/client'
import { CRISIS_SAFE_REPLY } from '../gemini/prompts'
import { formatFaqKnowledgeContext, searchCounselFaqs } from '../knowledge/search'
import { COUNSEL_MESSAGE_CREDIT_COST, recordAiUsage } from '../utils/aiUsage'

interface SendCounselMessageRequest {
  sessionId: string
  content: string
}

export const sendCounselMessage = onCall<SendCounselMessageRequest>(
  { region: 'asia-northeast3', secrets: [geminiApiKey] },
  async (request) => {
    process.env.GEMINI_API_KEY = geminiApiKey.value().trim()
    const uid = requireAuth(request)
    const sessionId = request.data?.sessionId
    const content = request.data?.content?.trim()

    if (!sessionId || !content) {
      throw new HttpsError('invalid-argument', 'sessionId와 content가 필요합니다.')
    }
    if (content.length > 2000) {
      throw new HttpsError('invalid-argument', '메시지는 2000자 이하여야 합니다.')
    }

    const { ref: sessionRef } = await assertSessionOwner(sessionId, uid)
    const now = Timestamp.now()
    const historyMessages = await loadRecentMessages(sessionId)

    const { riskLevel, keywords } = detectRisk(content)

    if (riskLevel === 'high') {
      await sessionRef.collection('messages').add({
        role: 'user',
        content,
        createdAt: now,
      })

      await db().collection('crisisEvents').add({
        sessionId,
        clientId: uid,
        triggerKeywords: keywords,
        riskLevel: 'high',
        actionTaken: 'human_handoff',
        createdAt: FieldValue.serverTimestamp(),
      })

      await sessionRef.update({
        status: 'escalated',
        riskLevel: 'high',
        updatedAt: FieldValue.serverTimestamp(),
      })

      const assistantRef = await sessionRef.collection('messages').add({
        role: 'assistant',
        content: CRISIS_SAFE_REPLY,
        createdAt: Timestamp.now(),
        flagged: true,
      })

      await sessionRef.update({
        messageCount: FieldValue.increment(2),
      })

      return {
        reply: CRISIS_SAFE_REPLY,
        riskLevel: 'high' as const,
        escalated: true,
        messageId: assistantRef.id,
      }
    }

    await sessionRef.collection('messages').add({
      role: 'user',
      content,
      createdAt: now,
    })

    let reply: string
    let modelUsed = DEFAULT_COUNSEL_MODEL
    let geminiUsage: Awaited<ReturnType<typeof generateCounselReply>>['usage']
    try {
      const history = toGeminiHistory(historyMessages)
      const matchedFaqs = await searchCounselFaqs(content)
      const knowledgeContext = formatFaqKnowledgeContext(matchedFaqs)
      const result = await generateCounselReply(history, content, { knowledgeContext })
      reply = result.text
      modelUsed = result.modelId
      geminiUsage = result.usage
    } catch (err) {
      const failure = classifyGeminiFailure(err)
      logger.error('Gemini counsel reply failed', {
        kind: failure.kind,
        message: failure.message,
        uid,
        sessionId,
      })

      if (failure.message.includes('GEMINI_API_KEY')) {
        throw new HttpsError(
          'failed-precondition',
          'AI 상담 서비스가 아직 설정되지 않았습니다. 관리자에게 문의하세요.'
        )
      }
      if (failure.kind === 'quota') {
        throw new HttpsError(
          'resource-exhausted',
          'AI 상담 API 사용 한도가 소진되었습니다. Google AI Studio에서 결제·크레딧을 충전한 뒤 다시 시도해 주세요.'
        )
      }
      if (failure.kind === 'auth') {
        throw new HttpsError(
          'failed-precondition',
          'Gemini API 키가 유효하지 않습니다. Secret 갱신 후 Functions를 재배포해 주세요.'
        )
      }
      if (failure.kind === 'model') {
        throw new HttpsError(
          'internal',
          'AI 모델 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
        )
      }
      throw new HttpsError('internal', 'AI 응답 생성에 실패했습니다.')
    }

    const assistantRef = await sessionRef.collection('messages').add({
      role: 'assistant',
      content: reply,
      model: modelUsed,
      createdAt: Timestamp.now(),
    })

    try {
      await recordAiUsage({
        clientId: uid,
        feature: 'counsel_message',
        reason: 'counsel_message',
        delta: -COUNSEL_MESSAGE_CREDIT_COST,
        sessionId,
        modelId: modelUsed,
        usage: geminiUsage,
        metadata: { channel: 'b2c_ai_counsel' },
      })
    } catch (usageErr) {
      logger.warn('AI usage ledger write failed', { usageErr, uid, sessionId })
    }

    await sessionRef.update({
      messageCount: FieldValue.increment(2),
      riskLevel,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return {
      reply,
      riskLevel,
      escalated: false,
      messageId: assistantRef.id,
    }
  }
)
