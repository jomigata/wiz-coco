'use client';

import { useLayoutEffect, useRef, useState } from 'react';

const WRAPPER_CLASS =
  "inline-block max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 sm:text-[18px]";

/** 고정 \\n + 자동 줄바꿈으로 시각 줄 수가 3줄 이상(줄바꿈 2회 이상)이면 고정 줄바꿈 제거 */
function countVisualLines(el: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = range.getClientRects();
  if (rects.length === 0) return 1;
  const tops = new Set<number>();
  for (let i = 0; i < rects.length; i++) {
    tops.add(Math.round(rects[i].top));
  }
  return tops.size;
}

function collapseFixedBreaks(text: string): string {
  return text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
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

/** 엑셀 체크리스트와 유사한 고딕 · 구절 쉼표(,) 가독성 */
export function EgoOkQuestionReading({ readingText }: { readingText: string }) {
  const [stripFixedBreaks, setStripFixedBreaks] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const hasFixedBreak = readingText.includes('\n');
  const displayText = hasFixedBreak && stripFixedBreaks ? collapseFixedBreaks(readingText) : readingText;

  useLayoutEffect(() => {
    if (!hasFixedBreak) {
      setStripFixedBreaks(false);
      return;
    }

    const container = rootRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return;

    const decide = () => {
      const width = container.clientWidth;
      if (width <= 0) return;
      probe.style.width = `${width}px`;
      const lineCount = countVisualLines(probe);
      setStripFixedBreaks(lineCount >= 3);
    };

    decide();
    const ro = new ResizeObserver(decide);
    ro.observe(container);
    return () => ro.disconnect();
  }, [readingText, hasFixedBreak]);

  return (
    <>
      <span
        ref={probeRef}
        aria-hidden
        className={`pointer-events-none fixed left-[-10000px] top-0 ${WRAPPER_CLASS} invisible`}
      >
        <ReadingLines text={readingText} />
      </span>
      <span ref={rootRef} className={WRAPPER_CLASS}>
        <ReadingLines text={displayText} />
      </span>
    </>
  );
}
