import type { CounselorAssessment } from '@/lib/assessmentApi';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

export type AssessmentListSortKey =
  | 'createdDesc'
  | 'createdAsc'
  | 'orgNameAsc'
  | 'orgNameDesc'
  | 'codeAsc'
  | 'codeDesc';

export const ASSESSMENT_LIST_SORT_OPTIONS: { value: AssessmentListSortKey; label: string }[] = [
  { value: 'createdDesc', label: '최신 생성순' },
  { value: 'createdAsc', label: '오래된 순' },
  { value: 'orgNameAsc', label: '기관/단체/그룹명 가나다순' },
  { value: 'orgNameDesc', label: '기관/단체/그룹명 역순' },
  { value: 'codeAsc', label: '검사코드 오름차순' },
  { value: 'codeDesc', label: '검사코드 내림차순' },
];

export function getAssessmentOrgLabel(a: CounselorAssessment): string {
  return (a.cohortName || a.title || '이름 없음').trim();
}

export function formatAssessmentSelectLabel(a: CounselorAssessment): string {
  return `${getAssessmentOrgLabel(a)} (${formatAccessCodeDisplay(a.accessCode)})`;
}

function parseCreatedAt(iso?: string): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export function sortCounselorAssessments(
  items: CounselorAssessment[],
  sortKey: AssessmentListSortKey
): CounselorAssessment[] {
  const copy = [...items];
  copy.sort((a, b) => {
    switch (sortKey) {
      case 'createdAsc':
        return parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt);
      case 'orgNameAsc':
        return getAssessmentOrgLabel(a).localeCompare(getAssessmentOrgLabel(b), 'ko');
      case 'orgNameDesc':
        return getAssessmentOrgLabel(b).localeCompare(getAssessmentOrgLabel(a), 'ko');
      case 'codeAsc':
        return (a.accessCode || '').localeCompare(b.accessCode || '');
      case 'codeDesc':
        return (b.accessCode || '').localeCompare(a.accessCode || '');
      case 'createdDesc':
      default:
        return parseCreatedAt(b.createdAt) - parseCreatedAt(a.createdAt);
    }
  });
  return copy;
}
