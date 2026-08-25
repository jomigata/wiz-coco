/** 내담자 포털 — 담당 상담사 명칭 */

export const PORTAL_TEST_MANAGER_TITLE = '담당 상담사';
export const PORTAL_TEST_MANAGER_CHAT_LABEL = '상담사';
export const PORTAL_INQUIRY_SECTION_TITLE = '문의하기 / 채팅';
export const PORTAL_INQUIRY_SECTION_DESC =
  '담당 상담사에게 검사·이용 관련 질문을 남기면 답변을 받을 수 있습니다.';
export const PORTAL_MY_TEST_LIST_LABEL = '나의 검사목록';
export const PORTAL_PROGRESS_SECTION_TITLE = '진행 현황';
export const PORTAL_COMPLETED_RESULTS_TITLE = '완료한 검사 결과';

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
