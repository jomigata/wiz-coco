'use client';

/** 엑셀 체크리스트와 유사한 고딕 · 구절 쉼표(,) 가독성 */
export function EgoOkQuestionReading({ readingText }: { readingText: string }) {
  const lines = readingText.split('\n');

  return (
    <span className="inline-block max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 sm:text-[18px]">
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`} className="block">
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
    </span>
  );
}
