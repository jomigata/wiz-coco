#!/usr/bin/env node
/**
 * Cloudflare Email Routing — support@wizcoco.com 포워딩 설정
 *
 * 필요: .env.cloudflare (CLOUDFLARE_API_TOKEN, EMAIL_ROUTING_DESTINATION)
 * 실행: npm run setup:cloudflare-email
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env.cloudflare');
const EXAMPLE_PATH = path.join(ROOT, '.env.cloudflare.example');

const CUSTOM_LOCAL = 'support';
const DOMAIN = process.env.CLOUDFLARE_ZONE_NAME || 'wizcoco.com';

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

async function cf(pathname, { method = 'GET', body } = {}, token) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!data.success) {
    const msg =
      data.errors?.map((e) => e.message).join('; ') ||
      data.messages?.map((m) => m.message).join('; ') ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data.result;
}

async function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ .env.cloudflare 파일이 없습니다.');
    console.error(`   copy "${EXAMPLE_PATH}" "${ENV_PATH}"`);
    process.exit(1);
  }

  const env = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
  const token = env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
  const destination = env.EMAIL_ROUTING_DESTINATION;
  const zoneName = env.CLOUDFLARE_ZONE_NAME || DOMAIN;

  if (!token) {
    console.error('❌ CLOUDFLARE_API_TOKEN 이 필요합니다.');
    console.error('   https://dash.cloudflare.com/profile/api-tokens');
    console.error('   권한: Zone DNS Edit + Account Email Routing Admin');
    process.exit(1);
  }
  if (!destination) {
    console.error('❌ EMAIL_ROUTING_DESTINATION (전달받을 실제 메일)이 필요합니다.');
    process.exit(1);
  }

  const customAddress = `${CUSTOM_LOCAL}@${zoneName}`;
  console.log(`📧 ${customAddress} → ${destination}`);

  const zones = await cf(`/zones?name=${encodeURIComponent(zoneName)}`, {}, token);
  const zone = Array.isArray(zones) ? zones[0] : null;
  if (!zone?.id) {
    throw new Error(`zone not found: ${zoneName}`);
  }
  const zoneId = zone.id;
  const accountId = zone.account?.id;
  if (!accountId) {
    throw new Error('account id not found on zone');
  }
  console.log(`✅ Zone: ${zoneName} (${zoneId})`);

  try {
    const settings = await cf(`/zones/${zoneId}/email/routing`, {}, token);
    if (!settings?.enabled) {
      console.log('🔧 Email Routing 활성화 + MX 레코드 추가...');
      await cf(`/zones/${zoneId}/email/routing/enable`, { method: 'POST' }, token);
      console.log('   ✅ enable 완료');
    } else {
      console.log('ℹ️ Email Routing 이미 활성화됨');
    }
  } catch (err) {
    console.log('🔧 Email Routing enable 시도...');
    await cf(`/zones/${zoneId}/email/routing/enable`, { method: 'POST' }, token);
    console.log('   ✅ enable 완료');
  }

  let destList = await cf(`/accounts/${accountId}/email/routing/addresses`, {}, token);
  let dest = destList?.find((d) => d.email?.toLowerCase() === destination.toLowerCase());

  if (!dest) {
    console.log(`📨 전달 주소 등록: ${destination}`);
    dest = await cf(
      `/accounts/${accountId}/email/routing/addresses`,
      { method: 'POST', body: { email: destination } },
      token,
    );
    console.log('   📬 Cloudflare 인증 메일을 확인하고 「Verify」를 클릭하세요.');
  } else if (!dest.verified) {
    console.log(`⚠️ ${destination} — 아직 인증 안 됨. 메일함에서 Verify 링크를 클릭하세요.`);
  } else {
    console.log(`✅ 전달 주소 인증됨: ${destination}`);
  }

  const rules = await cf(`/zones/${zoneId}/email/routing/rules`, {}, token);
  const existing = rules?.find(
    (r) =>
      r.matchers?.some(
        (m) =>
          m.type === 'literal' &&
          m.field === 'to' &&
          m.value?.toLowerCase() === customAddress.toLowerCase(),
      ),
  );

  if (existing) {
    console.log(`ℹ️ 라우팅 규칙 이미 존재: ${customAddress} (enabled=${existing.enabled})`);
  } else if (!dest?.verified) {
    console.log('\n⏳ 전달 주소 인증 후 아래 명령을 다시 실행하세요:');
    console.log('   npm run setup:cloudflare-email');
  } else {
    console.log(`🔀 라우팅 규칙 생성: ${customAddress}`);
    await cf(
      `/zones/${zoneId}/email/routing/rules`,
      {
        method: 'POST',
        body: {
          name: `WizCoCo ${CUSTOM_LOCAL}`,
          enabled: true,
          matchers: [{ type: 'literal', field: 'to', value: customAddress }],
          actions: [{ type: 'forward', value: [destination] }],
        },
      },
      token,
    );
    console.log('   ✅ 규칙 생성 완료');
  }

  const status = await cf(`/zones/${zoneId}/email/routing`, {}, token);
  console.log('\n--- 상태 ---');
  console.log(`Email Routing: ${status?.enabled ? 'enabled' : 'disabled'} (${status?.status || '-'})`);
  console.log(`주소: ${customAddress}`);
  console.log(`전달: ${destination}`);
  console.log('\n테스트: 다른 메일에서 support@wizcoco.com 으로 발송 후 수신 확인');
}

main().catch((err) => {
  console.error('❌', err.message || err);
  process.exit(1);
});
