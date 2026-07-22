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
  /** true면 검사코드 입력 단계 생략 후 기본정보부터 시작 */
  skipCodeStep?: boolean;
  /** MbtiProClientInfo 상단 제목 */
  infoStepTitle?: string;
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
  displayName: 'TA 이고-오케이그램 검사',
  progressTestType: 'EGO_OK_PRO',
  firebaseTestTypeLabel: 'TA 이고-오케이그램 검사',
  totalQuestions: 24,
  codePrefix: 'EGO_PROFESSIONAL',
  skipCodeStep: true,
  uiTheme: 'emerald',
  testScreenTitle: 'TA 이고-오케이그램 검사',
  testScreenSubtitle: '깊이 생각하지 말고, 자연스럽게 떠오르는 대로 선택해주세요.',
  infoStepTitle: 'TA 이고-오케이그램 검사',
  buildResultUrl: buildMbtiProResultUrl,
};
