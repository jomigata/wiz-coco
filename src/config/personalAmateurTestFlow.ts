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
