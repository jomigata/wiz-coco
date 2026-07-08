"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCounselor = requireCounselor;
exports.counselorOwnsTestResult = counselorOwnsTestResult;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const session_1 = require("./session");
const COUNSELOR_ROLES = new Set(['counselor', 'admin']);
async function requireCounselor(request) {
    var _a;
    const uid = (0, session_1.requireAuth)(request);
    const userDoc = await (0, firestore_1.getFirestore)().collection('users').doc(uid).get();
    const role = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
    if (!role || !COUNSELOR_ROLES.has(role)) {
        throw new https_1.HttpsError('permission-denied', '상담사 또는 관리자만 실행할 수 있습니다.');
    }
    return uid;
}
async function counselorOwnsTestResult(counselorUid, resultData) {
    var _a;
    if (resultData.counselorId === counselorUid) {
        return true;
    }
    const assessmentId = String(resultData.assessmentId || '').trim();
    if (!assessmentId)
        return false;
    const ass = await (0, firestore_1.getFirestore)().collection('assessments').doc(assessmentId).get();
    if (!ass.exists)
        return false;
    return ((_a = ass.data()) === null || _a === void 0 ? void 0 : _a.counselorId) === counselorUid;
}
//# sourceMappingURL=counselorAuth.js.map