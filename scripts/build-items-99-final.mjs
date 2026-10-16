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

/** 한 줄로 두기 위한 최대 글자 수 (초과 시 2줄, 41자부터 2줄) */
const READING_SINGLE_LINE_MAX = 40;
/** 2줄일 때 줄당 최대 글자 수 (초과 시 화면에서 3줄로 보일 수 있음) */
const READING_LINE_MAX = 42;

function splitTwoBalancedAtSpace(text) {
  let bestAt = -1;
  let bestDiff = Infinity;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== ' ') continue;
    const line1 = text.slice(0, i);
    const line2 = text.slice(i + 1);
    if (!line1 || !line2) continue;
    if (line1.length > READING_LINE_MAX || line2.length > READING_LINE_MAX) continue;
    const diff = Math.abs(line1.length - line2.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestAt = i;
    }
  }
  if (bestAt < 0) {
    const mid = Math.floor(text.length / 2);
    const space = text.indexOf(' ', mid);
    if (space > 0) return `${text.slice(0, space)}\n${text.slice(space + 1)}`;
    return text;
  }
  return `${text.slice(0, bestAt)}\n${text.slice(bestAt + 1)}`;
}

function commaSpacePositions(text) {
  const positions = [];
  for (let i = 0; i < text.length - 1; i += 1) {
    if (text[i] === ',' && text[i + 1] === ' ') positions.push(i);
  }
  return positions;
}

function breakAtCommaSpace(text, commaAt) {
  return `${text.slice(0, commaAt + 1)}\n${text.slice(commaAt + 2)}`;
}

function commaSplitFitsTwoLines(text, commaAt) {
  const line1 = text.slice(0, commaAt + 1);
  const line2 = text.slice(commaAt + 2);
  return line1.length <= READING_LINE_MAX && line2.length <= READING_LINE_MAX;
}

function wrapReadingText(text) {
  const withBreaks = text.replace(/@/g, '\n');
  if (withBreaks.includes('\n')) return withBreaks;

  const commas = commaSpacePositions(withBreaks);
  const singleComma = commas.length === 1;

  if (withBreaks.length <= READING_SINGLE_LINE_MAX) return withBreaks;

  if (singleComma) {
    const commaAt = commas[0];
    if (commaSplitFitsTwoLines(withBreaks, commaAt)) {
      return breakAtCommaSpace(withBreaks, commaAt);
    }
    return splitTwoBalancedAtSpace(withBreaks);
  }

  let bestComma = -1;
  let bestCommaDiff = Infinity;
  for (const commaAt of commas) {
    if (!commaSplitFitsTwoLines(withBreaks, commaAt)) continue;
    const line1 = withBreaks.slice(0, commaAt + 1);
    const line2 = withBreaks.slice(commaAt + 2);
    const diff = Math.abs(line1.length - line2.length);
    if (diff < bestCommaDiff) {
      bestCommaDiff = diff;
      bestComma = commaAt;
    }
  }

  if (bestComma >= 0) return breakAtCommaSpace(withBreaks, bestComma);

  return splitTwoBalancedAtSpace(withBreaks);
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
  note: '90 성격 + 타당도 9 + VRIN 5쌍. Validity: 9·15·26·38·48·58·68·78·88',
  itemCount: 99,
  validityItemNos,
  validityConfig: {
    imc: { itemNos: [9, 38, 68], failIfLikertAtMost: 3, invalidIfFailCountAtLeast: 2 },
    infreq: { itemNos: [26, 58, 78], hitIfLikertAtLeast: 3, invalidIfHitCountAtLeast: 2 },
    lie: { itemNos: [15, 48, 88], hitIfLikertAtMost: 2, cautionIfHitCountAtLeast: 2 },
    vrinPairs: [
      [3, 49],
      [5, 60],
      [11, 46],
      [34, 56],
      [33, 26],
    ],
  },
  items,
};

for (const it of items) {
  const plain = it.readingText.replace(/\n/g, ' ');
  let commas = 0;
  for (let i = 0; i < plain.length - 1; i += 1) {
    if (plain[i] === ',' && plain[i + 1] === ' ') commas += 1;
  }
  const lines = it.readingText.split('\n');
  if (lines.length === 2 && commas === 1 && !lines[0].endsWith(',')) {
    console.error(`Item ${it.no}: single comma but line break not after comma`);
    process.exit(1);
  }
}

fs.writeFileSync(outPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath} (${items.length} items)`);
