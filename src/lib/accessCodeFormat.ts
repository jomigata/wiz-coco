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

/** 나의코드: 연도 알파벳(2026=A, I/L/O/S/Z/B/G/Q 제외) + 숫자 2~9만 3자리 이상 */
const MY_CODE_LETTERS = 'ACDEFGHJKMNPRSTUVWXYZ';
const MY_CODE_RE = new RegExp(`^[${MY_CODE_LETTERS}]+[${DIGITS}]{3,}$`);

export function normalizeMyCodeInput(raw: string): string {
  const out: string[] = [];
  for (const ch of (raw || '').toUpperCase()) {
    if (MY_CODE_LETTERS.includes(ch)) out.push(ch);
    else if (DIGITS.includes(ch)) out.push(ch);
  }
  return out.join('');
}

export function isValidMyCodeInput(normalized: string): boolean {
  if (!normalized) return false;
  if (!MY_CODE_RE.test(normalized)) return false;
  let i = 0;
  while (i < normalized.length && MY_CODE_LETTERS.includes(normalized[i])) i += 1;
  return i >= 1 && normalized.length - i >= 3;
}

export function formatMyCodeWhileTyping(raw: string): string {
  return normalizeMyCodeInput(raw).slice(0, 20);
}

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

/** 로컬·서버 마이그레이션 완료 플래그 (localStorage) */
/** 로컬 저장소 데이터 마이그레이션 완료 플래그 (표시 전용 v1 이후 데이터 갱신) */
export const INSPECTION_CODE_MIGRATION_STORAGE_KEY = 'wizcoco_inspection_code_no_hyphen_data_v2';

/**
 * 검사코드·검사결과 코드 저장·조회용 정규화 (하이픈·공백 제거).
 * accessCode(CVC)와 MBTI 결과코드(MP250AA001) 공통.
 */
export function normalizeInspectionCode(raw: string): string {
  return normalizeAccessCodeInput(raw);
}

/** 문자열에 하이픈이 포함되어 있으면 true */
export function inspectionCodeHasHyphen(raw: string): boolean {
  return typeof raw === 'string' && raw.includes('-');
}

/** 조회 시 정규화 코드 우선, 레거시(하이픈 포함) URL·키 호환 */
export function inspectionCodeLookupKeys(raw: string): string[] {
  const trimmed = (raw || '').trim();
  if (!trimmed) return [];
  const normalized = normalizeInspectionCode(trimmed);
  const upper = trimmed.toUpperCase();
  const keys = new Set<string>();
  if (normalized) keys.add(normalized);
  if (upper) keys.add(upper);
  return Array.from(keys);
}

/** 저장된 코드와 조회 코드가 동일한 검사(하이픈 유무 무관)인지 */
export function inspectionCodesMatch(stored: string | undefined | null, lookup: string): boolean {
  if (!stored || !lookup) return false;
  const a = normalizeInspectionCode(stored);
  const b = normalizeInspectionCode(lookup);
  if (a && b && a === b) return true;
  return stored.toUpperCase() === lookup.toUpperCase();
}

/** localStorage test-result-* / mbti-test-result-* 조회 */
export function readLocalTestResultJson(code: string): string | null {
  if (typeof window === 'undefined' || !code) return null;
  for (const k of inspectionCodeLookupKeys(code)) {
    const v =
      localStorage.getItem(`test-result-${k}`) ?? localStorage.getItem(`mbti-test-result-${k}`);
    if (v) return v;
  }
  return null;
}
