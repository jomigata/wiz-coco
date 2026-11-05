#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const path = require('path');
const { ROOT, devStdio, spawnOptionsBase } = require('./lib/dev-headless');

const waitOn = require.resolve('wait-on/bin/wait-on');
const nextBin = require.resolve('next/dist/bin/next');

process.env.WIZCOCO_DEV_HEADLESS = process.env.WIZCOCO_DEV_HEADLESS || '1';

const wait = spawnSync(
  process.execPath,
  [waitOn, 'tcp:127.0.0.1:5000', '-t', '240000'],
  { cwd: ROOT, stdio: devStdio(), ...spawnOptionsBase() },
);
if (wait.status !== 0) process.exit(wait.status ?? 1);

const env = {
  ...process.env,
  SKIP_DB_INIT: 'true',
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
  NEXT_PUBLIC_FLASK_API_URL: 'http://localhost:5000',
};

const child = spawn(process.execPath, [nextBin, 'dev', '-p', '3000'], {
  cwd: ROOT,
  env,
  stdio: devStdio(),
  ...spawnOptionsBase(),
});

child.on('exit', (code) => process.exit(code ?? 0));
