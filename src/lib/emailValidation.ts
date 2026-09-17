/** 간단한 이메일 형식 검사 (연락처 수정·내담자 추가 등) */
export function isValidEmailAddress(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
