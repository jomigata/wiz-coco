/**
 * Import 99-item ego-ok survey from Excel → items-99-source.tsv + scale criteria JSON.
 *
 * Default xlsx (in repo): docs/internal-materials/ego-ok/이고-오케이 설문지 99문항.xlsx
 * Override: EGO_OK_99_XLSX=/path/to/file.xlsx
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const defaultXlsx = path.join(root, 'docs/internal-materials/ego-ok/이고-오케이 설문지 99문항.xlsx');
const xlsxPath = process.env.EGO_OK_99_XLSX?.trim() || defaultXlsx;
const tsvPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv');
const criteriaPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-scale-criteria-ko.json');

function cleanItemText(raw) {
  let t = String(raw ?? '').trim();
  t = t.replace(/\[cite:\s*\d+\]/gi, '').trim();
  t = t.replace(/\s+/g, ' ');
  return t;
}

function normalizeLikertInstruction(text) {
  return text
    .replace(/E\.\s*전혀 그렇지 않다/g, 'E. 거의 그렇지 않다')
    .replace(/A\.\s*매우 그렇다/g, 'A. 거의 항상 그렇다');
}

if (!fs.existsSync(xlsxPath)) {
  console.error(`XLSX not found: ${xlsxPath}`);
  process.exit(1);
}

const wb = XLSX.readFile(xlsxPath);
const sheet = wb.Sheets['99문항'];
if (!sheet) {
  console.error('Sheet "99문항" not found');
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
if (rows.length !== 99) {
  console.error(`Expected 99 rows, got ${rows.length}`);
  process.exit(1);
}

const tsvLines = [];
const byNo = {};

for (let i = 0; i < rows.length; i += 1) {
  const row = rows[i];
  const no = Number(row['번호']) || i + 1;
  if (no !== i + 1) {
    console.error(`Row order mismatch at index ${i}: 번호=${no}, expected ${i + 1}`);
    process.exit(1);
  }
  const scaleType = String(row['현척도코드'] ?? '').trim();
  if (!scaleType) {
    console.error(`Missing scaleType at no ${no}`);
    process.exit(1);
  }
  let text = cleanItemText(row['99 문항']);
  if (scaleType.startsWith('validity')) {
    text = normalizeLikertInstruction(text);
  }
  tsvLines.push(`${scaleType}\t${text}`);

  byNo[String(no)] = {
    scaleType,
    criterion: String(row['척도기준점'] ?? '').trim(),
    tip: String(row['활용팁'] ?? '').trim(),
    extraTip: String(row['추가 활용팁'] ?? '').trim(),
  };
}

fs.writeFileSync(tsvPath, `${tsvLines.join('\n')}\n`, 'utf8');
console.log(`Wrote ${tsvPath} (${tsvLines.length} lines)`);

const criteriaDoc = {
  sourceFile: path.relative(root, xlsxPath).replace(/\\/g, '/'),
  sheet: '99문항',
  note: '척도기준점·활용팁·추가 활용팁 — Excel 99문항 시트',
  byNo,
};
fs.writeFileSync(criteriaPath, `${JSON.stringify(criteriaDoc, null, 2)}\n`, 'utf8');
console.log(`Wrote ${criteriaPath}`);
