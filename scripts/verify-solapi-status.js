#!/usr/bin/env node
/**
 * Cloud Run 알림 채널 상태 + (선택) 알림톡 테스트 발송
 */
const fs = require('fs');
const path = require('path');

const API_BASE =
  process.env.FLASK_API_URL ||
  process.env.NEXT_PUBLIC_FLASK_API_URL ||
  'https://wizcoco-api-1088573742018.asia-northeast3.run.app';

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

async function main() {
  console.log(`📡 ${API_BASE}/api/notifications/status`);
  const statusRes = await fetch(`${API_BASE}/api/notifications/status`);
  const status = await statusRes.json();
  console.log(JSON.stringify(status, null, 2));

  const kakao = status.kakaoAlimtalk || {};
  if (!kakao.configured) {
    console.log('\n⚠️ 카카오 알림톡 미설정 — Secrets 등록 후 deploy-backend 완료를 기다리세요.');
    process.exit(1);
  }

  const local = fs.existsSync(ENV_PATH) ? parseEnv(fs.readFileSync(ENV_PATH, 'utf8')) : {};
  const cronSecret = process.env.NOTIFICATION_CRON_SECRET || local.NOTIFICATION_CRON_SECRET;
  const testPhone = process.env.ALIMTALK_TEST_PHONE || local.ALIMTALK_TEST_PHONE;

  if (!cronSecret) {
    console.log('\nℹ️ 테스트 발송 생략 (NOTIFICATION_CRON_SECRET 없음)');
    process.exit(0);
  }

  const templatesRes = await fetch(`${API_BASE}/api/notifications/alimtalk/templates`, {
    headers: { 'X-Notification-Cron-Secret': cronSecret },
  });
  console.log(`\n📋 templates: HTTP ${templatesRes.status}`);
  if (templatesRes.ok) {
    const templates = await templatesRes.json();
    console.log(JSON.stringify(templates, null, 2));
  }

  if (!testPhone) {
    console.log('\nℹ️ 테스트 발송 생략 (ALIMTALK_TEST_PHONE 없음)');
    process.exit(0);
  }

  console.log(`\n📨 테스트 발송 → ${testPhone.replace(/\d(?=\d{4})/g, '*')}`);
  const testRes = await fetch(`${API_BASE}/api/notifications/alimtalk/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Notification-Cron-Secret': cronSecret,
    },
    body: JSON.stringify({
      template: 'testReminder',
      phone: testPhone,
      displayName: 'WizCoCo테스트',
      title: '연동 테스트',
      pending: '미완료 검사 1건',
    }),
  });
  const testBody = await testRes.json().catch(() => ({}));
  console.log(`HTTP ${testRes.status}`, JSON.stringify(testBody, null, 2));
  process.exit(testRes.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
