/**
 * 검사코드 표시·검증 (백엔드 utils/access_code.py 와 동일 규칙)
 * 신규: CVC(자음+모음+자음, L/I/O/0/1 제외) + 숫자 2~9만 3자리 이상
 * 구형: 영숫자 6자리
 *
 * 화면·입력 표시는 하이픈(-) 없이 A-Z0-9 만 사용합니다.
 * 저장·API·URL 키는 normalizeAccessCodeInput 으로 동일하게 정규화합니다.
 */

const CONSONANTS = 'BCDFGHJKMNPQRSTVWXYZ';
const VOWELS = 'AEU';
const DIGITS = '23456789';

const NEW_RE = new RegExp(
  `^[${CONSONANTS}][${VOWELS}][${CONSONANTS}][${DIGITS}]{3,}$`,
  'i'
);
const OLD_RE = /^[0-9A-Z]{6}$/i;

export function normalizeAccessCodeInput(raw: string): string {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidAccessCodeInput(normalized: string): boolean {
  if (!normalized) return false;
  const u = normalized.toUpperCase();
  if (OLD_RE.test(u)) return true;
  return NEW_RE.test(u);
}

/**
 * 검사 참여 4자리 PIN: 전각 숫자·문자열/숫자 혼용 저장값까지 ASCII 숫자만 최대 4자리로 통일.
 */
export function normalizeJoinPinDigits(raw: unknown): string {
  if (raw == null || raw === '') return '';
  let out = '';
  for (const ch of String(raw)) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0xff10 && cp <= 0xff19) {
      out += String.fromCharCode(cp - 0xff10 + 0x30);
      continue;
    }
    if (ch >= '0' && ch <= '9') out += ch;
  }
  return out.slice(0, 4);
}

/**
 * 검사코드·검사결과 코드 UI 표시용 (하이픈 등 비영숫자 제거).
 * 구형 MP250-AA001 형식도 MP250AA001 로 표시합니다.
 */
export function formatAccessCodeDisplay(canonical: string): string {
  if (canonical == null || canonical === '') return '';
  if (canonical === '—') return '—';
  const normalized = normalizeAccessCodeInput(String(canonical));
  if (normalized) return normalized;
  return String(canonical).replace(/-/g, '').toUpperCase();
}

/**
 * 입력란용: 영숫자만 허용, 하이픈은 입력·표시하지 않음.
 */
export function formatAccessCodeWhileTyping(raw: string): string {
  return normalizeAccessCodeInput(raw);
}

/**
 * 검사 하기(join) 입력란용: formatAccessCodeWhileTyping 과 동일.
 */
export function formatJoinAccessCodeWhileTyping(raw: string): string {
  return normalizeAccessCodeInput(raw);
}
