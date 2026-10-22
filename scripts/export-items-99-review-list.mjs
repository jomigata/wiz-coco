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
const labelsPath = path.join(root, 'docs/internal-materials/ego-ok/item-subscale-diagnosis-ko.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-review-list.tsv');

const HEADERS = ['현검사번호(99)', '현척도코드', '현문항(99)', '비고'];

const BRACKET = {
  cp_positive: '[CP+]',
  cp_negative: '[CP−]',
  np_positive: '[NP+]',
  np_negative: '[NP−]',
  a_positive: '[A+]',
  a_negative: '[A−]',
  fc_positive: '[FC+]',
  fc_negative: '[FC−]',
  ac_positive: '[AC+]',
  ac_negative: '[AC−]',
  u_plus: '[U+]',
  u_minus: '[U−]',
  i_plus: '[I+]',
  i_minus: '[I−]',
  validity_imc: '[IMC]',
  validity_lie: '[L]',
  validity_infreq: '[F]',
};

/** 2026-10-22 TA 검토 메모 (해당 번호만) */
const REVIEW_EXTRA = {
  18: '「물론이며」→「당연히」 자연스러운 표현',
  24: 'AC− 위임·의존(상황: 결정 어려울 때). 95번(CP+ 책임 완수)과 척도·상황 구분',
  25: 'I+ 주변 신뢰·인정 — 77번(U+ 관계)과 맥락 다름(타인 평가 vs 관계 유지)',
  35: 'U+ 의견 존중 — 87번(결정 권리)과 문장 분리',
  39: 'I− 결정 불안·주변 따름 — 24·56·97과 AC−/I− 축으로 구분',
  55: 'I+ 애정 기억 — 타당도·U+와 무관',
  56: 'AC− 사소한 선택 위임 — 24(중요 결정)와 상황 구분',
  60: 'U− 타의견 거부 — 5(U+) VRIN 대립',
  83: 'NP+ 실수 수용 — 47(U+) 격려와 NP vs U 구분',
  87: 'U+ 자기결정 권리 — 35(존중)와 초점 다름',
  91: 'A+ 복잡 문제 이성 대처 — 11(갑작 상황 침착)과 상황 구분',
  95: 'CP+ 맡은 일 끝까지 — 24와 반대 극(책임·완수)',
};

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const labelBank = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

const sourceLines = fs.readFileSync(sourcePath, 'utf8').trim().split(/\r?\n/);
const sourceTextByNo = {};
for (let i = 0; i < sourceLines.length; i += 1) {
  const line = sourceLines[i];
  const tab = line.indexOf('\t');
  const raw = tab >= 0 ? line.slice(tab + 1) : line;
  sourceTextByNo[i + 1] = raw.replace(/@/g, '').replace(/\s+/g, ' ').trim();
}

function noteFor(item) {
  const br = BRACKET[item.scaleType] ?? item.scaleType;
  let tail = '';
  if (item.egoIndex != null) tail = labelBank.ego[String(item.egoIndex)] ?? '';
  else if (item.okIndex != null) tail = labelBank.ok[String(item.okIndex)] ?? '';
  const base = tail ? `${br} ${tail}` : br;
  const extra = REVIEW_EXTRA[item.no];
  return extra ? `${base} — ${extra}` : base;
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
