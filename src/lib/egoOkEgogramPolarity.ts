import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';

/** 부정성 비율(긍정+부정 합 대비) 구간 */
export type EgogramNegativeBand =
  | 'within40'
  | '41-45'
  | '46-50'
  | '51-55'
  | '56-60'
  | 'over60';

export type EgogramPolarityRow = {
  id: EgoScaleId;
  label: string;
  positiveRaw: number;
  negativeRaw: number;
  total: number;
  positivePct: number;
  negativePct: number;
  band: EgogramNegativeBand;
  bandLabel: string;
  /** ≤40%: 긍정 장점 · 그 외: 주의·대책 */
  strengths: string[];
  cautions: string[];
  remedies: string[];
};

const BAND_LABEL: Record<EgogramNegativeBand, string> = {
  within40: '부정 40% 이하 (권장)',
  '41-45': '부정 41~45% (경미 주의)',
  '46-50': '부정 46~50% (주의)',
  '51-55': '부정 51~55% (강한 주의)',
  '56-60': '부정 56~60% (고강도 주의)',
  over60: '부정 60% 초과 (즉시 개입 권고)',
};

export function classifyEgogramNegativePct(negativePct: number): EgogramNegativeBand {
  if (negativePct <= 40) return 'within40';
  if (negativePct <= 45) return '41-45';
  if (negativePct <= 50) return '46-50';
  if (negativePct <= 55) return '51-55';
  if (negativePct <= 60) return '56-60';
  return 'over60';
}

type ScaleCopy = {
  strengths: string[];
  byBand: Record<Exclude<EgogramNegativeBand, 'within40'>, { cautions: string[]; remedies: string[] }>;
};

const SCALE_COPY: Record<EgoScaleId, ScaleCopy> = {
  CP: {
    strengths: [
      '원칙·기준을 세워 조직과 역할을 안정시키는 힘',
      '책임감과 완결성으로 위기 시 방향을 잡는 리더십',
      '규범을 통해 타인을 보호하려는 건강한 부모 기능',
    ],
    byBand: {
      '41-45': {
        cautions: ['비판 톤이 잦아지면 관계가 방어적으로 굳어질 수 있습니다.'],
        remedies: ['피드백 전 “의도(돕기)”를 한 문장으로 말한 뒤 요청하세요.'],
      },
      '46-50': {
        cautions: ['옳고 그름에 집착하면 유연성과 공감이 줄어듭니다.'],
        remedies: ['규칙 1개를 협의·조정 가능한 항목으로 바꿔 보세요.'],
      },
      '51-55': {
        cautions: ['통제·잔소리로 인식되어 친밀감이 떨어지기 쉽습니다.'],
        remedies: ['주 1회 “칭찬·인정만” 대화 시간을 따로 잡으세요.'],
      },
      '56-60': {
        cautions: ['타인의 자율을 위협하는 CP가 되기 쉬워 갈등이 반복됩니다.'],
        remedies: ['상담에서 CP 트리거 상황을 기록하고, 대체 문장 3개를 연습하세요.'],
      },
      over60: {
        cautions: ['비판적 부모가 관계·팀 분위기를 지속적으로 위축시킬 수 있습니다.'],
        remedies: ['즉시 “STOP-호흡-재프레이밍” 루틴과 구조화된 분노·비판 관리 상담을 권합니다.'],
      },
    },
  },
  NP: {
    strengths: [
      '타인을 돌보고 정서적 안전감을 주는 능력',
      '공감·격려로 관계 회복과 협력을 이끄는 힘',
      '온기 있는 양육적 부모로 조직 문화를 부드럽게 만듦',
    ],
    byBand: {
      '41-45': {
        cautions: ['과잉 배려가 자신의 한계를 넘어설 수 있습니다.'],
        remedies: ['돕기 전 “오늘 내가 줄 수 있는 시간”을 먼저 정하세요.'],
      },
      '46-50': {
        cautions: ['거절 guilt·people-pleasing이 커질 수 있습니다.'],
        remedies: ['“아니오” 대신 “이때는 가능/불가” 형태로 경계를 연습하세요.'],
      },
      '51-55': {
        cautions: ['타인 문제를 떠안아 번아웃·resentment로 이어지기 쉽습니다.'],
        remedies: ['돌봄 일지를 쓰며 감정 노동량을 가시화하세요.'],
      },
      '56-60': {
        cautions: ['희생형 NP로 고정되면 관계가 불균형·의존적으로 변합니다.'],
        remedies: ['상담에서 역할 재분담·자기 돌봄 계획을 구체화하세요.'],
      },
      over60: {
        cautions: ['과보호·과개입이 상대 성장을 막고 관계 갈등을 키울 수 있습니다.'],
        remedies: ['즉시 돌봄 중단·위임 연습과 NP-CP 균형 코칭을 병행하세요.'],
      },
    },
  },
  A: {
    strengths: [
      '사실·데이터 기반으로 문제를 분석하는 냉정함',
      '감정과 분리해 합리적 선택을 내리는 성인 기능',
      '중재·협상에서 객관성을 유지하는 힘',
    ],
    byBand: {
      '41-45': {
        cautions: ['감정 표현이 줄면 “차갑다”는 인상을 줄 수 있습니다.'],
        remedies: ['결론 전 감정 한 줄(인정)을 습관화하세요.'],
      },
      '46-50': {
        cautions: ['지나친 이성화로 관계 니즈를 놓치기 쉽습니다.'],
        remedies: ['대화 목표를 “해결”과 “연결” 둘 다로 설정하세요.'],
      },
      '51-55': {
        cautions: ['감정 회피·거리두기가 커질 수 있습니다.'],
        remedies: ['주 1회 감정 라벨링(이름 붙이기) 연습을 권합니다.'],
      },
      '56-60': {
        cautions: ['성인 기능이 방어적 냉소로 변질될 수 있습니다.'],
        remedies: ['상담에서 A-only 대화 패턴과 트리거를 분석하세요.'],
      },
      over60: {
        cautions: ['감정 단절·무관심으로 위기 신호를 놓칠 위험이 큽니다.'],
        remedies: ['정서 교류 훈련·신체감각 기반 접근 등 A-감정 통합 상담을 권합니다.'],
      },
    },
  },
  FC: {
    strengths: [
      '창의·유희· spontaneity로 관계에 활력을 줌',
      '새 아이디어·실험 정신으로 변화를 주도',
      '진솔한 감정 표현으로 친밀감을 높임',
    ],
    byBand: {
      '41-45': {
        cautions: ['즉흥성이 커지면 약속·일정 관리가 흔들릴 수 있습니다.'],
        remedies: ['중요 일정만 “고정 블록”으로 달력에 넣으세요.'],
      },
      '46-50': {
        cautions: ['충동·지름길 선택이 늘 수 있습니다.'],
        remedies: ['결정 전 10분 지연 규칙을 적용해 보세요.'],
      },
      '51-55': {
        cautions: ['쾌락·회피 쪽 FC가 강해져 책임 회피로 보일 수 있습니다.'],
        remedies: ['즐거움 활동과 의무 활동을 1:1 짝지어 계획하세요.'],
      },
      '56-60': {
        cautions: ['규칙·타인 기대를 무시하는 행동으로 갈등이 커질 수 있습니다.'],
        remedies: ['상담에서 FC 폭주 상황·대가를 기록하고 대체 행동을 설계하세요.'],
      },
      over60: {
        cautions: ['무모·중독적 패턴(과소비·과음 등) 위험 신호를 점검해야 합니다.'],
        remedies: ['즉시 안전 계획·충동 조절 프로토콜과 전문 연계를 검토하세요.'],
      },
    },
  },
  AC: {
    strengths: [
      '협력·순응으로 팀 조화와 신뢰를 만듦',
      '규칙·역할을 지켜 안정적 수행을 보장',
      '타인 눈치를 빠르게 읽어 갈등을 완화',
    ],
    byBand: {
      '41-45': {
        cautions: ['착한 아이가 과해지면 자기 욕구 표현이 줄어듭니다.'],
        remedies: ['작은 요청 1가지를 매일 명확히 말하는 연습을 하세요.'],
      },
      '46-50': {
        cautions: ['불만을 삼키며 수동·우울감이 쌓일 수 있습니다.'],
        remedies: ['“I-message” 3문장 템플릿을 일지에 써 보세요.'],
      },
      '51-55': {
        cautions: ['과순응·자기비하 AC가 자존감을 깎을 수 있습니다.'],
        remedies: ['거절·지연 응답 연습과 AC-CP 내면 비판 분리를 하세요.'],
      },
      '56-60': {
        cautions: ['억압·희생이 폭발적 수동공격·신체화로 이어질 수 있습니다.'],
        remedies: ['상담에서 억압 감정·몸 신호를 추적하고 assertiveness 훈련을 권합니다.'],
      },
      over60: {
        cautions: ['자기 부정·공포 기반 순응이 관계·진로 선택을 크게 제한할 수 있습니다.'],
        remedies: ['즉시 자기주장·경계 설정 집중 상담과 243+·속마음 탭을 함께 참고하세요.'],
      },
    },
  },
};

export function buildEgogramPolarityRows(egogram: EgoOkScaleScore[]): EgogramPolarityRow[] {
  return egogram.map((s) => {
    const total = s.positiveRaw + s.negativeRaw;
    const positivePct = total > 0 ? Math.round((s.positiveRaw / total) * 100) : 0;
    const negativePct = total > 0 ? Math.round((s.negativeRaw / total) * 100) : 0;
    const band = classifyEgogramNegativePct(negativePct);
    const copy = SCALE_COPY[s.id];
    const strengths = copy.strengths;
    let cautions: string[] = [];
    let remedies: string[] = [];
    if (band === 'within40') {
      cautions = ['부정 사용 비율이 비교적 낮습니다. 긍정 기능을 강화·유지하는 방향이 유리합니다.'];
      remedies = ['강점을 구체적 행동으로 유지(칭찬, 경계, 휴식, 계획)하세요.'];
    } else {
      const tier = copy.byBand[band];
      cautions = tier.cautions;
      remedies = tier.remedies;
    }
    return {
      id: s.id,
      label: s.label,
      positiveRaw: s.positiveRaw,
      negativeRaw: s.negativeRaw,
      total,
      positivePct,
      negativePct,
      band,
      bandLabel: BAND_LABEL[band],
      strengths,
      cautions,
      remedies,
    };
  });
}

export function negativeBandTone(band: EgogramNegativeBand): string {
  switch (band) {
    case 'within40':
      return 'text-emerald-300 ring-emerald-500/30';
    case '41-45':
      return 'text-sky-300 ring-sky-500/30';
    case '46-50':
      return 'text-amber-200 ring-amber-500/30';
    case '51-55':
      return 'text-orange-300 ring-orange-500/40';
    case '56-60':
      return 'text-rose-300 ring-rose-500/40';
    default:
      return 'text-rose-200 ring-rose-600/50';
  }
}
