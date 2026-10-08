'use client';

import {
  EGO_SCALE_PATTERN_ORDER,
  plus243StageDigitColor,
  plus243TierToAscii,
  type Pattern243Plus,
  type Plus243ScaleEntry,
  type Plus243Tier,
} from '@/lib/egogram243Plus';

/** 알파벳(A/B/C) + 굵은 단계 숫자(1~9, 구간별 색) */
export function Plus243LetterStageGlyph({
  tier,
  className,
  letterClassName,
}: {
  tier: Plus243Tier;
  className?: string;
  letterClassName?: string;
}) {
  const letter = tier.letter;
  const stage = tier.stage;
  return (
    <span className={`inline-flex items-baseline font-mono ${className ?? ''}`}>
      <span className={`text-sm font-semibold text-slate-700 ${letterClassName ?? ''}`}>{letter}</span>
      <span
        className="text-base font-extrabold tabular-nums leading-none"
        style={{ color: plus243StageDigitColor(stage) }}
      >
        {stage}
      </span>
    </span>
  );
}

export function Plus243ScaleEntryGlyph({
  entry,
  className,
}: {
  entry: Plus243ScaleEntry;
  className?: string;
}) {
  return <Plus243LetterStageGlyph tier={entry.tier} className={className} />;
}

/** CP→NP→A→FC→AC 연속 243+ 유형 */
export function Pattern243PlusCode({
  plus,
  className,
  gapClassName = 'gap-0.5',
}: {
  plus: Pattern243Plus;
  className?: string;
  gapClassName?: string;
}) {
  return (
    <span className={`inline-flex flex-wrap items-baseline ${gapClassName} ${className ?? ''}`}>
      {EGO_SCALE_PATTERN_ORDER.map((id) => (
        <Plus243ScaleEntryGlyph key={id} entry={plus.byScale[id]} />
      ))}
    </span>
  );
}

/** 접두 텍스트 + 243+ 코드 (예: 「243+ A9B5…」) */
export function Pattern243PlusInline({
  plus,
  prefix = '243+',
  className,
}: {
  plus: Pattern243Plus;
  prefix?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1 ${className ?? ''}`}>
      {prefix ? <span className="text-xs font-semibold text-slate-600">{prefix}</span> : null}
      <Pattern243PlusCode plus={plus} />
    </span>
  );
}

/** 레거시: 전체 토큰 한 덩어리 색 (호환) */
export function Plus243TierToken({ tier, className }: { tier: Plus243Tier; className?: string }) {
  const label = plus243TierToAscii(tier);
  return (
    <span
      className={`font-mono text-sm font-bold tabular-nums ${className ?? ''}`}
      style={{ color: plus243StageDigitColor(tier.stage) }}
    >
      {label}
    </span>
  );
}
