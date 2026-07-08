import { httpsCallable } from 'firebase/functions';
import { initializeFirebase } from '@/lib/firebase';
import { getCounselorToken } from '@/lib/counselorAuth';
import type { AiReportDoc } from '@/types/aiUsage';
import { aiPricingByFeature } from '@/data/aiPricingCatalog';

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

export type InterpretAssessmentResultRequest = {
  resultId: string;
  forceRegenerate?: boolean;
};

export type InterpretAssessmentResultResponse = {
  reportId: string;
  content: string;
  title: string;
  cached: boolean;
  creditsCharged: number;
  modelId: string | null;
};

export async function interpretAssessmentResult(
  resultId: string,
  options?: { forceRegenerate?: boolean },
): Promise<InterpretAssessmentResultResponse> {
  const fn = httpsCallable<
    InterpretAssessmentResultRequest,
    InterpretAssessmentResultResponse
  >(getFunctionsInstance(), 'interpretAssessmentResult');
  const { data } = await fn({
    resultId,
    forceRegenerate: options?.forceRegenerate,
  });
  return data;
}

export type AiReportsListResponse = {
  resultId: string;
  reports: Array<AiReportDoc & { id: string }>;
};

export async function fetchAiReportsForResult(resultId: string): Promise<AiReportsListResponse> {
  const token = await getCounselorToken();
  const res = await fetch(
    `${getBaseUrl()}/api/ai/reports?resultId=${encodeURIComponent(resultId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `AI reports ${res.status}`);
  }
  return res.json() as Promise<AiReportsListResponse>;
}

export function assessmentInterpretCreditCost(forceRegenerate?: boolean): number {
  const base = aiPricingByFeature('assessment_interpret')?.credits ?? 4;
  return forceRegenerate ? Math.max(1, Math.ceil(base / 2)) : base;
}
