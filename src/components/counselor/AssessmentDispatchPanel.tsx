'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import {
  fetchAssessmentDispatchStatus,
  resendDispatchCredentials,
  type AssessmentDispatchStatus,
  type DispatchRecipient,
} from '@/lib/clientPortalApi';

function notifyLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'sent':
      return { text: '발송 성공', className: 'text-emerald-300' };
    case 'failed':
      return { text: '발송 실패', className: 'text-red-400' };
    case 'pending':
      return { text: '발송 대기', className: 'text-amber-300' };
    case 'skipped':
      return { text: '발송 생략', className: 'text-slate-400' };
    case 'not_sent':
      return { text: '미발송', className: 'text-slate-500' };
    default:
      return { text: status || '—', className: 'text-slate-400' };
  }
}

function testLabel(r: DispatchRecipient): { text: string; className: string } {
  if (r.testStatus === 'completed') {
    return { text: '검사 완료', className: 'text-emerald-300' };
  }
  if (r.testStatus === 'in_progress') {
    return {
      text: `${r.completedCount}/${r.requiredCount}`,
      className: 'text-amber-300',
    };
  }
  return { text: '미실시', className: 'text-slate-500' };
}

interface AssessmentDispatchPanelProps {
  assessmentId: string;
}

export default function AssessmentDispatchPanel({ assessmentId }: AssessmentDispatchPanelProps) {
  const [data, setData] = useState<AssessmentDispatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError('');
    try {
      const result = await fetchAssessmentDispatchStatus(assessmentId);
      setData(result);
      setSelected(new Set());
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : '불러오기 실패');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const allIds = useMemo(
    () => (data?.recipients || []).map((r) => r.portalId),
    [data?.recipients],
  );
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const completedCount = useMemo(
    () => (data?.recipients || []).filter((r) => r.testStatus === 'completed').length,
    [data?.recipients],
  );

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResend = async () => {
    if (!assessmentId || selected.size === 0) return;
    setResendLoading(true);
    setMessage('');
    try {
      const result = await resendDispatchCredentials(assessmentId, Array.from(selected));
      setMessage(
        `재발송 완료: 성공 ${result.sent}명, 실패 ${result.failed}명, 연락처 없음 ${result.skipped}명 (비밀번호는 새로 발급됩니다)`,
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '재발송에 실패했습니다.');
    } finally {
      setResendLoading(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400 text-sm py-4">내담자·발송 현황을 불러오는 중…</p>;
  }

  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>;
  }

  if (!data) return null;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-600 bg-slate-800/60 p-4 text-sm text-slate-300 space-y-1">
        <p>
          <span className="text-slate-500">검사코드 </span>
          <span className="font-mono font-semibold text-cyan-300">
            {formatAccessCodeDisplay(data.joinAccessCode)}
          </span>
        </p>
        {data.cohortName ? (
          <p>
            <span className="text-slate-500">기관/단체/그룹명 </span>
            {data.cohortName}
          </p>
        ) : null}
        <p>
          <span className="text-slate-500">검사명 </span>
          {data.title || '—'}
        </p>
        <p className="text-slate-500">
          검사 완료 {completedCount}명 / 전체 {data.recipients.length}명
        </p>
      </div>

      {message ? (
        <p className="text-sm text-slate-300" role="status">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleAll}
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-200 hover:bg-slate-600"
        >
          {allSelected ? '전체 해제' : '전체 선택'}
        </button>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={resendLoading || selected.size === 0}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {resendLoading ? '재발송 중…' : `선택 재발송 (${selected.size})`}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="px-3 py-1.5 rounded-lg text-sm bg-slate-700 text-slate-200 hover:bg-slate-600"
        >
          새로고침
        </button>
      </div>

      {data.recipients.length === 0 ? (
        <p className="text-slate-400">발송된 내담자가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-600">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800 text-slate-400">
              <tr>
                <th className="px-3 py-2 text-left w-10">선택</th>
                <th className="px-3 py-2 text-left">이름</th>
                <th className="px-3 py-2 text-left">이메일</th>
                <th className="px-3 py-2 text-left">휴대폰</th>
                <th className="px-3 py-2 text-left">나의코드</th>
                <th className="px-3 py-2 text-left">발송</th>
                <th className="px-3 py-2 text-left">검사</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {data.recipients.map((r) => {
                const notify = notifyLabel(r.notifyStatus);
                const test = testLabel(r);
                return (
                  <tr key={r.portalId} className="hover:bg-slate-800/50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.portalId)}
                        onChange={() => toggleOne(r.portalId)}
                        className="rounded text-blue-500"
                      />
                    </td>
                    <td className="px-3 py-2 text-white">{r.displayName || '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{r.email || '—'}</td>
                    <td className="px-3 py-2 text-slate-300">{r.phone || '—'}</td>
                    <td className="px-3 py-2 font-mono text-cyan-300">
                      {formatAccessCodeDisplay(r.myCode)}
                    </td>
                    <td className={`px-3 py-2 ${notify.className}`}>{notify.text}</td>
                    <td className={`px-3 py-2 ${test.className}`}>{test.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500">
        재발송 시 비밀번호가 새로 발급되며, 검사코드·나의코드·비밀번호가 이메일·문자로 전송됩니다.
      </p>
    </section>
  );
}
