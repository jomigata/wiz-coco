"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_RECOMMENDATION_CREDIT_COST = exports.ASSESSMENT_INTERPRET_CREDIT_COST = exports.COUNSEL_MESSAGE_CREDIT_COST = void 0;
exports.recordAiUsage = recordAiUsage;
exports.assertCounselorAiCredits = assertCounselorAiCredits;
const firestore_1 = require("firebase-admin/firestore");
const types_1 = require("../types");
const session_1 = require("./session");
const AI_CREDITS_ENFORCE = process.env.AI_CREDITS_ENFORCE === 'true';
/** counsel_message 1회당 차감 AI 크레딧 (T-3-04 단가표와 동기화 예정) */
exports.COUNSEL_MESSAGE_CREDIT_COST = 0;
/** 검사 결과 AI 해석 1건 (T-3-05) */
exports.ASSESSMENT_INTERPRET_CREDIT_COST = 4;
/** 맞춤 검사 추천 1건 (T-3-06) */
exports.TEST_RECOMMENDATION_CREDIT_COST = 1;
async function getAiBalance(counselorUid) {
    var _a;
    const snap = await (0, session_1.db)().collection(types_1.COUNSELOR_AI_CREDITS_COLLECTION).doc(counselorUid).get();
    if (!snap.exists)
        return 0;
    const balance = (_a = snap.data()) === null || _a === void 0 ? void 0 : _a.balance;
    return typeof balance === 'number' ? Math.max(0, balance) : 0;
}
async function applyAiCreditDelta(counselorUid, delta) {
    var _a;
    const ref = (0, session_1.db)().collection(types_1.COUNSELOR_AI_CREDITS_COLLECTION).doc(counselorUid);
    const snap = await ref.get();
    const current = snap.exists ? Math.max(0, Number((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.balance) || 0) : 0;
    const next = Math.max(0, current + delta);
    await ref.set({
        counselorUid,
        balance: next,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    return next;
}
/**
 * Gemini 호출 후 토큰·크레딧 원장 기록.
 * counselorUid가 있고 delta < 0 이면 잔액 차감 (AI_CREDITS_ENFORCE 시 부족하면 예외).
 */
async function recordAiUsage(input) {
    var _a, _b;
    const delta = (_a = input.delta) !== null && _a !== void 0 ? _a : 0;
    const counselorUid = (_b = input.counselorUid) === null || _b === void 0 ? void 0 : _b.trim();
    if (counselorUid && delta < 0) {
        const required = Math.abs(delta);
        const balance = await getAiBalance(counselorUid);
        if (balance < required) {
            if (AI_CREDITS_ENFORCE) {
                throw new Error(`insufficient_ai_credits:${balance}:${required}`);
            }
            return;
        }
    }
    let balanceAfter = 0;
    if (counselorUid && delta !== 0) {
        balanceAfter = await applyAiCreditDelta(counselorUid, delta);
    }
    else if (counselorUid) {
        balanceAfter = await getAiBalance(counselorUid);
    }
    const entry = {
        feature: input.feature,
        reason: input.reason,
        delta,
        balanceAfter,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    };
    if (counselorUid)
        entry.counselorUid = counselorUid;
    if (input.clientId)
        entry.clientId = input.clientId;
    if (input.sessionId)
        entry.sessionId = input.sessionId;
    if (input.portalId)
        entry.portalId = input.portalId;
    if (input.resultId)
        entry.resultId = input.resultId;
    if (input.reportId)
        entry.reportId = input.reportId;
    if (input.modelId)
        entry.modelId = input.modelId;
    if (input.actorUid)
        entry.actorUid = input.actorUid;
    if (input.metadata)
        entry.metadata = input.metadata;
    const usage = input.usage;
    if ((usage === null || usage === void 0 ? void 0 : usage.tokensPrompt) != null)
        entry.tokensPrompt = usage.tokensPrompt;
    if ((usage === null || usage === void 0 ? void 0 : usage.tokensCompletion) != null)
        entry.tokensCompletion = usage.tokensCompletion;
    if ((usage === null || usage === void 0 ? void 0 : usage.tokensTotal) != null)
        entry.tokensTotal = usage.tokensTotal;
    await (0, session_1.db)().collection(types_1.AI_USAGE_LEDGER_COLLECTION).add(entry);
}
async function assertCounselorAiCredits(counselorUid, required) {
    if (required <= 0)
        return;
    const balance = await getAiBalance(counselorUid);
    if (balance < required && AI_CREDITS_ENFORCE) {
        throw new Error(`insufficient_ai_credits:${balance}:${required}`);
    }
}
//# sourceMappingURL=aiUsage.js.map