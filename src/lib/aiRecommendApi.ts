import { httpsCallable } from 'firebase/functions';
import { initializeFirebase } from '@/lib/firebase';
import { getCounselorToken } from '@/lib/counselorAuth';
import { aiPricingByFeature } from '@/data/aiPricingCatalog';
import type {
  RecommendTestsFromResultRequest,
  RecommendTestsFromResultResponse,
} from '@/types/aiRecommendation';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

function getFunctionsInstance() {
  const { functions } = initializeFirebase();
  if (!functions) {
    throw new Error('Firebase Functions가 초기화되지 않았습니다.');
  }
  return functions;
}

export async function recommendTestsFromResult(
  resultId: string,
  availableTests: { testId: string; name: string }[],
  options?: { forceRegenerate?: boolean },
): Promise<RecommendTestsFromResultResponse> {
  const fn = httpsCallable<
    RecommendTestsFromResultRequest,
    RecommendTestsFromResultResponse
  >(getFunctionsInstance(), 'recommendTestsFromResult');
  const { data } = await fn({
    resultId,
    availableTests,
    forceRegenerate: options?.forceRegenerate,
  });
  return data;
}

export async function fetchTestRecommendationCache(
  resultId: string,
): Promise<RecommendTestsFromResultResponse | null> {
  const token = await getCounselorToken();
  const res = await fetch(
    `${getBaseUrl()}/api/ai/reports?resultId=${encodeURIComponent(resultId)}&feature=test_recommendation`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    reports?: Array<{
      id: string;
      content?: string;
      portalId?: string;
      metadata?: {
        summary?: string;
        recommendations?: RecommendTestsFromResultResponse['recommendations'];
      };
    }>;
  };
  const latest = data.reports?.[0];
  if (!latest?.metadata?.recommendations?.length) return null;
  return {
    reportId: latest.id,
    summary: latest.metadata.summary || latest.content || '',
    recommendations: latest.metadata.recommendations,
    portalId: latest.portalId || null,
    cached: true,
    creditsCharged: 0,
    modelId: null,
  };
}

export function testRecommendationCreditCost(): number {
  return aiPricingByFeature('test_recommendation')?.credits ?? 1;
}
