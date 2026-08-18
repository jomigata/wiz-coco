/**
 * 레거시 검사코드(MP/EP/AP)·localStorage 검사기록 일괄 삭제.
 * 서버 purge 후에도 브라우저에 남는 캐시를 정리합니다.
 */

const LEGACY_RECORD_ARRAY_KEYS = [
  'test_records',
  'deleted_test_records',
  'admin_deleted_records',
  'mbti-user-test-records',
  'db_generated_codes',
  'test_records_cache',
  'selected-test-records',
] as const;

const LEGACY_SINGLE_KEYS = [
  'mbti_result',
  'mbti_answers',
  'mbti_completion_time',
  'mbti_test_code',
  'mbti_pro_completion_time',
  'mbti_pro_client_info',
  'mbti_pro_code_data',
  'mbti_pro_result_data',
  'mbti_pro_client_info_backup',
  'lastGeneratedCode',
] as const;

const LEGACY_KEY_PREFIXES = [
  'mbti-user-test-records-',
  'test-result-',
  'mbti-test-result-',
  'pending-test-result-',
  'client-info-',
] as const;

const LEGACY_CODE_PREFIX = /^(MP|MG|MA|EP|EA|EG|AP|AA|AG|MI)(\d{2})/;

export function isLegacyInspectionCode(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  return LEGACY_CODE_PREFIX.test(value.trim().toUpperCase());
}

/** 레거시 localStorage·sessionStorage 키 전부 제거 */
export function purgeLegacyTestStorage(): { removedKeys: number } {
  if (typeof window === 'undefined') return { removedKeys: 0 };

  let removedKeys = 0;

  const removeKey = (key: string) => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removedKeys += 1;
    }
  };

  for (const key of LEGACY_RECORD_ARRAY_KEYS) removeKey(key);
  for (const key of LEGACY_SINGLE_KEYS) removeKey(key);

  for (const key of Object.keys(localStorage)) {
    if (LEGACY_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      removeKey(key);
    }
  }

  try {
    sessionStorage.removeItem('returnToTestRecords');
    sessionStorage.removeItem('returnToDeletedCodes');
    sessionStorage.removeItem('testJustCompleted');
  } catch {
    // ignore
  }

  if (removedKeys > 0) {
    console.info(`[purgeLegacyTestStorage] removed ${removedKeys} legacy storage key(s)`);
  }

  return { removedKeys };
}
