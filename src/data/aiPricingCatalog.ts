/** AI 기능별 단가표 (T-3-04) — 검사 포인트와 별도 AI 지갑 */
import {
  AI_POINT_COSTS,
  AI_PRICING_POINTS,
  aiCreditsToPoints,
  type AiPointFeature,
} from '@/lib/pointsCatalog';

export const AI_PRICING_CATALOG_VERSION = 1;

export type AiPricingItem = {
  feature: string;
  label: string;
  /** @deprecated DB AI credit units — UI는 points 사용 */
  credits: number;
  points: number;
  description: string;
};

export const AI_PRICING_CATALOG: AiPricingItem[] = AI_PRICING_POINTS.map((item) => ({
  feature: item.feature,
  label: item.label,
  credits: Math.round(item.points / 10),
  points: item.points,
  description: item.description,
}));

export function aiPricingByFeature(feature: string): AiPricingItem | undefined {
  return AI_PRICING_CATALOG.find((item) => item.feature === feature);
}

export function aiFeaturePointCost(feature: string, forceRegenerate?: boolean): number {
  const base =
    AI_POINT_COSTS[feature as AiPointFeature] ??
    aiPricingByFeature(feature)?.points ??
    0;
  return forceRegenerate && base > 0 ? Math.max(1, Math.ceil(base / 2)) : base;
}

export function aiFeatureCreditCost(feature: string, forceRegenerate?: boolean): number {
  const points = aiFeaturePointCost(feature, forceRegenerate);
  return Math.max(0, Math.round(points / 10));
}

export function aiCreditsChargedToPoints(creditsCharged: number): number {
  return aiCreditsToPoints(creditsCharged);
}
