/**
 * 확정 개정 90문항 → items-99-source.tsv (타당도 9·제시순서 유지)
 * node scripts/apply-ego-ok-90-revised-to-99-source.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'docs/internal-materials/ego-ok');

const reviewTsv = path.join(dir, 'items-90-revised-review.tsv');
const overridesPath = path.join(dir, 'items-90-revised-confirmed-overrides.json');
const sourcePath = path.join(dir, 'items-99-source.tsv');
const logPath = path.join(dir, 'items-90-apply-to-99-log.tsv');

function parseTsvLine(line) {
  const cols = line.split('\t');
  return cols;
}

const overrideBank = JSON.parse(fs.readFileSync(overridesPath, 'utf8')).overrides;

const reviewLines = fs.readFileSync(reviewTsv, 'utf8').trim().split(/\r?\n/);
const header = parseTsvLine(reviewLines[0]);
const idx = {
  kind: header.indexOf('구분'),
  scale: header.indexOf('척도코드'),
  ord: header.indexOf('척도내순번'),
  draft: header.indexOf('개정문항'),
};

const pools = {};
for (let i = 1; i < reviewLines.length; i += 1) {
  const cols = parseTsvLine(reviewLines[i]);
  if (cols[idx.kind] !== '성격') continue;
  const scaleType = cols[idx.scale];
  const ord = Number(cols[idx.ord]);
  const key = `${scaleType}:${ord}`;
  const text = overrideBank[key] ?? cols[idx.draft];
  (pools[scaleType] ||= [])[ord - 1] = text;
}

for (const [st, list] of Object.entries(pools)) {
  const expected = st.startsWith('i_') || st.startsWith('u_') ? 10 : 5;
  if (!list || list.length !== expected || list.some((x) => !x)) {
    console.error(`Pool ${st}: expected ${expected}, got ${list?.filter(Boolean).length}`);
    process.exit(1);
  }
}

const sourceLines = fs.readFileSync(sourcePath, 'utf8').trim().split(/\r?\n/);
const poolIdx = {};
const outLines = [];
const logRows = [['검사번호', '척도코드', '척도내순번', '반영문항'].join('\t')];

for (let i = 0; i < sourceLines.length; i += 1) {
  const no = i + 1;
  const line = sourceLines[i];
  const tab = line.indexOf('\t');
  const scaleType = line.slice(0, tab);
  const oldText = line.slice(tab + 1);

  if (scaleType.startsWith('validity')) {
    outLines.push(line);
    continue;
  }

  const pi = poolIdx[scaleType] || 0;
  poolIdx[scaleType] = pi + 1;
  const newText = pools[scaleType][pi];
  if (!newText) {
    console.error(`No pool text for ${scaleType} index ${pi} at no ${no}`);
    process.exit(1);
  }
  outLines.push(`${scaleType}\t${newText}`);
  logRows.push([no, scaleType, pi + 1, newText.replace(/\t/g, ' ')].join('\t'));
}

fs.writeFileSync(sourcePath, `${outLines.join('\n')}\n`, 'utf8');
fs.writeFileSync(logPath, `${logRows.join('\n')}\n`, 'utf8');
console.log(`Updated ${sourcePath} (${sourceLines.length} lines)`);
console.log(`Wrote ${logPath}`);
