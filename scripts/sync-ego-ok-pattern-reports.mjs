/**
 * 243패턴 보고서 문장 → src/data/egoOkPatternByCode.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourcePath = path.join(root, 'docs/internal-materials/ego-ok/patterns-243-reports.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/patterns-243-by-code.json');

const bank = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byCode = {};

for (const item of bank.items || []) {
  if (!item.code) continue;
  byCode[item.code] = {
    no: item.no,
    basicPattern: item.basicPattern || '',
    sections: item.sections || {},
  };
}

const payload = {
  id: bank.id,
  sectionLabels: bank.sectionLabels || {},
  missingCodes: bank.missingCodes || [],
  patterns: byCode,
};

fs.writeFileSync(outPath, JSON.stringify(payload), 'utf8');
console.log(`Wrote ${outPath} (${Object.keys(byCode).length} pattern codes)`);
