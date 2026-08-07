const ASSESSMENT_LIST_SEARCH_STORAGE_KEY = 'wizcoco:assessmentListSearch';

export function readAssessmentListSearch(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(ASSESSMENT_LIST_SEARCH_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function writeAssessmentListSearch(query: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = query.trim();
    if (trimmed) {
      sessionStorage.setItem(ASSESSMENT_LIST_SEARCH_STORAGE_KEY, trimmed);
    } else {
      sessionStorage.removeItem(ASSESSMENT_LIST_SEARCH_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function buildAssessmentProgressHref(assessmentId: string, searchQuery: string): string {
  const params = new URLSearchParams({ assessmentId: assessmentId.trim() });
  const q = searchQuery.trim();
  if (q) params.set('search', q);
  return `/counselor/assessments/progress?${params.toString()}`;
}
