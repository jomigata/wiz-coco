'use client';

import type { EdgeScrollHintState } from '@/lib/useMouseEdgeAutoScroll';

type Side = 'top' | 'right' | 'bottom' | 'left';

const NUDGE_CLASS: Record<Side, string> = {
  left: 'counselor-scroll-hint-nudge-left',
  right: 'counselor-scroll-hint-nudge-right',
  top: 'counselor-scroll-hint-nudge-up',
  bottom: 'counselor-scroll-hint-nudge-down',
};

function ScrollChevron({ side, active }: { side: Side; active: boolean }) {
  const rotate =
    side === 'left' ? '' : side === 'right' ? 'rotate-180' : side === 'top' ? '-rotate-90' : 'rotate-90';
  return (
    <svg
      className={`h-5 w-5 drop-shadow-md transition-[transform,color] duration-150 ${NUDGE_CLASS[side]} ${
        active ? 'scale-110 text-white' : 'text-white/80 opacity-90'
      } ${rotate}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.5 6.5 9 12l5.5 5.5" />
    </svg>
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
      ? 'inset-x-0 top-0 h-12 bg-gradient-to-b from-black/50 to-transparent'
      : side === 'bottom'
        ? 'inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent'
        : side === 'left'
          ? 'inset-y-0 left-0 w-12 bg-gradient-to-r from-black/45 to-transparent'
          : 'inset-y-0 right-0 w-12 bg-gradient-to-l from-black/45 to-transparent';

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
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-150 ${
          active
            ? 'border-white/80 bg-white/15 shadow-[0_0_18px_rgba(255,255,255,0.25)]'
            : 'border-white/30 bg-black/35'
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
