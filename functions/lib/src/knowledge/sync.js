"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCounselFaqFromSheetInternal = syncCounselFaqFromSheetInternal;
const firestore_1 = require("firebase-admin/firestore");
const sheetCsv_1 = require("./sheetCsv");
const FAQ_COLLECTION = 'counselFaqs';
const META_DOC = 'counselFaqMeta/sync';
const db = () => (0, firestore_1.getFirestore)();
async function syncCounselFaqFromSheetInternal() {
    const rows = await (0, sheetCsv_1.fetchFaqRowsFromSheet)();
    const firestore = db();
    const batch = firestore.batch();
    const activeIds = new Set();
    for (const row of rows) {
        const id = `row_${row.sheetRow}`;
        activeIds.add(id);
        const doc = {
            category: row.category,
            keywords: row.keywords,
            answerTemplate: row.answerTemplate,
            sheetRow: row.sheetRow,
            active: true,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        batch.set(firestore.collection(FAQ_COLLECTION).doc(id), doc, { merge: true });
    }
    const existing = await firestore.collection(FAQ_COLLECTION).get();
    let deleted = 0;
    for (const snap of existing.docs) {
        if (!activeIds.has(snap.id)) {
            batch.delete(snap.ref);
            deleted++;
        }
    }
    batch.set(firestore.doc(META_DOC), {
        lastSyncedAt: firestore_1.FieldValue.serverTimestamp(),
        rowCount: rows.length,
        source: 'google_sheets_csv',
    }, { merge: true });
    await batch.commit();
    return { synced: rows.length, deleted };
}
//# sourceMappingURL=sync.js.map