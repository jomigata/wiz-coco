/**
 * 2020.04.02 이고그램총합 원고(서은숙) — docs/internal-materials/egogram-manual/source-before-243.txt
 * 9단계(243+플러스) 구간만 사용. 충돌 시 이 모듈 문구가 egogramEnergyStageComments보다 우선.
 */
import type { EgoOkScaleScore, EgoScaleId } from '@/lib/egoOkScoring';
import type { Plus243Stage, Plus243Tier } from '@/lib/egogram243Plus';
import {
  formatCurrentStageLeadIn,
  isPlus243RecommendedStage,
  plus243StageBand,
  rawScoreToPlus243Tier,
} from '@/lib/egogram243Plus';

export type ManualInsightRole = 'peak' | 'low' | 'inRange' | 'offRange';

export type ManualNineStageBlock = {
  /** 상담자용 한 줄 특징 */
  trait: string;
  strengths: string[];
  cautions: string[];
  /** 에너지를 키울 때(1~3단계·최저) */
  raiseMeasures: string[];
  /** 에너지를 낮출 때(7~9단계·최고) */
  lowerMeasures: string[];
};

type BandKey = 'deficit' | 'normal' | 'excess';

const CP: Record<BandKey, Omit<ManualNineStageBlock, 'raiseMeasures' | 'lowerMeasures'>> = {
  deficit: {
    trait: 'CP가 낮으면 관용적·느슨·무절제로 보일 수 있고, 규범·도덕·가치관을 자신과 타인에게 잘 요구하지 않습니다.',
    strengths: [
      '틀에 얽매이지 않고 유연하게 관계를 맺을 여지가 있습니다.',
      '지나친 통제 없이 분위기를 부드럽게 만드는 면이 있습니다.',
    ],
    cautions: [
      '사회생활에서 신뢰받기 어렵거나, 중요한 일을 ‘구렁이 담넘어 가듯’ 흐릿하게 처리한다는 인상을 줄 수 있습니다.',
      'CP가 낮고 FC가 높으면 감정대로 행동해 주변을 긴장시키기 쉽습니다.',
    ],
  },
  normal: {
    trait: 'CP가 권장 구간(4~6단계)을 넘어 높아지면 이상·양심·책임·권위적 특성이 강해져 상대에게 안정감을 주기도 합니다.',
    strengths: [
      '원칙과 책임감을 바탕으로 일을 끝까지 해내려는 태도가 있습니다.',
      '기준과 질서를 지키려는 긍정적 CP 면이 드러납니다.',
    ],
    cautions: [
      '권위적 태도가 강해지면 상대가 반발하거나 위축될 수 있습니다.',
      '7단계 이상으로 치솟으면 비판·통제 쪽으로 기울기 쉬우니 강도 조절이 필요합니다.',
    ],
  },
  excess: {
    trait: 'CP가 지나치면 자기·타인에게 엄격한 주장을 강요하고 비판적이며, 상대의 말을 잘 듣지 않습니다.',
    strengths: [
      '사명감·책임감 있는 일에 몰입해 나태함을 줄이는 힘이 있습니다.',
      '정해진 규칙과 약속을 지키려는 면이 뚜렷합니다.',
    ],
    cautions: [
      '상대는 위축되어 말을 하지 않게 되고, 관계가 경직될 수 있습니다.',
      'CP·AC가 함께 높으면 참다가 한때 반응이 터질 수 있습니다.',
    ],
  },
};

const NP: Record<BandKey, Omit<ManualNineStageBlock, 'raiseMeasures' | 'lowerMeasures'>> = {
  deficit: {
    trait: 'NP가 낮으면 냉정·인정미 부족·방임적으로 보이며, 자기 자신에게도 해당됩니다.',
    strengths: ['감정에 휘둘리지 않고 거리를 두는 판단을 할 수 있습니다.'],
    cautions: [
      'CP가 높은데 NP가 낮으면 엄격하고 여유·유연성이 없어 보일 수 있습니다.',
      '돌봄·격려·헌신이 부족해 관계가 메마르게 느껴질 수 있습니다.',
    ],
  },
  normal: {
    trait: 'NP가 권장 구간(4~6단계) 상단~과잉 쪽이면 모성적·온화하고, 돕고 동정하며 거절을 잘 못하는 경향이 있습니다.',
    strengths: [
      '타인을 배려하고 공감하며, 관계를 따뜻하게 유지하려 합니다.',
      '원조 요청에 응하며 협력 분위기를 만듭니다.',
    ],
    cautions: ['과보호·과잉개입으로 넘어가지 않도록 선을 두는 연습이 필요합니다.'],
  },
  excess: {
    trait: 'NP가 지나치면 과보호·과잉개입이 되어 상대의 자주성·자립성을 빼앗기 쉽습니다.',
    strengths: ['적을 만들지 않고 헌신적으로 돕는다는 평가를 받기 쉽습니다.'],
    cautions: [
      '상대는 의존하게 되거나, 반항·거리두기로 이어질 수 있습니다.',
      '자녀·아랫사람을 너무 무르게 대해 낙오를 만들 수 있습니다.',
    ],
  },
};

const A: Record<BandKey, Omit<ManualNineStageBlock, 'raiseMeasures' | 'lowerMeasures'>> = {
  deficit: {
    trait: 'A가 낮으면 정확한 판단·계획이 어렵고, 그때그때 생각나는 대로 행동해 일관성이 떨어질 수 있습니다.',
    strengths: ['즉흥적·감정적 반응으로 분위기를 빠르게 바꿀 수 있습니다.'],
    cautions: [
      '신뢰를 받기 어렵고, 상대는 지성적인 교류를 피하려 할 수 있습니다.',
      '매사 주관적 처리로 갈등이 커질 수 있습니다.',
    ],
  },
  normal: {
    trait: 'A가 권장 구간(4~6단계)을 넘어 높아지면 이성·합리·냉정·결단이 강하고 계획적으로 일을 처리합니다.',
    strengths: [
      '경청하고 사실을 모아 문제 해결로 연결합니다.',
      '감정적 꾸중보다 이해 가능한 태도를 취합니다.',
    ],
    cautions: ['7단계 이상이면 감정·관계 쪽 배려가 줄어들 수 있으니 균형을 봅니다.'],
  },
  excess: {
    trait: 'A가 지나치면 무감정·기계적으로 보여 상대에게 차갑게 느껴질 수 있습니다.',
    strengths: ['업무·의사결정에서 논리와 효율을 중시합니다.'],
    cautions: [
      'FC가 낮으면 일 중독·회사인간처럼 보일 수 있습니다.',
      '물질·성과만능주의에 빠지면 관계 만족이 떨어질 수 있습니다.',
    ],
  },
};

const FC: Record<BandKey, Omit<ManualNineStageBlock, 'raiseMeasures' | 'lowerMeasures'>> = {
  deficit: {
    trait: 'FC가 낮으면 놀이·여행 등을 적극 즐기지 않고, 생활이 폐쇄적으로 느껴질 수 있습니다.',
    strengths: ['차분하고 변화가 적은 일에서 인내력·집중이 발휘되기 쉽습니다.'],
    cautions: [
      'AC·CP가 높으면 억압·불평·음주·화풀이 등으로 스트레스가 새 나올 수 있습니다.',
      '1~2단계처럼 매우 낮을 때는 치료·상담이 필요한 경우가 많다는 임상 참고가 있습니다.',
    ],
  },
  normal: {
    trait: 'FC가 중심을 넘으면 자발·적극·창조·직감이 강하고 희노애락을 솔직히 표현합니다.',
    strengths: [
      '개방적 태도로 주변에 즐거움을 줍니다.',
      '새로운 시도·창의적 과제에 기여합니다.',
    ],
    cautions: ['7단계 이상으로 가면 충동·자기중심 쪽을 의식적으로 조절합니다.'],
  },
  excess: {
    trait: 'FC가 지나치면 충동·자기중심·무책임·제멋대로로 보일 수 있습니다.',
    strengths: ['호기심·놀이 근성·창조적 일에 대한 희망이 큽니다.'],
    cautions: [
      '일상에서 풍파가 잦을 수 있고, 약속·규칙 경시로 신뢰가 떨어질 수 있습니다.',
      '사회성·협조 측면에서 ‘개구쟁이·자기도취’ 인상을 줄 수 있습니다.',
    ],
  },
};

const AC: Record<BandKey, Omit<ManualNineStageBlock, 'raiseMeasures' | 'lowerMeasures'>> = {
  deficit: {
    trait: 'AC가 낮으면 자기중심적 면이 강하고, FC가 높으면 자유방종으로 보일 수 있습니다.',
    strengths: ['자기 주장·독립적 판단을 내세우는 면이 있습니다.'],
    cautions: [
      '인간관계가 뜻대로 되지 않을 때가 많고, 사회성 측면에서 떳떳하지 않다는 평가를 받을 수 있습니다.',
      '급진·광신적 태도와 겹칠 수 있습니다.',
    ],
  },
  normal: {
    trait: 'AC가 중심을 넘으면 순응·타협·협조가 강하고, 타인 기대에 맞추려 감정을 억압하기도 합니다.',
    strengths: [
      '경청·배려·규칙 준수로 팀·가정 조율에 기여합니다.',
      '상대 눈치를 살피며 관계를 유지하려 합니다.',
    ],
    cautions: ['욕구불만·불안이 쌓이지 않도록 표현 통로를 마련합니다.'],
  },
  excess: {
    trait: 'AC가 지나치면 죄책감·자기속박·자기비하·열등감·적개심을 삼키기 쉽습니다.',
    strengths: ['갈등을 피하고 ‘착한 아이’ 역할로 관계를 유지하려 합니다.'],
    cautions: [
      '과민·불평·스트레스 누적, 때로는 급격한 반응으로 이어질 수 있습니다.',
      '강한 세계에 깊이 들어가면 환상·회피가 커질 수 있어 주변 지지가 필요합니다.',
    ],
  },
};

const SCALE_BLOCKS: Record<EgoScaleId, Record<BandKey, Omit<ManualNineStageBlock, 'raiseMeasures' | 'lowerMeasures'>>> = {
  CP,
  NP,
  A,
  FC,
  AC,
};

const RAISE_MEASURES: Record<EgoScaleId, string[]> = {
  CP: [
    '두 개의 의자요법으로 역할 교환·역지사지 통찰을 연습합니다.',
    '비판적 논평·해설요법으로 방어 벽을 세우고 자기 돌봄 책임을 인식합니다.',
    '베개 두들기기 등 CP를 몸으로 표현하는 안전한 연습을 합니다.',
    '리더십·운전 등 자기주장·책임 연습을 단계적으로 합니다.',
    '『나는 …라고 생각한다』『…은 옳다/싫다』 등 원칙·경계 언어를 연습합니다.',
  ],
  NP: [
    '껴안기·동정적 눈짓 등 스킨십과 격려를 계획적으로 늘립니다.',
    '감수성 훈련·게슈탈트·자원봉사로 타인 돌봄을 실천합니다.',
    '플러스 스트로크·칭찬 플랜을 짜서 NP를 양성합니다.',
    '요리·작은 선물 등 타인을 위한 서비스를 의식적으로 합니다.',
    '상대 기분·감정을 인정하는 말(『정말 …하고 싶으셨죠』)을 사용합니다.',
  ],
  A: [
    '외계인(ET) 선언 등 제3자 관찰로 사태를 객관화합니다.',
    '말·행동 전 1~10 헤아리기 등 시간적 여유를 둡니다.',
    '메모·기록·몰래 카메라 상상으로 주의력을 기울입니다.',
    '바둑·장기, 지명 반론자 등 논리·전체 검토 연습을 합니다.',
    '5W1H·『…라는 말씀입니까?』 확인으로 사실 검증을 합니다.',
  ],
  FC: [
    '배꼽·내복·동물 농장 등 유머·상상 연습으로 웃음을 회복합니다.',
    '머리 기울이기·자유 연상·동요·신비 체험으로 자발성을 자극합니다.',
    '금지 해제·이벤트·유머 플랜으로 즐거움을 계획합니다.',
    '『재미있네요』『함께 끼워 주세요』 등 FC 활성화 언어를 씁니다.',
    '예술·오락·짧은 공상을 즐기며 밝은 면을 보려 합니다.',
  ],
  AC: [
    '타인 기대 부응·타협·공감적 인지로 협력·순응을 연습합니다.',
    '상대 기분 파악(드라마 공감 등)·경청·맞장구로 AC를 키웁니다.',
    '『괜찮습니다』『미안합니다』『어떻게 해드릴까요』 등 배려 언어를 씁니다.',
    '애정·칭찬 스트로크 수용 허가로 독단성을 완화합니다.',
    '죄의식·감수성을 통해 타인 감정에 상처를 주지 않도록 합니다.',
  ],
};

const LOWER_MEASURES: Record<EgoScaleId, string[]> = {
  CP: [
    '즉석 질책·손가락질·명령조를 줄이고, 먼저 경청·확인 질문을 합니다.',
    '『그 까지것 아무려면 어때』『의견을 말해 봤자…』 같은 회피·무책임 패턴을 줄입니다.',
    '과잉 보호·침묵·걱정만 하는 태도 대신, 분명한 기대와 피드백을 균형 있게 줍니다.',
    '두 의자요법으로 상대 입장을 먼저 말해 보며 비판 강도를 낮춥니다.',
    '4~6단계 권장 구간을 목표로 CP 에너지를 한 단계씩 조절합니다.',
  ],
  NP: [
    '『확실히 하세요』『무슨 짓을』 등 압박·비판 언어를 줄입니다.',
    '도움 거절 연습·역할 분담으로 과보호·과잉개입을 낮춥니다.',
    '상대가 스스로 해낼 수 있는 일에는 개입을 줄이고 칭찬만 합니다.',
    '감점주의·실수 찾기 대신 장점·노력에 플러스 스트로크를 줍니다.',
    '4~6단계 권장 구간을 유지하며 NP를 한 단계 낮추는 것을 목표로 합니다.',
  ],
  A: [
    '『모르겠습니다』『Yes, but』 즉답·변명 패턴을 줄이고 감정 반응 전 휴지를 둡니다.',
    '상대 말을 끝까지 듣고, 감정 라벨링(『화가 나셨군요』)을 추가합니다.',
    '명상·요가·단전호호흡 등 긴장 이완으로 냉정함만 남지 않게 합니다.',
    '일 외 여가·FC 활동을 일정에 넣어 ‘컴퓨터 인간’ 인상을 완화합니다.',
    '7단계 이상이면 6단계(권장) 쪽으로 에너지를 한 단계씩 낮추는 것을 목표로 합니다.',
  ],
  FC: [
    '『하기 싫어』『지루해』『우울해』 등 FC 저하 언어·수동 태도를 줄입니다.',
    '약속·시간·규칙을 작은 것부터 지켜 충동·제멋대로를 조절합니다.',
    '즐거운 활동 후에도 타인 기대·AC 쪽 배려 한 줄을 덧붙입니다.',
    '라켓 감정에 오래 머무르지 않고, 짧은 공상·유머로 전환합니다.',
    '9단계에서 8→7→6단계로 인접 계단만 목표로 낮춥니다.',
  ],
  AC: [
    '『멋대로 해』『손해 본다』 등 AC 억압·독단 언어를 줄입니다.',
    '방약무인·완고·타인 감정 무시 태도를 줄이고, 잘못을 시인합니다.',
    '과한 자기비하·『어차피 나 같은 것은』 말 대신 구체적 요청을 연습합니다.',
    '불평만 쌓지 않고, 경계·거절을 A 자아로 문장화합니다.',
    '7단계 이상 AC는 6단계 권장 구간을 향해 표현·자기주장 균형을 맞춥니다.',
  ],
};

function bandKey(stage: Plus243Stage): BandKey {
  return plus243StageBand(stage);
}

function stageIntensityNote(tier: Plus243Tier): string {
  return formatCurrentStageLeadIn(tier);
}

/**
 * 243+ · 자율치료 · 이고 탭 공통 — 단계만 사용(점수 없음).
 * - 권장(4~6): 유지 장점 + 4·5·6 내부 이동은 유지 권장 + 벗어날 때만 주의
 * - 권장 밖: 과·부족 설명 + 한 단계 이동 후에도 밖이면 회복 방법
 */
export function buildPlus243StageGuidance(scaleId: EgoScaleId, stage: Plus243Stage): string[] {
  const lines: string[] = [];
  const block = getManualNineStageBlock(scaleId, stage);
  const prev = (stage - 1) as Plus243Stage;
  const next = (stage + 1) as Plus243Stage;
  const head = `${scaleId} ·`;

  if (isPlus243RecommendedStage(stage)) {
    const strengthText = block.strengths.filter(Boolean).slice(0, 2).join(' ');
    lines.push(
      `${head} 지금 ${stage}단계(권장 4~6)를 유지하는 것이 좋습니다. ${strengthText} 한 단계만 올리거나 내려도 4·5·6단계 안이면 굳이 바꿀 필요 없이, 지금처럼 쓰는 편이 안정적입니다.`,
    );
    if (prev === 3) {
      const b = getManualNineStageBlock(scaleId, 3);
      const downs = b.cautions.filter(Boolean).slice(0, 2).join(' ');
      lines.push(
        `${head} 주의: 한 단계 내려 3단계(부족)가 되면 권장 구간을 벗어납니다. ${downs || b.trait}`,
      );
    }
    if (next === 7) {
      const b = getManualNineStageBlock(scaleId, 7);
      const downs = b.cautions.filter(Boolean).slice(0, 2).join(' ');
      lines.push(
        `${head} 주의: 한 단계 올려 7단계(과잉)가 되면 권장 구간을 벗어납니다. ${downs || b.trait}`,
      );
    }
    return lines;
  }

  if (stage <= 3) {
    const lack =
      stage === 1
        ? '에너지가 매우 부족한 편입니다.'
        : stage === 2
          ? '에너지가 꽤 부족한 편입니다.'
          : '에너지가 부족한 편입니다.';
    lines.push(`${head} 현재 ${stage}단계(부족 1~3)입니다. ${lack} ${block.cautions[0] ?? block.trait}`);
    if (isPlus243RecommendedStage(next)) {
      const b4 = getManualNineStageBlock(scaleId, next);
      lines.push(
        `${head} 권장: 한 단계 올리면 ${next}단계(권장 4~6)에 들어옵니다. ${b4.strengths[0] ?? b4.trait} 급하게 여러 단계를 올리지 말고, 한 단계만 목표로 하세요.`,
      );
    } else {
      lines.push(
        `${head} 권장: 한 단계 올려도 아직 부족 구간일 수 있습니다. 조금씩 4~6단계를 향해 가세요. ${block.raiseMeasures.slice(0, 3).join(' · ')}`,
      );
    }
    return lines;
  }

  if (stage >= 7) {
    const heavy =
      stage >= 9 ? '에너지가 매우 과한 편입니다.' : stage === 8 ? '에너지가 꽤 과한 편입니다.' : '에너지가 과한 편입니다.';
    lines.push(`${head} 현재 ${stage}단계(과잉 7~9)입니다. ${heavy} ${block.cautions.filter(Boolean).slice(0, 2).join(' ')}`);
    if (isPlus243RecommendedStage(prev)) {
      const b6 = getManualNineStageBlock(scaleId, prev);
      lines.push(
        `${head} 권장: 한 단계 내리면 ${prev}단계(권장 4~6)에 가까워집니다. ${b6.strengths[0] ?? b6.trait} 한 번에 여러 단계 내리기보다 한 단계만 목표로 하세요.`,
      );
    } else {
      lines.push(
        `${head} 권장: 한 단계 내려도 아직 과잉일 수 있습니다. 조금씩 4~6단계를 향해 가세요. ${block.lowerMeasures.slice(0, 3).join(' · ')}`,
      );
    }
    if (stage < 9 && next <= 9) {
      const bNext = getManualNineStageBlock(scaleId, next);
      lines.push(
        `${head} 주의: 한 단계 더 올리면 ${next}단계로 과잉이 더 커집니다. ${bNext.cautions[0] ?? bNext.trait}`,
      );
    }
    return lines;
  }

  return lines;
}

/** 상담사용 — CP↔NP, FC↔AC 상대 관계 · A 조율 */
export function buildCounselorPairAndAdultGuidance(egogram: EgoOkScaleScore[]): string[] {
  const byId = Object.fromEntries(egogram.map((s) => [s.id, s])) as Record<EgoScaleId, EgoOkScaleScore>;
  const cp = byId.CP;
  const np = byId.NP;
  const fc = byId.FC;
  const ac = byId.AC;
  const a = byId.A;
  if (!cp || !np || !fc || !ac || !a) return [];

  const cpSt = rawScoreToPlus243Tier(cp.raw).stage;
  const npSt = rawScoreToPlus243Tier(np.raw).stage;
  const fcSt = rawScoreToPlus243Tier(fc.raw).stage;
  const acSt = rawScoreToPlus243Tier(ac.raw).stage;
  const aSt = rawScoreToPlus243Tier(a.raw).stage;

  const lines: string[] = [];

  if (cp.raw > np.raw) {
    lines.push(
      `CP↔NP: CP ${cpSt}단계가 NP ${npSt}단계보다 높습니다. 한쪽(부모 에너지)이 올라가면 다른 쪽은 상대적으로 줄어들기 쉽다고 설명합니다. 내담자에게 NP 쪽 자율치료(돌봄·격려 말하기)를 과제로 제시하고, CP는 한 단계 낮추는 방향을 함께 정합니다.`,
    );
  } else if (np.raw > cp.raw) {
    lines.push(
      `CP↔NP: NP ${npSt}단계가 CP ${cpSt}단계보다 높습니다. NP가 높을수록 CP(기준·책임)가 상대적으로 약해 보일 수 있음을 설명합니다. 내담자에게 CP 쪽 자율치료(원칙·경계 말하기)를 과제로 제시하고, NP 과보호로 넘어가지 않도록 조절합니다.`,
    );
  } else {
    lines.push(`CP↔NP: CP·NP 모두 ${cpSt}단계로 같습니다. 부모 에너지 균형은 유지하되, 둘 중 하나만 키우면 다른 쪽이 줄 수 있음을 미리 안내합니다.`);
  }

  if (fc.raw > ac.raw) {
    lines.push(
      `FC↔AC: FC ${fcSt}단계가 AC ${acSt}단계보다 높습니다. 즐거움·표현(FC)과 배려·순응(AC)은 서로 줄고 늘기 쉽다고 설명합니다. AC 쪽 자율치료(경청·타혹)를 설명·과제화하고, FC가 과하면 한 단계 내리는 방향을 함께 봅니다.`,
    );
  } else if (ac.raw > fc.raw) {
    lines.push(
      `FC↔AC: AC ${acSt}단계가 FC ${fcSt}단계보다 높습니다. 순응이 높으면 자유·표현이 상대적으로 약해 보일 수 있음을 설명합니다. FC 쪽 자율치료(유머·작은 즐거움)를 설명·과제화하고, AC 과순응은 한 단계 조절합니다.`,
    );
  } else {
    lines.push(`FC↔AC: FC·AC 모두 ${fcSt}단계로 같습니다. 아이 에너지 균형은 유지하되, 한쪽만 올리면 다른 쪽이 줄 수 있음을 안내합니다.`);
  }

  lines.push(
    `A(성인) ${aSt}단계: 다섯 에너지를 바꾸기 전에 A로 「지금 문제가 무엇인지」「한 단계만 바꾸면 무엇이 좋아질지」를 문장으로 정리하게 합니다. A가 부족(1~3)이면 메모·확인 질문부터, A가 과잉(7~9)이면 감정·관계 한 줄을 붙이도록 상담합니다.`,
  );

  return lines;
}

/** 내담자 자율치료 — 상담사가 설명·과제로 전달하는 문장 */
export function formatClientTasksForCounselor(scaleId: EgoScaleId, tasks: string[]): string[] {
  return tasks.map(
    (task) =>
      `내담자에게 자율치료로 설명: 「${task}」— 이번 상담·다음 면담까지 ${scaleId} 관련 실천 1가지만 골라 과제로 정합니다.`,
  );
}

/** @deprecated buildPlus243StageGuidance 사용 */
export function buildAdjacentTransitionMessages(scaleId: EgoScaleId, stage: Plus243Stage): string[] {
  return buildPlus243StageGuidance(scaleId, stage);
}

/** 현재 단계와 맞지 않는 ‘7단계 이상’ 등 일반 경고 문구 제거 */
function cautionsForStage(cautions: string[], stage: Plus243Stage): string[] {
  return cautions.filter((line) => {
    if (stage < 7 && /7단계\s*이상/.test(line)) return false;
    if (stage >= 7 && /4~6단계|권장 구간에서 안정/.test(line) && stage > 6) return false;
    return true;
  });
}

const COUNSELOR_TASKS: Record<EgoScaleId, Record<BandKey, string[]>> = {
  CP: {
    deficit: [
      '현재 CP 단계·243+ 표기(A9~C1)를 설명하고, 목표를 인접 단계(현재+1)로만 합의합니다.',
      '과제: 두 의자·리더십 훈련 등 1~2가지를 주간 단위로 정하고 다음 상담에서 점검합니다.',
      'FC·AC와의 조합을 보며 impulsive/억압 패턴이 있는지 관찰합니다.',
    ],
    normal: [
      '현재 CP 단계가 권장(4~6)인지 확인하고, 7단계(과잉)로 올라가는 스트레스 요인을 짚습니다.',
      '원칙·책임 강점을 인정한 뒤, 관계에서의 권위 사용 방식을 구체 사례로 검토합니다.',
    ],
    excess: [
      '과잉 CP(7~9단계)의 비판·통제가 관계에 미치는 영향을 사실 위주로 정리합니다.',
      '한 단계 낮추기 계약(경청·질문 비율 늘리기)을 세우고, 소진 징후를 모니터링합니다.',
      'CP·AC 동반 과잉 시 억압 후 폭발 가능성을 안전하게 탐색합니다.',
    ],
  },
  NP: {
    deficit: [
      'NP 부족(1~3)일 때 관계·가정에서의 ‘차가움’ 인식을 탐색하고, 작은 돌봄 행동 하나를 과제로 둡니다.',
      'CP가 높은 경우 엄격함+NP 부족 조합을 설명합니다.',
    ],
    normal: [
      '현재 NP 단계와 권장 구간을 확인하고, 과보호로 넘어가는지 경계합니다.',
      '거절 연습·역할 분담을 상담 안에서 리허설합니다.',
    ],
    excess: [
      '7~9단계 NP는 과보호·과잉개입 구간임을 명확히 설명합니다(권장 4~6 아님).',
      '상대의 자립을 해치지 않도록 개입 강도를 단계적으로 낮추는 계획을 세웁니다.',
    ],
  },
  A: {
    deficit: [
      'A 부족 시 즉흥·일관성 문제를 사례와 함께 정리하고, 메모·1~10 세기 등 A 활성화 과제를 줍니다.',
    ],
    normal: [
      '현재 A 단계가 권장인지 확인하고, 감정·관계 배려 균형을 점검합니다.',
    ],
    excess: [
      '7~9단계 A는 과잉(기계적·무감정) 구간임을 설명합니다.',
      'FC·여가 활동을 일정에 넣도록 돕고, 감정 라벨링을 연습하게 합니다.',
    ],
  },
  FC: {
    deficit: [
      'FC 낮음(1~3)과 폐쇄·억압 패턴을 탐색하고, 유머·작은 즐거움 과제를 1개씩 부여합니다.',
      'AC·CP가 높을 때의 스트레스 배출 경로를 함께 봅니다.',
    ],
    normal: [
      '현재 FC 단계 유지·미세 조절(6↔7)만 논의합니다.',
    ],
    excess: [
      '7~9단계 FC는 충동·자기중심 과잉 구간임을 설명합니다.',
      '약속·규칙 준수 계약과 AC 쪽 배려 행동을 짝지어 과제로 둡니다.',
    ],
  },
  AC: {
    deficit: [
      'AC 낮음(1~3)과 독단·자기중심 인상을 사례로 검토하고, 경청·타협 과제를 둡니다.',
    ],
    normal: [
      '현재 AC 단계와 협력 강점을 인정하고, 억압 누적 신호를 체크합니다.',
    ],
    excess: [
      '7~9단계 AC는 자기비하·과순응 과잉 구간임을 설명합니다.',
      'A 자아로 경계·거절 문장을 작성하는 연습을 상담에서 합니다.',
    ],
  },
};

export function getManualNineStageBlock(scaleId: EgoScaleId, stage: Plus243Stage): ManualNineStageBlock {
  const key = bandKey(stage);
  const base = SCALE_BLOCKS[scaleId][key];
  return {
    ...base,
    raiseMeasures: RAISE_MEASURES[scaleId],
    lowerMeasures: LOWER_MEASURES[scaleId],
  };
}

export type ManualNineStageInsight = {
  tier: Plus243Tier;
  stage: Plus243Stage;
  trait: string;
  strengths: string[];
  cautions: string[];
  measures: string[];
};

export function resolveManualInsightRole(
  stage: Plus243Stage,
  context: 'extreme' | 'neutral',
): ManualInsightRole {
  if (isPlus243RecommendedStage(stage)) {
    return 'inRange';
  }
  if (context === 'extreme') {
    return stage >= 7 ? 'peak' : 'low';
  }
  return 'offRange';
}

/** peak/low=극단 척도 · inRange=4~6 · offRange=권장 밖(중간 척도) */
export function buildManualNineStageInsight(
  scaleId: EgoScaleId,
  raw: number,
  role: ManualInsightRole,
): ManualNineStageInsight {
  const tier = rawScoreToPlus243Tier(raw);
  const block = getManualNineStageBlock(scaleId, tier.stage);
  const leadIn = stageIntensityNote(tier);

  let trait = `${leadIn}. ${block.trait}`;
  if (role === 'offRange') {
    trait = `${leadIn}. 권장 구간(4~6단계) 밖입니다. ${block.trait}`;
  } else if (role === 'inRange') {
    trait = `${leadIn}. ${block.trait}`;
  }

  const measures =
    tier.stage >= 7
      ? block.lowerMeasures
      : tier.stage <= 3
        ? block.raiseMeasures
        : isPlus243RecommendedStage(tier.stage)
          ? [...block.raiseMeasures.slice(0, 2), ...block.lowerMeasures.slice(0, 2)]
          : block.raiseMeasures;

  return {
    tier,
    stage: tier.stage,
    trait,
    strengths: [...block.strengths],
    cautions: cautionsForStage([...block.cautions], tier.stage),
    measures,
  };
}

export type SelfHelpTherapyScalePlan = {
  scaleId: EgoScaleId;
  displayName: string;
  raw: number;
  stage: Plus243Stage;
  tierLabel: string;
  stageLeadIn: string;
  summary: string;
  inRecommended: boolean;
  /** 단계 유지·이동·회복 안내 (243+와 동일) */
  guidanceLines: string[];
  counselorTasks: string[];
  clientTasks: string[];
};

export function buildSelfHelpTherapyScalePlan(scale: EgoOkScaleScore): SelfHelpTherapyScalePlan {
  const tier = rawScoreToPlus243Tier(scale.raw);
  const band = bandKey(tier.stage);
  const inRecommended = isPlus243RecommendedStage(tier.stage);
  const role = resolveManualInsightRole(tier.stage, 'neutral');
  const focused = buildManualNineStageInsight(scale.id, scale.raw, role);
  return {
    scaleId: scale.id,
    displayName: scale.label,
    raw: scale.raw,
    stage: tier.stage,
    tierLabel: tier.label,
    stageLeadIn: formatCurrentStageLeadIn(tier),
    summary: focused.trait,
    inRecommended,
    guidanceLines: buildPlus243StageGuidance(scale.id, tier.stage),
    counselorTasks: COUNSELOR_TASKS[scale.id][band],
    clientTasks: focused.measures,
  };
}
