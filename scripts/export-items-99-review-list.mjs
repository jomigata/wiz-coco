/**
 * 99문항 검토·엑셀 붙여넣기 (4열)
 * node scripts/export-items-99-review-list.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'docs/internal-materials/ego-ok/items-99.json');
const sourcePath = path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv');
const notesPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-notes-plain-ko.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-review-list.tsv');

const HEADERS = ['현검사번호(99)', '현척도코드', '현문항(99)', '비고'];

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const plainNotes = JSON.parse(fs.readFileSync(notesPath, 'utf8')).byNo ?? {};

const sourceLines = fs.readFileSync(sourcePath, 'utf8').trim().split(/\r?\n/);
const sourceTextByNo = {};
for (let i = 0; i < sourceLines.length; i += 1) {
  const line = sourceLines[i];
  const tab = line.indexOf('\t');
  const raw = tab >= 0 ? line.slice(tab + 1) : line;
  sourceTextByNo[i + 1] = raw.replace(/@/g, '').replace(/\s+/g, ' ').trim();
}

function noteFor(item) {
  return plainNotes[String(item.no)] ?? '';
}

const rows = bank.items.map((item) => ({
  no: item.no,
  scale: item.scaleType,
  text: sourceTextByNo[item.no] ?? item.text.replace(/\n/g, ' ').trim(),
  note: noteFor(item),
}));

const tsv = [
  HEADERS.join('\t'),
  ...rows.map((r) => [r.no, r.scale, r.text, r.note].join('\t')),
].join('\n');

fs.writeFileSync(outPath, `${tsv}\n`, 'utf8');
console.log(`Wrote ${outPath} (${rows.length} rows)`);
