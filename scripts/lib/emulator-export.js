/**
 * Firebase Auth + Firestore Emulator → .firebase/emulator-data
 * (run-firebase-emulators-persist.js, Flask debounced export 공용)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const importDirRel = path.join('.firebase', 'emulator-data');
const importDirAbs = path.join(ROOT, importDirRel);
const firebaseJs = path.join(ROOT, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');

function runFirebaseExport(label = 'manual', { quiet = false } = {}) {
  if (!fs.existsSync(firebaseJs)) {
    if (!quiet) console.warn('[emulator-export] firebase-tools not found');
    return { ok: false, status: 1 };
  }
  fs.mkdirSync(path.dirname(importDirAbs), { recursive: true });
  const r = spawnSync(
    process.execPath,
    [firebaseJs, 'emulators:export', importDirRel, '--project', 'wiz-coco', '--force'],
    {
      cwd: ROOT,
      stdio: quiet ? 'pipe' : 'inherit',
      shell: false,
      windowsHide: true,
    },
  );
  const ok = r.status === 0;
  if (!quiet) {
    if (ok) {
      console.log(`[emulator-export] ✓ export (${label}) → ${importDirRel}`);
    } else {
      console.warn(`[emulator-export] export failed (${label})`);
    }
  }
  return { ok, status: r.status ?? 1 };
}

module.exports = {
  ROOT,
  importDirRel,
  importDirAbs,
  runFirebaseExport,
};
