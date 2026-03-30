/**
 * 검사코드 표시·검증 (백엔드 utils/access_code.py 와 동일 규칙)
 * 신규: CVC(자음-모음-자음, L/I/O/0/1 제외) + 숫자 2~9만 3자리 이상
 * 구형: 영숫자 6자리
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

/** 읽기 쉽게: KAN724 → KAN-724 (구형 6자리는 그대로) */
export function formatAccessCodeDisplay(canonical: string): string {
  if (!canonical) return '';
  const u = canonical.toUpperCase();
  if (OLD_RE.test(u)) return u;
  const m = u.match(
    new RegExp(`^([${CONSONANTS}][${VOWELS}][${CONSONANTS}])([${DIGITS}]+)$`, 'i')
  );
  if (m) return `${m[1].toUpperCase()}-${m[2]}`;
  return u;
}

/**
 * 입력 중: 신규 형식(CVC+숫자 2~9)이면 3글자 뒤 숫자 구간 앞에 하이픈 표시.
 * 구형 6자리(영숫자)는 하이픈 없음.
 */
export function formatAccessCodeWhileTyping(raw: string): string {
  const noHyphen = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!noHyphen) return '';
  if (noHyphen.length === 6 && OLD_RE.test(noHyphen)) return noHyphen;
  const m = noHyphen.match(
    new RegExp(`^([${CONSONANTS}][${VOWELS}][${CONSONANTS}])([${DIGITS}]*)$`, 'i')
  );
  if (m) {
    const letters = m[1].toUpperCase();
    const digits = m[2];
    if (digits.length > 0) return `${letters}-${digits}`;
    return letters;
  }
  return noHyphen;
}
