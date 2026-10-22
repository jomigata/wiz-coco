/** 편집용 `@` · 저장용 `\n` — 선택적 고정 줄바꿈 */
export const EGO_OK_OPTIONAL_BREAK = '@';

export function hasOptionalLineBreak(text: string): boolean {
  return text.includes(EGO_OK_OPTIONAL_BREAK) || text.includes('\n');
}

export function applyOptionalLineBreaks(text: string): string {
  return text.replace(/@/g, '\n');
}

export function collapseOptionalLineBreaks(text: string): string {
  return text.replace(/@/g, ' ').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** canonical(JSON) → items-96 저장 형식 */
export function canonicalTextToStored(text: string): string {
  return applyOptionalLineBreaks(text);
}

export function commaSpaceIndices(text: string): number[] {
  const positions: number[] = [];
  for (let i = 0; i < text.length - 1; i += 1) {
    if (text[i] === ',' && text[i + 1] === ' ') positions.push(i);
  }
  return positions;
}

export function countCommaSpaces(text: string): number {
  return commaSpaceIndices(text).length;
}

export function breakAfterCommaAt(text: string, commaAt: number): string {
  return `${text.slice(0, commaAt + 1)}\n${text.slice(commaAt + 2)}`;
}

/** 쉼표(, ) 1개일 때만 그 뒤 줄바꿈 (문항 규칙: 문장당 쉼표 1개) */
export function applyCommaBreakForTwoLines(text: string): string | null {
  const indices = commaSpaceIndices(text);
  if (indices.length !== 1) return null;
  return breakAfterCommaAt(text, indices[0]);
}

/** 2줄·단어(공백) 경계 — 쉼표 줄바꿈이 3줄 이상일 때 대체 */
export function applyBalancedTwoLineBreak(text: string, lineMax: number): string | null {
  const collapsed = collapseOptionalLineBreaks(text);
  if (lineMax < 8 || collapsed.length <= lineMax) return collapsed;

  const spaces: number[] = [];
  for (let i = 0; i < collapsed.length; i += 1) {
    if (collapsed[i] === ' ') spaces.push(i);
  }
  if (spaces.length === 0) return null;

  let bestAt = -1;
  let bestDiff = Infinity;
  for (const sp of spaces) {
    const line1Len = sp;
    const line2Len = collapsed.length - sp - 1;
    if (line1Len > lineMax || line2Len > lineMax) continue;
    const diff = Math.abs(line1Len - line2Len);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestAt = sp;
    }
  }
  if (bestAt < 0) {
    const mid = Math.floor(collapsed.length / 2);
    let fallback = spaces.find((s) => s >= mid - 4 && s <= mid + 8);
    if (fallback == null) fallback = spaces[Math.floor(spaces.length / 2)];
    bestAt = fallback;
  }
  return `${collapsed.slice(0, bestAt)}\n${collapsed.slice(bestAt + 1)}`;
}

/** 뷰포트 너비(17px 고딕) 기준 대략적 한 줄 글자 수 */
export function estimateCharsPerLine(widthPx: number): number {
  if (widthPx <= 0) return 42;
  return Math.max(14, Math.floor(widthPx / 19));
}
