'use client';

import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import {
  applyOptionalLineBreaks,
  collapseOptionalLineBreaks,
  hasOptionalLineBreak,
} from '@/lib/egoOkQuestionBreaks';

const WRAPPER_CLASS =
  "inline-block max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 sm:text-[18px]";

const INNER_CLASS = 'block w-full whitespace-pre-line';

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

function CommaLineParts({ line }: { line: string }) {
  return (
    <>
      {line.split(/(, )/g).map((part, partIndex) =>
        part === ', ' ? (
          <span key={`comma-${partIndex}`} className="mr-[0.35em]">
            ,
          </span>
        ) : (
          <span key={`part-${partIndex}-${part.slice(0, 8)}`}>{part}</span>
        ),
      )}
    </>
  );
}

function ReadingLines({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <span className={INNER_CLASS}>
      {lines.map((line, lineIndex) => (
        <Fragment key={`line-${lineIndex}`}>
          {lineIndex > 0 ? '\n' : null}
          <CommaLineParts line={line} />
        </Fragment>
      ))}
    </span>
  );
}

/** 화면에 그리지 않고 줄 수만 측정 (React 트리와 분리) */
function measureLineCountOffscreen(widthPx: number, textWithBreaks: string, fontSource: HTMLElement): number {
  if (widthPx <= 0) return 1;

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${widthPx}px`,
    height: 'auto',
    overflow: 'hidden',
    visibility: 'hidden',
    pointerEvents: 'none',
    contain: 'strict',
  });

  const inner = document.createElement('span');
  inner.className = INNER_CLASS;
  inner.style.display = 'block';
  inner.style.width = `${widthPx}px`;
  const cs = getComputedStyle(fontSource);
  inner.style.font = cs.font;
  inner.style.letterSpacing = cs.letterSpacing;
  inner.style.lineHeight = cs.lineHeight;
  inner.textContent = textWithBreaks;

  host.appendChild(inner);
  document.body.appendChild(host);
  const lines = countVisualLines(inner);
  host.remove();
  return lines;
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
      if (width <= 0) return;
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
