import type { OkScaleId } from '@/lib/egoOkScoring';
import type { LifePositionKind } from '@/lib/egoOkScoring';

/** 인생태도(이고그램): 타인 NP−CP · 자기 FC−AC (0 이상이면 해당 축 긍정 방향) */
export function egogramLifeAxes(np: number, cp: number, fc: number, ac: number) {
  const uGap = np - cp;
  const iGap = fc - ac;
  return { uGap, iGap, uOthersPositive: uGap >= 0, iSelfPositive: iGap >= 0 };
}

/** @deprecated 오케이 막대 해석용 — 인생태도 판정에는 egogramLifeAxes 사용 */
export function okLifeAxes(uMinus: number, uPlus: number, iPlus: number, iMinus: number) {
  const uGap = uPlus - uMinus;
  const iGap = iPlus - iMinus;
  return { uGap, iGap, uOthersPositive: uGap >= 0, iSelfPositive: iGap >= 0 };
}

export function classifyOkLifePosition(uGap: number, iGap: number): { kind: LifePositionKind; summary: string } {
  const uPos = uGap >= 0;
  const iPos = iGap >= 0;
  if (uPos && iPos) {
    return {
      kind: '자타긍정',
      summary: '이고그램 기준 타인 축(NP, CP)·자기 축(FC, AC) 모두 긍정 방향입니다.',
    };
  }
  if (!uPos && !iPos) {
    return {
      kind: '자타부정',
      summary: '이고그램 기준 타인·자기 축 모두 부정 방향입니다.',
    };
  }
  if (uPos && !iPos) {
    return {
      kind: '타인긍정',
      summary: '이고그램 기준 타인 축은 긍정, 자기 축은 부정입니다.',
    };
  }
  return {
    kind: '자기긍정',
    summary: '이고그램 기준 타인 축은 부정, 자기 축은 긍정입니다.',
  };
}

/** 오케이 막대 표시 순서 (위→아래: U−, U+, I+, I−) */
export const OK_BAR_DISPLAY_ORDER: OkScaleId[] = ['U-', 'U+', 'I+', 'I-'];

/** 막대 끝 괄호 라벨 */
export const OK_BAR_POLE_LABEL: Record<OkScaleId, string> = {
  'U-': '타인부정',
  'U+': '타인긍정',
  'I+': '자기긍정',
  'I-': '자기부정',
};

function lifeDirectionPhrase(kind: LifePositionKind): string {
  switch (kind) {
    case '자타긍정':
      return '자기긍정+타인긍정';
    case '자타부정':
      return '자기부정+타인부정';
    case '타인긍정':
      return '타인긍정+자기부정';
    case '자기긍정':
      return '자기긍정+타인부정';
    default:
      return kind;
  }
}

function uAxisConfidenceBullet(uGap: number): string {
  if (uGap >= 5) {
    return (
      '인생태도의 방향에 대한 확신은 양육(NP)이 비판(CP)보다 충분히 앞서 있어, ' +
      '올바른 타인 축 방향을 잘 유지하고 있습니다.'
    );
  }
  if (uGap >= 0) {
    return (
      '인생태도의 방향에 대한 확신은 NP에 조금 더 마음을 사용하거나, ' +
      'CP에 무심함을 조금 더 두는 것이 완전한 나의 올바른 인생태도의 방향으로 가는 데 도움이 됩니다.'
    );
  }
  return (
    'CP가 NP보다 높아 타인 축이 부정 쪽으로 기울어 있으므로, NP를 키우고 CP는 낮추는 마음가짐이 필요합니다. ' +
    'CP에 해당하는 과한 비판·통제에는 다소 무관심을 두는 것이 방향 전환에 중요합니다.'
  );
}

function iAxisConfidenceBullet(iGap: number): string {
  if (iGap >= 5) {
    return (
      '자기 축에서는 FC(자유·창의)가 AC(순응)보다 충분히 앞서 있어, ' +
      '올바른 자기 방향을 잘 유지하고 있습니다.'
    );
  }
  if (iGap >= 0) {
    return (
      '자기 축은 긍정 방향이나, FC를 조금 더 키우고 AC는 줄이는 마음가짐이 ' +
      '완전한 자기긍정 쪽으로 가는 데 도움이 됩니다.'
    );
  }
  return (
    'AC가 FC보다 높아 자기 축이 부정 쪽으로 기울어 있으므로, FC를 키우고 AC는 낮추며, ' +
    '과한 순응·자기억압(AC)에는 다소 무관심을 두는 것이 필요합니다.'
  );
}

export type OkLifeOverviewBlock = {
  heading: string;
  bullets: string[];
};

export function buildOkLifeOverviewBlock(
  kind: LifePositionKind,
  uGap: number,
  iGap: number,
): OkLifeOverviewBlock {
  const direction = lifeDirectionPhrase(kind);
  const lead =
    kind === '자타긍정'
      ? `인생태도의 방향은 '${direction}' 으로 아주 인생태도를 갖고 있다.`
      : `인생태도의 방향은 '${direction}' 쪽으로 형성되어 있다.`;
  return {
    heading: `인생태도 : ${kind}`,
    bullets: [lead, uAxisConfidenceBullet(uGap), iAxisConfidenceBullet(iGap)],
  };
}
