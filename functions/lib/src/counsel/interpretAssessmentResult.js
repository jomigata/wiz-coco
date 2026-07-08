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
exports.interpretAssessmentResult = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const secrets_1 = require("../config/secrets");
const assessmentInterpret_1 = require("../gemini/assessmentInterpret");
const counselorAuth_1 = require("../utils/counselorAuth");
const aiUsage_1 = require("../utils/aiUsage");
const aiReports_1 = require("../utils/aiReports");
const session_1 = require("../utils/session");
exports.interpretAssessmentResult = (0, https_1.onCall)({ region: 'asia-northeast3', secrets: [secrets_1.geminiApiKey] }, async (request) => {
    var _a, _b, _c;
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
    const owns = await (0, counselorAuth_1.counselorOwnsTestResult)(counselorUid, resultData);
    if (!owns) {
        throw new https_1.HttpsError('permission-denied', '이 검사 결과에 접근할 수 없습니다.');
    }
    if (!forceRegenerate) {
        const cached = await (0, aiReports_1.findCachedInterpretReport)(counselorUid, resultId);
        if (cached) {
            return {
                reportId: cached.id,
                content: cached.content,
                title: cached.title,
                cached: true,
                creditsCharged: 0,
                modelId: cached.modelId || null,
            };
        }
    }
    const creditCost = forceRegenerate
        ? Math.max(1, Math.ceil(aiUsage_1.ASSESSMENT_INTERPRET_CREDIT_COST / 2))
        : aiUsage_1.ASSESSMENT_INTERPRET_CREDIT_COST;
    try {
        await (0, aiUsage_1.assertCounselorAiCredits)(counselorUid, creditCost);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.startsWith('insufficient_ai_credits')) {
            throw new https_1.HttpsError('resource-exhausted', 'AI 크레딧이 부족합니다. 협회 지급 또는 /counselor/credits AI 탭에서 확인해 주세요.');
        }
        throw err;
    }
    const testType = String(resultData.testType || resultData.testId || '심리검사').trim() || '심리검사';
    const clientLabel = String(resultData.clientEmail || resultData.email || resultData.uid || '내담자').trim() ||
        '내담자';
    let interpretation;
    try {
        interpretation = await (0, assessmentInterpret_1.generateAssessmentInterpretation)({
            testType,
            testId: resultData.testId,
            clientLabel,
            resultData: resultData.resultData,
            responses: resultData.responses,
            status: resultData.status,
        });
    }
    catch (err) {
        logger.error('Assessment AI interpret failed', { err, counselorUid, resultId });
        throw new https_1.HttpsError('internal', 'AI 해석 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
    const title = `${testType} AI 해석 리포트`;
    const reportId = await (0, aiReports_1.saveInterpretReport)({
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
    });
    try {
        await (0, aiUsage_1.recordAiUsage)({
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
        });
    }
    catch (usageErr) {
        logger.warn('AI usage ledger write failed after interpret', { usageErr, counselorUid, resultId });
    }
    return {
        reportId,
        content: interpretation.text,
        title,
        cached: false,
        creditsCharged: creditCost,
        modelId: interpretation.modelId,
    };
});
//# sourceMappingURL=interpretAssessmentResult.js.map