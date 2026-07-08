"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAssessmentReport = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const secrets_1 = require("../config/secrets");
const comprehensiveReport_1 = require("../gemini/comprehensiveReport");
const counselorAuth_1 = require("../utils/counselorAuth");
const aiUsage_1 = require("../utils/aiUsage");
const aiReports_1 = require("../utils/aiReports");
const session_1 = require("../utils/session");
exports.generateAssessmentReport = (0, https_1.onCall)({ region: 'asia-northeast3', secrets: [secrets_1.geminiApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    process.env.GEMINI_API_KEY = secrets_1.geminiApiKey.value().trim();
    const counselorUid = await (0, counselorAuth_1.requireCounselor)(request);
    const resultId = (_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.resultId) === null || _b === void 0 ? void 0 : _b.trim();
    const forceRegenerate = Boolean((_c = request.data) === null || _c === void 0 ? void 0 : _c.forceRegenerate);
    if (!resultId) {
        throw new https_1.HttpsError('invalid-argument', 'resultId가 필요합니다.');
    }
    const resultSnap = await (0, session_1.db)().collection('testResults').doc(resultId).get();
    if (!resultSnap.exists) {
        throw new https_1.HttpsError('not-found', '검사 결과를 찾을 수 없습니다.');
    }
    const resultData = resultSnap.data();
    if (!(await (0, counselorAuth_1.counselorOwnsTestResult)(counselorUid, resultData))) {
        throw new https_1.HttpsError('permission-denied', '이 검사 결과에 접근할 수 없습니다.');
    }
    if (!forceRegenerate) {
        const cached = await (0, aiReports_1.findCachedAiReport)(counselorUid, resultId, 'report_generate');
        if (cached) {
            return {
                reportId: cached.id,
                title: cached.title,
                summary: cached.content,
                sections: ((_d = cached.metadata) === null || _d === void 0 ? void 0 : _d.sections) || [],
                counselorNotes: ((_e = cached.metadata) === null || _e === void 0 ? void 0 : _e.counselorNotes) || '',
                recommendedTreatment: ((_f = cached.metadata) === null || _f === void 0 ? void 0 : _f.recommendedTreatment) || '',
                cached: true,
                creditsCharged: 0,
                modelId: cached.modelId || null,
            };
        }
    }
    const creditCost = forceRegenerate
        ? Math.max(1, Math.ceil(aiUsage_1.REPORT_GENERATE_CREDIT_COST / 2))
        : aiUsage_1.REPORT_GENERATE_CREDIT_COST;
    try {
        await (0, aiUsage_1.assertCounselorAiCredits)(counselorUid, creditCost);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.startsWith('insufficient_ai_credits')) {
            throw new https_1.HttpsError('resource-exhausted', 'AI 크레딧이 부족합니다.');
        }
        throw err;
    }
    const interpretCache = await (0, aiReports_1.findCachedAiReport)(counselorUid, resultId, 'assessment_interpret');
    const testType = String(resultData.testType || resultData.testId || '심리검사').trim();
    const clientLabel = String(resultData.clientEmail || resultData.email || resultData.uid || '내담자').trim() || '내담자';
    let generated;
    try {
        generated = await (0, comprehensiveReport_1.generateComprehensiveAssessmentReport)({
            testType,
            clientLabel,
            accessCode: resultData.accessCode || resultData.code,
            status: resultData.status,
            resultData: resultData.resultData,
            responses: resultData.responses,
            priorInterpretation: interpretCache === null || interpretCache === void 0 ? void 0 : interpretCache.content,
        });
    }
    catch (err) {
        logger.error('Comprehensive report failed', { err, counselorUid, resultId });
        throw new https_1.HttpsError('internal', '종합 리포트 생성에 실패했습니다.');
    }
    const title = `${testType} 종합 검사 리포트`;
    const reportId = await (0, aiReports_1.saveAiReport)({
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
    });
    try {
        await (0, aiUsage_1.recordAiUsage)({
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
        });
    }
    catch (usageErr) {
        logger.warn('AI ledger write failed after report', { usageErr });
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
    };
});
//# sourceMappingURL=generateAssessmentReport.js.map