/**
 * items-96.json 각 문항에 readingText 추가 (의미 그룹 · 쉼표+공백 구분)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, '../docs/internal-materials/ego-ok/items-96.json');

const CLAUSE_BREAKS = [
  '."는 ',
  '."',
  ' 나는 ',
  ' 나의 ',
  ' 대체로 ',
  ' 달라도 ',
  ' 하더라도 ',
  ' 질책하기보다 ',
  ' 먼저 ',
  ' 보다는 ',
  ' 보다 ',
  ' 때는 ',
  ' 으로 ',
  ' 에서 ',
  ' 에게 ',
  ' 이나 ',
  ' 이나 ',
  ' 이면 ',
  ' 라도 ',
  ' 라면 ',
  ' 하면 ',
  ' 하므로 ',
  ' 하여 ',
  ' 하고 ',
  ' 해도 ',
  ' 않도록 ',
  ' 않고 ',
  ' 때 ',
  ' 경우 ',
  ' 이면 ',
  ' 면 ',
  ' 고 ',
  ' 며 ',
  ' 또는 ',
  ' 편이다',
  ' 편이 ',
  ' 것이다',
  ' 주십시오',
  ' 선택합니다',
  ' 있습니다',
  ' 없습니다',
  ' 한다',
  ' 된다',
  ' 있다',
  ' 없다',
];

const GROUP_GAP = ', ';

function isBadBreak(text, end) {
  const tail = text.slice(end).trimStart();
  if (/^[\.，,)\]"']/.test(tail)) return true;
  if (/^고(\s|$)/.test(tail)) return true;
  if (/^식/.test(tail)) return true;
  if (/^된다/.test(tail)) return true;
  if (/^는(\s|$)/.test(tail)) return true;
  const head = text.slice(0, end).trimEnd();
  if (head.endsWith('"') && !tail.startsWith('는')) return true;
  return false;
}

function findMidClauseBreak(text) {
  if (text.startsWith('나는 ') && text.length > 22) {
    const end = 3;
    if (!isBadBreak(text, end)) return end;
  }

  if (text.includes('하더라도 질책')) {
    const end = text.indexOf('하더라도 ') + '하더라도 '.length;
    if (!isBadBreak(text, end)) return end;
  }

  const quotedNe = text.indexOf('."는 ');
  if (quotedNe !== -1) {
    const end = quotedNe + '."는 '.length;
    if (!isBadBreak(text, end)) return end;
  }

  const target = text.length / 2;
  let best = null;
  let bestDist = Infinity;
  const patterns = [...CLAUSE_BREAKS].sort((a, b) => b.length - a.length);
  for (const pat of patterns) {
    let from = 0;
    while (from < text.length) {
      const idx = text.indexOf(pat, from);
      if (idx === -1) break;
      const end = idx + pat.length;
      if (end >= 5 && end <= text.length - 3 && !isBadBreak(text, end)) {
        const dist = Math.abs(end - target);
        if (dist < bestDist || (dist === bestDist && best != null && end < best)) {
          bestDist = dist;
          best = end;
        }
      }
      from = idx + 1;
    }
  }
  return best;
}

function splitGroups(text, depth = 0) {
  const trimmed = text.trim();
  if (!trimmed) return [''];
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  if (trimmed.length <= 12 || depth >= 4) return [trimmed];

  const breakAt = findMidClauseBreak(trimmed);
  if (breakAt == null) return [trimmed];

  const head = trimmed.slice(0, breakAt).trim();
  const tail = trimmed.slice(breakAt).trim();
  if (!head || !tail) return [trimmed];

  return [...splitGroups(head, depth + 1), ...splitGroups(tail, depth + 1)];
}

function toReadingText(text) {
  if (text.includes('\n')) {
    return text
      .split('\n')
      .map((line) => splitGroups(line).join(GROUP_GAP))
      .join('\n');
  }
  return splitGroups(text).join(GROUP_GAP);
}

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
for (const item of bank.items) {
  item.readingText = toReadingText(item.text);
  item.text = item.readingText;
}
fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Updated readingText for ${bank.items.length} items in items-96.json`);
