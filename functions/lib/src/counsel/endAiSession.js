"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endAiSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const secrets_1 = require("../config/secrets");
const session_1 = require("../utils/session");
const client_1 = require("../gemini/client");
exports.endAiSession = (0, https_1.onCall)({ region: 'asia-northeast3', secrets: [secrets_1.geminiApiKey] }, async (request) => {
    var _a;
    process.env.GEMINI_API_KEY = secrets_1.geminiApiKey.value().trim();
    const uid = (0, session_1.requireAuth)(request);
    const sessionId = (_a = request.data) === null || _a === void 0 ? void 0 : _a.sessionId;
    if (!sessionId) {
        throw new https_1.HttpsError('invalid-argument', 'sessionId가 필요합니다.');
    }
    const { ref: sessionRef } = await (0, session_1.assertSessionClient)(sessionId, uid);
    const messages = await (0, session_1.loadRecentMessages)(sessionId, 50);
    const transcript = messages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');
    let summary = '상담이 종료되었습니다. 오늘 나눈 이야기를 소중히 돌아보세요.';
    try {
        if (transcript.trim()) {
            summary = await (0, client_1.generateSessionSummary)(transcript);
        }
    }
    catch (_b) {
        // 요약 실패 시 기본 문구 유지
    }
    await sessionRef.update({
        status: 'ended',
        summary,
        endedAt: session_1.FieldValue.serverTimestamp(),
        updatedAt: session_1.FieldValue.serverTimestamp(),
    });
    return { summary };
});
//# sourceMappingURL=endAiSession.js.map