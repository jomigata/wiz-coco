'use client';

import type { EdgeScrollHintState } from '@/lib/useMouseEdgeAutoScroll';

type Side = 'top' | 'right' | 'bottom' | 'left';

const NUDGE_CLASS: Record<Side, string> = {
  left: 'counselor-scroll-hint-nudge-left',
  right: 'counselor-scroll-hint-nudge-right',
  top: 'counselor-scroll-hint-nudge-up',
  bottom: 'counselor-scroll-hint-nudge-down',
};

/** 위·아래·좌·우 각각 스크롤 방향을 가리키는 chevron (회전 없음 — nudge 애니메이션과 transform 충돌 방지) */
const CHEVRON_PATH: Record<Side, string> = {
  top: 'M7 15 L12 9 L17 15',
  bottom: 'M7 9 L12 15 L17 9',
  left: 'M15 7 L9 12 L15 17',
  right: 'M9 7 L15 12 L9 17',
};

function ScrollChevron({ side, active }: { side: Side; active: boolean }) {
  return (
    <span
      className={`inline-flex ${NUDGE_CLASS[side]} ${active ? 'scale-110' : 'scale-100'} transition-transform duration-150`}
    >
      <svg
        className={`h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.85),0_1px_0_rgba(255,255,255,0.35)] ${
          active ? 'opacity-100' : 'opacity-95'
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={CHEVRON_PATH[side]} />
      </svg>
    </span>
  );
}

function EdgeHint({
  side,
  visible,
  active,
}: {
  side: Side;
  visible: boolean;
  active: boolean;
}) {
  if (!visible) return null;

  const position =
    side === 'top'
      ? 'left-1/2 top-2 -translate-x-1/2'
      : side === 'bottom'
        ? 'bottom-2 left-1/2 -translate-x-1/2'
        : side === 'left'
          ? 'left-2 top-1/2 -translate-y-1/2'
          : 'right-2 top-1/2 -translate-y-1/2';

  const gradient =
    side === 'top'
      ? 'inset-x-0 top-0 h-14 bg-gradient-to-b from-black/20 via-black/5 to-transparent'
      : side === 'bottom'
        ? 'inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/20 via-black/5 to-transparent'
        : side === 'left'
          ? 'inset-y-0 left-0 w-14 bg-gradient-to-r from-black/18 via-black/5 to-transparent'
          : 'inset-y-0 right-0 w-14 bg-gradient-to-l from-black/18 via-black/5 to-transparent';

  const label =
    side === 'top'
      ? '위로 스크롤'
      : side === 'bottom'
        ? '아래로 스크롤'
        : side === 'left'
          ? '왼쪽으로 스크롤'
          : '오른쪽으로 스크롤';

  return (
    <div
      className={`pointer-events-none absolute z-30 flex items-center justify-center ${position}`}
      aria-hidden={!visible}
    >
      <span className={`pointer-events-none absolute ${gradient}`} />
      <span
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border bg-transparent transition-all duration-150 ${
          active
            ? 'border-white/60 shadow-[0_0_14px_rgba(255,255,255,0.18)] ring-1 ring-white/10'
            : 'border-white/30 ring-1 ring-black/25'
        }`}
        title={label}
      >
        <ScrollChevron side={side} active={active} />
      </span>
    </div>
  );
}

/** 패널·탭 가장자리 — 스크롤 가능·엣지 자동 스크롤 방향 힌트 */
export default function EdgeScrollHintOverlay({
  hints,
  axes = 'both',
}: {
  hints: EdgeScrollHintState;
  axes?: 'both' | 'horizontal' | 'vertical';
}) {
  const { available, active } = hints;
  const showH = axes === 'both' || axes === 'horizontal';
  const showV = axes === 'both' || axes === 'vertical';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]" aria-live="polite">
      {showV ? (
        <>
          <EdgeHint side="top" visible={available.top} active={active.top} />
          <EdgeHint side="bottom" visible={available.bottom} active={active.bottom} />
        </>
      ) : null}
      {showH ? (
        <>
          <EdgeHint side="left" visible={available.left} active={active.left} />
          <EdgeHint side="right" visible={available.right} active={active.right} />
        </>
      ) : null}
    </div>
  );
}
