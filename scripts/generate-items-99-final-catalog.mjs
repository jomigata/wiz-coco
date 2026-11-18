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

/** NP− 5문항 소분류 (items-99-wording-comparison · scale-criteria) */
const NP_NEGATIVE_FOCUS = {
  12: '미리 알림·예방 챙김(NP−)',
  32: '참견·간섭(NP−)',
  52: '타인 고민 과몰입(NP−)',
  72: '선의의 대신 해줌(NP−)',
  92: '부탁 거절 시 내 불편·거절 곤란(NP−)',
};

/** A± 10문항 — items-99-a-scale-discriminant-ko.md */
const A_POSITIVE_TOPIC = {
  11: '돌발 시 이성·침착',
  31: '사실·근거 우선 해석',
  51: '확인된 현실 우선',
  71: '막힐 때 대안 실행',
  91: '착수 전 순서·계획',
};
const A_NEGATIVE_TOPIC = {
  2: '규칙·절차 우선',
  22: '손익·득실 계산',
  42: '말투 건조·감정 표현 적음',
  62: '진위·사실 확인 우선',
  82: '위로보다 이유·해결',
};

/** NP+ 5문항 — 최종 문장과 wording TSV가 어긋난 항목 */
const NP_POSITIVE_TOPIC = {
  43: '도움 제안·함께 방법 찾기',
  83: '실수 비난 대신 이해',
};

/** AC+ 5문항 — 최종 문장과 wording TSV가 어긋난 항목 */
const AC_POSITIVE_TOPIC = {
  16: '의견 엇갈릴 때 상호 양보',
  41: '여럿일 때 호흡·돕기',
  81: '집단 결론 수용',
};

/** AC− 5문항 — 최종 문장과 wording TSV가 어긋난 항목 */
const AC_NEGATIVE_TOPIC = {
  36: '서운·불만 말로 못 풀고 담음',
  76: '싫어도 대면 평소처럼 대함',
};

/** CP− 5문항 — 최종 문장과 wording TSV가 어긋난 항목 */
const CP_NEGATIVE_TOPIC = {
  4: '같이 할 때 내 방식·말로 지시',
  34: '역할·순서대로 진행 통제',
};

/** 최종 문장과 wording TSV가 어긋난 항목 */
const TOPIC_OVERRIDE = {
  57: '상대 감정·동기 이해',
};

function loadWordingTopics() {
  const p = path.join(root, 'docs/internal-materials/ego-ok/items-99-wording-comparison.tsv');
  const byNo = {};
  for (const line of fs.readFileSync(p, 'utf8').trim().split(/\r?\n/).slice(1)) {
    const cols = line.split('\t');
    const no = Number(cols[0]);
    if (!no) continue;
    const raw = cols[7] ?? '';
    const m = raw.match(/측정 주제:\s*([^.(]+)/);
    let topic = m ? m[1].trim().replace(/\.$/, '') : '';
    if (topic.includes('기준점')) topic = topic.split('. 기준점')[0].trim();
    byNo[no] = topic;
  }
  return byNo;
}

const WORDING_TOPIC = loadWordingTopics();

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

function focusLine(no, scaleType) {
  if (FOCUS[no]) return FOCUS[no];
  const lb = SHORT[scaleType];
  if (!lb) throw new Error(`Unknown scaleType for item ${no}: ${scaleType}`);

  let topic =
    NP_NEGATIVE_FOCUS[no] ??
    (scaleType === 'np_positive' ? NP_POSITIVE_TOPIC[no] : undefined) ??
    (scaleType === 'ac_positive' ? AC_POSITIVE_TOPIC[no] : undefined) ??
    (scaleType === 'ac_negative' ? AC_NEGATIVE_TOPIC[no] : undefined) ??
    (scaleType === 'cp_negative' ? CP_NEGATIVE_TOPIC[no] : undefined) ??
    (scaleType === 'a_positive' ? A_POSITIVE_TOPIC[no] : undefined) ??
    (scaleType === 'a_negative' ? A_NEGATIVE_TOPIC[no] : undefined) ??
    TOPIC_OVERRIDE[no] ??
    WORDING_TOPIC[no];

  if (!topic) throw new Error(`Missing 측정요지 for item ${no}`);
  if (/\([^)]+\)$/.test(topic)) return topic;
  return `${topic}(${lb})`;
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
  const focus = focusLine(no, st);
  const text = item.text.replace(/\n/g, ' / ');
  out.push([no, lb, st, pol, item.code, br, sc, focus, text].join('\t'));
}

const focusSeen = new Map();
for (const line of out.slice(1)) {
  const focus = line.split('\t')[7];
  if (!focusSeen.has(focus)) focusSeen.set(focus, []);
  focusSeen.get(focus).push(line.split('\t')[0]);
}
for (const [focus, nos] of focusSeen) {
  if (nos.length > 1) {
    console.warn(`Duplicate 측정요지 "${focus}" at items ${nos.join(', ')}`);
  }
}

const outPath = path.join(root, 'docs/internal-materials/ego-ok/items-99-final-catalog-ko.tsv');
fs.writeFileSync(outPath, `${out.join('\n')}\n`, 'utf8');
console.log('Wrote', outPath);