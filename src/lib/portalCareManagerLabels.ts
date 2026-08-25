/** 내 검사실·내담자-facing — 검사 매니저 명칭 */

export const PORTAL_TEST_MANAGER_TITLE = '검사 매니저';
export const PORTAL_TEST_MANAGER_CHAT_LABEL = '매니저';
export const PORTAL_INQUIRY_SECTION_TITLE = '검사 매니저에게 문의하기';
export const PORTAL_INQUIRY_SECTION_DESC =
  '검사 매니저에게 검사·이용 관련 질문을 남기면 답변을 받을 수 있습니다.';
export const PORTAL_MY_TEST_LIST_LABEL = '나의 검사목록';
export const PORTAL_PROGRESS_SECTION_TITLE = '진행 현황';

/** @deprecated */
export const PORTAL_PSYCH_MANAGER_TITLE = PORTAL_TEST_MANAGER_TITLE;
/** @deprecated */
export const PORTAL_PSYCH_MANAGER_CHAT_LABEL = PORTAL_TEST_MANAGER_CHAT_LABEL;
/** @deprecated */
export const PORTAL_CARE_MANAGER_TITLE = PORTAL_TEST_MANAGER_TITLE;
/** @deprecated */
export const PORTAL_CARE_MANAGER_CHAT_LABEL = PORTAL_TEST_MANAGER_CHAT_LABEL;

export function portalTestManagerDisplayName(name?: string | null): string {
  const trimmed = (name || '').trim();
  return trimmed || PORTAL_TEST_MANAGER_TITLE;
}

export function portalTestManagerChatSenderLabel(name?: string | null): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return PORTAL_TEST_MANAGER_CHAT_LABEL;
  return `${trimmed} (${PORTAL_TEST_MANAGER_CHAT_LABEL})`;
}

/** @deprecated */
export const portalPsychManagerDisplayName = portalTestManagerDisplayName;
/** @deprecated */
export const portalCareManagerDisplayName = portalTestManagerDisplayName;
