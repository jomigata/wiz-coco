/**
 * 97~99 타당도 문항을 25·50·75번 뒤에 삽입, 100번은 VRIN(33번 대립) 일관성 문항.
 * 출력: docs/internal-materials/ego-ok/items-100.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const inPath = path.join(root, 'docs/internal-materials/ego-ok/items-100.json');
const outPath = inPath;

const bank = JSON.parse(fs.readFileSync(inPath, 'utf8'));
const base96 = bank.items.filter((i) => i.no <= 96).sort((a, b) => a.no - b.no);
if (base96.length !== 96) {
  console.error('Expected 96 base items');
  process.exit(1);
}

const EXTRA_IMC = {
  text: "검사 질문을 꼼꼼히 읽고 있는지 확인합니다. \n‘B. 그렇지 않다’를 선택해 주세요.",
  readingText: "검사 질문을 꼼꼼히 읽고 있는지 확인합니다. \n‘B. 그렇지 않다’를 선택해 주세요.",
  code: 'VX',
  egoIndex: null,
  okIndex: null,
  scaleType: 'validity_imc',
  _key: 'imc97',
};

const EXTRA_LIE = {
  text: '나는 한 번도 다른 사람에게 화를 낸 적이 없다.',
  readingText: '나는 한 번도 다른 사람에게 화를 낸 적이 없다.',
  code: 'VX',
  egoIndex: null,
  okIndex: null,
  scaleType: 'validity_lie',
  _key: 'lie98',
};

const EXTRA_INFREQ = {
  text: '지난 1년 동안 단 하루도 잠을 잔 적이 없다.',
  readingText: '지난 1년 동안 단 하루도 잠을 잔 적이 없다.',
  code: 'VX',
  egoIndex: null,
  okIndex: null,
  scaleType: 'validity_infreq',
  _key: 'infreq99',
};

const EXTRA_VRIN = {
  text: '나는 새로운 것에 전혀 호기심이 없고, \n알고 싶은 것도 전혀 없다.',
  readingText: '나는 새로운 것에 전혀 호기심이 없고, \n알고 싶은 것도 전혀 없다.',
  code: 'VX',
  egoIndex: null,
  okIndex: null,
  scaleType: 'validity_vrin',
  _key: 'vrin100',
  vrinPairOrigNo: 33,
};

function insertAfterNo(items, afterNo, payload) {
  const idx = items.findIndex((i) => i._origNo === afterNo);
  if (idx < 0) throw new Error(`afterNo ${afterNo} not found`);
  items.splice(idx + 1, 0, { ...payload, _origNo: payload._key });
}

const items = base96.map((i) => ({ ...i, _origNo: i.no }));

insertAfterNo(items, 25, EXTRA_IMC);
insertAfterNo(items, 50, EXTRA_LIE);
insertAfterNo(items, 75, EXTRA_INFREQ);
items.push({ ...EXTRA_VRIN, _origNo: 'vrin100' });

const origToNew = new Map();
items.forEach((it, i) => {
  const newNo = i + 1;
  origToNew.set(it._origNo, newNo);
  it.no = newNo;
  delete it._key;
});

/** 삽입 기준(구 96번 체계): after 25·50·75 각 +1 */
function mapOrig96(n) {
  let m = n;
  if (n > 25) m += 1;
  if (n > 50) m += 1;
  if (n > 75) m += 1;
  return m;
}

const vrinPairsOrig = [
  [3, 39],
  [5, 65],
  [23, 60],
  [53, 78],
];
const vrinPairs = [
  ...vrinPairsOrig.map(([a, b]) => [mapOrig96(a), mapOrig96(b)]),
  [mapOrig96(33), 100],
];

const imc97No = origToNew.get('imc97');
const lie98No = origToNew.get('lie98');
const infreq99No = origToNew.get('infreq99');

const validityItemNos = [
  mapOrig96(15),
  mapOrig96(30),
  mapOrig96(47),
  mapOrig96(63),
  mapOrig96(77),
  mapOrig96(90),
  imc97No,
  lie98No,
  infreq99No,
  100,
].sort((a, b) => a - b);

bank.id = 'ego-ok-100';
bank.title = '이고-OK그램 체크리스트 (100문항, 타당도 10문항 분산)';
bank.note =
  '90 성격 + 타당도 10. IMC 97→25번 뒤, L 98→50번 뒤, F 99→75번 뒤, VRIN 100(33번 대립). reorder: scripts/reorder-items-100.mjs';
bank.itemCount = 100;
bank.validityItemNos = validityItemNos;
bank.vrinPairs = vrinPairs;
bank.imcExtra = { no: imc97No, expectedLikert: 2 };
bank.lieExtra = { no: lie98No };
bank.infreqExtra = { no: infreq99No };
bank.items = items.map(({ _origNo, ...rest }) => rest);

fs.writeFileSync(outPath, JSON.stringify(bank, null, 2), 'utf8');

console.log('Wrote', outPath);
console.log('IMC extra no', imc97No);
console.log('LIE extra no', lie98No);
console.log('INFREQ extra no', infreq99No);
console.log('VRIN pairs', JSON.stringify(vrinPairs));
