/**
 * Build canonical items-99.json from items-99-source.tsv + metadata pools from items-100.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const tsvPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv');
const poolPath = path.join(root, 'docs/internal-materials/ego-ok/items-100.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99.json');

const EXPECTED_COUNTS = {
  np_positive: 5,
  cp_negative: 5,
  i_plus: 10,
  cp_positive: 5,
  u_plus: 10,
  a_positive: 5,
  i_minus: 10,
  u_minus: 10,
  fc_positive: 5,
  np_negative: 5,
  ac_negative: 5,
  fc_negative: 5,
  ac_positive: 5,
  a_negative: 5,
};

const VALIDITY_NOS = [9, 15, 26, 38, 48, 58, 68, 78, 88];

function wrapReadingText(text) {
  if (text.length <= 42) return text;
  const mid = Math.floor(text.length / 2);
  const breakAt = text.indexOf(', ', mid);
  if (breakAt > 0 && breakAt < text.length - 8) {
    return `${text.slice(0, breakAt + 1)}\n${text.slice(breakAt + 2)}`;
  }
  const space = text.indexOf(' ', mid);
  if (space > 0) return `${text.slice(0, space)}\n${text.slice(space + 1)}`;
  return text;
}

const lines = fs.readFileSync(tsvPath, 'utf8').trim().split(/\r?\n/);
if (lines.length !== 99) {
  console.error(`Expected 99 TSV lines, got ${lines.length}`);
  process.exit(1);
}

const rows = lines.map((line, i) => {
  const tab = line.indexOf('\t');
  if (tab < 0) {
    console.error(`Line ${i + 1}: missing tab`);
    process.exit(1);
  }
  return { scaleType: line.slice(0, tab), text: line.slice(tab + 1) };
});

const counts = {};
for (const { scaleType } of rows) {
  if (scaleType.startsWith('validity')) continue;
  counts[scaleType] = (counts[scaleType] || 0) + 1;
}
for (const [k, expected] of Object.entries(EXPECTED_COUNTS)) {
  if (counts[k] !== expected) {
    console.error(`Scale ${k}: expected ${expected}, got ${counts[k] ?? 0}`);
    process.exit(1);
  }
}

const bank100 = JSON.parse(fs.readFileSync(poolPath, 'utf8'));
const pools = {};
for (const item of bank100.items) {
  if (item.scaleType.startsWith('validity')) continue;
  (pools[item.scaleType] ||= []).push(item);
}
const poolIdx = {};

function nextMeta(scaleType) {
  const pool = pools[scaleType];
  if (!pool?.length) {
    console.error(`No pool for ${scaleType}`);
    process.exit(1);
  }
  const i = poolIdx[scaleType] || 0;
  poolIdx[scaleType] = i + 1;
  const tpl = pool[i % pool.length];
  return { code: tpl.code, egoIndex: tpl.egoIndex ?? null, okIndex: tpl.okIndex ?? null };
}

const items = rows.map((row, index) => {
  const no = index + 1;
  const isValidity = row.scaleType.startsWith('validity');
  const meta = isValidity
    ? { code: 'VX', egoIndex: null, okIndex: null }
    : nextMeta(row.scaleType);
  const readingText = wrapReadingText(row.text);
  return {
    no,
    text: readingText,
    readingText,
    ...meta,
    scaleType: row.scaleType,
  };
});

const validityItemNos = items.filter((i) => i.scaleType.startsWith('validity')).map((i) => i.no);
if (JSON.stringify(validityItemNos) !== JSON.stringify(VALIDITY_NOS)) {
  console.error('Validity nos mismatch', validityItemNos);
  process.exit(1);
}

const bank = {
  id: 'ego-ok-99',
  title: '이고-OK그램 체크리스트 (99문항, 타당도 9문항 블록 인터리빙)',
  status: 'canonical',
  sourceFile: 'items-99-source.tsv + build-items-99-final.mjs',
  note: '90 성격 + 타당도 9 (VRIN 없음). Validity: 9·15·26·38·48·58·68·78·88',
  itemCount: 99,
  validityItemNos,
  validityConfig: {
    imc: [
      { no: 9, minAccept: 4 },
      { no: 38, minAccept: 4 },
      { no: 68, minAccept: 4 },
    ],
    lieAdmissive: [15, 48, 88],
    infreq: [26, 58, 78],
    vrinPairs: [],
  },
  items,
};

fs.writeFileSync(outPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath} (${items.length} items)`);
