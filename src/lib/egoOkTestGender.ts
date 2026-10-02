import type { EgoOkGender } from '@/lib/egoOkScoring';

export const EGO_OK_TEST_GENDER_STORAGE_KEY = 'wizcoco-ego-ok-test-display-gender';

export function egoOkGenderToLabel(gender: EgoOkGender): string {
  return gender === 'female' ? '여성' : '남성';
}

export function loadStoredTestGender(): EgoOkGender {
  if (typeof window === 'undefined') return 'male';
  const stored = localStorage.getItem(EGO_OK_TEST_GENDER_STORAGE_KEY);
  return stored === 'female' ? 'female' : 'male';
}

export function saveStoredTestGender(gender: EgoOkGender): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EGO_OK_TEST_GENDER_STORAGE_KEY, gender);
}

/** 테스트 결과: 새로고침마다 남↔여 교대 (저장값 기준 토글) */
export function toggleTestGenderOnPageLoad(): EgoOkGender {
  if (typeof window === 'undefined') return 'male';
  const sessionKey = 'wizcoco-ego-ok-test-gender-toggled';
  if (sessionStorage.getItem(sessionKey)) {
    return loadStoredTestGender();
  }
  const prev = loadStoredTestGender();
  const next: EgoOkGender = prev === 'female' ? 'male' : 'female';
  saveStoredTestGender(next);
  sessionStorage.setItem(sessionKey, '1');
  return next;
}
