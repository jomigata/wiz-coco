/**
 * 99문항 엑셀 붙여넣기용 TSV
 * node scripts/export-items-99-excel.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const jsonPath = path.join(root, 'docs/internal-materials/ego-ok/items-99.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-excel-export.tsv');

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const header = ['번호', '문항', '척도코드', 'code', 'egoIndex', 'okIndex'].join('\t');
const rows = bank.items.map((item) =>
  [
    item.no,
    item.text.replace(/\n/g, ' '),
    item.scaleType,
    item.code,
    item.egoIndex ?? '',
    item.okIndex ?? '',
  ].join('\t'),
);
fs.writeFileSync(outPath, `${header}\n${rows.join('\n')}\n`, 'utf8');
console.log(`Wrote ${outPath}`);
