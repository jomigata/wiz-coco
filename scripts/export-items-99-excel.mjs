/**
 * 99문항 엑셀용 TSV + XLSX (5열, 검사 제시 순서 1–99)
 * node scripts/export-items-99-excel.mjs
 *
 * 열: 번호 | 문항 | 척도코드 | 리커트 5점 | 진단.타당도 설명
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'docs/internal-materials/ego-ok/items-99.json');
const sourcePath = path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv');
const labelsPath = path.join(root, 'docs/internal-materials/ego-ok/item-subscale-diagnosis-ko.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.tsv');
const outXlsxPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.xlsx');
const outMdPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.md');

const COL_NO = '번호';
const COL_TEXT = '문항';
const COL_SCALE = '척도코드';
const COL_LIKERT = '리커트 5점';
const COL_DIAG = '진단.타당도 설명';
const HEADERS = [COL_NO, COL_TEXT, COL_SCALE, COL_LIKERT, COL_DIAG];

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

const rowObjects = bank.items.map((item) => ({
  [COL_NO]: item.no,
  [COL_TEXT]: plainWording(item),
  [COL_SCALE]: item.scaleType,
  [COL_LIKERT]: '리커트 5점',
  [COL_DIAG]: diagnosisCol(item),
}));

const tsvLines = [
  HEADERS.join('\t'),
  ...rowObjects.map((row) => HEADERS.map((h) => row[h]).join('\t')),
];
fs.writeFileSync(outPath, `${tsvLines.join('\n')}\n`, 'utf8');

const ws = XLSX.utils.json_to_sheet(rowObjects, { header: HEADERS });
ws['!cols'] = [{ wch: 5 }, { wch: 72 }, { wch: 16 }, { wch: 12 }, { wch: 48 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '99문항');
XLSX.writeFile(wb, outXlsxPath);

const mdLines = [
  '# 이고-오케이 99문항 — 엑셀 (5열, 검사 순서)',
  '',
  '**파일:**',
  '- [`items-99-excel-export.xlsx`](./items-99-excel-export.xlsx) — 엑셀에서 바로 열기',
  '- [`items-99-excel-export.tsv`](./items-99-excel-export.tsv) — TSV 복사·붙여넣기',
  '',
  `**열:** ${HEADERS.join(' | ')}`,
  '',
  '**재생성:** `npm run export:ego-ok-items-99-excel`',
  '',
  `| ${HEADERS.join(' | ')} |`,
  '| ---: | --- | --- | --- | --- |',
];
for (const row of rowObjects) {
  const wording = row[COL_TEXT].replace(/\|/g, '\\|');
  const diag = row[COL_DIAG].replace(/\|/g, '\\|');
  mdLines.push(
    `| ${row[COL_NO]} | ${wording} | ${row[COL_SCALE]} | ${row[COL_LIKERT]} | ${diag} |`,
  );
}
fs.writeFileSync(outMdPath, `${mdLines.join('\n')}\n`, 'utf8');

console.log(`Wrote ${outPath} (${rowObjects.length} rows)`);
console.log(`Wrote ${outXlsxPath}`);
console.log(`Wrote ${outMdPath}`);
