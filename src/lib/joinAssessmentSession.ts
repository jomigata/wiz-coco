/**
 * 검사코드 참여 세션: PIN은 Next.js 클라이언트 전환 시 본문 JSON이 깨지는 경우가 있어
 * 검사코드별 백업 키에도 보관한다.
 */
import { normalizeAccessCodeInput, normalizeJoinPinDigits } from '@/lib/accessCodeFormat';

export const JOIN_STORAGE_KEY = 'wizcoco_join_assessment';

function joinPinBackupStorageKey(accessCodeNorm: string): string {
  return `wizcoco_join_pin_${normalizeAccessCodeInput(accessCodeNorm)}`;
}

/** 4자리 PIN만 백업(없으면 해당 키 제거) */
export function persistJoinPinBackup(accessCodeNorm: string, pinRaw: unknown): void {
  if (typeof window === 'undefined') return;
  const code = normalizeAccessCodeInput(accessCodeNorm);
  const pin = normalizeJoinPinDigits(pinRaw);
  try {
    if (pin.length === 4) sessionStorage.setItem(joinPinBackupStorageKey(code), pin);
    else sessionStorage.removeItem(joinPinBackupStorageKey(code));
  } catch {
    // ignore
  }
}

/** 메인 세션(검사코드 일치 시) → 백업 순으로 PIN 조회 */
export function readJoinPinForAccessCode(accessCodeNorm: string): string {
  if (typeof window === 'undefined') return '';
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code) return '';
  try {
    const raw = sessionStorage.getItem(JOIN_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { accessCode?: unknown; joinPin?: unknown };
      if (normalizeAccessCodeInput(String(p.accessCode ?? '')) === code) {
        const pin = normalizeJoinPinDigits(p.joinPin);
        if (pin.length === 4) return pin;
      }
    }
  } catch {
    // ignore
  }
  try {
    return normalizeJoinPinDigits(sessionStorage.getItem(joinPinBackupStorageKey(code)));
  } catch {
    return '';
  }
}

/** 메인 세션 JSON의 joinPin 필드를 백업·복원 값으로 맞춤(검사 화면에서 돌아올 때 누락 방지) */
export function syncJoinMainStoragePin(accessCodeNorm: string): void {
  if (typeof window === 'undefined') return;
  const code = normalizeAccessCodeInput(accessCodeNorm);
  const pin = readJoinPinForAccessCode(code);
  persistJoinPinBackup(code, pin);
  try {
    const raw = sessionStorage.getItem(JOIN_STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (normalizeAccessCodeInput(String(p.accessCode ?? '')) !== code) return;
    if (pin.length === 4) p.joinPin = pin;
    sessionStorage.setItem(JOIN_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

/**
 * 검사 선택 현황으로 이동(코드·PIN 재입력 없이).
 * 클라이언트 라우팅에서 #p 가 누락되는 경우가 있어 `location.assign` 사용.
 */
export function navigateToJoinSelectionDashboard(accessCodeNorm: string): void {
  const code = normalizeAccessCodeInput(accessCodeNorm);
  if (!code || typeof window === 'undefined') return;
  syncJoinMainStoragePin(code);
  const pin = readJoinPinForAccessCode(code);
  const path = `/join/dashboard?accessCode=${encodeURIComponent(code)}`;
  const target = pin.length === 4 ? `${path}#p=${encodeURIComponent(pin)}` : path;
  window.location.assign(target);
}
