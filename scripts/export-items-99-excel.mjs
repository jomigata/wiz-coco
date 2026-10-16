/**
 * 99문항 엑셀 붙여넣기용 TSV (6열)
 * node scripts/export-items-99-excel.mjs
 *
 * 열: 번호 | 문항 | 인덱스(ego/ok) | 척도코드 | 리커트 5점 | [척도] 진단·타당도 설명
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'docs/internal-materials/ego-ok/items-99.json');
const sourcePath = path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv');
const labelsPath = path.join(root, 'docs/internal-materials/ego-ok/item-subscale-diagnosis-ko.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.tsv');
const outMdPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.md');

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const labelBank = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

const sourceLines = fs.readFileSync(sourcePath, 'utf8').trim().split(/\r?\n/);
const sourceTextByNo = {};
for (let i = 0; i < sourceLines.length; i += 1) {
  const line = sourceLines[i];
  const tab = line.indexOf('\t');
  const raw = tab >= 0 ? line.slice(tab + 1) : line;
  const text = raw
    .replace(/,\s*@/g, ', ')
    .replace(/@/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  sourceTextByNo[i + 1] = text;
}

function plainWording(item) {
  return sourceTextByNo[item.no] ?? item.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

const BRACKET = {
  cp_positive: '[CP 긍정]',
  cp_negative: '[CP 부정]',
  np_positive: '[NP 긍정]',
  np_negative: '[NP 부정]',
  a_positive: '[A 긍정]',
  a_negative: '[A 부정]',
  fc_positive: '[FC 긍정]',
  fc_negative: '[FC 부정]',
  ac_positive: '[AC 긍정]',
  ac_negative: '[AC 부정]',
  u_plus: '[U+ 타인긍정]',
  u_minus: '[U− 타인부정]',
  i_plus: '[I+ 자기긍정]',
  i_minus: '[I− 자기부정]',
  validity_imc: '[타당도 IMC]',
  validity_lie: '[타당도 L]',
  validity_infreq: '[타당도 F]',
};

const VALIDITY_BY_NO = {
  9: '현실·시간 지각(24시간·하루·내일)',
  38: '신체·반사(갑작스러운 위험·굉음에 놀람)',
  68: '생활 상식(과로·피로 시 휴식 필요)',
  26: '정서(기쁨·분노·슬픔 등 감정 경험)',
  58: '인지(무수면·완벽 집중)',
  78: '신체(감기·두통 등 잔병치레)',
  15: '정서 위선(가까운 사람에게 짜증·투정)',
  48: '성실 위선(피곤할 때 쉬고 싶음)',
  88: '관계 위선(가까운 사람에게 서운함)',
};

function diagnosisCol(item) {
  const br = BRACKET[item.scaleType] ?? item.scaleType;
  if (item.scaleType.startsWith('validity_')) {
    return `${br} ${VALIDITY_BY_NO[item.no] ?? ''}`.trim();
  }
  if (item.egoIndex != null) {
    const key = String(item.egoIndex);
    const tail = labelBank.ego[key] ?? '';
    return tail ? `${br} ${tail}` : br;
  }
  if (item.okIndex != null) {
    const key = String(item.okIndex);
    const tail = labelBank.ok[key] ?? '';
    return tail ? `${br} ${tail}` : br;
  }
  return br;
}

const header = ['번호', '문항', '인덱스', '척도코드', '리커트 5점', '진단·타당도 설명'].join('\t');
const rows = bank.items.map((item) => {
  const index = item.egoIndex ?? item.okIndex ?? '';
  return [
    item.no,
    plainWording(item),
    index,
    item.scaleType,
    '리커트 5점',
    diagnosisCol(item),
  ].join('\t');
});

fs.writeFileSync(outPath, `${header}\n${rows.join('\n')}\n`, 'utf8');

const mdLines = [
  '# 이고-오케이 99문항 — 엑셀 붙여넣기 (6열)',
  '',
  '**사용:** [`items-99-excel-export.tsv`](./items-99-excel-export.tsv) 파일 전체 선택 → 복사 → 엑셀 A1에 붙여넣기.',
  '',
  '**열:** 번호 | 문항(최종 한 줄) | 인덱스(ego/ok) | 척도코드 | 리커트 5점 | 진단·타당도 설명',
  '',
  '**재생성:** `npm run export:ego-ok-items-99-excel`',
  '',
  '| 번호 | 문항 | 인덱스 | 척도코드 | 리커트 | 진단·타당도 |',
  '| ---: | --- | ---: | --- | --- | --- |',
];
for (const item of bank.items) {
  const index = item.egoIndex ?? item.okIndex ?? '';
  const wording = plainWording(item).replace(/\|/g, '\\|');
  const diag = diagnosisCol(item).replace(/\|/g, '\\|');
  mdLines.push(`| ${item.no} | ${wording} | ${index} | ${item.scaleType} | 리커트 5점 | ${diag} |`);
}
fs.writeFileSync(outMdPath, `${mdLines.join('\n')}\n`, 'utf8');

console.log(`Wrote ${outPath} (${rows.length} rows)`);
console.log(`Wrote ${outMdPath}`);
