"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Timestamp = exports.FieldValue = exports.db = void 0;
exports.requireAuth = requireAuth;
exports.assertSessionOwner = assertSessionOwner;
exports.assertSessionClient = assertSessionClient;
exports.loadRecentMessages = loadRecentMessages;
exports.toGeminiHistory = toGeminiHistory;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
Object.defineProperty(exports, "FieldValue", { enumerable: true, get: function () { return firestore_1.FieldValue; } });
Object.defineProperty(exports, "Timestamp", { enumerable: true, get: function () { return firestore_1.Timestamp; } });
const types_1 = require("../types");
const db = () => (0, firestore_1.getFirestore)();
exports.db = db;
function requireAuth(request) {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    return request.auth.uid;
}
async function assertSessionOwner(sessionId, uid) {
    const snap = await db().collection(types_1.AI_COUNSEL_SESSIONS_COLLECTION).doc(sessionId).get();
    if (!snap.exists) {
        throw new https_1.HttpsError('not-found', '상담 세션을 찾을 수 없습니다.');
    }
    const data = snap.data();
    if (data.clientId !== uid) {
        throw new https_1.HttpsError('permission-denied', '이 세션에 접근할 수 없습니다.');
    }
    if (data.status !== 'active') {
        throw new https_1.HttpsError('failed-precondition', '종료되었거나 에스컬레이션된 세션입니다.');
    }
    return { ref: snap.ref, data };
}
async function assertSessionClient(sessionId, uid) {
    const snap = await db().collection(types_1.AI_COUNSEL_SESSIONS_COLLECTION).doc(sessionId).get();
    if (!snap.exists) {
        throw new https_1.HttpsError('not-found', '상담 세션을 찾을 수 없습니다.');
    }
    const data = snap.data();
    if (data.clientId !== uid) {
        throw new https_1.HttpsError('permission-denied', '이 세션에 접근할 수 없습니다.');
    }
    return { ref: snap.ref, data };
}
async function loadRecentMessages(sessionId, limit = 20) {
    const snap = await db()
        .collection(types_1.AI_COUNSEL_SESSIONS_COLLECTION)
        .doc(sessionId)
        .collection('messages')
        .orderBy('createdAt', 'asc')
        .limitToLast(limit)
        .get();
    return snap.docs.map((d) => d.data());
}
function toGeminiHistory(messages) {
    const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(m.content) }],
    }));
    while (history.length > 0 && history[history.length - 1].role === 'user') {
        history.pop();
    }
    return history;
}
//# sourceMappingURL=session.js.map