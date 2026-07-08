import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { geminiApiKey } from '../config/secrets'
import { generateTestRecommendations } from '../gemini/testRecommendation'
import { counselorOwnsTestResult, requireCounselor } from '../utils/counselorAuth'
import {
  assertCounselorAiCredits,
  recordAiUsage,
  TEST_RECOMMENDATION_CREDIT_COST,
} from '../utils/aiUsage'
import { findCachedAiReport, saveAiReport } from '../utils/aiReports'
import { db } from '../utils/session'

interface RecommendTestsFromResultRequest {
  resultId: string
  availableTests: { testId: string; name: string }[]
  forceRegenerate?: boolean
}

export const recommendTestsFromResult = onCall<RecommendTestsFromResultRequest>(
  { region: 'asia-northeast3', secrets: [geminiApiKey] },
  async (request) => {
    process.env.GEMINI_API_KEY = geminiApiKey.value().trim()
    const counselorUid = await requireCounselor(request)
    const resultId = request.data?.resultId?.trim()
    const availableTests = request.data?.availableTests
    const forceRegenerate = Boolean(request.data?.forceRegenerate)

    if (!resultId) {
      throw new HttpsError('invalid-argument', 'resultId가 필요합니다.')
    }
    if (!Array.isArray(availableTests) || availableTests.length === 0) {
      throw new HttpsError('invalid-argument', 'availableTests 배열이 필요합니다.')
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
      const cached = await findCachedAiReport(counselorUid, resultId, 'test_recommendation')
      if (cached?.metadata?.recommendations?.length) {
        return {
          reportId: cached.id,
          summary: cached.metadata.summary || cached.content,
          recommendations: cached.metadata.recommendations,
          portalId: cached.portalId || resultData.portalId || null,
          cached: true,
          creditsCharged: 0,
          modelId: cached.modelId || null,
        }
      }
    }

    try {
      await assertCounselorAiCredits(counselorUid, TEST_RECOMMENDATION_CREDIT_COST)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.startsWith('insufficient_ai_credits')) {
        throw new HttpsError(
          'resource-exhausted',
          'AI 크레딧이 부족합니다. /counselor/credits AI 탭에서 확인해 주세요.'
        )
      }
      throw err
    }

    const testType =
      String(resultData.testType || resultData.testId || '심리검사').trim() || '심리검사'
    const clientLabel =
      String(resultData.clientEmail || resultData.email || resultData.uid || '내담자').trim() ||
      '내담자'

    let generated
    try {
      generated = await generateTestRecommendations({
        testType,
        clientLabel,
        resultData: resultData.resultData,
        responses: resultData.responses,
        availableTests,
      })
    } catch (err) {
      logger.error('Test recommendation failed', { err, counselorUid, resultId })
      throw new HttpsError('internal', 'AI 검사 추천 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }

    const title = `${testType} 맞춤 검사 추천`
    const reportId = await saveAiReport({
      counselorUid,
      resultId,
      portalId: resultData.portalId,
      feature: 'test_recommendation',
      title,
      content: generated.summary,
      modelId: generated.modelId,
      creditsCharged: TEST_RECOMMENDATION_CREDIT_COST,
      testType,
      clientLabel,
      metadata: {
        summary: generated.summary,
        recommendations: generated.recommendations,
      },
    })

    try {
      await recordAiUsage({
        counselorUid,
        feature: 'test_recommendation',
        reason: 'test_recommendation',
        delta: -TEST_RECOMMENDATION_CREDIT_COST,
        resultId,
        reportId,
        portalId: resultData.portalId,
        modelId: generated.modelId,
        usage: generated.usage,
        actorUid: counselorUid,
        metadata: { recommendationCount: generated.recommendations.length },
      })
    } catch (usageErr) {
      logger.warn('AI usage ledger write failed after recommendation', {
        usageErr,
        counselorUid,
        resultId,
      })
    }

    return {
      reportId,
      summary: generated.summary,
      recommendations: generated.recommendations,
      portalId: resultData.portalId || null,
      cached: false,
      creditsCharged: TEST_RECOMMENDATION_CREDIT_COST,
      modelId: generated.modelId,
    }
  }
)
