#!/usr/bin/env node
/** Emulator가 떠 있을 때 즉시 export (Flask debounce·수동 백업) */
const { runFirebaseExport } = require('./lib/emulator-export');

const label = process.argv.slice(2).join(' ') || 'now';
const { ok, status } = runFirebaseExport(label, { quiet: true });
process.exit(ok ? 0 : status);
