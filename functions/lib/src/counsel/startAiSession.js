"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAiSession = void 0;
const https_1 = require("firebase-functions/v2/https");
const session_1 = require("../utils/session");
const types_1 = require("../types");
exports.startAiSession = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (request) => {
    var _a, _b;
    const uid = (0, session_1.requireAuth)(request);
    const title = ((_b = (_a = request.data) === null || _a === void 0 ? void 0 : _a.title) === null || _b === void 0 ? void 0 : _b.trim()) || 'AI 상담';
    const active = await (0, session_1.db)()
        .collection(types_1.AI_COUNSEL_SESSIONS_COLLECTION)
        .where('clientId', '==', uid)
        .where('type', '==', 'ai')
        .where('status', '==', 'active')
        .limit(1)
        .get();
    if (!active.empty) {
        return { sessionId: active.docs[0].id };
    }
    const ref = await (0, session_1.db)().collection(types_1.AI_COUNSEL_SESSIONS_COLLECTION).add({
        clientId: uid,
        type: 'ai',
        status: 'active',
        title,
        riskLevel: 'none',
        messageCount: 0,
        createdAt: session_1.FieldValue.serverTimestamp(),
        updatedAt: session_1.FieldValue.serverTimestamp(),
    });
    return { sessionId: ref.id };
});
//# sourceMappingURL=startAiSession.js.map