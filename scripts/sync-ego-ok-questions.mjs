/**
 * Canonical ego-ok items → src/data/egoOkQuestions.ts
 * Source: docs/internal-materials/ego-ok/items-96.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourcePath = path.join(root, 'docs/internal-materials/ego-ok/items-96.json');
const outPath = path.join(root, 'src/data/egoOkQuestions.ts');

const bank = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

if (!Array.isArray(bank.items) || bank.items.length !== 96) {
  console.error(`Expected 96 items, got ${bank.items?.length ?? 0}`);
  process.exit(1);
}

function scaleKindFromItem(item) {
  if (typeof item.scaleType === 'string' && item.scaleType.startsWith('validity')) return 'validity';
  const code = item.code;
  if (typeof code !== 'string' || code.length < 2) return 'egogram';
  return code[1] === 'C' ? 'okgram' : 'egogram';
}

const lines = [];
lines.push('/**');
lines.push(' * TA 이고-오케이그램 검사 문항 (96, 타당도 6문항 분산).');
lines.push(` * Generated from ${path.relative(root, sourcePath).replace(/\\/g, '/')}`);
lines.push(` * Bank id: ${bank.id} — do not edit by hand; run: npm run sync:ego-ok-questions`);
lines.push(' */');
lines.push('');
lines.push(`export const EGO_OK_ITEM_BANK_ID = '${bank.id}' as const;`);
lines.push('');
lines.push("export type EgoOkScaleKind = 'egogram' | 'okgram' | 'validity';");
lines.push('');
lines.push('export interface EgoOkQuestion {');
lines.push('  no: number;');
lines.push('  text: string;');
lines.push('  /** 화면 표시용(의미 그룹 · 넓은 간격). 없으면 text 사용 */');
lines.push('  readingText?: string;');
lines.push('  code: string;');
lines.push('  egoIndex: number | null;');
lines.push('  okIndex: number | null;');
lines.push('  scaleType: string;');
lines.push('  scaleKind: EgoOkScaleKind;');
lines.push('}');
lines.push('');
lines.push('export const EGO_OK_QUESTIONS: EgoOkQuestion[] = [');

for (const item of bank.items) {
  const scaleKind = scaleKindFromItem(item);
  const egoIndex = item.egoIndex ?? null;
  const okIndex = item.okIndex ?? null;
  const text = JSON.stringify(item.text);
  const readingText =
    typeof item.readingText === 'string' && item.readingText.length > 0
      ? `, readingText: ${JSON.stringify(item.readingText)}`
      : '';
  const code = JSON.stringify(item.code);
  const scaleType = JSON.stringify(item.scaleType);
  lines.push(
    `  { no: ${item.no}, text: ${text}${readingText}, code: ${code}, egoIndex: ${egoIndex}, okIndex: ${okIndex}, scaleType: ${scaleType}, scaleKind: '${scaleKind}' },`,
  );
}

lines.push('];');
lines.push('');
lines.push('export const EGO_OK_QUESTION_COUNT = EGO_OK_QUESTIONS.length;');
lines.push('');

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`Wrote ${outPath} (${bank.items.length} items)`);
