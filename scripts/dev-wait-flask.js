#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const { ROOT, devLogPath, devStdio, spawnOptionsBase } = require('./lib/dev-headless');

const waitOn = require.resolve('wait-on/bin/wait-on');

process.env.WIZCOCO_DEV_HEADLESS = process.env.WIZCOCO_DEV_HEADLESS || '1';

const wait = spawnSync(
  process.execPath,
  [waitOn, 'tcp:127.0.0.1:8080', '-t', '240000'],
  { cwd: ROOT, stdio: devStdio(), ...spawnOptionsBase() },
);
if (wait.status !== 0) process.exit(wait.status ?? 1);

require('./run-flask-dev.js');
