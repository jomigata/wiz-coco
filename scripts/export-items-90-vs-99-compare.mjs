/**
 * 구 표준 90문항 ↔ 99문항(타당도 제외) 비교표 — 엑셀 붙여넣기 TSV + XLSX
 * node scripts/export-items-90-vs-99-compare.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'docs/internal-materials/ego-ok');

const COL_OLD_NO = '구번호(90)';
const COL_OLD_SCALE = '구척도코드';
const COL_OLD_TEXT = '구문항';
const COL_IDX = '인덱스(ego/ok)';
const COL_NEW_NO = '현검사번호(99)';
const COL_NEW_SCALE = '현척도코드';
const COL_NEW_TEXT = '현문항(99)';
const COL_SCALE_SAME = '척도동일';
const COL_TEXT_SAME = '문항동일';
const COL_NOTE = '비고';

const HEADERS = [
  COL_OLD_NO,
  COL_OLD_SCALE,
  COL_OLD_TEXT,
  COL_IDX,
  COL_NEW_NO,
  COL_NEW_SCALE,
  COL_NEW_TEXT,
  COL_SCALE_SAME,
  COL_TEXT_SAME,
  COL_NOTE,
];

function plain(text) {
  return (text ?? '')
    .replace(/,\s*@/g, ', ')
    .replace(/@/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function indexKey(item) {
  if (item.egoIndex != null) return `ego ${item.egoIndex}`;
  if (item.okIndex != null) return `ok ${item.okIndex}`;
  return '';
}

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
}

function byIndex(items) {
  const map = new Map();
  for (const it of items) {
    const k = indexKey(it);
    if (!k) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  }
  return map;
}

function tokenSet(text) {
  return new Set(plain(text).replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter(Boolean));
}

function similarity(a, b) {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / Math.max(sa.size, sb.size);
}

function pickBest(candidates, ...references) {
  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  let best = candidates[0];
  let bestScore = -1;
  for (const c of candidates) {
    const score = Math.max(...references.map((ref) => similarity(c.text, ref)));
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function ordinalWithinScale(items, item) {
  const pool = items
    .filter((x) => x.scaleType === item.scaleType)
    .sort((a, b) => a.no - b.no);
  const idx = pool.findIndex((x) => x.no === item.no);
  return idx >= 0 ? idx + 1 : 0;
}

const items90 = loadJson('items-90.json').items.sort((a, b) => a.no - b.no);
const items99 = loadJson('items-99.json').items.filter((x) => !x.scaleType.startsWith('validity'));
const items100 = loadJson('items-100.json').items.filter((x) => !x.scaleType.startsWith('validity'));

const map99 = byIndex(items99);
const map100 = new Map();
for (const it of items100) {
  const k = indexKey(it);
  if (k && !map100.has(k)) map100.set(k, it);
}

const rows = [];

for (const old of items90) {
  const k = indexKey(old);
  const ref100 = map100.get(k);
  let neu = null;
  let note = '';

  const candidates = map99.get(k) ?? [];
  if (candidates.length) {
    const sameScale = candidates.filter((c) => c.scaleType === old.scaleType);
    const pool = (sameScale.length ? sameScale : candidates).slice().sort((a, b) => a.no - b.no);
    if (candidates.length > 1) {
      note = `동일인덱스 ${pool.map((c) => c.no).join('·')} → ${pool[0].no}번 대표`;
    }
    if (pool.length > 1 && ref100) {
      neu = pickBest(pool, ref100.text, old.text);
      const best = similarity(neu.text, ref100.text);
      const tied = pool.filter(
        (c) => Math.abs(similarity(c.text, ref100.text) - best) < 0.02,
      );
      if (tied.length > 1) neu = tied.sort((a, b) => a.no - b.no)[0];
    } else if (pool.length > 1) {
      neu = pool[0];
    } else {
      neu = pool[0];
    }
  } else {
    note = '인덱스 미배정';
    const ord = ordinalWithinScale(items90, old);
    const pool99 = items99
      .filter((x) => x.scaleType === old.scaleType)
      .sort((a, b) => a.no - b.no);
    neu = pool99[ord - 1] ?? null;
    if (neu) note += ` → ${old.scaleType} ${ord}번째 대응(99번 ${neu.no})`;
  }

  if (neu && old.scaleType !== neu.scaleType) {
    note = [note, `척도변경 ${old.scaleType}→${neu.scaleType}`].filter(Boolean).join('; ');
  }

  const oldPlain = plain(old.text);
  const newPlain = neu ? plain(neu.text) : '';
  rows.push({
    [COL_OLD_NO]: old.no,
    [COL_OLD_SCALE]: old.scaleType,
    [COL_OLD_TEXT]: oldPlain,
    [COL_IDX]: k,
    [COL_NEW_NO]: neu?.no ?? '',
    [COL_NEW_SCALE]: neu?.scaleType ?? '',
    [COL_NEW_TEXT]: newPlain,
    [COL_SCALE_SAME]: neu && old.scaleType === neu.scaleType ? 'Y' : 'N',
    [COL_TEXT_SAME]: neu && oldPlain === newPlain ? 'Y' : 'N',
    [COL_NOTE]: note,
  });
}

const outTsv = path.join(dir, 'items-90-vs-99-compare.tsv');
const outXlsx = path.join(dir, 'items-90-vs-99-compare.xlsx');
const outMd = path.join(dir, 'items-90-vs-99-compare.md');

const tsvLines = [
  HEADERS.join('\t'),
  ...rows.map((row) => HEADERS.map((h) => String(row[h] ?? '')).join('\t')),
];
fs.writeFileSync(outTsv, `${tsvLines.join('\n')}\n`, 'utf8');

const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
ws['!cols'] = [
  { wch: 8 },
  { wch: 14 },
  { wch: 56 },
  { wch: 10 },
  { wch: 12 },
  { wch: 14 },
  { wch: 56 },
  { wch: 8 },
  { wch: 8 },
  { wch: 28 },
];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '90vs99');
XLSX.writeFile(wb, outXlsx);

const md = [
  '# 구 90문항 ↔ 99문항(타당도 제외) 비교',
  '',
  '**용도:** 엑셀에서 구·현 문항·척도를 나란히 검토.',
  '',
  '- [`items-90-vs-99-compare.xlsx`](./items-90-vs-99-compare.xlsx)',
  '- [`items-90-vs-99-compare.tsv`](./items-90-vs-99-compare.tsv)',
  '',
  '**대응 규칙:** 우선 `egoIndex` / `okIndex` 동일; 99에서 인덱스가 중복·누락이면 `items-100`·척도 내 순서로 보조 매칭. **비고** 열 확인.',
  '',
  '**재생성:** `npm run export:ego-ok-items-90-vs-99-compare`',
  '',
  `| ${HEADERS.join(' | ')} |`,
  '| ---: | --- | --- | --- | ---: | --- | --- | --- | --- | --- |',
  ...rows.map((row) => {
    const esc = (s) => String(s).replace(/\|/g, '\\|');
    return `| ${row[COL_OLD_NO]} | ${row[COL_OLD_SCALE]} | ${esc(row[COL_OLD_TEXT])} | ${row[COL_IDX]} | ${row[COL_NEW_NO]} | ${row[COL_NEW_SCALE]} | ${esc(row[COL_NEW_TEXT])} | ${row[COL_SCALE_SAME]} | ${row[COL_TEXT_SAME]} | ${esc(row[COL_NOTE])} |`;
  }),
  '',
];
fs.writeFileSync(outMd, `${md.join('\n')}\n`, 'utf8');

console.log(`Wrote ${outTsv} (${rows.length} rows)`);
console.log(`Wrote ${outXlsx}`);
console.log(`Wrote ${outMd}`);
