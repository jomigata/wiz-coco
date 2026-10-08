import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'docs/internal-materials/ego-ok/items-96.json');
const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-100.json');

const bank = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
bank.id = 'ego-ok-100';
bank.title = '이고-OK그램 체크리스트 (100문항, 타당도 10문항)';
bank.itemCount = 100;
bank.note =
  '90 성격 문항 + 타당도 10문항(15,30,47,63,77,90 + 97~100). 타당도 문항은 척도 합산에서 제외. 97~100은 2026-10 타당도 정밀화 추가분.';
bank.validityItemNos = [15, 30, 47, 63, 77, 90, 97, 98, 99, 100];

const extra = [
  {
    no: 97,
    text: "검사 질문을 꼼꼼히 읽고 있는지 확인합니다. \n‘B. 그렇지 않다’를 선택해 주세요.",
    readingText: "검사 질문을 꼼꼼히 읽고 있는지 확인합니다. \n‘B. 그렇지 않다’를 선택해 주세요.",
    code: 'VX',
    egoIndex: null,
    okIndex: null,
    scaleType: 'validity_imc',
  },
  {
    no: 98,
    text: "나는 한 번도 다른 사람에게 화를 낸 적이 없다.",
    readingText: "나는 한 번도 다른 사람에게 화를 낸 적이 없다.",
    code: 'VX',
    egoIndex: null,
    okIndex: null,
    scaleType: 'validity_lie',
  },
  {
    no: 99,
    text: "지난 1년 동안 단 하루도 잠을 잔 적이 없다.",
    readingText: "지난 1년 동안 단 하루도 잠을 잔 적이 없다.",
    code: 'VX',
    egoIndex: null,
    okIndex: null,
    scaleType: 'validity_infreq',
  },
  {
    no: 100,
    text: "응답 주의력 확인: 이 문항만 \n‘C. 보통이다’를 선택해 주세요.",
    readingText: "응답 주의력 확인: 이 문항만 \n‘C. 보통이다’를 선택해 주세요.",
    code: 'VX',
    egoIndex: null,
    okIndex: null,
    scaleType: 'validity_imc',
  },
];

bank.items = [...bank.items, ...extra];
fs.writeFileSync(outPath, JSON.stringify(bank, null, 2), 'utf8');
console.log(`Wrote ${outPath} (${bank.items.length} items)`);
