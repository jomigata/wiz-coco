/**
 * 검토용: 99문항 종결 어미 매핑 + 변경 전·후 전문
 * 출력: docs/internal-materials/ego-ok/items-99-ending-mapping-ko.tsv
 *       docs/internal-materials/ego-ok/items-99-ending-mapping-ko.md
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const json = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/internal-materials/ego-ok/items-99.json'), 'utf8')
);

/**
 * @typedef {{ tag: string, likert: string, proposed: string | null, note?: string, elicitBefore?: number, elicitAfter?: number }} RowMeta
 * 자기보고 정확도 % — 주관적·휴리스틱(현장 데이터 아님). rubric은 MD 참고.
 */

/** proposed null = 변경 전과 동일(유지) */
const META = /** @type {Record<number, RowMeta>} */ ({
  1: { tag: 'action', likert: 'action', proposed: '흠을 잡기보다, 잘한 점이나 장점을 칭찬하곤 한다.' },
  2: { tag: 'effort', likert: 'action', proposed: '인정이나 예외보다, 정해진 규칙과 절차대로 정확히 맞추려 한다.' },
  3: { tag: 'state', likert: 'agree', proposed: '나 자신의 성격과 삶의 방식을, 있는 그대로 받아들이고 아낀다.' },
  4: {
    tag: 'action',
    likert: 'action',
    proposed: '함께하다가 의견이 갈릴 때, 상대보다 내 판단이 맞다고 보고 끝까지 주장하곤 한다.',
  },
  5: { tag: 'think', likert: 'think', proposed: '의견이 달라도, 서로 생각이 다를 수 있다고 받아들인다.' },
  6: { tag: 'action', likert: 'action', proposed: '주변 시선이 신경 쓰여, 사소한 행동도 지나치게 조심하곤 한다.' },
  7: {
    tag: 'action',
    likert: 'action',
    proposed: '사람들과 어울릴 때, 속마음을 숨기기보다 편하게 웃고 즐기곤 한다.',
  },
  8: {
    tag: 'feel_often',
    likert: 'feel_often',
    proposed: '사람들에게 호감이나 좋은 인상을 주지 못한다고, 느낄 때가 많다.',
  },
  9: {
    tag: 'validity_feel',
    likert: 'validity_stmt',
    proposed: '낯선 사람을 만나도, 얼마 지나지 않아 그 사람 성격을 꽤 잘 안다고 느낀다.',
    note: 'F; 성실→부정',
  },
  10: {
    tag: 'difficulty',
    likert: 'pyeon',
    proposed: '남들의 사소한 실수나 약속 어김은, 대충 넘기기 어렵고 용서하기 어렵다.',
    note: '이중 어렵다 — Likert는 그렇다/아니다 혼용 주의',
  },
  11: {
    tag: 'action',
    likert: 'action',
    proposed: '문제가 생겼을 때, 감정보다 차분하고 이성적으로 대처하곤 한다.',
  },
  12: { tag: 'action', likert: 'action', proposed: '가까운 사람이 실수하지 않도록, 미리 챙겨 알려 주곤 한다.' },
  13: { tag: 'feel', likert: 'feel_state', proposed: '내가 속한 곳에서, 나의 역할을 다하며 기여하고 있다고 느낀다.' },
  14: { tag: 'action', likert: 'action', proposed: '남의 행동이나 일 처리에, 쓴소리나 지적을 쉽게 하곤 한다.' },
  15: { tag: 'validity_freq', likert: 'validity_stmt', proposed: null, note: 'L; 유지' },
  16: { tag: 'effort', likert: 'action', proposed: '의견이 엇갈리면, 양쪽이 조금씩 양보해 맞추려 한다.' },
  17: { tag: 'action', likert: 'action', proposed: '해야 할 일이 있어도, 기분에 따라 미루거나 바꿔 버리곤 한다.' },
  18: { tag: 'think', likert: 'think', proposed: null, note: '이미 ~본다' },
  19: { tag: 'think', likert: 'think', proposed: '어릴 적, 든든하게 받쳐 주는 관계가 없었다고 생각한다.' },
  20: {
    tag: 'difficulty',
    likert: 'pyeon',
    proposed: '남들의 뚜렷한 성과나 좋은 결과에, 선뜻 인정하고 칭찬하기가 어렵다.',
  },
  21: { tag: 'action', likert: 'action', proposed: '이야기할 때, 상대 말에 귀 기울이고 마음을 헤아려 주곤 한다.' },
  22: { tag: 'action', likert: 'action', proposed: '사람을 대하거나 일할 때, 손해와 이익을 먼저 따져보곤 한다.' },
  23: { tag: 'effort', likert: 'effort', proposed: '현실에만 안주하지 않고, 더 높은 목표를 향해 꾸준히 노력한다.' },
  24: { tag: 'desire', likert: 'desire', proposed: '힘들거나 곤란할 때, 스스로보다 누군가에게 의지하고 싶어진다.' },
  25: {
    tag: 'hear',
    likert: 'hear',
    proposed: '가까운 사람들이, 나와 있으면 의지가 된다고 말하는 경우가 많다.',
  },
  26: {
    tag: 'validity_abs',
    likert: 'validity_stmt',
    proposed: '살면서 기쁨이나 분노를, 마음 깊이 느껴본 적이 거의 없다.',
    note: 'F',
  },
  27: { tag: 'state', likert: 'agree', proposed: '남이 잘되면, 내 일처럼 기분이 좋아진다.' },
  28: { tag: 'action', likert: 'action', proposed: '다른 사람 눈치나 규칙보다, 내가 편한 방식을 먼저 택하곤 한다.' },
  29: { tag: 'feel', likert: 'feel_often', proposed: '내 능력이나 잠재력을, 잘 믿지 못해 자주 불안해한다.' },
  30: { tag: 'action', likert: 'action', proposed: '누가 곤란해 보여도, 나서 돕기보다 스스로 해결하게 두곤 한다.' },
  31: {
    tag: 'action',
    likert: 'action',
    proposed: '일이 애매하거나 꼬이면, 내 뜻대로 해석하기보다 사실과 근거부터 따져보곤 한다.',
  },
  32: { tag: 'action', likert: 'action', proposed: '가정이나 일터에서, 남의 일에 자주 끼어들어 참견하곤 한다.' },
  33: { tag: 'desire', likert: 'desire', proposed: '새로운 것을 보면 호기심이 들어, 직접 시도해 보고 싶어진다.' },
  34: { tag: 'action', likert: 'action', proposed: '여럿이 함께 일할 때, 내가 방향과 진행 속도를 잡아 가곤 한다.' },
  35: { tag: 'action', likert: 'action', proposed: '내 방식이 더 낫다고 느껴도, 억지로 따르게 하지 않는다.' },
  36: { tag: 'action', likert: 'action', proposed: '서운한 일이 있어도, 말로 풀지 못하고 혼자 마음에 담아 두곤 한다.' },
  37: { tag: 'action', likert: 'action', proposed: '새로운 일이 생기면, 망설이기보다 먼저 판단하고 행동한다.' },
  38: {
    tag: 'imc_state',
    likert: 'imc_meta',
    proposed: '오래 미뤄 둔 일을 끝냈을 때, 마음이 한결 가벼워진다.',
    note: 'IMC',
  },
  39: { tag: 'feel', likert: 'feel_often', proposed: '문제가 생기거나 일이 어긋나면, 먼저 내가 잘못한 것 같다고 느끼곤 한다.' },
  40: { tag: 'action', likert: 'action', proposed: '의견을 나눌 때, 맞추기보다 내 원칙을 먼저 내세운다.' },
  41: { tag: 'action', likert: 'action', proposed: '여럿이 일할 때, 서로 호흡을 맞추며 돕곤 한다.' },
  42: {
    tag: 'state',
    likert: 'hear',
    proposed: '말할 때 농담이나 감정 표현을 잘 안 하고, 건조하게 들리는 경우가 많다.',
    note: '타인 평가·인상',
  },
  43: { tag: 'action', likert: 'action', proposed: '힘들어하는 사람을 보면, 도움을 제안하며 함께 방법을 찾곤 한다.' },
  44: { tag: 'effort', likert: 'effort', proposed: '작은 이득보다, 양심에 부끄럽지 않게 바르게 행동하려 한다.' },
  45: { tag: 'state', likert: 'pyeon', proposed: '내 외모나 첫인상에, 대체로 만족한다.' },
  46: { tag: 'action', likert: 'action', proposed: '어떤 일이 마음에 꽂히면, 뒷일 생각 없이 일단 행동하곤 한다.' },
  47: { tag: 'action', likert: 'action', proposed: '동료가 실수해도, 탓하기보다 격려한다.' },
  48: {
    tag: 'imc_desire',
    likert: 'imc_meta',
    proposed: '몸이 무겁게 지친 날에는, 잠깐이라도 쉬고 싶어진다.',
    note: 'L/피로 인정; IMC 성격 혼재 아님·L 유지 권장',
  },
  49: { tag: 'feel_sometimes', likert: 'feel_sometimes', proposed: '가끔은 나 자신이, 많이 부족하거나 무기력하게 느껴진다.' },
  50: { tag: 'feel', likert: 'feel_often', proposed: '상대가 내 기대에 못 미치면, 답답하고 화가 난다.' },
  51: { tag: 'action', likert: 'action', proposed: '일이나 상황을 볼 때, 막연한 기대보다 지금 확인된 현실부터 본다.' },
  52: { tag: 'feel', likert: 'action', proposed: '남의 고민이나 걱정을, 내 일처럼 끌어안고 신경 쓰곤 한다.' },
  53: { tag: 'action', likert: 'action', proposed: '복잡하게 따지지 않고, 첫 느낌으로 상황을 빠르게 파악한다.' },
  54: { tag: 'difficulty', likert: 'pyeon', proposed: '상식이나 기본 매너에서 벗어난 행동을 보면, 받아들이기 어렵다.' },
  55: { tag: 'feel', likert: 'feel_state', proposed: '나는 따뜻한 관심 속에서 자랐다고 느낀다.' },
  56: { tag: 'action', likert: 'action', proposed: '사소한 선택도 혼자 정하기 어려워, 결국 가까운 사람이 정한 쪽을 따른다.' },
  57: { tag: 'effort', likert: 'pyeon', proposed: '상대의 단점이나 약한 점도, 고치려 하기보다 있는 그대로 받아들이려 한다.' },
  58: {
    tag: 'validity_abs',
    likert: 'validity_stmt',
    proposed: '다른 사람과 나를 비교해서 생각하는 일이, 거의 없다.',
    note: 'F',
  },
  59: { tag: 'difficulty', likert: 'pyeon', proposed: '실패가 두려워, 새로운 일이나 도전에 선뜻 나서지 못한다.' },
  60: { tag: 'feel', likert: 'feel_often', proposed: '나와 생각이나 가치관이 다르면, 거부감이 들어 마음을 닫는다.' },
  61: { tag: 'hear', likert: 'hear', proposed: '주위에서 예의 바르고 착하다는 말을 종종 듣는다.' },
  62: {
    tag: 'action',
    likert: 'action',
    proposed: '의문이 생긴 말을 들으면, 끝까지 사실·근거가 맞는지 확인하곤 한다.',
  },
  63: { tag: 'action', likert: 'action', proposed: '주변 사람들의 노력과 성장을, 따뜻하게 격려하고 응원한다.' },
  64: { tag: 'action', likert: 'action', proposed: '남이 보지 않아도, 공공 질서와 규칙을 지킨다.' },
  65: { tag: 'state', likert: 'pyeon', proposed: '내가 잘하는 분야에서는, 자신감이 있다.' },
  66: { tag: 'validity_freq', likert: 'validity_stmt', proposed: null, note: '이미 ~때가 있다' },
  67: { tag: 'state', likert: 'pyeon', proposed: '다른 사람을 쉽게 의심하기보다, 대체로 신뢰한다.' },
  68: {
    tag: 'imc_state',
    likert: 'imc_meta',
    proposed: '칭찬이나 따뜻한 격려를 들으면, 기분이 한결 나고 힘이 조금 생긴다.',
    note: 'IMC',
  },
  69: { tag: 'feel_often', likert: 'feel_often', proposed: null, note: '이미 ~때가 많다' },
  70: { tag: 'action', likert: 'action', proposed: '사람들과 이야기할 때, 잘한 점보다 고칠 점을 먼저 말한다.' },
  71: { tag: 'action', likert: 'action', proposed: '일이 뜻대로 안 풀릴 때, 걱정만 하기보다 실행할 대안부터 찾는다.' },
  72: { tag: 'action', likert: 'action', proposed: '부탁받지 않아도, 남의 할 일을 내가 대신 해 버리곤 한다.' },
  73: { tag: 'state', likert: 'action', proposed: '긍정적이고 활기찬 기운으로, 일상을 보낸다.' },
  74: { tag: 'action', likert: 'action', proposed: '사소한 일에도 답답해져, 쉽게 욱하며 화를 내곤 한다.' },
  75: { tag: 'think', likert: 'think', proposed: null },
  76: { tag: 'action', likert: 'action', proposed: '마음에 안 들어도, 그 사람 앞에서는 평소처럼 대한다.' },
  77: { tag: 'action', likert: 'action', proposed: '가까운 사람들과 연락을 이어 가며, 관계를 유지한다.' },
  78: {
    tag: 'validity_abs',
    likert: 'validity_stmt',
    proposed: '일상에서 깜빡하거나 착각해, 작은 실수를 한 적이 거의 없다.',
    note: 'F',
  },
  79: { tag: 'state', likert: 'pyeon', proposed: '사람들과 어울리는 자리가 부담돼서, 혼자 있으려 한다.' },
  80: { tag: 'feel', likert: 'feel_often', proposed: '다른 사람이 아무리 친절해도, 속마음까지는 믿기 어렵다고 느낀다.' },
  81: { tag: 'action', likert: 'action', proposed: '함께 정한 결론이 있으면, 내 뜻과 달라도 따른다.' },
  82: {
    tag: 'action',
    likert: 'action',
    proposed: '친한 사람이 힘들다고 털어놓으면, 들어 주기보다 원인과 어떻게 할지부터 말한다.',
  },
  83: { tag: 'effort', likert: 'action', proposed: '상대가 실수를 해도, 탓하지 않고 상황을 이해하려 한다.' },
  84: { tag: 'effort', likert: 'effort', proposed: '아무리 바빠도, 말과 행동에서 기본 예의를 지키려 한다.' },
  85: {
    tag: 'action',
    likert: 'action',
    proposed: '사람들 앞에서는 대체로 긴장하지 않고, 내 생각을 자연스럽게 표현한다.',
  },
  86: { tag: 'action', likert: 'action', proposed: '조용하고 진지해야 할 자리에서, 나도 모르게 가볍게 행동하곤 한다.' },
  87: { tag: 'think', likert: 'think', proposed: null },
  88: { tag: 'validity_freq', likert: 'validity_stmt', proposed: null },
  89: { tag: 'difficulty', likert: 'feel_often', proposed: '내 옷차림이나 스타일에, 만족하지 못해 자신이 없다.' },
  90: { tag: 'effort', likert: 'action', proposed: '중요한 일은 남에게 맡기기보다, 내가 직접 처리하려 한다.' },
  91: { tag: 'action', likert: 'action', proposed: '새로 맡은 일을 시작하기 전, 순서와 계획을 먼저 잡는다.' },
  92: {
    tag: 'difficulty',
    likert: 'pyeon',
    proposed: '힘들거나 바빠도 내 마음이 불편해, 남의 부탁을 쉽게 거절하지 못한다.',
  },
  93: { tag: 'action', likert: 'action', proposed: '화가 나면, 상대가 내 말에 동의할 때까지 계속 밀어붙인다.' },
  94: { tag: 'action', likert: 'action', proposed: '평소 사소한 행동이라도, 남에게 불편이 없도록 주위를 보며 행동한다.' },
  95: { tag: 'effort', likert: 'effort', proposed: '맡은 일이 힘들어도, 책임을 느끼며 끝까지 해내려 한다.' },
  96: { tag: 'ability', likert: 'agree', proposed: null, note: '이미 ~할 수 있다' },
  97: {
    tag: 'difficulty',
    likert: 'pyeon',
    proposed: '혼자 결정해야 할 때, 틀릴까 봐 걱정되어 쉽게 결론을 내지 못한다.',
  },
  98: { tag: 'action', likert: 'action', proposed: '일이 잘 안 풀려도, 포기하지 않고 다시 시도한다.' },
  99: { tag: 'state', likert: 'action', proposed: '뻔하지 않고 색다른 아이디어가, 자주 떠오른다.' },
});

const TAG_LABEL = {
  action: '행동·습관 (~하곤 한다)',
  effort: '의도·노력 (~하려 한다 / 노력한다)',
  think: '인지·가치 (~생각한다 / 본다)',
  feel: '정서·자기감 (~느낀다)',
  feel_often: '정서 빈도 (~때가 많다 / 느끼곤 한다)',
  feel_sometimes: '가끔 정서 (~때도 있다 / 느껴진다)',
  desire: '욕구 (~싶어진다)',
  difficulty: '어려움·장벽 (~하기 어렵다 / 못한다)',
  state: '상태·반응 (~된다 / ~한다 직설)',
  hear: '타인 말·평 (~듣는다)',
  validity_freq: '타당도 빈도 (~때가 있다)',
  validity_abs: '타당도 절대 (~거의 없다)',
  validity_feel: '타당도 과장 (~느낀다)',
  imc_state: 'IMC 현상 (~된다)',
  imc_desire: 'IMC 욕구 (~싶어진다)',
  ability: '역량 (~할 수 있다)',
  pyeon_keep: '유지 (~편이다)',
};

function flattenText(t) {
  return t.replace(/\n/g, ' ').trim();
}

function displayText(t) {
  return t.includes('\n') ? t.replace(/\n/g, ' / ') : t;
}

function clampElicit(n) {
  return Math.max(52, Math.min(93, Math.round(n)));
}

/** 변경 전: 종결·문장구조 기반 휴리스틱 */
function scoreElicitBefore(text, scaleType, no) {
  const t = flattenText(text);
  let score;
  const factors = [];

  if (/생각한다\.?$/.test(t) || /본다\.?$/.test(t)) {
    score = 88;
    factors.push('인지종결');
  } else if (/할 수 있다\.?$/.test(t)) {
    score = 86;
    factors.push('역량종결');
  } else if (/때가 많다\.?$/.test(t)) {
    score = 85;
    factors.push('빈도명시');
  } else if (/때가 있다\.?$/.test(t)) {
    score = 87;
    factors.push('빈도명시');
  } else if (/편이다\.?\s*$/.test(t)) {
    score = 73;
    factors.push('편이다(성향뭉개기)');
  } else {
    score = 74;
    factors.push('기타종결');
  }

  if (/어렵고.+어려운 편|넘기기 어렵고 용서하기 어려운 편/.test(t)) {
    score -= 10;
    factors.push('이중어려움+편');
  } else if (
    /어려운 편|못하는 편|나서지 못하는 편|거절하지 못하는 편|내지 못하는 편|자신 없는 편|받아들이기 어려운 편/.test(
      t
    )
  ) {
    score -= 6;
    factors.push('장벽+편');
  }

  if (/느끼는 편이다/.test(t)) {
    score -= 5;
    factors.push('정서+편이중');
  }
  if (/싶어지는 편이다/.test(t)) {
    score -= 4;
    factors.push('욕구+편이중');
  }
  if (scaleType.startsWith('validity') && /편이다/.test(t)) {
    score -= 9;
    factors.push('타당도+편');
  }
  if (/말하는 편이다/.test(t) && !/내가/.test(t.slice(0, 20))) {
    score -= 7;
    factors.push('타인발화혼동');
  }
  if (/없는 편이다|거의 없는 편/.test(t)) {
    score -= 8;
    factors.push('절대부인+편');
  }
  if (/좋아지는 편|가벼워지는 편|생기는 편|떠오르는 편/.test(t)) {
    score -= 2;
    factors.push('반응+편');
  }

  const stigma = [14, 32, 60, 70, 80, 93];
  if (stigma.includes(no)) {
    score -= 1;
    factors.push('사회바람직성');
  }

  return { score: clampElicit(score), factors: factors.join(';') || '—' };
}

const TAG_ELICIT_AFTER = {
  action: 84,
  effort: 83,
  think: 87,
  feel: 86,
  feel_often: 87,
  feel_sometimes: 88,
  desire: 85,
  difficulty: 84,
  state: 83,
  hear: 82,
  validity_freq: 87,
  validity_abs: 85,
  validity_feel: 79,
  imc_state: 86,
  imc_desire: 87,
  ability: 86,
};

/** 변경 후: 측정태그 + (통일 Likert 미적용 시 감점) */
function scoreElicitAfter(tag, scaleType, no, changed) {
  if (!changed) return null;
  let score = TAG_ELICIT_AFTER[tag] ?? 82;
  const factors = [`종결태그:${tag}`];

  if (!['ability', 'validity_freq', 'imc_state', 'imc_desire'].includes(tag)) {
    score -= 3;
    factors.push('Likert통일감점(-3)');
  }
  if (scaleType.startsWith('validity') && tag === 'validity_feel') {
    score -= 3;
    factors.push('F과장주장');
  }
  if (no === 25) {
    score -= 2;
    factors.push('타인말빈도');
  }
  if (no === 42) {
    score -= 2;
    factors.push('타인인상추정');
  }
  if (no === 52) {
    score -= 1;
    factors.push('정서·몰입혼합');
  }
  if (no === 9) {
    score -= 2;
  }

  return { score: clampElicit(score), factors: factors.join(';') };
}

const rows = json.items.map((item) => {
  const m = META[item.no];
  if (!m) throw new Error(`Missing META for item ${item.no}`);
  const before = item.text;
  const after = m.proposed ?? before;
  const changed = flattenText(before) !== flattenText(after) ? 'Y' : 'N';
  const beforeE = scoreElicitBefore(before, item.scaleType, item.no);
  let elicitBefore = m.elicitBefore ?? beforeE.score;
  let elicitFactorsBefore = beforeE.factors;
  let elicitAfter;
  let elicitFactorsAfter;
  if (changed === 'N') {
    elicitAfter = m.elicitAfter ?? elicitBefore;
    elicitFactorsAfter = '유지';
  } else {
    const afterE = scoreElicitAfter(m.tag, item.scaleType, item.no, true);
    elicitAfter = m.elicitAfter ?? afterE.score;
    elicitFactorsAfter = afterE.factors;
  }
  const elicitDelta = elicitAfter - elicitBefore;
  return {
    no: item.no,
    scaleType: item.scaleType,
    tag: m.tag,
    tagKo: TAG_LABEL[m.tag] ?? m.tag,
    likert: m.likert,
    changed,
    before: displayText(before),
    after: displayText(m.proposed ? after : before),
    note: m.note ?? '',
    elicitBefore,
    elicitAfter,
    elicitDelta,
    elicitFactorsBefore,
    elicitFactorsAfter,
  };
});

const outDir = path.join(root, 'docs/internal-materials/ego-ok');
const tsvPath = path.join(outDir, 'items-99-ending-mapping-ko.tsv');
const mdPath = path.join(outDir, 'items-99-ending-mapping-ko.md');

const tsvHeader =
  '번호\tscaleType\t종결태그\t종결태그설명\tLikert템플릿\t변경여부\t속마음정확도_변경전%\t속마음정확도_변경후%\t증감%p\t변경전요인\t변경후요인\t변경전문장\t변경후문장\t비고\n';
const tsvBody = rows
  .map(
    (r) =>
      [
        r.no,
        r.scaleType,
        r.tag,
        r.tagKo,
        r.likert,
        r.changed,
        r.elicitBefore,
        r.elicitAfter,
        r.elicitDelta >= 0 ? `+${r.elicitDelta}` : String(r.elicitDelta),
        r.elicitFactorsBefore.replace(/\t/g, ' '),
        r.elicitFactorsAfter.replace(/\t/g, ' '),
        r.before.replace(/\t/g, ' '),
        r.after.replace(/\t/g, ' '),
        r.note.replace(/\t/g, ' '),
      ].join('\t')
  )
  .join('\n');
fs.writeFileSync(tsvPath, tsvHeader + tsvBody + '\n', 'utf8');

const changedCount = rows.filter((r) => r.changed === 'Y').length;
const avg = (arr) => Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
const meanBefore = avg(rows.map((r) => r.elicitBefore));
const meanAfter = avg(rows.map((r) => r.elicitAfter));
const meanDelta = avg(rows.map((r) => r.elicitDelta));
const changedRows = rows.filter((r) => r.changed === 'Y');
const meanBeforeChg = avg(changedRows.map((r) => r.elicitBefore));
const meanAfterChg = avg(changedRows.map((r) => r.elicitAfter));
const md = `# 이고-오케이 99문항 — 종결 어미 매핑 (적용 전 검토용)

> **상태:** 미적용 · \`items-99-source.tsv\` / 빌드 반영 전  
> **생성:** \`node scripts/generate-items-99-ending-mapping.mjs\`  
> **스프레드시트:** [items-99-ending-mapping-ko.tsv](./items-99-ending-mapping-ko.tsv)

## 요약

| 항목 | 값 |
|------|-----|
| 전체 문항 | 99 |
| \`~편이다\` → 다른 종결 **제안** | ${changedCount} |
| **유지** (이미 적합·타당도·생각/능력형) | ${99 - changedCount} |

## 자기보고·속마음 정확도 %(휴리스틱)

> **주의:** 아래 %는 내담자 실증 데이터가 아니라, 문장구조·종결어미·Likert 정렬 가정에 따른 **전문가 휴리스틱 점수**입니다. 100%는 이론적 상한에 가깝습니다.

### 채점 루브릭 (문항당 가중 개념)

| 요소 | 비중 | 설명 |
|------|------|------|
| 구성 타당 정렬 | 40% | 행동·생각·정서·장벽에 맞는 종결인가 |
| 응답 지침 명료성 | 25% | 동의 시 무엇을 인정하는지 분명한가 |
| 방어·사회적 바람직성 | 20% | 덜 \`모범답안\`처럼 읽히는가 |
| 빈도·강도 앵커 | 15% | \`때가 있다\`·\`하곤 한다\` 등 빈도 추정 가능한가 |

- **변경 전** \`~편이다\` 기본 73점에서 이중어미·타당도+편·정서+편 등 **감점**.
- **변경 후** 종결태그 기본 82–88점에서 **Likert 통일 UI 미연동 −3** (제안 어미만 적용 시).
- **유지 문항**은 변경 전·후 % **동일**.

### 평균 (99문항)

| 구분 | 변경 전 % | 변경 후 % | Δ |
|------|----------:|----------:|---:|
| 전체 | ${meanBefore} | ${meanAfter} | +${meanDelta} |
| 변경 제안 91문항만 | ${meanBeforeChg} | ${meanAfterChg} | +${(meanAfterChg - meanBeforeChg).toFixed(1)} |

### 종결 태그 범례

| 태그 | 설명 | Likert 제안 키 (참고: items-99-likert-labels-proposal) |
|------|------|--------------------------------------------------------|
${Object.entries(TAG_LABEL)
  .map(([k, v]) => `| \`${k}\` | ${v} | (문항별 likert 열 참고) |`)
  .join('\n')}

### 적용 시 주의

1. **UI Likert** — 현재는 전 문항 동일 5지선다. 어미를 바꾸면 [items-99-likert-labels-proposal-ko.md](./items-99-likert-labels-proposal-ko.md) 의 \`Likert템플릿\` 열과 맞추는 것이 좋습니다.
2. **줄바꿈** — 표시는 " / " 로 통일. 적용 시 소스 TSV의 @·쉼표 규칙은 [items-99-reading-linebreak-ko.md](./items-99-reading-linebreak-ko.md) 를 따릅니다.
3. **타당도 9문항** — L·F·IMC는 \`validity_stmt\` / \`imc_meta\` 위주로 **편이다 제거**만 제안합니다.
4. **VRIN 쌍** — 4↔81, 5↔60 등 문체를 쌍마다 대칭 맞출지 검토하세요.

---

## 전 문항: 정확도 % · 변경 전 · 변경 후

| No | 척도 | Chg | 전% | 후% | Δ | 변경 전 | 변경 후 |
|---:|------|:---:|---:|---:|---:|---------|---------|
${rows
  .map(
    (r) => {
      const d = r.elicitDelta >= 0 ? `+${r.elicitDelta}` : String(r.elicitDelta);
      return `| ${r.no} | ${r.scaleType} | ${r.changed} | ${r.elicitBefore} | ${r.elicitAfter} | ${d} | ${r.before.replace(/\|/g, '\\|')} | ${r.after.replace(/\|/g, '\\|')} |`;
    }
  )
  .join('\n')}

---

## 태그별 문항 번호

${Object.keys(TAG_LABEL)
  .map((tag) => {
    const nos = rows.filter((r) => r.tag === tag).map((r) => r.no);
    if (!nos.length) return '';
    return `- **${tag}** (${nos.length}): ${nos.join(', ')}`;
  })
  .filter(Boolean)
  .join('\n')}
`;

fs.writeFileSync(mdPath, md, 'utf8');
console.log(`Wrote ${tsvPath}`);
console.log(`Wrote ${mdPath}`);
console.log(`Changed: ${changedCount} / 99`);