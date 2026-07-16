'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminPageLayout from '@/components/AdminPageLayout';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import {
  fetchPermanentlyDeletedRecords,
  purgePermanentlyDeletedRecords,
  restorePermanentlyDeletedRecords,
  type PermanentlyDeletedAssessment,
  type PermanentlyDeletedPortal,
} from '@/lib/adminDeletionsApi';

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export default function AdminPermanentlyDeletedPage() {
  const [assessments, setAssessments] = useState<PermanentlyDeletedAssessment[]>([]);
  const [portals, setPortals] = useState<PermanentlyDeletedPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());
  const [selectedPortals, setSelectedPortals] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPermanentlyDeletedRecords();
      setAssessments(data.assessments || []);
      setPortals(data.portals || []);
      setSelectedAssessments(new Set());
      setSelectedPortals(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalSelected = selectedAssessments.size + selectedPortals.size;

  const toggleAssessment = (id: string) => {
    setSelectedAssessments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePortal = (id: string) => {
    setSelectedPortals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRestore = async () => {
    if (totalSelected === 0) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await restorePermanentlyDeletedRecords({
        assessmentIds: Array.from(selectedAssessments),
        portalIds: Array.from(selectedPortals),
      });
      setMessage(
        `복구 완료 — 검사코드 ${result.restoredAssessments}건, 내담자 ${result.restoredPortals}명`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '복구 실패');
    } finally {
      setBusy(false);
    }
  };

  const handlePurge = async () => {
    if (totalSelected === 0) return;
    if (
      !window.confirm(
        `선택 ${totalSelected}건을 DB에서 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await purgePermanentlyDeletedRecords({
        assessmentIds: Array.from(selectedAssessments),
        portalIds: Array.from(selectedPortals),
        confirm: 'PURGE',
      });
      setMessage(
        `완전 삭제 — 검사코드 ${result.purgedAssessments}건, 내담자 ${result.purgedPortals}명`,
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '완전 삭제 실패');
    } finally {
      setBusy(false);
    }
  };

  const assessmentRows = useMemo(() => assessments, [assessments]);
  const portalRows = useMemo(() => portals, [portals]);

  return (
    <AdminPageLayout
      title="영구 삭제 보관함"
      description="상담사가 영구 삭제한 검사코드·내담자 기록입니다. 삭제 목록으로 되돌리거나 DB에서 완전히 제거할 수 있습니다."
      toolbar={
        <>
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={busy || totalSelected === 0}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            삭제 목록으로 복구 ({totalSelected})
          </button>
          <button
            type="button"
            onClick={() => void handlePurge()}
            disabled={busy || totalSelected === 0}
            className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            DB 완전 삭제 ({totalSelected})
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/5"
          >
            새로고침
          </button>
        </>
      }
    >
      {message ? <p className="mb-3 text-sm text-emerald-300">{message}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">불러오는 중…</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-200">검사코드 ({assessmentRows.length})</h2>
            {assessmentRows.length === 0 ? (
              <p className="text-sm text-slate-500">영구 삭제된 검사코드가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">선택</th>
                      <th className="px-3 py-2 text-left">검사코드</th>
                      <th className="px-3 py-2 text-left">검사명</th>
                      <th className="px-3 py-2 text-left">상담사 UID</th>
                      <th className="px-3 py-2 text-left">영구 삭제일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentRows.map((row) => (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedAssessments.has(row.id)}
                            onChange={() => toggleAssessment(row.id)}
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-cyan-300">
                          {formatAccessCodeDisplay(row.accessCode)}
                        </td>
                        <td className="px-3 py-2 text-white">{row.title || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{row.counselorId || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {formatWhen(row.permanentlyDeletedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-200">내담자 ({portalRows.length})</h2>
            {portalRows.length === 0 ? (
              <p className="text-sm text-slate-500">영구 삭제된 내담자가 없습니다.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-slate-900/60 text-slate-400">
                    <tr>
                      <th className="px-3 py-2 text-left">선택</th>
                      <th className="px-3 py-2 text-left">이름</th>
                      <th className="px-3 py-2 text-left">연락처</th>
                      <th className="px-3 py-2 text-left">나의코드</th>
                      <th className="px-3 py-2 text-left">상담사 UID</th>
                      <th className="px-3 py-2 text-left">영구 삭제일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portalRows.map((row) => (
                      <tr key={row.portalId} className="border-t border-white/10">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedPortals.has(row.portalId)}
                            onChange={() => togglePortal(row.portalId)}
                          />
                        </td>
                        <td className="px-3 py-2 text-white">{row.displayName || '—'}</td>
                        <td className="px-3 py-2 text-slate-300">
                          {row.email || formatPhoneDisplay(row.phone) || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-cyan-300">{row.myCode || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">{row.counselorId || '—'}</td>
                        <td className="px-3 py-2 text-xs text-slate-400">
                          {formatWhen(row.permanentlyDeletedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminPageLayout>
  );
}
