/**
 * items-96.json 각 문항에 readingText 추가 (의미 그룹 · U+3000 간격, 쉼표 없음)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, '../docs/internal-materials/ego-ok/items-96.json');

const CLAUSE_BREAKS = [
  '."는 ',
  '."',
  ' 보다는 ',
  ' 보다 ',
  ' 때는 ',
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

const GROUP_GAP = '\u3000\u3000';

function isBadBreak(text, end) {
  const tail = text.slice(end).trimStart();
  if (/^[\.，,)\]"']/.test(tail)) return true;
  if (/^고(\s|$)/.test(tail)) return true;
  const head = text.slice(0, end).trimEnd();
  if (head.endsWith('"') && !tail.startsWith('는')) return true;
  return false;
}

function findMidClauseBreak(text) {
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
        if (dist < bestDist) {
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
  if (trimmed.length <= 14 || depth >= 2) return [trimmed];

  const breakAt = findMidClauseBreak(trimmed);
  if (breakAt == null) return [trimmed];

  const head = trimmed.slice(0, breakAt).trim();
  const tail = trimmed.slice(breakAt).trim();
  if (!head || !tail) return [trimmed];

  const groups = [...splitGroups(head, depth + 1), ...splitGroups(tail, depth + 1)];
  if (groups.length <= 3) return groups;
  return [groups[0], groups.slice(1, -1).join(' '), groups[groups.length - 1]];
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
}
fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`, 'utf8');
console.log(`Updated readingText for ${bank.items.length} items in items-96.json`);
