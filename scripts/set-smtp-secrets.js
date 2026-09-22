#!/usr/bin/env node
/**
 * backend/.env.smtp.local → GitHub Secrets (SMTP_* , MAIL_FROM)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, 'backend', '.env.smtp.local');
const EXAMPLE_PATH = path.join(ROOT, 'backend', '.env.smtp.local.example');

const SECRET_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'MAIL_FROM',
  'COUNSELOR_ADMIN_NOTIFY_EMAIL',
];

function parseEnv(content) {
  const vars = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

function ghSecretSet(name, value) {
  const result = spawnSync('gh', ['secret', 'set', name, '--repo', 'jomigata/wiz-coco'], {
    input: value,
    encoding: 'utf8',
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.status !== 0) {
    throw new Error(`gh secret set ${name} failed (exit ${result.status})`);
  }
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ backend/.env.smtp.local 없음');
    console.error(`   copy "${EXAMPLE_PATH}" "${ENV_PATH}"`);
    process.exit(1);
  }

  const vars = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
  if (!vars.SMTP_HOST || !vars.SMTP_USER || !vars.SMTP_PASSWORD) {
    console.error('❌ SMTP_HOST, SMTP_USER, SMTP_PASSWORD 가 backend/.env.smtp.local 에 필요합니다.');
    process.exit(1);
  }

  if (!vars.SMTP_PORT) vars.SMTP_PORT = '587';
  if (!vars.MAIL_FROM) vars.MAIL_FROM = vars.SMTP_USER;
  if (!vars.COUNSELOR_ADMIN_NOTIFY_EMAIL) {
    vars.COUNSELOR_ADMIN_NOTIFY_EMAIL = vars.MAIL_FROM;
  }

  const toSet = SECRET_KEYS.filter((k) => vars[k]);
  console.log(`🔐 GitHub Secrets 등록 (${toSet.length}개)...`);
  for (const key of toSet) {
    ghSecretSet(key, vars[key]);
    console.log(`   ✅ ${key}`);
  }
  console.log('\n✅ 완료. 로컬: npm run smtp:local:check → npm run dev 재시작');
}

main();
