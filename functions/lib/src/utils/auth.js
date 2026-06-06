"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const session_1 = require("./session");
async function requireAdmin(request) {
    var _a;
    const uid = (0, session_1.requireAuth)(request);
    const userDoc = await (0, firestore_1.getFirestore)().collection('users').doc(uid).get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
        throw new https_1.HttpsError('permission-denied', '관리자만 실행할 수 있습니다.');
    }
    return uid;
}
//# sourceMappingURL=auth.js.map