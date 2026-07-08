/** AI 기능별 단가표 (T-3-04) — 검사 크레딧과 분리 */
export const AI_PRICING_CATALOG_VERSION = 1;

export type AiPricingItem = {
  feature: string;
  label: string;
  credits: number;
  description: string;
};

export const AI_PRICING_CATALOG: AiPricingItem[] = [
  {
    feature: 'counsel_message',
    label: 'AI 상담 메시지',
    credits: 0,
    description: 'B2C AI 마음상담 (토큰 원장만 기록, 파일럿 무료)',
  },
  {
    feature: 'session_summary',
    label: '상담 세션 요약',
    credits: 0,
    description: 'B2C 세션 종료 요약 (파일럿 무료)',
  },
  {
    feature: 'assessment_interpret',
    label: '검사 결과 AI 해석',
    credits: 4,
    description: '내담자 1건 검사 결과 해석 리포트',
  },
  {
    feature: 'test_recommendation',
    label: '맞춤 검사 추천',
    credits: 1,
    description: '결과 기반 추가 검사 추천',
  },
  {
    feature: 'report_generate',
    label: 'AI 종합 리포트',
    credits: 5,
    description: '복수 검사 통합 리포트 생성',
  },
];

export const PILOT_FREE_AI_CREDITS = 20;

export function aiPricingByFeature(feature: string): AiPricingItem | undefined {
  return AI_PRICING_CATALOG.find((item) => item.feature === feature);
}
