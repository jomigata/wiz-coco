#!/usr/bin/env node
/**
 * backend/.env.solapi → GitHub Secrets 일괄 등록 + 백엔드 재배포 트리거
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, 'backend', '.env.solapi');
const EXAMPLE_PATH = path.join(ROOT, 'backend', '.env.solapi.example');

const REQUIRED = [
  'SOLAPI_API_KEY',
  'SOLAPI_API_SECRET',
  'SOLAPI_SENDER',
  'SOLAPI_KAKAO_PF_ID',
  'SOLAPI_KAKAO_TEMPLATE_TEST_REMINDER',
  'SOLAPI_KAKAO_TEMPLATE_CARE',
  'SOLAPI_KAKAO_TEMPLATE_PORTAL_CREDENTIALS',
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
  const result = spawnSync('gh', ['secret', 'set', name], {
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
    console.error('❌ backend/.env.solapi 파일이 없습니다.');
    console.error(`   예시 복사: copy "${EXAMPLE_PATH}" "${ENV_PATH}"`);
    console.error('   값 입력 후: npm run secrets:solapi');
    process.exit(1);
  }

  const vars = parseEnv(fs.readFileSync(ENV_PATH, 'utf8'));
  const missing = REQUIRED.filter((k) => !vars[k]);
  if (missing.length) {
    console.error('❌ 다음 값이 비어 있습니다:', missing.join(', '));
    process.exit(1);
  }

  console.log('🔐 GitHub Secrets 등록 중 (7개)...');
  for (const key of REQUIRED) {
    ghSecretSet(key, vars[key]);
    console.log(`   ✅ ${key}`);
  }

  console.log('\n🚀 백엔드 재배포 트리거 (deploy-backend.yml)...');
  const deploy = spawnSync('gh', ['workflow', 'run', 'deploy-backend.yml', '--ref', 'main'], {
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (deploy.status !== 0) {
    console.warn('⚠️ workflow run 실패 — GitHub Actions에서 수동 실행하세요.');
  } else {
    console.log('✅ deploy-backend 워크플로가 시작되었습니다.');
  }

  console.log('\n다음: 배포 완료 후 npm run verify:solapi');
}

main();
