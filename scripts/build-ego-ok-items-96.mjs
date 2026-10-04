/**
 * Build items-96.json from items-90 + 6 dispersed validity items + text/index patches.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const in90 = path.join(root, 'docs/internal-materials/ego-ok/items-90.json');
const out96 = path.join(root, 'docs/internal-materials/ego-ok/items-96.json');

const bank90 = JSON.parse(fs.readFileSync(in90, 'utf8'));
let items = bank90.items.map((x) => ({ ...x }));

/** old 90-item no → partial patch (applied before insert) */
const PATCH_OLD = {
  2: { text: '"내가 시키는 대로 하면 된다."는 식으로 말한다.' },
  6: { scaleType: 'a_positive' },
  10: { text: '주변 사람들이 실수하지 않도록 사소한 부분까지 챙겨주는 편이다.' },
  12: { text: '좋은 일이나 나쁜 일이나 양심에 따라 행동한다.' },
  28: { text: '동료가 실패하더라도 질책하기보다 먼저 격려하려고 노력한다.' },
  29: { text: '남의 일에는 아랑곳하지 않고 내가 하고싶은대로 행동한다.' },
  30: { text: '나는 내 판단에 자신이 없어 다른 사람들이 하는 대로 따르는 편이다.' },
  38: { text: '나는 상대의 인격을 존중하고 그의 기본까지도 수용한다.' },
  39: { text: '감각적이고 직관이 강하다. (경험, 연상, 추리를 하지 않고 직접적으로 바로 판단함.)' },
  41: { text: '나는 실패가 두려워서 일에 선뜻 손을 대지 못할 때가 있다.' },
  46: { text: '문제를 다룰 때 감정을 배제하고 제3자의 객관적 사실에 근거하여 판단한다.' },
  60: { text: '상대가 부탁하지 않더라도 내가 먼저 나서서 일을 대신해 주곤 한다.' },
  69: { text: '원칙이나 논리에 맞지 않는 일은 납득할 만한 이유가 없으면 받아들이지 않는다.' },
  81: { text: '화가 나면 상대방을 강하게 몰아붙이거나 거칠게 질책한다.' },
};

for (const [no, patch] of Object.entries(PATCH_OLD)) {
  const idx = Number(no) - 1;
  items[idx] = { ...items[idx], ...patch };
}

const VALIDITY = [
  {
    pos: 15,
    item: {
      text: '살면서 단 한 번도 남의 험담이나 사소한 거짓말을 해본 적이 없다.',
      code: 'VX',
      egoIndex: null,
      okIndex: null,
      scaleType: 'validity_lie',
    },
  },
  {
    pos: 30,
    item: {
      text: "이 문항은 주의력을 확인하기 위한 질문입니다. '전혀 그렇지 않다(1번)'를 선택해 주십시오.",
      code: 'VX',
      egoIndex: null,
      okIndex: null,
      scaleType: 'validity_imc',
    },
  },
  {
    pos: 47,
    item: {
      text: '나는 지난 한 달 동안 단 하루도 음식이나 물을 섭취하지 않았다.',
      code: 'VX',
      egoIndex: null,
      okIndex: null,
      scaleType: 'validity_infreq',
    },
  },
  {
    pos: 63,
    item: {
      text: '약속 시간에 단 1분이라도 늦거나 어겨본 적이 평생 한 번도 없다.',
      code: 'VX',
      egoIndex: null,
      okIndex: null,
      scaleType: 'validity_lie',
    },
  },
  {
    pos: 77,
    item: {
      text: "설문에 성실히 참여하고 계시는지 확인하는 문항입니다. '매우 그렇다(5번)'를 선택해 주십시오.",
      code: 'VX',
      egoIndex: null,
      okIndex: null,
      scaleType: 'validity_imc',
    },
  },
  {
    pos: 90,
    item: {
      text: '가끔 벽이나 바닥에서 정체불명의 악마 목소리가 선명하게 들린다.',
      code: 'VX',
      egoIndex: null,
      okIndex: null,
      scaleType: 'validity_infreq',
    },
  },
];

for (const { pos, item } of VALIDITY) {
  items.splice(pos - 1, 0, item);
}

items = items.map((it, i) => ({ ...it, no: i + 1 }));

if (items.length !== 96) {
  console.error('Expected 96 items, got', items.length);
  process.exit(1);
}

const bank96 = {
  id: 'ego-ok-96',
  title: '이고-OK그램 체크리스트 (96문항, 타당도 분산)',
  status: 'canonical',
  sourceFile: '검사 - 종합 설문지 결과 기준치_2020.04.01.xlsx + 타당도 분산(2026)',
  note: '90 성격 문항 + 타당도 6문항(15,30,47,63,77,90). 타당도 문항은 척도 합산에서 제외.',
  itemCount: 96,
  validityItemNos: [15, 30, 47, 63, 77, 90],
  items,
};

fs.writeFileSync(out96, JSON.stringify(bank96, null, 2), 'utf8');
console.log('Wrote', out96);
