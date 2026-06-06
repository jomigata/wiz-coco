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
exports.sendCounselMessage = void 0;
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
const secrets_1 = require("../config/secrets");
const session_1 = require("../utils/session");
const crisis_1 = require("../safety/crisis");
const client_1 = require("../gemini/client");
const prompts_1 = require("../gemini/prompts");
const search_1 = require("../knowledge/search");
exports.sendCounselMessage = (0, https_1.onCall)({ region: 'asia-northeast3', secrets: [secrets_1.geminiApiKey] }, async (request) => {
    var _a, _b, _c;
    process.env.GEMINI_API_KEY = secrets_1.geminiApiKey.value().trim();
    const uid = (0, session_1.requireAuth)(request);
    const sessionId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.sessionId;
    const content = (_c = (_b = request.data) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
    if (!sessionId || !content) {
        throw new https_1.HttpsError('invalid-argument', 'sessionId와 content가 필요합니다.');
    }
    if (content.length > 2000) {
        throw new https_1.HttpsError('invalid-argument', '메시지는 2000자 이하여야 합니다.');
    }
    const { ref: sessionRef } = await (0, session_1.assertSessionOwner)(sessionId, uid);
    const now = session_1.Timestamp.now();
    const historyMessages = await (0, session_1.loadRecentMessages)(sessionId);
    const { riskLevel, keywords } = (0, crisis_1.detectRisk)(content);
    if (riskLevel === 'high') {
        await sessionRef.collection('messages').add({
            role: 'user',
            content,
            createdAt: now,
        });
        await (0, session_1.db)().collection('crisisEvents').add({
            sessionId,
            clientId: uid,
            triggerKeywords: keywords,
            riskLevel: 'high',
            actionTaken: 'human_handoff',
            createdAt: session_1.FieldValue.serverTimestamp(),
        });
        await sessionRef.update({
            status: 'escalated',
            riskLevel: 'high',
            updatedAt: session_1.FieldValue.serverTimestamp(),
        });
        const assistantRef = await sessionRef.collection('messages').add({
            role: 'assistant',
            content: prompts_1.CRISIS_SAFE_REPLY,
            createdAt: session_1.Timestamp.now(),
            flagged: true,
        });
        await sessionRef.update({
            messageCount: session_1.FieldValue.increment(2),
        });
        return {
            reply: prompts_1.CRISIS_SAFE_REPLY,
            riskLevel: 'high',
            escalated: true,
            messageId: assistantRef.id,
        };
    }
    await sessionRef.collection('messages').add({
        role: 'user',
        content,
        createdAt: now,
    });
    let reply;
    let modelUsed = client_1.DEFAULT_COUNSEL_MODEL;
    try {
        const history = (0, session_1.toGeminiHistory)(historyMessages);
        const matchedFaqs = await (0, search_1.searchCounselFaqs)(content);
        const knowledgeContext = (0, search_1.formatFaqKnowledgeContext)(matchedFaqs);
        const result = await (0, client_1.generateCounselReply)(history, content, { knowledgeContext });
        reply = result.text;
        modelUsed = result.modelId;
    }
    catch (err) {
        const failure = (0, client_1.classifyGeminiFailure)(err);
        logger.error('Gemini counsel reply failed', {
            kind: failure.kind,
            message: failure.message,
            uid,
            sessionId,
        });
        if (failure.message.includes('GEMINI_API_KEY')) {
            throw new https_1.HttpsError('failed-precondition', 'AI 상담 서비스가 아직 설정되지 않았습니다. 관리자에게 문의하세요.');
        }
        if (failure.kind === 'quota') {
            throw new https_1.HttpsError('resource-exhausted', 'AI 상담 API 사용 한도가 소진되었습니다. Google AI Studio에서 결제·크레딧을 충전한 뒤 다시 시도해 주세요.');
        }
        if (failure.kind === 'auth') {
            throw new https_1.HttpsError('failed-precondition', 'Gemini API 키가 유효하지 않습니다. Secret 갱신 후 Functions를 재배포해 주세요.');
        }
        if (failure.kind === 'model') {
            throw new https_1.HttpsError('internal', 'AI 모델 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
        throw new https_1.HttpsError('internal', 'AI 응답 생성에 실패했습니다.');
    }
    const assistantRef = await sessionRef.collection('messages').add({
        role: 'assistant',
        content: reply,
        model: modelUsed,
        createdAt: session_1.Timestamp.now(),
    });
    await sessionRef.update({
        messageCount: session_1.FieldValue.increment(2),
        riskLevel,
        updatedAt: session_1.FieldValue.serverTimestamp(),
    });
    return {
        reply,
        riskLevel,
        escalated: false,
        messageId: assistantRef.id,
    };
});
//# sourceMappingURL=sendCounselMessage.js.map