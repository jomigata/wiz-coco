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