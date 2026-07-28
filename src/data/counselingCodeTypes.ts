/** 상담코드 생성 시 상담사가 선택하는 상담 유형 (관리·분류용) */
export const COUNSELING_CODE_TYPES = [
  { value: 'individual', label: '개인상담', description: '1:1 개인 내담자 대상' },
  { value: 'group', label: '그룹상담', description: '소그룹·집단 프로그램' },
  { value: 'school', label: '학교·기관', description: '학교·대학·공공기관 프로그램' },
  { value: 'corporate', label: '기업·조직', description: '직장·조직 EAP·복지 프로그램' },
  { value: 'community', label: '상담센터·지역', description: '상담센터·지역사회 프로그램' },
  { value: 'other', label: '기타상담', description: '위 분류에 해당하지 않는 경우' },
] as const;

export type CounselingCodeType = (typeof COUNSELING_CODE_TYPES)[number]['value'];

export function counselingCodeTypeLabel(value: string | undefined | null): string {
  const v = (value || '').trim();
  const found = COUNSELING_CODE_TYPES.find((t) => t.value === v);
  return found?.label ?? (v || '—');
}

/** 목록 표시: 개인상담(RAR338) — 괄호 형식 */
export function formatCounselingCodeTypeWithCode(
  codeCategory: string | undefined | null,
  formattedAccessCode: string,
): string {
  const typeLabel = counselingCodeTypeLabel(codeCategory || 'group');
  const code = (formattedAccessCode || '').trim();
  if (!code || code === '—') return typeLabel;
  return `${typeLabel}(${code})`;
}

/** 목록 표시: 개인상담/RAR338 — 슬래시 형식 */
export function formatCounselingTypeWithCodeSlash(
  codeCategory: string | undefined | null,
  formattedAccessCode: string,
): string {
  const typeLabel = counselingCodeTypeLabel(codeCategory || 'group');
  const code = (formattedAccessCode || '').trim();
  if (!code || code === '—') return typeLabel;
  return `${typeLabel}/${code}`;
}
