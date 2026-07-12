#!/usr/bin/env node
/**
 * Solapi ↔ 카카오 채널 연동 (CLI)
 *
 * 1) npm run solapi:kakao:token          — 인증번호 카카오톡 수신
 * 2) npm run solapi:kakao:link -- TOKEN  — 연동 완료 + pfId 출력
 * 3) npm run solapi:kakao:list           — 연동된 채널 목록
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', 'backend', '.env.solapi');

const SEARCH_ID = process.env.KAKAO_SEARCH_ID || 'wizcoco';
const PHONE = process.env.KAKAO_MANAGER_PHONE || '01051825410';
/** 카카오 채널 카테고리: 교육 > 교육정보/접수대행/자격증 */
const CATEGORY_CODE = process.env.KAKAO_CATEGORY_CODE || '00200050001';

function parseEnv(content) {
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    vars[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return vars;
}

function solapiAuth(key, secret) {
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const salt = crypto.randomUUID();
  const signature = crypto.createHmac('sha256', secret).update(date + salt).digest('hex');
  return `HMAC-SHA256 ApiKey=${key}, Date=${date}, Salt=${salt}, Signature=${signature}`;
}

async function solapi(pathname, { method = 'GET', body } = {}, creds) {
  const res = await fetch(`https://api.solapi.com${pathname}`, {
    method,
    headers: {
      Authorization: solapiAuth(creds.key, creds.secret),
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data.errorMessage || data.message || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function loadCreds() {
  if (!fs.existsSync(ENV_PATH)) {
    throw new Error(`backend/.env.solapi 없음`);
  }
  const env = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
  if (!env.SOLAPI_API_KEY || !env.SOLAPI_API_SECRET) {
    throw new Error('SOLAPI_API_KEY / SOLAPI_API_SECRET 필요');
  }
  return { key: env.SOLAPI_API_KEY, secret: env.SOLAPI_API_SECRET, env };
}

function writePfId(pfId) {
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  if (/^SOLAPI_KAKAO_PF_ID=.*/m.test(content)) {
    content = content.replace(/^SOLAPI_KAKAO_PF_ID=.*/m, `SOLAPI_KAKAO_PF_ID=${pfId}`);
  } else {
    content += `\nSOLAPI_KAKAO_PF_ID=${pfId}\n`;
  }
  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log(`✅ backend/.env.solapi → SOLAPI_KAKAO_PF_ID 저장`);
}

async function requestToken(creds) {
  console.log(`📨 연동 토큰 요청: searchId=${SEARCH_ID}, phone=${PHONE}`);
  const result = await solapi(
    '/kakao/v2/channels/token',
    {
      method: 'POST',
      body: { searchId: SEARCH_ID, phoneNumber: PHONE },
    },
    creds,
  );
  console.log('✅ 토큰 발송 요청 성공 — 카카오톡(알림톡)으로 인증번호 확인');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n다음: npm run solapi:kakao:link -- 받은인증번호');
}

async function linkChannel(creds, token) {
  if (!token) {
    throw new Error('인증 토큰이 필요합니다. npm run solapi:kakao:link -- 123456');
  }
  console.log(`🔗 채널 연동 중... (category=${CATEGORY_CODE})`);
  const channel = await solapi(
    '/kakao/v2/channels',
    {
      method: 'POST',
      body: {
        searchId: SEARCH_ID,
        phoneNumber: PHONE,
        categoryCode: CATEGORY_CODE,
        token: String(token).trim(),
      },
    },
    creds,
  );
  const pfId = channel.channelId || channel.pfId || channel.id;
  console.log('✅ 채널 연동 완료');
  console.log(JSON.stringify(channel, null, 2));
  if (pfId) {
    writePfId(pfId);
    console.log(`\npfId(channelId): ${pfId}`);
  }
}

async function listChannels(creds) {
  const data = await solapi('/kakao/v2/channels', {}, creds);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  const cmd = process.argv[2] || 'help';
  const creds = loadCreds();

  if (cmd === 'token') {
    await requestToken(creds);
    return;
  }
  if (cmd === 'link') {
    const token = process.argv[3];
    await linkChannel(creds, token);
    return;
  }
  if (cmd === 'list') {
    await listChannels(creds);
    return;
  }

  console.log(`
Solapi 카카오 채널 연동

  npm run solapi:kakao:token
  npm run solapi:kakao:link -- 인증번호
  npm run solapi:kakao:list

환경변수(선택): KAKAO_SEARCH_ID, KAKAO_MANAGER_PHONE, KAKAO_CATEGORY_CODE
`);
}

main().catch((err) => {
  console.error('❌', err.message || err);
  if (String(err.message).includes('채널 상태')) {
    console.error('\n💡 카카오 관리자센터 → 위즈코코 → 채널 정보');
    console.error('   「채널 공개」「검색 허용」을 ON 한 뒤 다시 시도하세요.');
  }
  process.exit(1);
});
