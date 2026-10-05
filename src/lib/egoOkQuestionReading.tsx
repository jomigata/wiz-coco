'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import {
  applyOptionalLineBreaks,
  collapseOptionalLineBreaks,
  hasOptionalLineBreak,
} from '@/lib/egoOkQuestionBreaks';

/** h2 전역 tracking-tight·가는 글꼴 합성으로 한글이 겹쳐 보이지 않도록 인라인으로 고정 */
const TEXT_STYLE: CSSProperties = {
  letterSpacing: '0px',
  fontWeight: 400,
  fontSynthesis: 'none',
  lineHeight: 1.7,
  WebkitFontSmoothing: 'auto',
  textRendering: 'auto',
};

const WRAPPER_CLASS =
  "mx-auto w-full max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] text-slate-50 sm:text-[18px]";

const MIN_LINES_TO_STRIP = 3;

function formatCommaSpacing(text: string): string {
  return text.replace(/, /g, ',\u2009');
}

function countTextNodeLines(textNode: Text): number {
  const range = document.createRange();
  range.selectNodeContents(textNode);
  return Math.max(1, range.getClientRects().length);
}

/** 화면과 같은 블록 줄 구조로만 줄 수 측정 (표시 상태와 되먹임 없음) */
function measureLineCountOffscreen(widthPx: number, textWithBreaks: string): number {
  if (widthPx <= 0) return 1;

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${widthPx}px`,
    visibility: 'hidden',
    pointerEvents: 'none',
  });

  const probe = document.createElement('div');
  probe.className = WRAPPER_CLASS;
  Object.assign(probe.style, {
    width: `${widthPx}px`,
    textAlign: 'center',
    letterSpacing: '0px',
    fontWeight: '400',
    lineHeight: '1.7',
    fontSize: '17px',
  });

  const formatted = formatCommaSpacing(textWithBreaks);
  for (const segment of formatted.split('\n')) {
    const line = document.createElement('div');
    line.textContent = segment;
    probe.appendChild(line);
  }

  host.appendChild(probe);
  document.body.appendChild(host);

  let lines = 0;
  probe.querySelectorAll('div').forEach((line) => {
    const textNode = line.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      lines += countTextNodeLines(textNode as Text);
    }
  });

  host.remove();
  return Math.max(1, lines);
}

function LineBlocks({ text }: { text: string }) {
  const lines = formatCommaSpacing(text).split('\n');
  return (
    <>
      {lines.map((line, index) => (
        <div key={`${index}-${line.slice(0, 16)}`} className="w-full">
          {line}
        </div>
      ))}
    </>
  );
}

/** 엑셀 체크리스트와 유사한 고딕 · 구절 쉼표(,) · @ 선택 줄바꿈 */
export function EgoOkQuestionReading({ readingText }: { readingText: string }) {
  const [stripFixedBreaks, setStripFixedBreaks] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(0);
  const hasBreak = hasOptionalLineBreak(readingText);
  const withBreaks = applyOptionalLineBreaks(readingText);
  const displayText = hasBreak && stripFixedBreaks ? collapseOptionalLineBreaks(readingText) : withBreaks;

  useLayoutEffect(() => {
    setStripFixedBreaks(false);
    widthRef.current = 0;
  }, [readingText]);

  useLayoutEffect(() => {
    if (!hasBreak) return;

    const el = rootRef.current;
    if (!el) return;

    const decide = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      if (widthRef.current === width) return;
      widthRef.current = width;
      const linesWithBreak = measureLineCountOffscreen(width, withBreaks);
      const shouldStrip = linesWithBreak >= MIN_LINES_TO_STRIP;
      setStripFixedBreaks((prev) => (prev === shouldStrip ? prev : shouldStrip));
    };

    decide();
    const ro = new ResizeObserver(decide);
    ro.observe(el);
    return () => ro.disconnect();
  }, [readingText, hasBreak, withBreaks]);

  return (
    <div ref={rootRef} className={`${WRAPPER_CLASS} text-center`} style={TEXT_STYLE}>
      <LineBlocks text={displayText} />
    </div>
  );
}
