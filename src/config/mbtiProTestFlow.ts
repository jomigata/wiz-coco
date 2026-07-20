export type MbtiProCodePrefix = 'PROFESSIONAL' | 'EGO_PROFESSIONAL';

export type MbtiProTestFlowConfig = {
  defaultPath: string;
  displayName: string;
  progressTestType: string;
  firebaseTestTypeLabel: string;
  totalQuestions: number;
  codePrefix: MbtiProCodePrefix;
  pageShellClassName?: string;
  uiTheme?: 'emerald' | 'portal';
  testScreenTitle?: string;
  testScreenSubtitle?: string;
  codeStepTitle?: string;
  codeStepSubtitle?: string;
  buildResultUrl: (params: { encodedData: string; testCode: string | null }) => string;
};

function buildMbtiProResultUrl(params: { encodedData: string; testCode: string | null }) {
  const testCodeParam = params.testCode ? `&code=${encodeURIComponent(params.testCode)}` : '';
  return `/tests/mbti_pro/result?data=${params.encodedData}${testCodeParam}&from=completion`;
}

export const MBTI_PRO_TEST_FLOW: MbtiProTestFlowConfig = {
  defaultPath: '/tests/mbti_pro',
  displayName: '전문가용 MBTI 검사',
  progressTestType: 'MBTI_PRO',
  firebaseTestTypeLabel: '전문가용 MBTI 검사',
  totalQuestions: 24,
  codePrefix: 'PROFESSIONAL',
  uiTheme: 'emerald',
  buildResultUrl: buildMbtiProResultUrl,
};

export const EGO_OK_PRO_TEST_FLOW: MbtiProTestFlowConfig = {
  defaultPath: '/tests/ego-ok-pro',
  displayName: '전문가용 이고-오케이그램 검사',
  progressTestType: 'EGO_OK_PRO',
  firebaseTestTypeLabel: '전문가용 이고-오케이그램 검사',
  totalQuestions: 24,
  codePrefix: 'EGO_PROFESSIONAL',
  pageShellClassName: 'bg-[#070b14]',
  uiTheme: 'portal',
  testScreenTitle: '전문가용 이고-오케이그램 검사',
  testScreenSubtitle: '각 문항에 가장 가까운 답을 선택해 주세요.',
  codeStepTitle: '전문가용 이고-오케이그램 검사',
  codeStepSubtitle: '검사코드가 없어도 검사를 진행할 수 있습니다. 검사코드는 상담사가 제공한 경우에만 입력하세요.',
  buildResultUrl: buildMbtiProResultUrl,
};
