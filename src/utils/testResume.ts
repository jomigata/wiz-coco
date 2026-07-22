/**
 * 검사 페이지별 고정 testId 생성 (진행 중 저장·이어하기 기능은 제거됨)
 */

export function generateTestId(pathname: string, userId?: string): string {
  const pathParts = pathname.split('/').filter(Boolean);
  const testPath = pathParts.slice(pathParts.indexOf('tests') + 1).join('_');
  return userId ? `${testPath}_${userId}` : testPath;
}

/** 레거시 localStorage 진행 데이터 정리 (완료 시 등) */
export function clearTestProgress(testId: string): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`test_progress_${testId}`);
    const saved = localStorage.getItem('test_progress_list');
    if (!saved) return;
    const list = JSON.parse(saved) as Array<{ testId: string }>;
    if (!Array.isArray(list)) return;
    const filtered = list.filter((t) => t.testId !== testId);
    localStorage.setItem('test_progress_list', JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

/** 앱 로드 시 남아 있을 수 있는 진행 저장 키 일괄 삭제 */
export function purgeAllTestProgressStorage(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('test_progress_list');
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('test_progress_')) keys.push(key);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
