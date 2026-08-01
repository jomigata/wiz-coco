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

/** 응답 payload가 실질적으로 변경되었는지 (문항 답·개인정보 포함) */
export function mbtiProResponsesChanged(
  before: unknown,
  after: Record<string, unknown>,
): boolean {
  const prev = parseMbtiProJoinResponses(before);
  const next = parseMbtiProJoinResponses(after);

  const prevKeys = Object.keys(prev.answers).sort();
  const nextKeys = Object.keys(next.answers).sort();
  if (prevKeys.length !== nextKeys.length) return true;
  for (let i = 0; i < prevKeys.length; i += 1) {
    if (prevKeys[i] !== nextKeys[i]) return true;
    if (prev.answers[prevKeys[i]] !== next.answers[nextKeys[i]]) return true;
  }

  const normInfo = (info: ClientInfo | null) => {
    if (!info) return null;
    return {
      birthYear: info.birthYear || 0,
      gender: info.gender || '',
      maritalStatus: info.maritalStatus || '',
      name: info.name || '',
      privacyAgreed: info.privacyAgreed !== false,
      phone: info.phone || '',
      groupCode: info.groupCode || '',
    };
  };
  return JSON.stringify(normInfo(prev.clientInfo)) !== JSON.stringify(normInfo(next.clientInfo));
}

/** 일반 join/test 응답 dict 비교 (숫자 값만) */
export function joinTestResponsesChanged(
  before: unknown,
  after: Record<string, number>,
): boolean {
  const prev: Record<string, number> = {};
  if (before && typeof before === 'object' && !Array.isArray(before)) {
    for (const [key, val] of Object.entries(before as Record<string, unknown>)) {
      if (typeof val === 'number') prev[key] = val;
    }
  }
  const prevKeys = Object.keys(prev).sort();
  const nextKeys = Object.keys(after).sort();
  if (prevKeys.length !== nextKeys.length) return true;
  for (let i = 0; i < prevKeys.length; i += 1) {
    if (prevKeys[i] !== nextKeys[i]) return true;
    if (prev[prevKeys[i]] !== after[nextKeys[i]]) return true;
  }
  return false;
}
