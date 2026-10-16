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
const labelsPath = path.join(root, 'docs/internal-materials/ego-ok/item-subscale-diagnosis-ko.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.tsv');

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const labelBank = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

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
    item.text.replace(/\n/g, ' '),
    index,
    item.scaleType,
    '리커트 5점',
    diagnosisCol(item),
  ].join('\t');
});

fs.writeFileSync(outPath, `${header}\n${rows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath} (${rows.length} rows)`);
