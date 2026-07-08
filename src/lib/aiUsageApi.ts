import type {
  AiUsageSchemaResponse,
  CounselorAiCreditsMeResponse,
} from '@/types/aiUsage';
import { getCounselorToken } from '@/lib/counselorAuth';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
}

async function aiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getCounselorToken();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `AI API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** GET /api/ai/schema — 인증 불필요 */
export async function fetchAiUsageSchema(): Promise<AiUsageSchemaResponse> {
  const res = await fetch(`${getBaseUrl()}/api/ai/schema`);
  if (!res.ok) {
    throw new Error(`AI schema fetch failed: ${res.status}`);
  }
  return res.json() as Promise<AiUsageSchemaResponse>;
}

/** GET /api/ai/credits/me */
export async function fetchCounselorAiCredits(
  limit = 30,
): Promise<CounselorAiCreditsMeResponse> {
  const q = limit ? `?limit=${encodeURIComponent(String(limit))}` : '';
  return aiFetch<CounselorAiCreditsMeResponse>(`/api/ai/credits/me${q}`);
}
