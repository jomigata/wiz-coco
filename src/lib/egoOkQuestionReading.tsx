'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import {
  applyOptionalLineBreaks,
  collapseOptionalLineBreaks,
  hasOptionalLineBreak,
} from '@/lib/egoOkQuestionBreaks';

const WRAPPER_CLASS =
  "inline-block max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 sm:text-[18px]";

/** 시각 줄 수가 3줄 이상(줄바꿈 2회 이상)이면 @/\\n 고정 줄바꿈 제거 */
function countVisualLines(el: HTMLElement): number {
  const style = getComputedStyle(el);
  const lineHeight = parseFloat(style.lineHeight);
  const height = el.getBoundingClientRect().height;
  if (lineHeight > 0 && !Number.isNaN(lineHeight)) {
    return Math.max(1, Math.round(height / lineHeight));
  }
  return Math.max(1, Math.round(height / 28));
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
    setStripFixedBreaks(false);
  }, [readingText]);

  useLayoutEffect(() => {
    if (!hasBreak || stripFixedBreaks) return;

    const el = rootRef.current;
    if (!el) return;

    if (countVisualLines(el) >= 3) {
      setStripFixedBreaks(true);
    }
  }, [readingText, hasBreak, stripFixedBreaks, withBreaks]);

  useLayoutEffect(() => {
    if (!hasBreak) return;

    const el = rootRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => setStripFixedBreaks(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [readingText, hasBreak]);

  return (
    <span ref={rootRef} className={WRAPPER_CLASS}>
      <ReadingLines text={displayText} />
    </span>
  );
}
