/**
 * 성격 90문항 순서 유지 + 타당도 9문항 + VRIN(100) 재배치
 * 인접 ±5 키워드 유사도 최소, 타당도 간 최소 간격·시작/말미 회피
 *
 * node scripts/spread-validity-neighbors.mjs [--write]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonPath = path.join(__dirname, '../docs/internal-materials/ego-ok/items-100.json');
const WRITE = process.argv.includes('--write');

const WINDOW = 5;
const MIN_VALIDITY_GAP = 8;
const MIN_VALIDITY_POS = 8;
const MAX_VALIDITY_POS = 94;

const VALIDITY_THEMES = {
  validity_lie: [
    '거짓',
    '험담',
    '화',
    '분노',
    '약속',
    '늦',
    '시간',
    '도덕',
    '양심',
    '비난',
    '칭찬',
    '선의',
    '믿',
    '완벽',
    '한 번도',
    '단 한',
  ],
  validity_imc: ['검사', '선택', '주의', '확인', '질문', '읽', '그렇다', '지시', '따르'],
  validity_infreq: ['잠', '수면', '음식', '물', '섭취', '소리', '듣', '한 달', '1년', '단 하루'],
};

function line(t) {
  return (t ?? '').replace(/\s+/g, ' ').trim();
}

function scoreNeighbor(validityItem, personalityText) {
  const themes = VALIDITY_THEMES[validityItem.scaleType] ?? [];
  let s = 0;
  for (const kw of themes) {
    if (personalityText.includes(kw)) s += kw.length > 2 ? 2 : 1;
  }
  return s;
}

function buildSequence(personality, validityNine, insertAfterCounts) {
  /** insertAfterCounts[k] = personality index (0..90) after which to insert validity k (sorted) */
  const out = [];
  let v = 0;
  for (let p = 0; p < personality.length; p++) {
    out.push(personality[p]);
    while (v < validityNine.length && insertAfterCounts[v] === p) {
      out.push(validityNine[v++]);
    }
  }
  while (v < validityNine.length) {
    out.push(validityNine[v++]);
  }
  return out;
}

function sequenceScore(seq) {
  let total = 0;
  for (let i = 0; i < seq.length; i++) {
    const it = seq[i];
    if (!it.scaleType?.startsWith('validity_') || it.scaleType === 'validity_vrin') continue;
    const pos = i + 1;
    if (pos < MIN_VALIDITY_POS || pos > MAX_VALIDITY_POS) total += 50;
    for (let d = -WINDOW; d <= WINDOW; d++) {
      if (d === 0) continue;
      const j = i + d;
      if (j < 0 || j >= seq.length) continue;
      const other = seq[j];
      if (other.scaleType?.startsWith('validity_')) continue;
      total += scoreNeighbor(it, line(other.text));
    }
  }
  // validity proximity penalty (first 99 only)
  const vPos = seq
    .map((it, idx) => ({ it, idx: idx + 1 }))
    .filter(({ it }) => it.scaleType?.startsWith('validity_') && it.scaleType !== 'validity_vrin')
    .map(({ idx }) => idx);
  for (let a = 0; a < vPos.length; a++) {
    for (let b = a + 1; b < vPos.length; b++) {
      const g = Math.abs(vPos[a] - vPos[b]);
      if (g < MIN_VALIDITY_GAP) total += (MIN_VALIDITY_GAP - g) * 15;
    }
  }
  return total;
}

function renumber(items) {
  items.forEach((it, i) => {
    it.no = i + 1;
  });
}

const bank = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const all = bank.items.map((it) => ({ ...it }));

const validityNine = all.filter(
  (i) => i.scaleType?.startsWith('validity_') && i.scaleType !== 'validity_vrin'
);
const personality = all.filter((i) => !i.scaleType?.startsWith('validity_'));
const vrin = all.find((i) => i.scaleType === 'validity_vrin');

if (personality.length !== 90 || validityNine.length !== 9) {
  console.error('Expected 90 personality + 9 validity, got', personality.length, validityNine.length);
  process.exit(1);
}

// Current insert-after indices
function currentInsertAfter() {
  const ins = [];
  let p = 0;
  for (const it of all) {
    if (it.scaleType?.startsWith('validity_') && it.scaleType !== 'validity_vrin') {
      ins.push(p - 1);
    } else if (!it.scaleType?.startsWith('validity_')) {
      p++;
    }
  }
  return ins;
}

let bestIns = currentInsertAfter();
let bestScore = sequenceScore(buildSequence(personality, validityNine, bestIns));
console.log('Current score:', bestScore, 'insertAfter', bestIns);

// Greedy local search: shift each validity insertion among personality anchors
for (let pass = 0; pass < 400; pass++) {
  let improved = false;
  for (let k = 0; k < 9; k++) {
    for (let trial = -12; trial <= 12; trial++) {
      const ins = [...bestIns];
      ins[k] = Math.max(-1, Math.min(personality.length - 1, ins[k] + trial));
      for (let j = 1; j < 9; j++) {
        if (ins[j] < ins[j - 1]) ins[j] = ins[j - 1];
      }
      const seq = buildSequence(personality, validityNine, ins);
      if (seq.length !== 99) continue;
      const sc = sequenceScore(seq);
      if (sc < bestScore) {
        bestScore = sc;
        bestIns = ins;
        improved = true;
      }
    }
  }
  if (!improved) break;
}

// Try permuting validity order (L/F/IMC) at same slots
const perms = [
  validityNine,
  [...validityNine].sort((a, b) => a.scaleType.localeCompare(b.scaleType)),
];
let bestValid = validityNine;
let seqBest = buildSequence(personality, validityNine, bestIns);
let scBest = sequenceScore(seqBest);

for (const order of perms) {
  const seq = buildSequence(personality, order, bestIns);
  const sc = sequenceScore(seq);
  if (sc < scBest) {
    scBest = sc;
    bestValid = order;
    seqBest = seq;
  }
}

// Brute assign validity types to slots: 3 IMC, 3 L, 3 F — try matching slot difficulty
const imc = validityNine.filter((i) => i.scaleType === 'validity_imc');
const lie = validityNine.filter((i) => i.scaleType === 'validity_lie');
const inf = validityNine.filter((i) => i.scaleType === 'validity_infreq');

function assignAndScore(orderGroups) {
  const ordered = [...orderGroups[0], ...orderGroups[1], ...orderGroups[2]];
  const seq = buildSequence(personality, ordered, bestIns);
  return { sc: sequenceScore(seq), ordered, seq };
}

let bestAssign = bestValid;
let bestAssignScore = scBest;
let bestAssignSeq = seqBest;

for (let t = 0; t < 200; t++) {
  const sh = (arr) => [...arr].sort(() => Math.random() - 0.5);
  const trial = assignAndScore([sh(imc), sh(lie), sh(inf)]);
  if (trial.sc < bestAssignScore) {
    bestAssignScore = trial.sc;
    bestAssign = trial.ordered;
    bestAssignSeq = trial.seq;
  }
}

console.log('Best score:', bestAssignScore, 'insertAfter', bestIns);

const final99 = bestAssignSeq;
const final100 = [...final99, vrin];
renumber(final100);

// Map old validity numbers (from bank before change)
const OLD_VALIDITY = [15, 26, 31, 48, 52, 65, 78, 80, 93];
function key(it) {
  return line(it.text);
}
const oldBank = bank.items;
console.log('\n=== 타당도 9문항 구(이전 100은행) → 신 번호 ===');
for (const oldNo of OLD_VALIDITY) {
  const oldIt = oldBank.find((i) => i.no === oldNo);
  const neu = final100.find((i) => key(i) === key(oldIt));
  console.log(`${oldNo} → ${neu?.no}\t${oldIt.scaleType}\t${line(oldIt.text).slice(0, 55)}`);
}

console.log('\n=== 신 타당도 9문항 (오름차순) ===');
console.log(
  final100
    .filter((i) => i.scaleType?.startsWith('validity_') && i.scaleType !== 'validity_vrin')
    .map((i) => i.no)
    .join(', ')
);

console.log('\n=== 신 타당도 10문항 (VRIN 포함) ===');
console.log(
  final100
    .filter((i) => i.scaleType?.startsWith('validity_'))
    .map((i) => i.no)
    .join(', ')
);

if (WRITE) {
  const pairTexts = [
    ['나는 나 자신을 좋아하고', '가끔은 나 자신이, 아무런 가치도 없는'],
    ['너그럽게 받아들인다', '강하게 비판하게 된다'],
    ['냉정함을 유지하는 편이다', '즉흥적으로 행동하는 편이다'],
    ['지배하려는 성향이 강하다', '독립성이, 부족한 편이다'],
    ['새로운 것에 호기심이 많고', '전혀 호기심이 없고'],
  ];
  function noBySubstr(sub) {
    return final100.find((i) => line(i.text).includes(sub))?.no;
  }
  const vrinPairs = pairTexts.map(([a, b]) => [noBySubstr(a), noBySubstr(b)]);

  bank.items = final100;
  bank.validityItemNos = final100.filter((i) => i.scaleType?.startsWith('validity_')).map((i) => i.no);
  bank.vrinPairs = vrinPairs;
  bank.note =
    '90 성격 + 타당도 10. Validity spread: scripts/spread-validity-neighbors.mjs --write';
  bank.imcExtra = {
    no: final100.find((i) => line(i.text).includes('B. 그렇지 않다'))?.no,
    expectedLikert: 2,
  };
  bank.lieExtra = {
    no: final100.find((i) => line(i.text) === '나는 한 번도 다른 사람에게 화를 낸 적이 없다.')?.no,
  };
  bank.infreqExtra = {
    no: final100.find((i) => line(i.text).includes('단 하루도 잠을'))?.no,
  };

  fs.writeFileSync(jsonPath, JSON.stringify(bank, null, 2), 'utf8');
  console.log('\nWrote', jsonPath);
  console.log('VRIN pairs', JSON.stringify(vrinPairs));
}
