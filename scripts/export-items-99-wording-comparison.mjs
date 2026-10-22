/**
 * 99문항 문구 이력 비교 TSV (엑셀 붙여넣기)
 * node scripts/export-items-99-wording-comparison.mjs
 *
 * 최초: 9ce0f9c9 (99문항 뱅크 최초 도입)
 * 중간: 00232c9c (2026-10-22 TA 1차 검토 직전)
 * 최종: items-99-source.tsv (현재)
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { buildLegacy90AttachmentTextBy99No } from './lib/legacy-90-text-for-99.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const INITIAL_COMMIT = '9ce0f9c9';
const INTERMEDIATE_COMMIT = '00232c9c';
const SOURCE_PATH = path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv');
const NOTES_PATH = path.join(root, 'docs/internal-materials/ego-ok/items-99-notes-plain-ko.json');
const MEASUREMENT_PATH = path.join(
  root,
  'docs/internal-materials/ego-ok/items-99-measurement-focus-ko.json',
);
const JSON_PATH = path.join(root, 'docs/internal-materials/ego-ok/items-99.json');
const OUT_PATH = path.join(root, 'docs/internal-materials/ego-ok/items-99-wording-comparison.tsv');
const OUT_MD = path.join(root, 'docs/internal-materials/ego-ok/items-99-wording-comparison.md');

const LABELS_PATH = path.join(root, 'docs/internal-materials/ego-ok/item-subscale-diagnosis-ko.json');

const HEADERS = [
  '현검사번호(99)',
  '현척도코드',
  '구90·첨부문항',
  '최초문항',
  '중간문항(직전)',
  '최종문항',
  '비고',
  '측정주제·기준점',
];

function gitSourceAt(commit) {
  const rel = 'docs/internal-materials/ego-ok/items-99-source.tsv';
  const raw = execSync(`git show ${commit}:${rel}`, { cwd: root, encoding: 'utf8' });
  return parseSourceTsv(raw);
}

function parseSourceTsv(raw) {
  const lines = raw.trim().split(/\r?\n/);
  const byNo = {};
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const tab = line.indexOf('\t');
    const scale = tab >= 0 ? line.slice(0, tab) : '';
    let text = tab >= 0 ? line.slice(tab + 1) : line;
    text = text.replace(/@/g, ' ').replace(/\s+/g, ' ').trim();
    byNo[i + 1] = { scale, text };
  }
  return byNo;
}

function loadFinal() {
  return parseSourceTsv(fs.readFileSync(SOURCE_PATH, 'utf8'));
}

function normalizeForCompare(s) {
  return s.replace(/\s+/g, ' ').trim();
}

const bank = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const notes = JSON.parse(fs.readFileSync(NOTES_PATH, 'utf8')).byNo ?? {};
const measurement =
  JSON.parse(fs.readFileSync(MEASUREMENT_PATH, 'utf8')).byNo ?? {};
const labels = JSON.parse(fs.readFileSync(LABELS_PATH, 'utf8'));

const initial = gitSourceAt(INITIAL_COMMIT);
const intermediate = gitSourceAt(INTERMEDIATE_COMMIT);
const finalMap = loadFinal();
const legacy90 = buildLegacy90AttachmentTextBy99No(bank.items, labels, measurement);

const rows = bank.items.map((item) => {
  const no = item.no;
  const scale = finalMap[no]?.scale ?? item.scaleType;
  const tLegacy = legacy90[no] ?? '';
  const t0 = initial[no]?.text ?? '';
  const t1 = intermediate[no]?.text ?? '';
  const t2 = finalMap[no]?.text ?? '';
  const note = notes[String(no)] ?? '';
  const measure = measurement[String(no)] ?? '';
  return { no, scale, tLegacy, t0, t1, t2, note, measure };
});

const tsvLines = [
  HEADERS.join('\t'),
  ...rows.map((r) =>
    [r.no, r.scale, r.tLegacy, r.t0, r.t1, r.t2, r.note, r.measure].join('\t'),
  ),
];
fs.writeFileSync(OUT_PATH, `${tsvLines.join('\n')}\n`, 'utf8');

let changedMid = 0;
let changedFinal = 0;
for (const r of rows) {
  if (normalizeForCompare(r.t0) !== normalizeForCompare(r.t1)) changedMid += 1;
  if (normalizeForCompare(r.t1) !== normalizeForCompare(r.t2)) changedFinal += 1;
}

const md = [
  '# 이고-오케이 99문항 — 문구 이력 비교',
  '',
  `- **최초** 커밋: \`${INITIAL_COMMIT}\` (99문항 뱅크 도입)`,
  `- **중간** 커밋: \`${INTERMEDIATE_COMMIT}\` (TA 1차 검토·VRIN 직전)`,
  `- **최종**: \`items-99-source.tsv\` (생활형·리커트 정렬 개정)`,
  '',
  `- 최초→중간 문항 변경: **${changedMid}** / 99`,
  `- 중간→최종 문항 변경: **${changedFinal}** / 99`,
  '',
  '**엑셀:** [`items-99-wording-comparison.tsv`](./items-99-wording-comparison.tsv)',
  '',
  '**열:** 번호 · 척도 · **구90·첨부** · 최초 · 중간 · 최종 · 비고 · **측정주제·기준점**',
  '',
  '**구90·첨부:** `items-90.json`(2020 체크리스트 90) + 시트 하단 타당도(`items-checklist-attachment-validity-ko.json`·96/100 풀). 매칭: **척도코드** + **ego/ok 측정 주제**(또는 타당도는 주제 유사도).',
  '',
  '**재생성:** `npm run generate:ego-ok-items-99-measurement-focus` 후 `npm run export:ego-ok-items-99-wording-comparison`',
  '',
].join('\n');
fs.writeFileSync(OUT_MD, `${md}\n`, 'utf8');

console.log(`Wrote ${OUT_PATH}`);
console.log(`Wrote ${OUT_MD}`);
console.log(`Changed initial→intermediate: ${changedMid}, intermediate→final: ${changedFinal}`);
