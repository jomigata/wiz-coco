import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';
import { readClientPortalSession } from '@/lib/clientPortalSession';

export function parseDedicatedTestResultResponses(raw: unknown): {
  answers: Record<string, number>;
  clientInfo: Partial<ClientInfo> | null;
} {
  const answers: Record<string, number> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { answers, clientInfo: null };
  }
  let clientInfo: Partial<ClientInfo> | null = null;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (key === 'clientInfo' && val && typeof val === 'object' && !Array.isArray(val)) {
      clientInfo = val as Partial<ClientInfo>;
      continue;
    }
    if (typeof val === 'number') {
      answers[key] = val;
    }
  }
  return { answers, clientInfo };
}

export function buildDedicatedTestResultResponses(
  answers: Record<string, number>,
  clientInfo: ClientInfo | null | undefined,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...answers };
  if (clientInfo) {
    payload.clientInfo = {
      name: clientInfo.name ?? '',
      birthYear: clientInfo.birthYear ?? 0,
      gender: clientInfo.gender ?? '',
      maritalStatus: clientInfo.maritalStatus ?? '',
      privacyAgreed: clientInfo.privacyAgreed ?? false,
      phone: clientInfo.phone ?? '',
      groupCode: clientInfo.groupCode ?? '',
    };
  }
  return payload;
}

export function resolveClientInfoForPortalEdit(
  stored: Partial<ClientInfo> | null | undefined,
): ClientInfo {
  const portal = readClientPortalSession();
  let fromStorage: Partial<ClientInfo> | null = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('mbti_pro_client_info');
      if (raw) fromStorage = JSON.parse(raw) as Partial<ClientInfo>;
    } catch {
      // ignore
    }
  }
  const merged = { ...fromStorage, ...stored };
  const birthYear = Number(merged.birthYear) || 0;
  return {
    birthYear,
    groupCode: merged.groupCode || '',
    groupPassword: merged.groupPassword || '',
    gender: merged.gender || '',
    maritalStatus: merged.maritalStatus || '',
    name: (merged.name || portal?.portal?.displayName || '').trim(),
    privacyAgreed: merged.privacyAgreed ?? true,
    phone: merged.phone || '',
  };
}
