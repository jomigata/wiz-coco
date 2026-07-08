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
exports.recommendTestsFromResult = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const secrets_1 = require("../config/secrets");
const testRecommendation_1 = require("../gemini/testRecommendation");
const counselorAuth_1 = require("../utils/counselorAuth");
const aiUsage_1 = require("../utils/aiUsage");
const aiReports_1 = require("../utils/aiReports");
const session_1 = require("../utils/session");
exports.recommendTestsFromResult = (0, https_1.onCall)({ region: 'asia-northeast3', secrets: [secrets_1.geminiApiKey] }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    process.env.GEMINI_API_KEY = secrets_1.geminiApiKey.value().trim();
    const counselorUid = await (0, counselorAuth_1.requireCounselor)(request);
    const resultId = (_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.resultId) === null || _b === void 0 ? void 0 : _b.trim();
    const availableTests = (_c = request.data) === null || _c === void 0 ? void 0 : _c.availableTests;
    const forceRegenerate = Boolean((_d = request.data) === null || _d === void 0 ? void 0 : _d.forceRegenerate);
    if (!resultId) {
        throw new https_1.HttpsError('invalid-argument', 'resultId가 필요합니다.');
    }
    if (!Array.isArray(availableTests) || availableTests.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'availableTests 배열이 필요합니다.');
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
        const cached = await (0, aiReports_1.findCachedAiReport)(counselorUid, resultId, 'test_recommendation');
        if ((_f = (_e = cached === null || cached === void 0 ? void 0 : cached.metadata) === null || _e === void 0 ? void 0 : _e.recommendations) === null || _f === void 0 ? void 0 : _f.length) {
            return {
                reportId: cached.id,
                summary: cached.metadata.summary || cached.content,
                recommendations: cached.metadata.recommendations,
                portalId: cached.portalId || resultData.portalId || null,
                cached: true,
                creditsCharged: 0,
                modelId: cached.modelId || null,
            };
        }
    }
    try {
        await (0, aiUsage_1.assertCounselorAiCredits)(counselorUid, aiUsage_1.TEST_RECOMMENDATION_CREDIT_COST);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.startsWith('insufficient_ai_credits')) {
            throw new https_1.HttpsError('resource-exhausted', 'AI 크레딧이 부족합니다. /counselor/credits AI 탭에서 확인해 주세요.');
        }
        throw err;
    }
    const testType = String(resultData.testType || resultData.testId || '심리검사').trim() || '심리검사';
    const clientLabel = String(resultData.clientEmail || resultData.email || resultData.uid || '내담자').trim() ||
        '내담자';
    let generated;
    try {
        generated = await (0, testRecommendation_1.generateTestRecommendations)({
            testType,
            clientLabel,
            resultData: resultData.resultData,
            responses: resultData.responses,
            availableTests,
        });
    }
    catch (err) {
        logger.error('Test recommendation failed', { err, counselorUid, resultId });
        throw new https_1.HttpsError('internal', 'AI 검사 추천 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
    const title = `${testType} 맞춤 검사 추천`;
    const reportId = await (0, aiReports_1.saveAiReport)({
        counselorUid,
        resultId,
        portalId: resultData.portalId,
        feature: 'test_recommendation',
        title,
        content: generated.summary,
        modelId: generated.modelId,
        creditsCharged: aiUsage_1.TEST_RECOMMENDATION_CREDIT_COST,
        testType,
        clientLabel,
        metadata: {
            summary: generated.summary,
            recommendations: generated.recommendations,
        },
    });
    try {
        await (0, aiUsage_1.recordAiUsage)({
            counselorUid,
            feature: 'test_recommendation',
            reason: 'test_recommendation',
            delta: -aiUsage_1.TEST_RECOMMENDATION_CREDIT_COST,
            resultId,
            reportId,
            portalId: resultData.portalId,
            modelId: generated.modelId,
            usage: generated.usage,
            actorUid: counselorUid,
            metadata: { recommendationCount: generated.recommendations.length },
        });
    }
    catch (usageErr) {
        logger.warn('AI usage ledger write failed after recommendation', {
            usageErr,
            counselorUid,
            resultId,
        });
    }
    return {
        reportId,
        summary: generated.summary,
        recommendations: generated.recommendations,
        portalId: resultData.portalId || null,
        cached: false,
        creditsCharged: aiUsage_1.TEST_RECOMMENDATION_CREDIT_COST,
        modelId: generated.modelId,
    };
});
//# sourceMappingURL=recommendTestsFromResult.js.map