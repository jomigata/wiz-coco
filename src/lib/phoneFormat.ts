/**
 * 휴대폰·전화번호 표시용 (하이픈 구분).
 * 휴대폰 11자리: 010-1234-5678
 * 서울 02: 02-1234-5678 / 02-123-4567
 * 지역·대표번호: 0xx-xxx-xxxx / xxxx-xxxx
 */

function digitFromChar(ch: string): string | null {
  if (ch >= '0' && ch <= '9') return ch;
  const cp = ch.codePointAt(0)!;
  if (cp >= 0xff10 && cp <= 0xff19) {
    return String.fromCharCode(cp - 0xff10 + 0x30);
  }
  return null;
}

/** 숫자만 추출 (+82 → 0 접두) */
export function normalizePhoneDigits(raw: unknown): string {
  if (raw == null) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';

  let digits = '';
  for (const ch of trimmed) {
    const d = digitFromChar(ch);
    if (d) digits += d;
  }
  if (!digits) return '';

  if (digits.startsWith('82') && digits.length >= 10) {
    digits = `0${digits.slice(2)}`;
  }
  return digits;
}

/**
 * 내담자 일괄 등록(CSV/엑셀)용 — Excel이 선행 0을 제거한 10xxxxxxxx → 010xxxxxxxx
 */
export function normalizeRecipientPhone(raw: unknown): string {
  let digits = normalizePhoneDigits(raw);
  if (!digits) return '';
  if (digits.length === 10 && digits.startsWith('10')) {
    digits = `0${digits}`;
  }
  return digits;
}

function formatDigitsWithDashes(digits: string): string | null {
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith('01')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.startsWith('02')) {
    const rest = digits.slice(2);
    if (rest.length === 7) return `02-${rest.slice(0, 3)}-${rest.slice(3)}`;
    if (rest.length === 8) return `02-${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    if (digits.startsWith('01')) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 9 && digits.startsWith('02')) {
    const rest = digits.slice(2);
    return `02-${rest.slice(0, 3)}-${rest.slice(3)}`;
  }

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }

  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return null;
}

/** UI·Excel 등 표시용. 빈 값이면 '' */
export function formatPhoneDisplay(raw: unknown): string {
  const trimmed = raw == null ? '' : String(raw).trim();
  if (!trimmed) return '';

  const digits = normalizePhoneDigits(trimmed);
  if (!digits) return trimmed;

  const formatted = formatDigitsWithDashes(digits);
  if (formatted) return formatted;

  if (trimmed.includes('-')) return trimmed;
  return digits;
}

/** 표시용 + 빈 값 대체 문자 */
export function formatPhoneDisplayOr(raw: unknown, empty = '—'): string {
  return formatPhoneDisplay(raw) || empty;
}

/** 가운데 4자리 마스킹 표시 (예: 010-****-5410) */
export function formatPhoneMaskedDisplay(raw: unknown): string {
  const digits = normalizePhoneDigits(raw);
  if (!digits) return formatPhoneDisplayOr(raw);

  if (digits.length === 11 && digits.startsWith('01')) {
    return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith('01')) {
    return `${digits.slice(0, 3)}-****-${digits.slice(6)}`;
  }

  const formatted = formatPhoneDisplay(raw);
  const parts = formatted.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-****-${parts[2]}`;
  }

  if (digits.length >= 8) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }

  return formatted;
}
