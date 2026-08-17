/**
 * 검색어의 * 는 임의 문자·숫자 1개 이상(.+)에 매칭합니다.
 * * 가 없으면 기존처럼 부분 문자열(대소문자 무시) 검색입니다.
 */
export function matchesWildcardSearch(text: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  const hay = text || '';
  if (!q.includes('*')) {
    return hay.toLowerCase().includes(q.toLowerCase());
  }
  const escaped = q.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.+');
  try {
    return new RegExp(escaped, 'i').test(hay);
  } catch {
    return hay.toLowerCase().includes(q.toLowerCase());
  }
}

/** 여러 필드 각각에 대해 검색 — 필드를 이어 붙이지 않고, 하나라도 일치하면 true */
export function matchesWildcardFields(fields: Array<string | null | undefined>, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return fields.some((field) => matchesWildcardSearch(String(field ?? ''), q));
}
