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

/** 쉼표 1개면 그 뒤; 여러 개면 2줄·줄당 maxLen 이내 후보 중 균형 */
export function applyCommaBreakForTwoLines(text: string, lineMax = 42): string | null {
  const indices = commaSpaceIndices(text);
  if (indices.length === 0) return null;
  if (indices.length === 1) return breakAfterCommaAt(text, indices[0]);

  let bestAt: number | null = null;
  let bestDiff = Infinity;
  for (const commaAt of indices) {
    const line1Len = commaAt + 1;
    const line2Len = text.length - commaAt - 2;
    if (line1Len > lineMax || line2Len > lineMax) continue;
    const diff = Math.abs(line1Len - line2Len);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestAt = commaAt;
    }
  }
  if (bestAt == null) return null;
  return breakAfterCommaAt(text, bestAt);
}
