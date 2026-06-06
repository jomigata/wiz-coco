"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.counselFaqSheetGid = exports.counselFaqSheetId = exports.FAQ_SHEET_UNSET = void 0;
exports.isCounselFaqSheetConfigured = isCounselFaqSheetConfigured;
const params_1 = require("firebase-functions/params");
exports.FAQ_SHEET_UNSET = 'unset';
exports.counselFaqSheetId = (0, params_1.defineString)('COUNSEL_FAQ_SHEET_ID', {
    default: exports.FAQ_SHEET_UNSET,
    description: 'Google Sheets document ID for counsel FAQ sync',
});
exports.counselFaqSheetGid = (0, params_1.defineString)('COUNSEL_FAQ_SHEET_GID', {
    default: '0',
    description: 'Google Sheets tab gid for counsel FAQ CSV export',
});
function isCounselFaqSheetConfigured(sheetId) {
    const id = (sheetId !== null && sheetId !== void 0 ? sheetId : exports.counselFaqSheetId.value()).trim();
    return id.length > 0 && id !== exports.FAQ_SHEET_UNSET;
}
//# sourceMappingURL=params.js.map