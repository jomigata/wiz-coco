'use client';

const CLAUSE_BREAKS = [
  ' 보다는 ',
  ' 보다 ',
  ' 때는 ',
  ' 때 ',
  ' 경우 ',
  ' 이면 ',
  ' 면 ',
  ' 고 ',
  ' 며 ',
  ' 또는 ',
  ' 편이다',
  ' 편이 ',
  ' 것이다',
  ' 주십시오',
  ' 선택합니다',
  ' 있습니다',
  ' 없습니다',
  ' 한다',
  ' 된다',
  ' 있다',
  ' 없다',
];

function findMidClauseBreak(text: string): number | null {
  const target = text.length / 2;
  let best: number | null = null;
  let bestDist = Infinity;

  for (const pat of CLAUSE_BREAKS) {
    let from = 0;
    while (from < text.length) {
      const idx = text.indexOf(pat, from);
      if (idx === -1) break;
      const end = idx + pat.length;
      if (end >= 5 && end <= text.length - 3) {
        const dist = Math.abs(end - target);
        if (dist < bestDist) {
          bestDist = dist;
          best = end;
        }
      }
      from = idx + 1;
    }
  }
  return best;
}

/** 문항 본문을 2~3개 의미 그룹으로 나눔 (가독성 · 빠른 인식) */
export function splitEgoOkQuestionIntoGroups(text: string, depth = 0): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [''];
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  if (trimmed.length <= 14 || depth >= 2) return [trimmed];

  const commaParts = trimmed.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
  if (commaParts.length >= 2 && commaParts.length <= 3) return commaParts;

  const breakAt = findMidClauseBreak(trimmed);
  if (breakAt == null) return [trimmed];

  const head = trimmed.slice(0, breakAt).trim();
  const tail = trimmed.slice(breakAt).trim();
  if (!head || !tail) return [trimmed];

  const groups = [...splitEgoOkQuestionIntoGroups(head, depth + 1), ...splitEgoOkQuestionIntoGroups(tail, depth + 1)];
  if (groups.length <= 3) return groups;
  return [groups[0], groups.slice(1, -1).join(' '), groups[groups.length - 1]];
}

export function EgoOkQuestionText({ text }: { text: string }) {
  const groups = splitEgoOkQuestionIntoGroups(text);

  if (groups.length <= 1 && !text.includes('\n')) {
    return <span className="tracking-[0.04em]">{text}</span>;
  }

  return (
    <span className="inline-flex max-w-[min(100%,36rem)] flex-wrap items-center justify-center text-balance">
      {groups.map((group, index) => (
        <span key={`${index}-${group.slice(0, 12)}`} className="inline-flex items-center">
          {index > 0 ? (
            <span className="mx-[0.5em] select-none text-white/45" aria-hidden>
              ,
            </span>
          ) : null}
          <span className="tracking-[0.05em]">{group}</span>
        </span>
      ))}
    </span>
  );
}
