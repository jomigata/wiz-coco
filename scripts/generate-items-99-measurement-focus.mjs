/**
 * items-99-measurement-focus-ko.json 생성 (측정 주제·기준점 일상어)
 * node scripts/generate-items-99-measurement-focus.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bank = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/internal-materials/ego-ok/items-99.json'), 'utf8'),
);
const labels = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/internal-materials/ego-ok/item-subscale-diagnosis-ko.json'),
    'utf8',
  ),
);

const VALIDITY = {
  9: {
    topic: '시간·하루의 길이',
    criterion: '24시간·오늘과 내일처럼 현실적인 시간 감각',
  },
  15: {
    topic: '가까운 사람에게 짜증·투정',
    criterion: '피곤·예민할 때 솔직히 짜증이 나는 경험(과도한 부인 여부)',
  },
  26: {
    topic: '기쁨·분노·슬픔 등 감정 경험',
    criterion: '평생 한 번도 감정이 없었다는 식의 비현실적 답변',
  },
  38: {
    topic: '갑작스러운 소리·위험',
    criterion: '놀람 반응이 있는지(무성의·부주의 응답)',
  },
  48: {
    topic: '피곤할 때 쉬고 싶음',
    criterion: '지칠 때 게으름·회피 욕구를 솔직히 인정하는지',
  },
  58: {
    topic: '잠 없이 완벽 집중',
    criterion: '무수면·무피로 주장의 비현실성',
  },
  68: {
    topic: '과로·수면 부족과 피로',
    criterion: '무리하면 피곤해지는 보통의 몸 반응',
  },
  78: {
    topic: '감기·두통 등 작은 병',
    criterion: '잔병치레가 전혀 없었다는 비현실적 답변',
  },
  88: {
    topic: '가까운 사람에게 서운함',
    criterion: '사소한 말·행동에 서운함을 느끼는 보통의 경험',
  },
};

function themeFor(item) {
  if (item.egoIndex != null) return labels.ego[String(item.egoIndex)] ?? '';
  if (item.okIndex != null) return labels.ok[String(item.okIndex)] ?? '';
  return '';
}

function lifeArea(item) {
  if (item.scaleType.startsWith('validity_')) return '응답 성실·현실성';
  if (item.egoIndex != null) return '역할·행동 패턴';
  return '자기·타인에 대한 느낌';
}

function focusLine(item) {
  const v = VALIDITY[item.no];
  if (v) {
    return `측정 주제: ${v.topic}. 기준점: ${v.criterion}`;
  }
  const theme = themeFor(item);
  const area = lifeArea(item);
  return `측정 주제: ${theme} (${area}). 기준점: 평소 일상·관계에서 문장과 같이 느껴지고 행동하는 정도`;
}

const byNo = {};
for (const item of bank.items) {
  byNo[String(item.no)] = focusLine(item);
}

const out = {
  note: '비교 TSV 7열(측정주제·기준점). 전문 척도명 대신 일상어 주제·기준.',
  byNo,
};

const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-measurement-focus-ko.json');
fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(`Wrote ${outPath} (${Object.keys(byNo).length} items)`);
