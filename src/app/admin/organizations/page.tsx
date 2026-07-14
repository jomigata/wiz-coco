'use client';

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import {
  adminAssignOrgAdmin,
  adminCreateOrganization,
  adminGrantOrgCredits,
  adminListOrganizations,
  adminUpdateOrgLiaison,
  type OrganizationRecord,
} from '@/lib/orgApi';

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationRecord[]>([]);
  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState('school');
  const [liaisonUid, setLiaisonUid] = useState('');
  const [adminUid, setAdminUid] = useState('');
  const [grantOrgId, setGrantOrgId] = useState('');
  const [grantAmount, setGrantAmount] = useState(30);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reload = () =>
    adminListOrganizations()
      .then(setOrgs)
      .catch((e) => setError(e instanceof Error ? e.message : '목록 실패'));

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await adminCreateOrganization({
        name: name.trim(),
        type: orgType,
        liaisonCounselorUid: liaisonUid.trim(),
        adminUid: adminUid.trim() || undefined,
      });
      setMessage('기관이 생성되었습니다.');
      setName('');
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminGrantOrgCredits(grantOrgId.trim(), grantAmount, 'poc_prepaid');
      setMessage(`${grantAmount} 크레딧 지급 완료`);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '지급 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">B2B 기관 관리</h1>
        <p className="text-slate-400 text-sm mb-6">3단계 — 학교·기업 POC · 선결제 크레딧 · org_admin 배정</p>

        {message && (
          <div className="mb-4 rounded-lg bg-emerald-900/40 p-4 text-emerald-200 text-sm">{message}</div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 p-4 text-red-200 text-sm">{error}</div>
        )}

        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 p-6 mb-8 space-y-3 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900">기관 생성 (POC)</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="기관명"
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
            required
          />
          <select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          >
            <option value="school">학교</option>
            <option value="company">기업</option>
            <option value="public">공공</option>
          </select>
          <input
            value={liaisonUid}
            onChange={(e) => setLiaisonUid(e.target.value)}
            placeholder="담당 상담사 UID (liaisonCounselorUid)"
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
            required
          />
          <input
            value={adminUid}
            onChange={(e) => setAdminUid(e.target.value)}
            placeholder="기관 담당자 UID (org_admin, 선택)"
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
          >
            기관 생성
          </button>
        </form>

        <form onSubmit={handleGrant} className="rounded-xl border border-slate-200 p-6 mb-8 space-y-3 bg-slate-900/50">
          <h2 className="text-lg font-semibold text-slate-900">기관 크레딧 지급 (선결제)</h2>
          <input
            value={grantOrgId}
            onChange={(e) => setGrantOrgId(e.target.value)}
            placeholder="organizationId"
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
            required
          />
          <input
            type="number"
            min={1}
            value={grantAmount}
            onChange={(e) => setGrantAmount(Number(e.target.value))}
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-900 text-sm"
          />
          <button type="submit" disabled={loading} className="w-full py-2 rounded-lg bg-emerald-700 text-white font-semibold">
            크레딧 지급
          </button>
        </form>

        <h2 className="text-lg font-semibold text-slate-900 mb-3">기관 목록</h2>
        <ul className="space-y-3">
          {orgs.map((o) => {
            const id = o.organizationId || o.id || '';
            return (
              <li key={id} className="rounded-lg border border-slate-200 p-4 bg-white/5 text-sm text-slate-300">
                <p className="font-medium text-white">{o.name}</p>
                <p className="text-xs text-slate-500">{id} · {o.type} · 크레딧 {o.creditBalance ?? 0}</p>
                <p className="text-xs">담당 상담사: {o.liaisonCounselorUid || '—'}</p>
                <p className="text-xs">org_admin: {o.adminUid || '—'}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs text-violet-400 hover:text-violet-300"
                    onClick={() => {
                      const uid = prompt('새 담당 상담사 UID (liaisonCounselorUid)', o.liaisonCounselorUid || '');
                      if (!uid?.trim()) return;
                      adminUpdateOrgLiaison(id, uid.trim())
                        .then(() => {
                          setMessage('담당 상담사가 변경되었습니다.');
                          return reload();
                        })
                        .catch((e) => setError(e instanceof Error ? e.message : '변경 실패'));
                    }}
                  >
                    담당 상담사 변경
                  </button>
                  {o.adminUid ? null : (
                    <button
                      type="button"
                      className="text-xs text-blue-400"
                      onClick={() => {
                        const uid = prompt('org_admin UID');
                        if (uid) adminAssignOrgAdmin(id, uid).then(reload).catch(alert);
                      }}
                    >
                      담당자 배정
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </RoleGuard>
  );
}
