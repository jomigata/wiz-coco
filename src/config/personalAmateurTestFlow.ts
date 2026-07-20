export type PersonalAmateurTestCodePrefix = 'AMATEUR' | 'EGO_AMATEUR';

export type PersonalAmateurTestFlowConfig = {
  defaultPath: string;
  displayName: string;
  /** testResume 저장용 testType */
  progressTestType: string;
  totalQuestions: number;
  codePrefix: PersonalAmateurTestCodePrefix;
  matchesInProgressTestType: (testType: string) => boolean;
  buildResultPath: (code: string, results: { mbtiType?: string }) => string;
  /** 검사코드·기본정보 단계 생략 후 바로 문항 */
  skipCodeAndInfoSteps?: boolean;
  /** 상단 앱 네비(검사시작 화면과 동일) 유지 */
  keepAppTopNavVisible?: boolean;
  pageShellClassName?: string;
  testUiTheme?: 'emerald' | 'portal';
  testScreenTitle?: string;
  testScreenSubtitle?: string;
};

export const MBTI_AMATEUR_TEST_FLOW: PersonalAmateurTestFlowConfig = {
  defaultPath: '/tests/mbti',
  displayName: '개인용 MBTI 검사',
  progressTestType: 'MBTI',
  totalQuestions: 20,
  codePrefix: 'AMATEUR',
  matchesInProgressTestType: (testType) => {
    const t = (testType || '').toLowerCase();
    return t.includes('mbti') && !t.includes('pro') && !t.includes('전문가') && !t.includes('inside');
  },
  buildResultPath: (code, results) =>
    `/results/mbti?code=${encodeURIComponent(code)}&type=${encodeURIComponent(results.mbtiType || 'INTJ')}&from=completion`,
};

export const EGO_OK_AMATEUR_TEST_FLOW: PersonalAmateurTestFlowConfig = {
  defaultPath: '/tests/ego-ok',
  displayName: '개인용 이고-오케이 검사',
  progressTestType: 'EGO_OK',
  totalQuestions: 20,
  codePrefix: 'EGO_AMATEUR',
  skipCodeAndInfoSteps: true,
  keepAppTopNavVisible: true,
  pageShellClassName: 'bg-[#070b14] min-h-screen',
  testUiTheme: 'portal',
  testScreenTitle: '이고-오케이그램 검사',
  testScreenSubtitle: '각 문항에 가장 가까운 답을 선택해 주세요.',
  matchesInProgressTestType: (testType) => {
    const t = (testType || '').toLowerCase();
    return (
      t.includes('ego') ||
      t.includes('이고') ||
      t.includes('ego_ok') ||
      t.includes('ego-ok')
    );
  },
  buildResultPath: (code, results) =>
    `/results/mbti?code=${encodeURIComponent(code)}&type=${encodeURIComponent(results.mbtiType || 'INTJ')}&from=completion&test=ego-ok`,
};
