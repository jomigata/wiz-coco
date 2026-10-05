'use client';

import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import {
  applyOptionalLineBreaks,
  collapseOptionalLineBreaks,
  hasOptionalLineBreak,
} from '@/lib/egoOkQuestionBreaks';

const WRAPPER_CLASS =
  "mx-auto max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 antialiased sm:text-[18px]";

const MIN_LINES_TO_STRIP = 3;

/** 쉼표 뒤 여백 — 추가 span 없이 한 텍스트 노드 */
function formatCommaSpacing(text: string): string {
  return text.replace(/, /g, ',\u2009');
}

function countTextNodeLines(textNode: Text): number {
  const range = document.createRange();
  range.selectNodeContents(textNode);
  return range.getClientRects().length;
}

function countVisibleLinesFromContainer(container: HTMLElement): number {
  let lines = 0;
  container.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      lines += countTextNodeLines(node as Text);
    }
  });
  return Math.max(1, lines);
}

/** `\n` → `<br />` 와 동일한 DOM으로 시각적 줄 수 (wrap + 고정 줄바꿈) */
function countVisualLinesForPlainText(root: HTMLElement, plainText: string): number {
  const formatted = formatCommaSpacing(plainText);
  const segments = formatted.split('\n');

  root.replaceChildren();
  segments.forEach((segment, index) => {
    if (index > 0) {
      root.appendChild(document.createElement('br'));
    }
    if (segment.length > 0) {
      root.appendChild(document.createTextNode(segment));
    }
  });

  let lines = 0;
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      lines += countTextNodeLines(node as Text);
    }
  });
  return Math.max(1, lines);
}

function measureLineCountOffscreen(widthPx: number, textWithBreaks: string, fontSource: HTMLElement): number {
  if (widthPx <= 0) return 1;

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${widthPx}px`,
    overflow: 'hidden',
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  const probe = document.createElement('div');
  probe.className = WRAPPER_CLASS;
  probe.style.width = `${widthPx}px`;
  probe.style.textAlign = 'center';
  const cs = getComputedStyle(fontSource);
  probe.style.font = cs.font;
  probe.style.letterSpacing = cs.letterSpacing;
  probe.style.lineHeight = cs.lineHeight;

  host.appendChild(probe);
  document.body.appendChild(host);
  const lines = countVisualLinesForPlainText(probe, textWithBreaks);
  host.remove();
  return lines;
}

function BrFormattedText({ text }: { text: string }) {
  const formatted = formatCommaSpacing(text);
  const segments = formatted.split('\n');

  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={`seg-${index}-${segment.slice(0, 12)}`}>
          {index > 0 ? <br /> : null}
          {segment}
        </Fragment>
      ))}
    </>
  );
}

/** 엑셀 체크리스트와 유사한 고딕 · 구절 쉼표(,) · @ 선택 줄바꿈 */
export function EgoOkQuestionReading({ readingText }: { readingText: string }) {
  const [stripFixedBreaks, setStripFixedBreaks] = useState(false);
  const stripRef = useRef(stripFixedBreaks);
  stripRef.current = stripFixedBreaks;
  const rootRef = useRef<HTMLDivElement>(null);
  const hasBreak = hasOptionalLineBreak(readingText);
  const withBreaks = applyOptionalLineBreaks(readingText);
  const displayText = hasBreak && stripFixedBreaks ? collapseOptionalLineBreaks(readingText) : withBreaks;

  useLayoutEffect(() => {
    if (!hasBreak) {
      setStripFixedBreaks(false);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const decide = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      let linesWithBreak = measureLineCountOffscreen(width, withBreaks, el);
      // pre-line 측정과 달리, `<br />` 렌더 기준으로 화면에서 한 번 더 확인 (2·6·7번 등 3줄 strip 누락 방지)
      if (!stripRef.current) {
        linesWithBreak = Math.max(linesWithBreak, countVisibleLinesFromContainer(el));
      }
      const shouldStrip = linesWithBreak >= MIN_LINES_TO_STRIP;
      setStripFixedBreaks((prev) => (prev === shouldStrip ? prev : shouldStrip));
    };

    decide();
    const ro = new ResizeObserver(decide);
    ro.observe(el);
    return () => ro.disconnect();
  }, [readingText, hasBreak, withBreaks]);

  return (
    <div ref={rootRef} className={`${WRAPPER_CLASS} text-center`}>
      <BrFormattedText text={displayText} />
    </div>
  );
}
