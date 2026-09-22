#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const backendDir = path.join(root, 'backend');
const isWin = process.platform === 'win32';
const py = path.join(backendDir, '.venv', isWin ? 'Scripts/python.exe' : 'bin/python');
const script = path.join(backendDir, 'scripts', 'test_smtp_send.py');

const r = spawnSync(py, [script], { cwd: backendDir, stdio: 'inherit', shell: false });
process.exit(r.status ?? 1);
