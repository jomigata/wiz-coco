#!/usr/bin/env node
/** 로컬 dev 백그라운드 — 별도 cmd 창 없이 로그 파일로만 출력 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

function devLogPath() {
  return process.env.WIZCOCO_DEV_LOG || path.join(ROOT, '.firebase', 'local-dev-server.log');
}

function isHeadlessDev() {
  return process.env.WIZCOCO_DEV_HEADLESS === '1' || process.env.WIZCOCO_DEV_HEADLESS === 'true';
}

function appendLogLine(line) {
  try {
    const log = devLogPath();
    fs.mkdirSync(path.dirname(log), { recursive: true });
    fs.appendFileSync(log, line);
  } catch {
    /* ignore */
  }
}

/** @returns {'inherit' | [string, number, number]} */
function devStdio() {
  if (!isHeadlessDev()) return 'inherit';
  const log = devLogPath();
  fs.mkdirSync(path.dirname(log), { recursive: true });
  const fd = fs.openSync(log, 'a');
  return ['ignore', fd, fd];
}

function spawnOptionsBase() {
  return {
    windowsHide: true,
    shell: false,
  };
}

module.exports = {
  ROOT,
  devLogPath,
  isHeadlessDev,
  appendLogLine,
  devStdio,
  spawnOptionsBase,
};
