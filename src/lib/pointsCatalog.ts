/**
 * WizCoCo 포인트 단가표 — DB는 검사/AI 크레딧(정수) 유지, UI·API는 포인트 표기
 * 1포인트 = 10원 · 검사 크레딧 1건 = 10포인트 · AI 크레딧 1건 = 10포인트
 */

export const WON_PER_POINT = 10;

export const POINTS_PER_ASSESSMENT_CREDIT = 10;
export const POINTS_PER_AI_CREDIT = 10;

/** @deprecated POINTS_PER_ASSESSMENT_CREDIT */
export const POINTS_PER_CREDIT = POINTS_PER_ASSESSMENT_CREDIT;

// --- 검사(포털) ---
export const POINT_COST_PORTAL_RECIPIENT = 10;
export const POINT_COST_PUBLIC_CLAIM_PHONE = 10;
export const POINT_COST_PUBLIC_CLAIM_EMAIL = 0;

export const PUBLIC_CLAIM_PHONE_POINT_COST = POINT_COST_PUBLIC_CLAIM_PHONE;
export const PUBLIC_CLAIM_PHONE_CREDIT_COST = 1;

export const PILOT_FREE_ASSESSMENT_CREDITS = 50;
export const PILOT_FREE_ASSESSMENT_POINTS = PILOT_FREE_ASSESSMENT_CREDITS * POINTS_PER_ASSESSMENT_CREDIT;

export const PILOT_FREE_AI_CREDITS = 20;
export const PILOT_FREE_AI_POINTS = PILOT_FREE_AI_CREDITS * POINTS_PER_AI_CREDIT;

// --- AI 기능 (포인트) ---
export const AI_POINT_COSTS = {
  counsel_message: 0,
  session_summary: 0,
  assessment_interpret: 40,
  test_recommendation: 10,
  report_generate: 50,
} as const;

export type AiPointFeature = keyof typeof AI_POINT_COSTS;

export const AI_PRICING_POINTS: {
  feature: AiPointFeature;
  label: string;
  points: number;
  description: string;
}[] = [
  {
    feature: 'counsel_message',
    label: 'AI 상담 메시지',
    points: AI_POINT_COSTS.counsel_message,
    description: 'B2C AI 마음상담 (파일럿 무료)',
  },
  {
    feature: 'session_summary',
    label: '상담 세션 요약',
    points: AI_POINT_COSTS.session_summary,
    description: 'B2C 세션 종료 요약 (파일럿 무료)',
  },
  {
    feature: 'assessment_interpret',
    label: '검사 결과 AI 해석',
    points: AI_POINT_COSTS.assessment_interpret,
    description: '내담자 1건 검사 결과 해석',
  },
  {
    feature: 'test_recommendation',
    label: '맞춤 검사 추천',
    points: AI_POINT_COSTS.test_recommendation,
    description: '결과 기반 추가 검사 추천',
  },
  {
    feature: 'report_generate',
    label: 'AI 종합 리포트',
    points: AI_POINT_COSTS.report_generate,
    description: '복수 검사 통합 리포트',
  },
];

// --- 상품 (충전 팩) ---
export const COMMERCE_PRODUCT_POINTS: Record<
  string,
  { name: string; points: number; amount: number; note?: string }
> = {
  'credit-pack-10': { name: '포인트 100팩', points: 100, amount: 75_000 },
  'credit-pack-50': { name: '포인트 500팩', points: 500, amount: 300_000 },
  'counselor-starter': {
    name: '스타터 월 구독',
    points: 200,
    amount: 150_000,
    note: '월 200포인트 · 초과 750포인트당 7,500원',
  },
  'counselor-pro': {
    name: '프로 월 구독',
    points: 500,
    amount: 250_000,
    note: '월 500포인트 · 초과 750포인트당 6,000원',
  },
};

export function assessmentCreditsToPoints(credits: number): number {
  const n = Number.isFinite(credits) ? credits : 0;
  return Math.max(0, Math.round(n * POINTS_PER_ASSESSMENT_CREDIT));
}

export function aiCreditsToPoints(credits: number): number {
  const n = Number.isFinite(credits) ? credits : 0;
  return Math.max(0, Math.round(n * POINTS_PER_AI_CREDIT));
}

/** @deprecated assessmentCreditsToPoints */
export const creditsToPoints = assessmentCreditsToPoints;

export function pointsToWon(points: number): number {
  const n = Number.isFinite(points) ? points : 0;
  return Math.max(0, Math.round(n * WON_PER_POINT));
}

export function formatPoints(points: number): string {
  return `${Math.max(0, Math.round(points)).toLocaleString('ko-KR')}포인트`;
}

export function formatPointsDelta(deltaPoints: number): string {
  const n = Math.round(deltaPoints);
  if (n > 0) return `+${formatPoints(n)}`;
  if (n < 0) return `−${formatPoints(Math.abs(n))}`;
  return formatPoints(0);
}

export function resolvePointsBalance(
  res: { pointsBalance?: number; balance?: number },
  kind: 'assessment' | 'ai' = 'assessment',
): number {
  if (typeof res.pointsBalance === 'number') return res.pointsBalance;
  const balance = typeof res.balance === 'number' ? res.balance : 0;
  return kind === 'ai' ? aiCreditsToPoints(balance) : assessmentCreditsToPoints(balance);
}
