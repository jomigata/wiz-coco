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
