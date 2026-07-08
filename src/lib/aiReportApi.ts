import { httpsCallable } from 'firebase/functions';
import { initializeFirebase } from '@/lib/firebase';
import { getCounselorToken } from '@/lib/counselorAuth';
import type { AiReportDoc, ComprehensiveReportResponse } from '@/types/aiUsage';
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

export type GenerateAssessmentReportRequest = {
  resultId: string;
  forceRegenerate?: boolean;
};

export async function generateAssessmentReport(
  resultId: string,
  options?: { forceRegenerate?: boolean },
): Promise<ComprehensiveReportResponse> {
  const fn = httpsCallable<
    GenerateAssessmentReportRequest,
    ComprehensiveReportResponse
  >(getFunctionsInstance(), 'generateAssessmentReport');
  const { data } = await fn({
    resultId,
    forceRegenerate: options?.forceRegenerate,
  });
  return data;
}

export async function fetchComprehensiveReportsForResult(
  resultId: string,
): Promise<Array<AiReportDoc & { id: string }>> {
  const token = await getCounselorToken();
  const res = await fetch(
    `${getBaseUrl()}/api/ai/reports?resultId=${encodeURIComponent(resultId)}&feature=report_generate`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `AI reports ${res.status}`);
  }
  const data = (await res.json()) as { reports?: Array<AiReportDoc & { id: string }> };
  return data.reports || [];
}

export async function saveReportAnnotations(
  reportId: string,
  payload: { counselorNotes?: string; recommendedTreatment?: string },
): Promise<AiReportDoc & { id: string }> {
  const token = await getCounselorToken();
  const res = await fetch(
    `${getBaseUrl()}/api/ai/reports/${encodeURIComponent(reportId)}/annotations`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `저장 실패 (${res.status})`);
  }
  return res.json() as Promise<AiReportDoc & { id: string }>;
}

export function reportGenerateCreditCost(forceRegenerate?: boolean): number {
  const base = aiPricingByFeature('report_generate')?.credits ?? 5;
  return forceRegenerate ? Math.max(1, Math.ceil(base / 2)) : base;
}
