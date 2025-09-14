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
exports.processLogs = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Firebase Admin 초기화
admin.initializeApp();
// API Functions - 간단한 API 엔드포인트
exports.api = functions.https.onRequest(async (req, res) => {
    try {
        console.log(`[Firebase Functions] API 요청: ${req.method} ${req.url}`);
        // CORS 헤더 설정
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }
        // 기본 API 응답
        const response = {
            success: true,
            message: 'Firebase Functions API가 정상적으로 작동합니다.',
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url
        };
        console.log(`[Firebase Functions] API 응답 완료: ${req.method} ${req.url}`);
        res.status(200).json(response);
    }
    catch (err) {
        console.error('[Firebase Functions] API 에러:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: err.message
        });
    }
});
// 로그 처리 함수
exports.processLogs = functions.https.onRequest(async (req, res) => {
    try {
        console.log('[Firebase Functions] 로그 처리 요청');
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        const logData = req.body;
        console.log('[Firebase Functions] 로그 데이터:', logData);
        // Firestore에 로그 저장
        await admin.firestore().collection('logs').add(Object.assign(Object.assign({}, logData), { timestamp: admin.firestore.FieldValue.serverTimestamp() }));
        res.status(200).json({ success: true });
    }
    catch (err) {
        console.error('[Firebase Functions] 로그 처리 에러:', err);
        res.status(500).json({ error: 'Log processing failed' });
    }
});
//# sourceMappingURL=index.js.map