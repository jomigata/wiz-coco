import { onCall, HttpsError } from 'firebase-functions/v2/https'
import * as logger from 'firebase-functions/logger'
import { geminiApiKey } from '../config/secrets'
import { generateComprehensiveAssessmentReport } from '../gemini/comprehensiveReport'
import { counselorOwnsTestResult, requireCounselor } from '../utils/counselorAuth'
import {
  assertCounselorAiCredits,
  recordAiUsage,
  REPORT_GENERATE_CREDIT_COST,
} from '../utils/aiUsage'
import { findCachedAiReport, saveAiReport } from '../utils/aiReports'
import { db } from '../utils/session'

interface GenerateAssessmentReportRequest {
  resultId: string
  forceRegenerate?: boolean
}

export const generateAssessmentReport = onCall<GenerateAssessmentReportRequest>(
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

    if (!(await counselorOwnsTestResult(counselorUid, resultData))) {
      throw new HttpsError('permission-denied', '이 검사 결과에 접근할 수 없습니다.')
    }

    if (!forceRegenerate) {
      const cached = await findCachedAiReport(counselorUid, resultId, 'report_generate')
      if (cached) {
        return {
          reportId: cached.id,
          title: cached.title,
          summary: cached.content,
          sections: cached.metadata?.sections || [],
          counselorNotes: cached.metadata?.counselorNotes || '',
          recommendedTreatment: cached.metadata?.recommendedTreatment || '',
          cached: true,
          creditsCharged: 0,
          modelId: cached.modelId || null,
        }
      }
    }

    const creditCost = forceRegenerate
      ? Math.max(1, Math.ceil(REPORT_GENERATE_CREDIT_COST / 2))
      : REPORT_GENERATE_CREDIT_COST

    try {
      await assertCounselorAiCredits(counselorUid, creditCost)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.startsWith('insufficient_ai_credits')) {
        throw new HttpsError('resource-exhausted', 'AI 크레딧이 부족합니다.')
      }
      throw err
    }

    const interpretCache = await findCachedAiReport(counselorUid, resultId, 'assessment_interpret')
    const testType = String(resultData.testType || resultData.testId || '심리검사').trim()
    const clientLabel =
      String(resultData.clientEmail || resultData.email || resultData.uid || '내담자').trim() || '내담자'

    let generated
    try {
      generated = await generateComprehensiveAssessmentReport({
        testType,
        clientLabel,
        accessCode: resultData.accessCode || resultData.code,
        status: resultData.status,
        resultData: resultData.resultData,
        responses: resultData.responses,
        priorInterpretation: interpretCache?.content,
      })
    } catch (err) {
      logger.error('Comprehensive report failed', { err, counselorUid, resultId })
      throw new HttpsError('internal', '종합 리포트 생성에 실패했습니다.')
    }

    const title = `${testType} 종합 검사 리포트`
    const reportId = await saveAiReport({
      counselorUid,
      resultId,
      portalId: resultData.portalId,
      feature: 'report_generate',
      title,
      content: generated.summary,
      modelId: generated.modelId,
      creditsCharged: creditCost,
      testType,
      clientLabel,
      metadata: {
        sections: generated.sections,
        accessCode: resultData.accessCode || resultData.code,
        status: resultData.status || 'completed',
        counselorNotes: '',
        recommendedTreatment: '',
      },
    })

    try {
      await recordAiUsage({
        counselorUid,
        feature: 'report_generate',
        reason: 'report_generate',
        delta: -creditCost,
        resultId,
        reportId,
        portalId: resultData.portalId,
        modelId: generated.modelId,
        usage: generated.usage,
        actorUid: counselorUid,
      })
    } catch (usageErr) {
      logger.warn('AI ledger write failed after report', { usageErr })
    }

    return {
      reportId,
      title,
      summary: generated.summary,
      sections: generated.sections,
      counselorNotes: '',
      recommendedTreatment: '',
      cached: false,
      creditsCharged: creditCost,
      modelId: generated.modelId,
    }
  }
)
