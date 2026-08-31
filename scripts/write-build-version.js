/**
 * 배포마다 public/build-version.json 을 새 SHA로 갱신합니다.
 * 브라우저가 오래 열려 있는 탭에서 오래된 JS 청크를 계속 쓰는 문제를
 * (Next static export + 1년 캐시) 감지하기 위해 클라이언트가 이 파일을 주기적으로 조회합니다.
 */
const fs = require('fs');
const path = require('path');

const sha =
  process.env.NEXT_PUBLIC_BUILD_SHA ||
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  String(Date.now());
const runId = process.env.NEXT_PUBLIC_BUILD_RUN_ID || process.env.GITHUB_RUN_ID || '';

const publicDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(publicDir, { recursive: true });

const payload = {
  sha,
  runId,
  builtAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(publicDir, 'build-version.json'),
  JSON.stringify(payload, null, 2),
);

console.log(`[write-build-version] sha=${sha} runId=${runId}`);
