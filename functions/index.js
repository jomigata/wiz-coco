const functions = require('firebase-functions');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Next.js 앱 준비
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Firebase Functions에서 Next.js 앱 실행
exports.nextServer = functions.https.onRequest(async (req, res) => {
  try {
    await app.prepare();
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling', req.url, err);
    res.statusCode = 500;
    res.end('internal server error');
  }
});

// API Functions - Next.js API Routes를 Firebase Functions로 프록시
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
    
    await app.prepare();
    const parsedUrl = parse(req.url, true);
    await handle(req, res, parsedUrl);
    
    console.log(`[Firebase Functions] API 응답 완료: ${req.method} ${req.url}`);
  } catch (err) {
    console.error('[Firebase Functions] API 에러:', err);
    res.statusCode = 500;
    res.json({ error: 'Internal server error', details: err.message });
  }
}); 