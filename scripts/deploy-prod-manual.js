#!/usr/bin/env node
/**
 * prod 수동 배포 — AUTO_DEPLOY_ON_PUSH=false 일 때 GitHub Actions 트리거
 * 로컬 npm run dev 로 1차 검증 후, 온라인 확인이 필요할 때만 실행.
 */
const { spawnSync } = require('child_process');

const mode = (process.argv[2] || 'help').toLowerCase();

function gh(args) {
  const r = spawnSync('gh', args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function printHelp() {
  console.log(`
WizCoCo prod 수동 배포 (GitHub Actions)

전제: main에 push 완료 · AUTO_DEPLOY_ON_PUSH=false (push만으로는 GCP 배포 없음)

  node scripts/deploy-prod-manual.js hosting     UI만 (hosting-only, 가장 저렴)
  node scripts/deploy-prod-manual.js auto        Firebase auto (변경 경로별)
  node scripts/deploy-prod-manual.js api         Flask API → Cloud Run
  node scripts/deploy-prod-manual.js all         hosting-only + api (순차)
  node scripts/deploy-prod-manual.js status      Variable + 최근 Actions run

로컬 1차: npm run dev  ·  npx tsc --noEmit
`);
}

function deployHosting(deployMode) {
  gh([
    'workflow',
    'run',
    'deploy.yml',
    '-f',
    `deploy_mode=${deployMode}`,
    '-f',
    'environment=production',
    '-f',
    'sync_gemini_secret=false',
  ]);
  console.log('\n→ Actions: 🚀 WizCoCo Deploy (Firebase)\n');
}

function deployApi() {
  gh(['workflow', 'run', 'deploy-backend.yml']);
  console.log('\n→ Actions: 🚀 Deploy Flask API to Cloud Run\n');
}

function status() {
  gh(['variable', 'list']);
  console.log('');
  gh(['run', 'list', '--limit', '6', '--branch', 'main']);
}

switch (mode) {
  case 'hosting':
    deployHosting('hosting-only');
    break;
  case 'auto':
    deployHosting('auto');
    break;
  case 'api':
    deployApi();
    break;
  case 'all':
    deployHosting('hosting-only');
    deployApi();
    break;
  case 'status':
    status();
    break;
  default:
    printHelp();
    break;
}
