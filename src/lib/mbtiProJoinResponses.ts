import type { ClientInfo } from '@/components/tests/MbtiProClientInfo';

const META_KEYS = new Set(['_clientInfo', 'clientInfo']);

export function buildMbtiProJoinResponses(
  answers: Record<string, number>,
  clientInfo?: ClientInfo | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...answers };
  if (clientInfo) {
    out._clientInfo = {
      birthYear: clientInfo.birthYear,
      gender: clientInfo.gender,
      maritalStatus: clientInfo.maritalStatus,
      name: clientInfo.name ?? '',
      privacyAgreed: clientInfo.privacyAgreed,
      phone: clientInfo.phone ?? '',
      groupCode: clientInfo.groupCode ?? '',
    };
  }
  return out;
}

function coerceClientInfo(raw: unknown): ClientInfo | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const birthYear = typeof o.birthYear === 'number' ? o.birthYear : parseInt(String(o.birthYear || '0'), 10);
  return {
    birthYear: Number.isNaN(birthYear) ? 0 : birthYear,
    groupCode: String(o.groupCode ?? ''),
    groupPassword: o.groupPassword ? String(o.groupPassword) : undefined,
    gender: String(o.gender ?? ''),
    maritalStatus: String(o.maritalStatus ?? ''),
    name: o.name ? String(o.name) : '',
    privacyAgreed: o.privacyAgreed !== false,
    phone: String(o.phone ?? ''),
  };
}

/** API에 저장된 responses → 문항 답 + 개인정보 */
export function parseMbtiProJoinResponses(raw: unknown): {
  answers: Record<string, number>;
  clientInfo: ClientInfo | null;
} {
  const answers: Record<string, number> = {};
  let clientInfo: ClientInfo | null = null;

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (META_KEYS.has(key)) {
        clientInfo = coerceClientInfo(val) ?? clientInfo;
        continue;
      }
      if (typeof val === 'number') {
        answers[key] = val;
      }
    }
  }

  return { answers, clientInfo };
}
