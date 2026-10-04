import type { OkScaleId } from '@/lib/egoOkScoring';
import type { LifePositionKind } from '@/lib/egoOkScoring';

/** (U−)−(U+): 0 이상 → 타인긍정 · (I+)−(I−): 0 이상 → 자기긍정 */
export function okLifeAxes(uMinus: number, uPlus: number, iPlus: number, iMinus: number) {
  const uTa = uMinus - uPlus;
  const iTa = iPlus - iMinus;
  return { uTa, iTa, uOthersPositive: uTa >= 0, iSelfPositive: iTa >= 0 };
}

export function classifyOkLifePosition(uTa: number, iTa: number): { kind: LifePositionKind; summary: string } {
  const uPos = uTa >= 0;
  const iPos = iTa >= 0;
  if (uPos && iPos) {
    return {
      kind: '자타긍정',
      summary: '오케이그램 기준 타인 축(U−−U+)·자기 축(I+−I−) 모두 긍정 방향입니다.',
    };
  }
  if (!uPos && !iPos) {
    return {
      kind: '자타부정',
      summary: '오케이그램 기준 타인·자기 축 모두 부정 방향입니다.',
    };
  }
  if (uPos && !iPos) {
    return {
      kind: '타인긍정',
      summary: '오케이그램 기준 타인 축은 긍정, 자기 축은 부정입니다.',
    };
  }
  return {
    kind: '자기긍정',
    summary: '오케이그램 기준 타인 축은 부정, 자기 축은 긍정입니다.',
  };
}

export function okScalePoleTag(id: OkScaleId, uTa: number, iTa: number): string {
  if (id === 'U+' || id === 'U-') return uTa >= 0 ? '타인긍정' : '타인부정';
  return iTa >= 0 ? '자기긍정' : '자기부정';
}

export function buildOkLifeOverview(
  kind: LifePositionKind,
  uTa: number,
  iTa: number,
  okgram: { id: OkScaleId; raw: number }[],
): string {
  const byId = Object.fromEntries(okgram.map((s) => [s.id, s.raw]));
  return (
    `인생태도 ${kind} — 타인 축(U−−U+) ${uTa >= 0 ? '+' : ''}${uTa}, 자기 축(I+−I−) ${iTa >= 0 ? '+' : ''}${iTa}. ` +
    `U+ ${byId['U+'] ?? '—'} · U− ${byId['U-'] ?? '—'} · I+ ${byId['I+'] ?? '—'} · I− ${byId['I-'] ?? '—'}. ` +
    `오케이그램은 속마음(내면) 에너지로, U+/U−는 타인·양육·비판 축, I+/I−는 자기·감정·순응 축을 나타냅니다. ` +
    `극단적 고·저점은 관계·스트레스에서 과잉·회피로 이어질 수 있으니 이고그램과 함께 봅니다.`
  );
}
