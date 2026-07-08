"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCachedInterpretReport = findCachedInterpretReport;
exports.saveInterpretReport = saveInterpretReport;
const firestore_1 = require("firebase-admin/firestore");
const types_1 = require("../types");
const session_1 = require("./session");
async function findCachedInterpretReport(counselorUid, resultId) {
    const snap = await (0, session_1.db)()
        .collection(types_1.AI_REPORTS_COLLECTION)
        .where('counselorUid', '==', counselorUid)
        .where('resultId', '==', resultId)
        .limit(1)
        .get();
    if (snap.empty)
        return null;
    const doc = snap.docs[0];
    return Object.assign({ id: doc.id }, doc.data());
}
async function saveInterpretReport(payload) {
    const ref = await (0, session_1.db)().collection(types_1.AI_REPORTS_COLLECTION).add(Object.assign(Object.assign({}, payload), { createdAt: firestore_1.FieldValue.serverTimestamp(), updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    return ref.id;
}
//# sourceMappingURL=aiReports.js.map