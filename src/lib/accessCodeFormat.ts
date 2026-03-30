/**
 * 검사코드 표시·검증 (백엔드 utils/access_code.py 와 동일 규칙)
 * 신규: CVC(자음-모음-자음, L/I/O/0/1 제외) + 숫자 2~9만 3자리 이상
 * 구형: 영숫자 6자리
 *
 * 하이픈(-)은 화면·입력 표시용일 뿐이며, 저장·API·URL에는 포함되지 않습니다.
 * (normalizeAccessCodeInput 이 영숫자만 남깁니다.)
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
 * 연속 알파벳 / 연속 숫자 덩어리 사이에만 하이픈 삽입 (가독성).
 * 저장값은 하이픈 없이 A-Z0-9 만 사용한다고 가정합니다.
 */
function formatAccessCodeDisplayFromAlnum(upperAlnum: string): string {
  const u = (upperAlnum || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (!u) return '';
  const parts: string[] = [];
  let i = 0;
  while (i < u.length) {
    const isDigit = u[i] >= '0' && u[i] <= '9';
    let j = i + 1;
    while (j < u.length) {
      const d = u[j] >= '0' && u[j] <= '9';
      if (d !== isDigit) break;
      j++;
    }
    parts.push(u.slice(i, j));
    i = j;
  }
  return parts.join('-');
}

/**
 * Firestore/API에 저장된 canonical 검사코드 → 화면 표시용 (하이픈은 표시 전용).
 */
export function formatAccessCodeDisplay(canonical: string): string {
  return formatAccessCodeDisplayFromAlnum(normalizeAccessCodeInput(canonical));
}

/**
 * 일반 입력란용: 알파벳·숫자 경계마다 하이픈 (상담사 목록 등).
 */
export function formatAccessCodeWhileTyping(raw: string): string {
  return formatAccessCodeDisplayFromAlnum(normalizeAccessCodeInput(raw));
}

/**
 * 검사 하기(join) 전용: 처음 3글자는 알파벳만, 3글자 입력 후 `-` 자동 표시, 이어서 숫자만.
 * 구형 6자리 코드는 한 번에 붙여 넣은 경우에만 덩어리 하이픈 표시로 입력 가능.
 */
export function formatJoinAccessCodeWhileTyping(raw: string): string {
  const u = normalizeAccessCodeInput(raw);
  if (!u) return '';

  if (u.length === 6 && OLD_RE.test(u)) {
    return formatAccessCodeDisplayFromAlnum(u);
  }

  let letters = '';
  let i = 0;
  while (i < u.length && letters.length < 3) {
    const c = u[i];
    if (c >= 'A' && c <= 'Z') {
      letters += c;
      i++;
    } else {
      break;
    }
  }

  if (letters.length < 3) {
    return letters;
  }

  let digits = '';
  while (i < u.length) {
    const c = u[i];
    if (c >= '0' && c <= '9') {
      digits += c;
      i++;
    } else {
      return formatAccessCodeDisplayFromAlnum(u);
    }
  }

  return digits.length > 0 ? `${letters}-${digits}` : `${letters}-`;
}
