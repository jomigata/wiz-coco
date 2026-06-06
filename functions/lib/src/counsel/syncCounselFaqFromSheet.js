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
exports.scheduledSyncCounselFaq = exports.syncCounselFaqFromSheet = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const logger = __importStar(require("firebase-functions/logger"));
const auth_1 = require("../utils/auth");
const sync_1 = require("../knowledge/sync");
const params_1 = require("../config/params");
exports.syncCounselFaqFromSheet = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (request) => {
    await (0, auth_1.requireAdmin)(request);
    if (!(0, params_1.isCounselFaqSheetConfigured)()) {
        throw new https_1.HttpsError('failed-precondition', 'COUNSEL_FAQ_SHEET_ID 환경 변수를 설정한 뒤 Functions를 재배포하세요.');
    }
    try {
        const result = await (0, sync_1.syncCounselFaqFromSheetInternal)();
        return Object.assign({ ok: true }, result);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed';
        logger.error('syncCounselFaqFromSheet failed', { message });
        throw new https_1.HttpsError('internal', message);
    }
});
exports.scheduledSyncCounselFaq = (0, scheduler_1.onSchedule)({
    schedule: 'every 24 hours',
    region: 'asia-northeast3',
    timeZone: 'Asia/Seoul',
}, async () => {
    if (!(0, params_1.isCounselFaqSheetConfigured)()) {
        logger.warn('scheduledSyncCounselFaq skipped: COUNSEL_FAQ_SHEET_ID not set');
        return;
    }
    try {
        const result = await (0, sync_1.syncCounselFaqFromSheetInternal)();
        logger.info('scheduledSyncCounselFaq ok', result);
    }
    catch (err) {
        logger.error('scheduledSyncCounselFaq failed', {
            message: err instanceof Error ? err.message : String(err),
        });
    }
});
//# sourceMappingURL=syncCounselFaqFromSheet.js.map