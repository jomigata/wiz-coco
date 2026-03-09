/**
 * 참여 코드 플로우용 기본 문항 (testId별 문항이 없을 때 사용)
 * 백엔드는 responses만 저장·채점하며, 검사별 확장 시 이 파일 또는 testId 매핑으로 교체 가능
 */
export interface GenericQuestion {
  id: string;
  question: string;
  type: string;
}

export const genericJoinQuestions: GenericQuestion[] = [
  { id: 'q1', question: '현재 전반적인 심리적 안녕감은 어떠한가요?', type: 'wellbeing' },
  { id: 'q2', question: '최근 한 달간 스트레스를 얼마나 느꼈나요?', type: 'stress' },
  { id: 'q3', question: '일상에서 목표나 의미를 느끼는 정도는 어떠한가요?', type: 'meaning' },
  { id: 'q4', question: '주변 사람들과의 관계에 만족하고 있나요?', type: 'relationship' },
  { id: 'q5', question: '필요할 때 상담이나 지원을 받을 수 있다고 생각하나요?', type: 'support' },
];
