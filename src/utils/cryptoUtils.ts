import crypto from 'crypto';

/**
 * 지정된 길이의 랜덤 문자열을 생성합니다.
 * @param length 생성할 문자열의 길이 (기본값: 32)
 * @returns 생성된 랜덤 문자열
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

/**
 * 비밀번호를 해싱합니다.
 * @param password 해싱할 비밀번호
 * @param salt 솔트 (없으면 새로 생성)
 * @returns 해시값과 솔트를 포함한 객체
 */
export function hashPassword(password: string, salt?: string) {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, useSalt, 1000, 64, 'sha512')
    .toString('hex');
  return { hash, salt: useSalt };
}

/**
 * 비밀번호가 해시값과 일치하는지 확인합니다.
 * @param password 확인할 비밀번호
 * @param hash 비교할 해시값
 * @param salt 해싱에 사용된 솔트
 * @returns 일치 여부 (boolean)
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === verifyHash;
}

/**
 * 6자리 인증 코드를 생성합니다.
 * @returns 6자리 숫자 문자열
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
} 