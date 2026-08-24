/** 내 검사실·내담자-facing — 검사 케어 매니저 명칭 */

export const PORTAL_CARE_MANAGER_TITLE = '검사 케어 매니저';
export const PORTAL_CARE_MANAGER_CHAT_LABEL = '매니저';
export const PORTAL_INQUIRY_SECTION_TITLE = '검사 케어 매니저에게 문의하기';
export const PORTAL_INQUIRY_SECTION_DESC =
  '검사 케어 매니저에게 검사·이용 관련 질문을 남기면 답변을 받을 수 있습니다.';
export const PORTAL_MY_TEST_LIST_LABEL = '나의 검사목록';

export function portalCareManagerDisplayName(name?: string | null): string {
  const trimmed = (name || '').trim();
  return trimmed || PORTAL_CARE_MANAGER_TITLE;
}
