/**
 * 99문항 ↔ 구 표준 90·첨부 체크리스트 문항 (척도코드 + ego/ok 측정 주제)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '../..');
const dir = path.join(root, 'docs/internal-materials/ego-ok');

function plain(text) {
  return (text ?? '')
    .replace(/,\s*@/g, ', ')
    .replace(/@/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function indexKey(item) {
  if (item.egoIndex != null) return `ego ${item.egoIndex}`;
  if (item.okIndex != null) return `ok ${item.okIndex}`;
  return '';
}

function themeForItem(item, labels) {
  if (item.egoIndex != null) return labels.ego[String(item.egoIndex)] ?? '';
  if (item.okIndex != null) return labels.ok[String(item.okIndex)] ?? '';
  return '';
}

function tokenSet(text) {
  return new Set(plain(text).replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter(Boolean));
}

function similarity(a, b) {
  const sa = tokenSet(a);
  const sb = tokenSet(b);
  if (!sa.size || !sb.size) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / Math.max(sa.size, sb.size);
}

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
}

/** 첨부·96·100 시트 하단 타당도 문구 풀 (성격 90에는 없음) */
function loadAttachmentValidityPool() {
  const pool = [];
  for (const name of ['items-96.json', 'items-100.json']) {
    const bank = loadJson(name);
    for (const it of bank.items ?? []) {
      if (!it.scaleType?.startsWith('validity_')) continue;
      pool.push({
        scaleType: it.scaleType,
        text: plain(it.text),
        source: name,
      });
    }
  }
  const extra = loadJson('items-checklist-attachment-validity-ko.json');
  for (const row of extra.items ?? []) {
    pool.push({
      scaleType: row.scaleType,
      text: plain(row.text),
      source: 'attachment',
    });
  }
  return pool;
}

function pickValidityLegacy(item99, measurementStr, pool) {
  const sameScale = pool.filter((p) => p.scaleType === item99.scaleType);
  if (!sameScale.length) return '';
  let best = sameScale[0];
  let bestScore = -1;
  for (const p of sameScale) {
    const score = similarity(p.text, measurementStr);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best.text;
}

function personalityLegacy(item99, items90, labels) {
  const theme99 = themeForItem(item99, labels);
  const k = indexKey(item99);

  let candidates = items90.filter(
    (o) => indexKey(o) === k && o.scaleType === item99.scaleType,
  );
  if (candidates.length === 0 && k) {
    candidates = items90.filter((o) => indexKey(o) === k);
  }
  if (candidates.length === 0) {
    candidates = items90.filter(
      (o) =>
        o.scaleType === item99.scaleType &&
        themeForItem(o, labels) === theme99 &&
        theme99,
    );
  }
  if (candidates.length === 0) return '';

  if (candidates.length === 1) return plain(candidates[0].text);

  let best = candidates[0];
  let bestScore = -1;
  for (const c of candidates) {
    const score = similarity(c.text, item99.text);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return plain(best.text);
}

/**
 * @returns {Record<number, string>} 99번호 → 구90·첨부 문항
 */
export function buildLegacy90AttachmentTextBy99No(items99, labels, measurementByNo) {
  const items90 = loadJson('items-90.json').items;
  const validityPool = loadAttachmentValidityPool();
  const out = {};

  for (const item of items99) {
    const measure = measurementByNo[String(item.no)] ?? '';
    if (item.scaleType.startsWith('validity_')) {
      out[item.no] = pickValidityLegacy(item, measure, validityPool);
    } else {
      out[item.no] = personalityLegacy(item, items90, labels);
    }
  }
  return out;
}

export { plain, indexKey, themeForItem };
