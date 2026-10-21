/**
 * VRIN 5쌍 대립 논리 점검 (items-99.json + egoOkValidity 쌍)
 * node scripts/audit-ego-ok-vrin-pairs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bank = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/internal-materials/ego-ok/items-99.json'), 'utf8'),
);

const PAIRS = bank.validityConfig?.vrinPairs ?? [];
const RATIONALE = [
  'I+ vs I−',
  'U+ vs U−',
  'A+ vs FC−',
  'CP− vs AC+',
  'FC+ vs F(infreq)',
];

function item(no) {
  return bank.items.find((x) => x.no === no);
}

let ok = true;
for (let i = 0; i < PAIRS.length; i += 1) {
  const [a, b] = PAIRS[i];
  const ia = item(a);
  const ib = item(b);
  console.log(`\n${i + 1}. ${a} ↔ ${b} (${RATIONALE[i] ?? '?'})`);
  console.log(`   ${a} [${ia?.scaleType}] ${ia?.text.replace(/\n/g, ' ')}`);
  console.log(`   ${b} [${ib?.scaleType}] ${ib?.text.replace(/\n/g, ' ')}`);
  if (!ia || !ib) {
    console.log('   ERROR: missing item');
    ok = false;
  }
  if (b === 26 && ib?.scaleType !== 'validity_infreq') {
    console.log('   ERROR: 26 must be validity_infreq');
    ok = false;
  }
}
console.log(ok ? '\nOK' : '\nFAILED');
process.exit(ok ? 0 : 1);
