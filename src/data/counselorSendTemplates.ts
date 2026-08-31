import { counselorAssessmentTestOptions } from './counselorAssessmentTests';

export type CounselorSendTemplateId = 'basic' | 'relation' | 'stress' | 'custom';

export type CounselorSendTemplate = {
  id: CounselorSendTemplateId;
  name: string;
  description: string;
  testIds: string[];
  /** 발송 시 cohortName (그룹명) */
  presetGroupName?: string;
  /** 발송 시 title (소속) */
  presetAffiliation?: string;
  /** 맞춤 — 그룹명·소속 직접 입력 카드 */
  customOrgInput?: boolean;
};

/** 상담사가 고르는 검사 세트. 끝까지 되는 검사만 넣는다. */
export const COUNSELOR_SEND_TEMPLATES: CounselorSendTemplate[] = [
  {
    id: 'basic',
    name: '성격유형 검사',
    description: '개인의 종합적인 성격과 속마음을 알아봅니다.',
    presetGroupName: '성격유형 검사',
    presetAffiliation: '개인의 종합적인 성격과 속마음을 알아봅니다.',
    testIds: ['mbti'],
  },
  {
    id: 'relation',
    name: '관계.궁합 검사',
    description: '커플이나 가족간의 관계와 궁합을 알아봅니다.',
    presetGroupName: '관계.궁합 검사',
    presetAffiliation: '커플이나 가족간의 관계와 궁합을 알아봅니다.',
    testIds: ['inside-mbti'],
  },
  {
    id: 'stress',
    name: '마음상태 검사',
    description: '개인의 마음상태와 스트레스를 알아봅니다.',
    presetGroupName: '마음상태 검사',
    presetAffiliation: '개인의 마음상태와 스트레스를 알아봅니다.',
    testIds: ['generic'],
  },
  {
    id: 'custom',
    name: '맞춤',
    description: '그룹명 · 소속 직접 입력',
    testIds: ['generic'],
    customOrgInput: true,
  },
];

/** @deprecated use DEFAULT_WELCOME_MESSAGE from welcomeMessageSamples */
export const QUICK_SEND_MESSAGE = '아래 링크로 진행하여 주세요.';

export function resolveTemplateTestList(
  template: CounselorSendTemplate,
): { testId: string; name: string }[] {
  return template.testIds
    .map((id) => counselorAssessmentTestOptions.find((t) => t.testId === id))
    .filter((t): t is { testId: string; name: string } => Boolean(t));
}

export function resolveTemplateOrgFields(
  template: CounselorSendTemplate,
): { cohortName: string; title: string } {
  return {
    cohortName: (template.presetGroupName || template.name).slice(0, 120),
    title: (template.presetAffiliation || template.description).slice(0, 200),
  };
}
