/**
 * 100문항 엑셀 붙여넣기용 TSV 생성
 * node scripts/export-items-100-excel.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'docs/internal-materials/ego-ok/items-100.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-100-excel-export.tsv');

const LIKERT = { 1: 'E. 전혀 그렇지 않다', 2: 'B. 그렇지 않다', 5: 'A. 매우 그렇다' };

function oldNoFromNew(no) {
  if (no <= 25) return no;
  if (no === 26) return null;
  if (no <= 51) return no - 1;
  if (no === 52) return null;
  if (no <= 77) return no - 2;
  if (no === 78) return null;
  if (no <= 99) return no - 3;
  if (no === 100) return null;
  return null;
}

/** 신번호 → 수정·추가 메모 (표현 수정·타당도 우선) */
const MOD_BY_NEW = {
  2: '표현 수정: 오탈자 「시기는」→「시키는」',
  10: '표현 수정: 실수 회피 중심 → 일반적 배려·행동 표현',
  13: '표현 수정: 「좋다/나쁘다」 단정 표현 정제',
  29: '표현 수정: 극단 표현 완화 (구 28번)',
  30: '표현 수정: 극단 표현 완화 (구 29번)',
  44: '표현 수정: 「손 대지 않음」→「선뜻 착수하지 못함」 등 (구 43번)',
  47: '표현 수정: A(성인) 맥락·간섭 표현 정리 (구 46번)',
  75: '표현 수정: 「사리」→「상식이나 논리」 (구 73번)',
  89: '표현 수정: 질책·잔소리 표현 정제 (구 86번)',
  15: '타당도 L Scale 1 — 사회적 바람직성 (구 15번, 번호 유지)',
  26: '타당도 [신규] IMC — 구 25번 뒤 삽입',
  31: '타당도 IMC — 구 30번에서 이동',
  48: '타당도 F Scale 1 — 구 47번에서 이동',
  52: '타당도 [신규] L — 구 50번 뒤 삽입',
  65: '타당도 L Scale 2 — 구 63번에서 이동',
  78: '타당도 [신규] F — 구 75번 뒤 삽입',
  80: '타당도 IMC — 구 77번에서 이동',
  93: '타당도 F Scale 2 — 구 90번에서 이동',
  100: '타당도 [신규] VRIN — 34번(호기심)과 대립',
};

const IMC_EXPECT = { 26: 2, 31: 1, 80: 5 };

const VALIDITY_LABEL = {
  validity_lie: 'validity_lie (L)',
  validity_imc: 'validity_imc (IMC)',
  validity_infreq: 'validity_infreq (F)',
  validity_vrin: 'validity_vrin (VRIN)',
};

function scaleLabel(item) {
  if (item.scaleType?.startsWith('validity_')) {
    return VALIDITY_LABEL[item.scaleType] ?? item.scaleType;
  }
  return item.scaleType ?? '';
}

function oneLine(text) {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function modNote(no, oldNo, scaleType) {
  if (MOD_BY_NEW[no]) return MOD_BY_NEW[no];
  if (scaleType?.startsWith('validity_')) return MOD_BY_NEW[no] ?? '타당도 문항';
  if (oldNo != null && oldNo !== no) return `원본 유지 (기존 구${oldNo}번)`;
  return '원본 유지';
}

function buildVrinMap(pairs) {
  const m = new Map();
  pairs.forEach(([a, b], i) => {
    const n = i + 1;
    m.set(a, `Pair${n}-A`);
    m.set(b, `Pair${n}-B`);
  });
  return m;
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const vrinMap = buildVrinMap(data.vrinPairs ?? []);

const header =
  '신번호(100)\t구번호(96)\t문항(현행)\t척도/타당도\t수정·추가 내용\tVRIN\t기대응답(타당도)\n';

const rows = data.items.map((item) => {
  const no = item.no;
  const old = oldNoFromNew(no);
  const oldCol = old == null ? '(신규)' : String(old);
  const text = oneLine(item.text);
  const scale = scaleLabel(item);
  const mod = modNote(no, old, item.scaleType);
  const vrin = vrinMap.get(no) ?? '';
  let expect = '';
  if (IMC_EXPECT[no]) {
    expect = `${LIKERT[IMC_EXPECT[no]]} (${IMC_EXPECT[no]}점)`;
  }
  return [no, oldCol, text, scale, mod, vrin, expect].join('\t');
});

const tsv = header + rows.join('\n') + '\n';
fs.writeFileSync(outPath, tsv, 'utf8');
console.log(`Wrote ${rows.length} rows → ${outPath}`);
