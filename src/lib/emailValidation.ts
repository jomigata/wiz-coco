/** 내담자·발송용 이메일 형식 (Gmail RFC 5321 거부 패턴 방지) */
export function normalizeEmailAddress(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmailAddress(raw: string): boolean {
  const email = normalizeEmailAddress(raw);
  if (!email) return true;
  if (email.length > 254 || email.includes('..')) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const [local, domain] = email.split('@');
  if (!local || !domain) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((l) => !l)) return false;
  return true;
}
