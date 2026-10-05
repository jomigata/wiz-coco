/**
 * 2번 첨부(96문항 전체): @ 없는 문항은 마지막 ", " 뒤에 @ 삽입.
 * 1번 @ 목록(명시 문항)은 canonical에 이미 @ 있으면 유지.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const canonicalPath = path.join(
  __dirname,
  '../docs/internal-materials/ego-ok/items-96-canonical-text.json',
);

/** 1차 @ 목록 + 29번 */
const EXPLICIT_NOS = new Set([
  2, 5, 6, 8, 10, 13, 21, 26, 27, 29, 30, 31, 32, 34, 40, 41, 42, 49, 59, 60, 64, 65, 69, 70,
  71, 73, 76, 77, 79, 80, 83, 84, 85, 88, 93,
]);

function insertBreakBeforeLastClause(text) {
  if (text.includes('@')) return text;
  const idx = text.lastIndexOf(', ');
  if (idx === -1) return text;
  return `${text.slice(0, idx + 2)}@${text.slice(idx + 2)}`;
}

const bank = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
let changed = 0;

for (let i = 0; i < bank.texts.length; i++) {
  const no = i + 1;
  if (no === 29) {
    const want =
      '동료가 실수를 하더라도, 질책하기보다는, 먼저 @따뜻하게 격려해 준다.';
    if (bank.texts[i] !== want) {
      bank.texts[i] = want;
      changed++;
    }
    continue;
  }
  if (EXPLICIT_NOS.has(no) && bank.texts[i].includes('@')) continue;

  const next = insertBreakBeforeLastClause(bank.texts[i]);
  if (next !== bank.texts[i]) {
    bank.texts[i] = next;
    changed++;
  }
}

fs.writeFileSync(canonicalPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Batch-2 @ merge: ${changed} text(s) updated in items-96-canonical-text.json`);
