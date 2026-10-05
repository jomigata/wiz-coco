'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import {
  applyOptionalLineBreaks,
  collapseOptionalLineBreaks,
  hasOptionalLineBreak,
} from '@/lib/egoOkQuestionBreaks';

const WRAPPER_CLASS =
  "inline-block max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 sm:text-[18px]";

const MIN_LINES_TO_STRIP = 3;

function countVisualLines(el: HTMLElement): number {
  const style = getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight);
  const height = el.getBoundingClientRect().height;
  if (lineHeight > 0 && !Number.isNaN(lineHeight)) {
    return Math.max(1, Math.round(height / lineHeight));
  }
  return Math.max(1, Math.round(height / 28));
}

/** 화면에 그리지 않고 줄 수만 측정 (이중 렌더 방지) */
function measureLineCountOffscreen(
  widthPx: number,
  textWithBreaks: string,
  fontSource: HTMLElement,
): number {
  if (widthPx <= 0) return 1;

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    width: `${widthPx}px`,
    height: '0',
    overflow: 'hidden',
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  const cs = getComputedStyle(fontSource);
  const span = document.createElement('span');
  span.style.display = 'inline-block';
  span.style.width = '100%';
  span.style.whiteSpace = 'pre-line';
  span.style.font = cs.font;
  span.style.letterSpacing = cs.letterSpacing;
  span.textContent = textWithBreaks;

  host.appendChild(span);
  document.body.appendChild(host);
  const lines = countVisualLines(span);
  host.remove();
  return lines;
}

function ReadingLines({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`} className={lineIndex > 0 ? 'block' : undefined}>
          {line.split(/(, )/g).map((part, partIndex) =>
            part === ', ' ? (
              <span key={`comma-${lineIndex}-${partIndex}`} className="mr-[0.35em]">
                ,
              </span>
            ) : (
              <span key={`part-${lineIndex}-${partIndex}-${part.slice(0, 8)}`}>{part}</span>
            ),
          )}
        </span>
      ))}
    </>
  );
}

/** 엑셀 체크리스트와 유사한 고딕 · 구절 쉼표(,) · @ 선택 줄바꿈 */
export function EgoOkQuestionReading({ readingText }: { readingText: string }) {
  const [stripFixedBreaks, setStripFixedBreaks] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
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
      const linesWithBreak = measureLineCountOffscreen(width, withBreaks, el);
      const shouldStrip = linesWithBreak >= MIN_LINES_TO_STRIP;
      setStripFixedBreaks((prev) => (prev === shouldStrip ? prev : shouldStrip));
    };

    decide();
    const ro = new ResizeObserver(decide);
    ro.observe(el);
    return () => ro.disconnect();
  }, [readingText, hasBreak, withBreaks]);

  return (
    <span ref={rootRef} className={WRAPPER_CLASS}>
      <ReadingLines text={displayText} />
    </span>
  );
}
