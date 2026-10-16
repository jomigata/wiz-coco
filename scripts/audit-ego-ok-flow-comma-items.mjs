/**
 * Lists items stored as one line (no \\n) with at least one ", " — responsive UI breaks at comma when width wraps to 2 lines.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/internal-materials/ego-ok/items-99.json'), 'utf8'),
);

const flowComma = [];
for (const it of json.items) {
  const t = it.readingText || it.text;
  if (t.includes('\n')) continue;
  const commas = (t.match(/, /g) || []).length;
  if (commas > 0) flowComma.push({ no: it.no, commas, len: t.length, text: t });
}

console.log(`Flow + comma (no stored line break): ${flowComma.length} items`);
for (const row of flowComma) {
  console.log(`${row.no}\t${row.len}c\t${row.commas}comma\t${row.text}`);
}
