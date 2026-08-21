import { counselorAssessmentTestOptions } from './counselorAssessmentTests';

export type CounselorSendTemplateId = 'basic' | 'relation' | 'stress';

export type CounselorSendTemplate = {
  id: CounselorSendTemplateId;
  name: string;
  description: string;
  testIds: string[];
};

/** 상담사가 고르는 검사 세트 3종. 끝까지 되는 검사만 넣는다. */
export const COUNSELOR_SEND_TEMPLATES: CounselorSendTemplate[] = [
  {
    id: 'basic',
    name: '기본',
    description: '성격 유형을 짧게 봅니다',
    testIds: ['mbti'],
  },
  {
    id: 'relation',
    name: '관계',
    description: '관계·궁합을 봅니다',
    testIds: ['inside-mbti'],
  },
  {
    id: 'stress',
    name: '스트레스',
    description: '3분 마음 체크 (6문항)',
    testIds: ['generic'],
  },
];

/** 카톡·안내 기본 문구. 상담사가 다시 쓰지 않는다. */
export const QUICK_SEND_MESSAGE =
  '아래 링크로 3분만 해 주세요. 회원가입은 필요 없습니다.';

export function resolveTemplateTestList(
  template: CounselorSendTemplate,
): { testId: string; name: string }[] {
  return template.testIds
    .map((id) => counselorAssessmentTestOptions.find((t) => t.testId === id))
    .filter((t): t is { testId: string; name: string } => Boolean(t));
}
