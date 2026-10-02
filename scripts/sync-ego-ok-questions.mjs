/**
 * Canonical ego-ok items → src/data/egoOkQuestions.ts
 * Source: docs/internal-materials/ego-ok/items-90.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourcePath = path.join(root, 'docs/internal-materials/ego-ok/items-90.json');
const outPath = path.join(root, 'src/data/egoOkQuestions.ts');

const bank = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

if (!Array.isArray(bank.items) || bank.items.length !== 90) {
  console.error(`Expected 90 items, got ${bank.items?.length ?? 0}`);
  process.exit(1);
}

function scaleKindFromCode(code) {
  if (typeof code !== 'string' || code.length < 2) return 'egogram';
  return code[1] === 'C' ? 'okgram' : 'egogram';
}

const lines = [];
lines.push('/**');
lines.push(' * TA 이고-오케이그램 검사 문항 (90).');
lines.push(` * Generated from ${path.relative(root, sourcePath).replace(/\\/g, '/')}`);
lines.push(` * Bank id: ${bank.id} — do not edit by hand; run: npm run sync:ego-ok-questions`);
lines.push(' */');
lines.push('');
lines.push("export const EGO_OK_ITEM_BANK_ID = 'ego-ok-90' as const;");
lines.push('');
lines.push("export type EgoOkScaleKind = 'egogram' | 'okgram';");
lines.push('');
lines.push('export interface EgoOkQuestion {');
lines.push('  no: number;');
lines.push('  text: string;');
lines.push('  code: string;');
lines.push('  egoIndex: number | null;');
lines.push('  okIndex: number | null;');
lines.push('  scaleType: string;');
lines.push('  scaleKind: EgoOkScaleKind;');
lines.push('}');
lines.push('');
lines.push('export const EGO_OK_QUESTIONS: EgoOkQuestion[] = [');

for (const item of bank.items) {
  const scaleKind = scaleKindFromCode(item.code);
  const egoIndex = item.egoIndex ?? null;
  const okIndex = item.okIndex ?? null;
  const text = JSON.stringify(item.text);
  const code = JSON.stringify(item.code);
  const scaleType = JSON.stringify(item.scaleType);
  lines.push(
    `  { no: ${item.no}, text: ${text}, code: ${code}, egoIndex: ${egoIndex}, okIndex: ${okIndex}, scaleType: ${scaleType}, scaleKind: '${scaleKind}' },`,
  );
}

lines.push('];');
lines.push('');
lines.push('export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;');
lines.push('');

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${outPath} (${bank.items.length} items)`);
