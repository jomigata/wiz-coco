/**
 * docs/internal-materials/ego-ok/items-96-canonical-text.json → items-96.json text / readingText
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const canonicalPath = path.join(root, 'docs/internal-materials/ego-ok/items-96-canonical-text.json');
const bankPath = path.join(root, 'docs/internal-materials/ego-ok/items-96.json');

const { texts } = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
if (texts.length !== 96) {
  console.error(`Expected 96 texts, got ${texts.length}`);
  process.exit(1);
}

const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
if (bank.items.length !== 96) {
  console.error(`Expected 96 items, got ${bank.items.length}`);
  process.exit(1);
}

for (let i = 0; i < 96; i++) {
  const item = bank.items.find((x) => x.no === i + 1);
  if (!item) {
    console.error(`Missing item no ${i + 1}`);
    process.exit(1);
  }
  const text = texts[i];
  item.text = text;
  item.readingText = text;
}

bank.note =
  '90 성격 문항 + 타당도 6문항(15,30,47,63,77,90). 타당도 문항은 척도 합산에서 제외. 문항 본문: items-96-canonical-text.json.';

fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log('Applied canonical text to items-96.json (96 items)');
