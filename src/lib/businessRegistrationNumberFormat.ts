/** 국내 사업자등록번호 10자리 — 표기 000-00-00000 */

function digitFromChar(ch: string): string | null {
  if (ch >= '0' && ch <= '9') return ch;
  const cp = ch.codePointAt(0)!;
  if (cp >= 0xff10 && cp <= 0xff19) {
    return String.fromCharCode(cp - 0xff10 + 0x30);
  }
  return null;
}

export function normalizeBusinessRegistrationDigits(raw: unknown): string {
  if (raw == null) return '';
  let digits = '';
  for (const ch of String(raw).trim()) {
    const d = digitFromChar(ch);
    if (d) digits += d;
  }
  return digits.slice(0, 10);
}

export function formatBusinessRegistrationNumber(raw: unknown): string {
  const digits = normalizeBusinessRegistrationDigits(raw);
  if (!digits) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatBusinessRegistrationWhileTyping(raw: string): string {
  return formatBusinessRegistrationNumber(raw);
}

export function formatBusinessRegistrationDisplayOr(raw: unknown, fallback: string): string {
  const formatted = formatBusinessRegistrationNumber(raw);
  return formatted || fallback;
}
