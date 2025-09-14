import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

// Firebase Admin 초기화
admin.initializeApp();

// API Functions - 간단한 API 엔드포인트
export const api = functions.https.onRequest(async (req: Request, res: Response) => {
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
  } catch (err: any) {
    console.error('[Firebase Functions] API 에러:', err);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error', 
      details: err.message 
    });
  }
});

// 로그 처리 함수
export const processLogs = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    console.log('[Firebase Functions] 로그 처리 요청');
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    const logData = req.body;
    console.log('[Firebase Functions] 로그 데이터:', logData);
    
    // Firestore에 로그 저장
    await admin.firestore().collection('logs').add({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Firebase Functions] 로그 처리 에러:', err);
    res.status(500).json({ error: 'Log processing failed' });
  }
}); 