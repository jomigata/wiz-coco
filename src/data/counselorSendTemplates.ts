import { counselorAssessmentTestOptions } from './counselorAssessmentTests';

export type CounselorSendTemplateId = 'basic' | 'relation' | 'stress' | 'custom';

export type CounselorSendTemplate = {
  id: CounselorSendTemplateId;
  name: string;
  description: string;
  testIds: string[];
  /** 기관/단체/그룹명 직접 입력 카드 */
  customOrgInput?: boolean;
};

/** 상담사가 고르는 검사 세트. 끝까지 되는 검사만 넣는다. */
export const COUNSELOR_SEND_TEMPLATES: CounselorSendTemplate[] = [
  {
    id: 'basic',
    name: '이고-오케이그램',
    description: '성격 유형을 짧게 봅니다',
    testIds: ['mbti'],
  },
  {
    id: 'relation',
    name: '커플·가족·관계',
    description: '관계·궁합을 봅니다',
    testIds: ['inside-mbti'],
  },
  {
    id: 'stress',
    name: '스트레스',
    description: '3분 마음 체크 (6문항)',
    testIds: ['generic'],
  },
  {
    id: 'custom',
    name: '맞춤',
    description: '검사 선택',
    testIds: ['generic'],
    customOrgInput: true,
  },
];

/** 카톡·안내 기본 문구. 상담사가 검사 보내기 화면에서 수정할 수 있다. */
export const QUICK_SEND_MESSAGE = '아래 링크로 진행하여 주세요.';

export function resolveTemplateTestList(
  template: CounselorSendTemplate,
): { testId: string; name: string }[] {
  return template.testIds
    .map((id) => counselorAssessmentTestOptions.find((t) => t.testId === id))
    .filter((t): t is { testId: string; name: string } => Boolean(t));
}
