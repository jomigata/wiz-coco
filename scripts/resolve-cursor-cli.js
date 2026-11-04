#!/usr/bin/env node
/**
 * Cursor / VS Code CLI for `--open-url` (Simple Browser vscode:// URI).
 * Used by open-local-dev-simple-browser.js
 */
const fs = require('fs');
const path = require('path');

/**
 * @returns {string[]} existing executables, Cursor first
 */
function resolveEditorCliPaths() {
  const out = [];
  const pushIfFile = (p) => {
    if (p && fs.existsSync(p)) out.push(p);
  };

  if (process.env.CURSOR_PATH) pushIfFile(process.env.CURSOR_PATH.trim());

  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA;
    if (local) {
      pushIfFile(path.join(local, 'Programs', 'cursor', 'Cursor.exe'));
      pushIfFile(path.join(local, 'Programs', 'Cursor', 'Cursor.exe'));
    }
    const pf = process.env.ProgramFiles;
    if (pf) {
      pushIfFile(path.join(pf, 'Cursor', 'Cursor.exe'));
    }
    const pf86 = process.env['ProgramFiles(x86)'];
    if (pf86) {
      pushIfFile(path.join(pf86, 'Cursor', 'Cursor.exe'));
    }
  } else if (process.platform === 'darwin') {
    pushIfFile('/Applications/Cursor.app/Contents/MacOS/Cursor');
    pushIfFile('/Applications/Visual Studio Code.app/Contents/MacOS/Electron');
  }

  const pathNames =
    process.platform === 'win32'
      ? ['cursor.cmd', 'cursor', 'code.cmd', 'code']
      : ['cursor', 'code'];
  for (const name of pathNames) {
    if (!out.includes(name)) out.push(name);
  }

  return out;
}

module.exports = { resolveEditorCliPaths };
