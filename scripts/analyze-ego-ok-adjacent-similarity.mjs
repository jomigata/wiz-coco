import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(root, '../src/data/egoOkQuestions.ts'), 'utf8');
const texts = [...src.matchAll(/no: (\d+), text: "((?:\\.|[^"\\])*)"/g)].map((m) => ({
  no: +m[1],
  text: m[2].replace(/\\n/g, ' ').replace(/\\"/g, '"'),
}));

const stop = new Set(
  '나는 나의 그는 그를 그녀를 다른 사람들 상대방 주변 사람들 편이다 때가 있다 것도 잘'.split(/\s+/)
);

function tokens(t) {
  return t
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stop.has(w));
}

function bigrams(t) {
  const s = t.replace(/\s/g, '');
  const out = new Set();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

function jaccard(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const uni = A.size + B.size - inter;
  return uni ? inter / uni : 0;
}

const pairs = [];
for (let i = 1; i < texts.length; i++) {
  const j = jaccard(texts[i - 1].text, texts[i].text);
  if (j >= 0.14) pairs.push({ a: texts[i - 1], b: texts[i], j });
}
pairs.sort((x, y) => y.j - x.j);
console.log('count', texts.length, 'pairs', pairs.length);
console.log(JSON.stringify(pairs.slice(0, 30), null, 2));
