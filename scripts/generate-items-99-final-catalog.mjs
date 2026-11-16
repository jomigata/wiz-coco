/**
 * Generate docs/internal-materials/ego-ok/items-99-final-catalog-ko.tsv
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/internal-materials/ego-ok/items-99.json'), 'utf8')
);
const tsvLines = fs.readFileSync(
  path.join(root, 'docs/internal-materials/ego-ok/items-99-source.tsv'),
  'utf8'
).trim().split(/\r?\n/);

const SHORT = {
  np_positive: 'NP+',
  np_negative: 'NP−',
  cp_positive: 'CP+',
  cp_negative: 'CP−',
  a_positive: 'A+',
  a_negative: 'A−',
  fc_positive: 'FC+',
  fc_negative: 'FC−',
  ac_positive: 'AC+',
  ac_negative: 'AC−',
  i_plus: 'I+',
  i_minus: 'I−',
  u_plus: 'U+',
  u_minus: 'U−',
  validity_infreq: 'F',
  validity_lie: 'L',
  validity_imc: 'IMC',
};

const POLARITY = {
  np_positive: '에고 긍정',
  np_negative: '에고 부정',
  cp_positive: '에고 긍정',
  cp_negative: '에고 부정',
  a_positive: '에고 긍정',
  a_negative: '에고 부정',
  fc_positive: '에고 긍정',
  fc_negative: '에고 부정',
  ac_positive: '에고 긍정',
  ac_negative: '에고 부정',
  i_plus: '오케이 긍정',
  i_minus: '오케이 부정',
  u_plus: '오케이 긍정',
  u_minus: '오케이 부정',
  validity_infreq: '타당도 F',
  validity_lie: '타당도 L',
  validity_imc: '타당도 IMC',
};

const FOCUS = {
  9: '과한 통찰(낯선 이 짐작); 성실→부정',
  15: '잘남·부러움 인정; 부정→L포장',
  26: '정서 깊이 부인; VRIN7; 성실→부정',
  38: '밀린 일 마무리 안도; 성실→동의',
  48: '피곤 시 쉼 인정; 부정→L포장',
  58: '사회비교 거의 없음; 성실→부정',
  68: '격려 후 기분·힘; 성실→동의',
  78: '작은 실수 거의 없음; 성실→부정',
  88: '서운함 인정; 부정→L포장',
};

const VRIN = {
  3: 'VRIN↔49(I+ vs I−)',
  4: 'VRIN↔81(CP− vs AC+)',
  5: 'VRIN↔60(U+ vs U−)',
  7: 'VRIN↔26(FC+ vs F)',
  11: 'VRIN↔46(A+ vs FC−)',
  26: 'VRIN↔7',
  46: 'VRIN↔11',
  49: 'VRIN↔3',
  60: 'VRIN↔5',
  81: 'VRIN↔4',
};

function focusLine(no, scaleType, text) {
  if (FOCUS[no]) return FOCUS[no];
  const t = text.replace(/\n/g, ' ');
  if (scaleType === 'a_positive') return '이성·계획·현실·대안(A+ 5문항)';
  if (scaleType === 'a_negative') return '규칙·실리·건조함·팩트(A− 5문항)';
  if (scaleType.startsWith('np_')) return scaleType.endsWith('positive') ? '돌봄·격려·공감(NP+)' : '과잉챙김·참견(NP−)';
  if (scaleType.startsWith('cp_')) return scaleType.endsWith('positive') ? '목표·양심·예의(CP+)' : '통제·비판·분노(CP−)';
  if (scaleType.startsWith('fc_')) return scaleType.endsWith('positive') ? '호기심·활력·직관(FC+)' : '충동·즉흥(FC−)';
  if (scaleType.startsWith('ac_')) return scaleType.endsWith('positive') ? '협력·예의·순응(AC+)' : '의존·억압·위축(AC−)';
  if (scaleType === 'i_plus') return '자기긍정·자신감(I+)';
  if (scaleType === 'i_minus') return '자기부정·불안·회피(I−)';
  if (scaleType === 'u_plus') return '타인수용·개방(U+)';
  if (scaleType === 'u_minus') return '타인비판·통제·거부(U−)';
  return t.slice(0, 40);
}

const out = [];
out.push(
  [
    '번호',
    '표기척도',
    'scaleType',
    '극성',
    'TA코드',
    '줄바꿈',
    '채점·연계',
    '측정요지',
    '최종문항',
  ].join('\t')
);

for (let i = 0; i < 99; i++) {
  const item = json.items[i];
  const src = tsvLines[i].slice(tsvLines[i].indexOf('\t') + 1);
  const no = item.no;
  const st = item.scaleType;
  const lb = SHORT[st] ?? st;
  const pol = POLARITY[st] ?? '';
  const br = src.includes('@') ? '수동(@)' : item.text.includes('\n') ? '자동(쉼표)' : '1줄';
  const sc = VRIN[no] ?? (st.startsWith('validity') ? (FOCUS[no]?.split(';')[0] ?? '') : '');
  const focus = focusLine(no, st, item.text);
  const text = item.text.replace(/\n/g, ' / ');
  out.push([no, lb, st, pol, item.code, br, sc, focus, text].join('\t'));
}

const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-final-catalog-ko.tsv');
fs.writeFileSync(outPath, `${out.join('\n')}\n`, 'utf8');
console.log('Wrote', outPath);