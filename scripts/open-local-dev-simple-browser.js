#!/usr/bin/env node
/**
 * Cursor/VS Code Simple Browser — 로컬 테스트용 탭 3개 (우측 내장 브라우저)
 */
const { execFileSync } = require('child_process');

const TABS = [
  { title: 'WizCoCo UI', url: 'http://localhost:3000/' },
  { title: '상담사 관리', url: 'http://localhost:3000/admin/counselor-management' },
  { title: 'Emulator Auth', url: 'http://127.0.0.1:4000/auth' },
];

function sleepMs(ms) {
  if (process.platform === 'win32') {
    try {
      execFileSync('powershell', ['-NoProfile', '-Command', `Start-Sleep -Milliseconds ${ms}`], {
        stdio: 'ignore',
      });
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    execFileSync('sleep', [`${ms / 1000}`], { stdio: 'ignore' });
  } catch {
    /* ignore */
  }
}

function openSimpleBrowser(url) {
  const uri = `vscode://vscode.simple-browser/show?url=${encodeURIComponent(url)}`;
  const candidates = [
    process.env.CURSOR_PATH,
    process.platform === 'win32' ? 'cursor.cmd' : 'cursor',
    process.platform === 'win32' ? 'code.cmd' : 'code',
  ].filter(Boolean);

  for (const cli of candidates) {
    try {
      execFileSync(cli, ['--open-url', uri], { stdio: 'ignore', windowsHide: true });
      return true;
    } catch {
      /* try next */
    }
  }
  console.warn('[dev:workspace:open] Simple Browser를 열지 못했습니다. 수동으로 열기:', url);
  return false;
}

function main() {
  for (let i = 0; i < TABS.length; i += 1) {
    const { url, title } = TABS[i];
    openSimpleBrowser(url);
    console.log(`[dev:workspace:open] Simple Browser: ${title} → ${url}`);
    if (i < TABS.length - 1) sleepMs(600);
  }
}

main();
