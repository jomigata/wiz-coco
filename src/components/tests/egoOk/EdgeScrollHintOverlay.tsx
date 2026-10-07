'use client';

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { EdgeScrollHintState } from '@/lib/useMouseEdgeAutoScroll';
import { isLightBackgroundAt } from '@/lib/edgeHintContrast';

type Side = 'top' | 'right' | 'bottom' | 'left';

type HintTone = 'on-dark' | 'on-light';

const NUDGE_CLASS: Record<Side, string> = {
  left: 'counselor-scroll-hint-nudge-left',
  right: 'counselor-scroll-hint-nudge-right',
  top: 'counselor-scroll-hint-nudge-up',
  bottom: 'counselor-scroll-hint-nudge-down',
};

const TRACK_NUDGE_CLASS: Record<'top' | 'bottom', string> = {
  top: 'counselor-scroll-hint-track-up',
  bottom: 'counselor-scroll-hint-track-down',
};

const CHEVRON_PATH: Record<Side, string> = {
  top: 'M7 15 L12 9 L17 15',
  bottom: 'M7 9 L12 15 L17 9',
  left: 'M15 7 L9 12 L15 17',
  right: 'M9 7 L15 12 L9 17',
};

const TONE_STYLES: Record<
  HintTone,
  { bubbleIdle: string; bubbleActive: string; scrimSide: string }
> = {
  'on-dark': {
    bubbleIdle: 'border-white/30 ring-1 ring-black/25',
    bubbleActive: 'border-white/60 shadow-[0_0_14px_rgba(255,255,255,0.18)] ring-1 ring-white/10',
    scrimSide: 'from-black/18 via-black/5',
  },
  'on-light': {
    bubbleIdle: 'border-slate-500/45 ring-1 ring-white/70 bg-white/35',
    bubbleActive:
      'border-slate-700/70 shadow-[0_0_12px_rgba(15,23,42,0.12)] ring-1 ring-white/80 bg-white/50',
    scrimSide: 'from-slate-900/10 via-slate-900/4',
  },
};

/** 상·하 스크롤 트랙 — 회색 테두리, 배경 없음 */
const SCROLL_TRACK_UNIVERSAL = {
  border: 'border-slate-400/85',
  borderActive: 'border-slate-300',
  glow: 'shadow-[0_0_10px_rgba(100,116,139,0.22)]',
  glowActive: 'shadow-[0_0_14px_rgba(148,163,184,0.32)]',
};

/** 상·하 트랙 — 화면보다 좁게 좌우 여백 */
export const VIEWPORT_EDGE_HINT_WIDTH_CLASS =
  'left-1/2 w-[min(calc(100vw-2rem),calc(100%-1rem))] -translate-x-1/2';

function DualStrokeChevron({ side, sizeClass = 'h-6 w-6' }: { side: Side; sizeClass?: string }) {
  const d = CHEVRON_PATH[side];
  return (
    <svg className={sizeClass} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={d}
        stroke="#ffffff"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={d}
        stroke="#0f172a"
        strokeWidth="2.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScrollChevron({ side, active }: { side: Side; active: boolean }) {
  return (
    <span
      className={`inline-flex ${NUDGE_CLASS[side]} ${active ? 'scale-110' : 'scale-100'} transition-transform duration-150`}
    >
      <DualStrokeChevron side={side} sizeClass="h-5 w-5" />
    </span>
  );
}

function TopBottomScrollTrack({
  side,
  active,
  label,
}: {
  side: 'top' | 'bottom';
  active: boolean;
  label: string;
}) {
  const track = SCROLL_TRACK_UNIVERSAL;
  return (
    <div
      className={`relative flex h-8 w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-transparent transition-[border-color,box-shadow] duration-150 ${
        active ? `${track.borderActive} ${track.glowActive}` : `${track.border} ${track.glow}`
      }`}
      title={label}
    >
      <span
        className={`relative inline-flex ${TRACK_NUDGE_CLASS[side]} ${active ? 'scale-110' : 'scale-100'} transition-transform duration-150`}
      >
        <DualStrokeChevron side={side} />
      </span>
    </div>
  );
}

function useAdaptiveHintTone(
  visible: boolean,
  anchorRef: RefObject<HTMLElement | null>,
  side: Side,
) {
  const [tone, setTone] = useState<HintTone>('on-dark');

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y =
      side === 'top'
        ? Math.min(window.innerHeight - 1, rect.bottom + 14)
        : side === 'bottom'
          ? Math.max(1, rect.top - 14)
          : side === 'left'
            ? Math.min(window.innerWidth - 1, rect.right + 10)
            : Math.max(1, rect.left - 10);
    setTone(isLightBackgroundAt(x, y) ? 'on-light' : 'on-dark');
  }, [anchorRef, side]);

  useLayoutEffect(() => {
    if (!visible) return;
    measure();
    const raf = requestAnimationFrame(measure);
    document.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [visible, measure]);

  return tone;
}

function EdgeHint({
  side,
  visible,
  active,
  pinEdges,
}: {
  side: Side;
  visible: boolean;
  active: boolean;
  pinEdges?: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const tone = useAdaptiveHintTone(visible, anchorRef, side);
  const styles = TONE_STYLES[tone];

  if (!visible) return null;

  const isVerticalTrack = pinEdges && (side === 'top' || side === 'bottom');

  const position = pinEdges
    ? side === 'top'
      ? `top-0 flex justify-center pt-1.5 ${isVerticalTrack ? VIEWPORT_EDGE_HINT_WIDTH_CLASS : 'inset-x-0'}`
      : side === 'bottom'
        ? `bottom-0 flex justify-center pb-1.5 ${isVerticalTrack ? VIEWPORT_EDGE_HINT_WIDTH_CLASS : 'inset-x-0'}`
        : side === 'left'
          ? 'inset-y-0 left-0 flex w-11 items-center justify-center'
          : 'inset-y-0 right-0 flex w-11 items-center justify-center'
    : side === 'top'
      ? 'left-1/2 top-2 -translate-x-1/2'
      : side === 'bottom'
        ? 'bottom-2 left-1/2 -translate-x-1/2'
        : side === 'left'
          ? 'left-2 top-1/2 -translate-y-1/2'
          : 'right-2 top-1/2 -translate-y-1/2';

  const gradient =
    side === 'left'
      ? `absolute inset-y-0 left-0 w-14 bg-gradient-to-r ${styles.scrimSide} to-transparent`
      : side === 'right'
        ? `absolute inset-y-0 right-0 w-14 bg-gradient-to-l ${styles.scrimSide} to-transparent`
        : '';

  const label =
    side === 'top'
      ? '위로 스크롤'
      : side === 'bottom'
        ? '아래로 스크롤'
        : side === 'left'
          ? '왼쪽으로 스크롤'
          : '오른쪽으로 스크롤';

  if (isVerticalTrack) {
    return (
      <div
        ref={anchorRef}
        className={`pointer-events-none absolute z-30 ${position}`}
        aria-hidden={!visible}
      >
        <TopBottomScrollTrack side={side} active={active} label={label} />
      </div>
    );
  }

  const chevronBubble = (
    <span
      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-150 ${
        active ? styles.bubbleActive : styles.bubbleIdle
      }`}
      title={label}
    >
      <ScrollChevron side={side} active={active} />
    </span>
  );

  return (
    <div
      ref={anchorRef}
      className={`pointer-events-none absolute z-30 ${pinEdges ? '' : 'flex items-center justify-center'} ${position}`}
      aria-hidden={!visible}
    >
      {gradient ? <span className={`pointer-events-none ${gradient}`} /> : null}
      {chevronBubble}
    </div>
  );
}

/** 패널·탭 가장자리 — 스크롤 가능·엣지 자동 스크롤 방향 힌트 */
export default function EdgeScrollHintOverlay({
  hints,
  axes = 'both',
  pinEdges = false,
}: {
  hints: EdgeScrollHintState;
  axes?: 'both' | 'horizontal' | 'vertical';
  pinEdges?: boolean;
}) {
  const { available, active } = hints;
  const showH = axes === 'both' || axes === 'horizontal';
  const showV = axes === 'both' || axes === 'vertical';

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[inherit]"
      aria-live="polite"
    >
      {showV ? (
        <>
          <EdgeHint side="top" visible={available.top} active={active.top} pinEdges={pinEdges} />
          <EdgeHint side="bottom" visible={available.bottom} active={active.bottom} pinEdges={pinEdges} />
        </>
      ) : null}
      {showH ? (
        <>
          <EdgeHint side="left" visible={available.left} active={active.left} pinEdges={pinEdges} />
          <EdgeHint side="right" visible={available.right} active={active.right} pinEdges={pinEdges} />
        </>
      ) : null}
    </div>
  );
}
