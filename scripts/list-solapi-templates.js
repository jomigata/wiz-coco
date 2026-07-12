#!/usr/bin/env node
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', 'backend', '.env.solapi');

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

function auth(key, secret) {
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const salt = crypto.randomUUID();
  const signature = crypto.createHmac('sha256', secret).update(date + salt).digest('hex');
  return `HMAC-SHA256 ApiKey=${key}, Date=${date}, Salt=${salt}, Signature=${signature}`;
}

async function main() {
  const env = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
  const headers = { Authorization: auth(env.SOLAPI_API_KEY, env.SOLAPI_API_SECRET) };
  const pfId = env.SOLAPI_KAKAO_PF_ID;

  const res = await fetch(`https://api.solapi.com/kakao/v2/templates?channelId=${pfId}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  const map = {
    'WizCoCo 검사 미완료 안내': 'SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER',
    'WizCoCo 치료·과제 안내': 'SOLAPI_KAKAO_TEMPLATE_CARE',
    'WizCoCo 검사 접속 안내': 'SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS',
  };

  for (const t of data.templateList || []) {
    console.log(`${t.name}\t${t.status}\t${t.templateId}\t${map[t.name] || ''}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
