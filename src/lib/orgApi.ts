/**
 * B2B 기관(Org Admin) API
 */

import { getCounselorToken } from '@/lib/counselorAuth';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

async function orgFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getCounselorToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${getBaseUrl()}${path}`, { ...init, headers });
}

export interface OrgCohortSummary {
  cohortId: string;
  cohortName: string;
  participantCount: number;
  completedCount: number;
  completionRatePercent: number;
  prepaidByOrg?: boolean;
}

export interface OrgGroupReport {
  organizationId: string;
  cohortId: string;
  cohortName: string;
  anonymous: boolean;
  participantCount: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  completionRatePercent: number;
  byTest: { testId: string; name: string; completedCount: number }[];
  disclaimer?: string;
}

export interface OrgMeResponse {
  organizationId: string;
  organization: { name?: string; type?: string };
  creditBalance: number;
  enforceCredits: boolean;
  cohorts: OrgCohortSummary[];
  ledger: { delta: number; reason: string; balanceAfter: number; createdAt?: string }[];
}

export async function fetchOrgMe(): Promise<OrgMeResponse> {
  const res = await orgFetch('/api/org/me');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `기관 정보 조회 실패 (${res.status})`);
  }
  return res.json();
}

export async function fetchOrgGroupReport(cohortId: string): Promise<OrgGroupReport> {
  const res = await orgFetch(`/api/org/cohorts/${encodeURIComponent(cohortId)}/group-report`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `그룹 리포트 조회 실패 (${res.status})`);
  }
  return res.json();
}

export async function orgBulkCreate(body: {
  cohortName: string;
  title?: string;
  rows: { displayName?: string; email?: string; phone?: string }[];
  testList: { testId: string; name: string }[];
  queueNotify?: boolean;
}): Promise<Record<string, unknown>> {
  const res = await orgFetch('/api/org/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || `일괄 발송 실패 (${res.status})`);
  }
  return res.json();
}

export interface OrganizationRecord {
  id?: string;
  organizationId?: string;
  name: string;
  type?: string;
  liaisonCounselorUid?: string;
  adminUid?: string;
  creditBalance?: number;
}

export async function adminListOrganizations(): Promise<OrganizationRecord[]> {
  const res = await orgFetch('/api/admin/organizations');
  if (!res.ok) throw new Error('기관 목록 조회 실패');
  const data = await res.json();
  return data.organizations || [];
}

export async function adminCreateOrganization(params: {
  name: string;
  type: string;
  liaisonCounselorUid: string;
  adminUid?: string;
}): Promise<OrganizationRecord> {
  const res = await orgFetch('/api/admin/organizations', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || '기관 생성 실패');
  }
  const data = await res.json();
  return data.organization;
}

export async function adminGrantOrgCredits(orgId: string, amount: number, reason?: string) {
  const res = await orgFetch(`/api/admin/organizations/${encodeURIComponent(orgId)}/grant-credits`, {
    method: 'POST',
    body: JSON.stringify({ amount, reason: reason || 'admin_org_grant' }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || '크레딧 지급 실패');
  }
  return res.json();
}

export async function adminAssignOrgAdmin(orgId: string, adminUid: string) {
  const res = await orgFetch(`/api/admin/organizations/${encodeURIComponent(orgId)}/assign-admin`, {
    method: 'POST',
    body: JSON.stringify({ adminUid }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || '담당자 배정 실패');
  }
  return res.json();
}

export function printOrgGroupReport(report: OrgGroupReport, orgName: string): void {
  if (typeof window === 'undefined') return;
  const rows = report.byTest
    .map(
      (t) =>
        `<tr><td>${t.name}</td><td style="text-align:right">${t.completedCount}</td></tr>`,
    )
    .join('');
  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>그룹 리포트</title>
<style>@page{margin:18mm}body{font-family:'Malgun Gothic',sans-serif;font-size:11pt;color:#1e293b}
h1{font-size:18pt}table{border-collapse:collapse;width:100%;margin:12px 0}th,td{border:1px solid #cbd5e1;padding:8px}
th{background:#f1f5f9}.muted{color:#64748b;font-size:9pt;margin-top:24px}</style></head><body>
<h1>익명 그룹 통계 리포트</h1>
<p>${orgName} · ${report.cohortName}</p>
<table><tr><th>항목</th><th>값</th></tr>
<tr><td>참여자 수</td><td>${report.participantCount}</td></tr>
<tr><td>완료</td><td>${report.completedCount}</td></tr>
<tr><td>진행 중</td><td>${report.inProgressCount}</td></tr>
<tr><td>미시작</td><td>${report.notStartedCount}</td></tr>
<tr><td>완료율</td><td>${report.completionRatePercent}%</td></tr>
</table>
<h2>검사별 완료 건수</h2>
<table><tr><th>검사</th><th>완료 수</th></tr>${rows}</table>
<p class="muted">${report.disclaimer || ''}</p>
</body></html>`;
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:none';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc?.open();
  doc?.write(html);
  doc?.close();
  iframe.contentWindow?.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}
