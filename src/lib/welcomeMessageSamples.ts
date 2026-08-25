/** 상담(코드) 안내 메시지 — 새 구성·수정 폼 예시 버튼용 */

export type WelcomeMessageSample = {
  label: string;
  text: string;
};

export const WELCOME_MESSAGE_SAMPLES: WelcomeMessageSample[] = [
  {
    label: '샘플 1',
    text:
      '검사는 편안한 마음으로 솔직하게 응답해 주시면 됩니다. 문의 사항은 담당 상담사에게 연락해 주세요.',
  },
  {
    label: '샘플 2',
    text:
      '[접속 안내] ① 이메일·문자로 받은 나의코드·비밀번호 확인 ② 나의 검사목록에 로그인 ③ 검사 목록에서 순서대로 실시. 검사 중 어려움이 있으면 담당 상담사에게 연락해 주세요.',
  },
  {
    label: '샘플 3',
    text:
      '안녕하세요. 이번 심리검사에 참여해 주셔서 감사합니다. 발송된 나의코드·비밀번호로 나의 검사목록에 접속한 뒤, 안내된 검사를 모두 완료해 주세요. 궁금한 점은 담당 상담사에게 문의해 주세요.',
  },
  {
    label: '샘플 4',
    text: '아래 링크로 진행하여 주세요.',
  },
];

/** 내 검사실 진행 현황에서 표시하지 않을 안내 문구(구 샘플·기본 문구) */
const PORTAL_WELCOME_BOILERPLATE =
  '본 검사는 안내된 기한 내에 완료해 주시기 바랍니다. 검사 결과는 상담·코칭 목적으로만 활용되며, 개인정보는 관련 법령에 따라 보호됩니다.';

export function stripPortalWelcomeBoilerplate(message: string): string {
  const trimmed = (message || '').trim();
  if (!trimmed) return '';
  if (trimmed === PORTAL_WELCOME_BOILERPLATE) return '';
  return trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line && line !== PORTAL_WELCOME_BOILERPLATE)
    .join('\n')
    .trim();
}
