#!/usr/bin/env node
/**
 * Cursor/VS Code Simple Browser — 로컬 테스트용 탭 3개 (우측 내장 브라우저)
 */
const { execFileSync } = require('child_process');
const { resolveEditorCliPaths } = require('./resolve-cursor-cli');

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
  const candidates = resolveEditorCliPaths();

  for (const cli of candidates) {
    try {
      const opts = { stdio: 'ignore', windowsHide: true };
      if (process.platform === 'win32' && (cli.includes('\\') || cli.includes('/'))) {
        execFileSync(cli, ['--open-url', uri], opts);
      } else {
        execFileSync(cli, ['--open-url', uri], { ...opts, shell: process.platform === 'win32' });
      }
      return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

/** OS 기본 브라우저 — WIZCOCO_DEV_FALLBACK_SYSTEM_BROWSER=1 일 때만 (기본: Simple Browser 전용) */
function openSystemBrowser(url) {
  try {
    if (process.platform === 'win32') {
      execFileSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore', windowsHide: true });
      return true;
    }
    if (process.platform === 'darwin') {
      execFileSync('open', [url], { stdio: 'ignore' });
      return true;
    }
    execFileSync('xdg-open', [url], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function allowSystemFallback() {
  return (
    process.env.WIZCOCO_DEV_SYSTEM_BROWSER === '1' ||
    process.env.WIZCOCO_DEV_FALLBACK_SYSTEM_BROWSER === '1'
  );
}

function main() {
  let simpleOk = 0;
  const forceSystem = process.env.WIZCOCO_DEV_SYSTEM_BROWSER === '1';

  for (let i = 0; i < TABS.length; i += 1) {
    const { url, title } = TABS[i];
    let opened = false;
    if (!forceSystem) {
      opened = openSimpleBrowser(url);
      if (opened) simpleOk += 1;
    }
    if (!opened && (forceSystem || allowSystemFallback())) {
      opened = openSystemBrowser(url);
      if (opened) {
        console.log(`[dev:workspace:open] 기본 브라우저: ${title} → ${url}`);
      }
    } else if (opened) {
      console.log(`[dev:workspace:open] Simple Browser: ${title} → ${url}`);
    }
    if (!opened) {
      console.warn('[dev:workspace:open] 브라우저를 열지 못했습니다. 수동으로 열기:', url);
    }
    if (i < TABS.length - 1) sleepMs(600);
  }

  if (!forceSystem && simpleOk === 0) {
    console.warn(
      '[dev:workspace:open] Simple Browser를 열지 못했습니다. Cursor.exe 경로 확인 — .vscode/settings.json terminal.integrated.env.windows.CURSOR_PATH 또는 .env.local 의 CURSOR_PATH',
    );
  } else if (!forceSystem && simpleOk > 0) {
    console.log(
      `[dev:workspace:open] Cursor Simple Browser ${simpleOk}/${TABS.length}탭 — 로컬 서버는 IDE 우측 탭에서 확인하세요.`,
    );
  }
}

main();
