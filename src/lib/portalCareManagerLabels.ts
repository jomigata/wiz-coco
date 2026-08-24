/** 내 검사실·내담자-facing — 심리 매니저 명칭 */

export const PORTAL_PSYCH_MANAGER_TITLE = '심리 매니저';
export const PORTAL_PSYCH_MANAGER_CHAT_LABEL = '매니저';
export const PORTAL_INQUIRY_SECTION_TITLE = '심리 매니저에게 문의하기';
export const PORTAL_INQUIRY_SECTION_DESC =
  '심리 매니저에게 검사·이용 관련 질문을 남기면 답변을 받을 수 있습니다.';
export const PORTAL_MY_TEST_LIST_LABEL = '나의 검사목록';

/** @deprecated use PORTAL_PSYCH_MANAGER_TITLE */
export const PORTAL_CARE_MANAGER_TITLE = PORTAL_PSYCH_MANAGER_TITLE;
/** @deprecated use PORTAL_PSYCH_MANAGER_CHAT_LABEL */
export const PORTAL_CARE_MANAGER_CHAT_LABEL = PORTAL_PSYCH_MANAGER_CHAT_LABEL;

export function portalPsychManagerDisplayName(name?: string | null): string {
  const trimmed = (name || '').trim();
  return trimmed || PORTAL_PSYCH_MANAGER_TITLE;
}

/** @deprecated use portalPsychManagerDisplayName */
export const portalCareManagerDisplayName = portalPsychManagerDisplayName;
