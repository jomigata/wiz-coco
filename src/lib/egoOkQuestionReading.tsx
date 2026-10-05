'use client';

const GROUP_GAP = '\u3000\u3000';

/** 엑셀 체크리스트와 유사한 고딕·그룹 간격(쉼표 없음) */
export function EgoOkQuestionReading({ readingText }: { readingText: string }) {
  const lines = readingText.split('\n');

  return (
    <span className="inline-block max-w-[min(100%,38rem)] font-['Malgun_Gothic','Apple_SD_Gothic_Neo','Noto_Sans_KR',sans-serif] text-[17px] font-normal leading-[1.65] tracking-[0.02em] text-slate-50 sm:text-[18px]">
      {lines.map((line, lineIndex) => (
        <span key={`line-${lineIndex}`} className="block">
          {line.split(GROUP_GAP).map((group, groupIndex) => (
            <span
              key={`${lineIndex}-${groupIndex}-${group.slice(0, 8)}`}
              className={groupIndex > 0 ? 'ml-[0.45em]' : undefined}
            >
              {group}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
