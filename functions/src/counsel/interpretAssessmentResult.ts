import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { geminiApiKey } from '../config/secrets'
import { generateAssessmentInterpretation } from '../gemini/assessmentInterpret'
import { counselorOwnsTestResult, requireCounselor } from '../utils/counselorAuth'
import {
  assertCounselorAiCredits,
  ASSESSMENT_INTERPRET_CREDIT_COST,
  recordAiUsage,
} from '../utils/aiUsage'
import { findCachedInterpretReport, saveInterpretReport } from '../utils/aiReports'
import { db } from '../utils/session'

interface InterpretAssessmentResultRequest {
  resultId: string
  forceRegenerate?: boolean
}

export const interpretAssessmentResult = onCall<InterpretAssessmentResultRequest>(
  { region: 'asia-northeast3', secrets: [geminiApiKey] },
  async (request) => {
    process.env.GEMINI_API_KEY = geminiApiKey.value().trim()
    const counselorUid = await requireCounselor(request)
    const resultId = request.data?.resultId?.trim()
    const forceRegenerate = Boolean(request.data?.forceRegenerate)

    if (!resultId) {
      throw new HttpsError('invalid-argument', 'resultId가 필요합니다.')
    }

    const resultSnap = await db().collection('testResults').doc(resultId).get()
    if (!resultSnap.exists) {
      throw new HttpsError('not-found', '검사 결과를 찾을 수 없습니다.')
    }
    const resultData = resultSnap.data()!

    const owns = await counselorOwnsTestResult(counselorUid, resultData)
    if (!owns) {
      throw new HttpsError('permission-denied', '이 검사 결과에 접근할 수 없습니다.')
    }

    if (!forceRegenerate) {
      const cached = await findCachedInterpretReport(counselorUid, resultId)
      if (cached) {
        return {
          reportId: cached.id,
          content: cached.content,
          title: cached.title,
          cached: true,
          creditsCharged: 0,
          modelId: cached.modelId || null,
        }
      }
    }

    const creditCost = forceRegenerate
      ? Math.max(1, Math.ceil(ASSESSMENT_INTERPRET_CREDIT_COST / 2))
      : ASSESSMENT_INTERPRET_CREDIT_COST

    try {
      await assertCounselorAiCredits(counselorUid, creditCost)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.startsWith('insufficient_ai_credits')) {
        throw new HttpsError(
          'resource-exhausted',
          'AI 크레딧이 부족합니다. 협회 지급 또는 /counselor/credits AI 탭에서 확인해 주세요.'
        )
      }
      throw err
    }

    const testType =
      String(resultData.testType || resultData.testId || '심리검사').trim() || '심리검사'
    const clientLabel =
      String(resultData.clientEmail || resultData.email || resultData.uid || '내담자').trim() ||
      '내담자'

    let interpretation
    try {
      interpretation = await generateAssessmentInterpretation({
        testType,
        testId: resultData.testId,
        clientLabel,
        resultData: resultData.resultData,
        responses: resultData.responses,
        status: resultData.status,
      })
    } catch (err) {
      logger.error('Assessment AI interpret failed', { err, counselorUid, resultId })
      throw new HttpsError('internal', 'AI 해석 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }

    const title = `${testType} AI 해석 리포트`
    const reportId = await saveInterpretReport({
      counselorUid,
      resultId,
      portalId: resultData.portalId,
      feature: 'assessment_interpret',
      title,
      content: interpretation.text,
      modelId: interpretation.modelId,
      creditsCharged: creditCost,
      testType,
      clientLabel,
    })

    try {
      await recordAiUsage({
        counselorUid,
        feature: 'assessment_interpret',
        reason: 'assessment_interpret',
        delta: -creditCost,
        resultId,
        reportId,
        portalId: resultData.portalId,
        modelId: interpretation.modelId,
        usage: interpretation.usage,
        actorUid: counselorUid,
        metadata: { forceRegenerate, testType },
      })
    } catch (usageErr) {
      logger.warn('AI usage ledger write failed after interpret', { usageErr, counselorUid, resultId })
    }

    return {
      reportId,
      content: interpretation.text,
      title,
      cached: false,
      creditsCharged: creditCost,
      modelId: interpretation.modelId,
    }
  }
)
