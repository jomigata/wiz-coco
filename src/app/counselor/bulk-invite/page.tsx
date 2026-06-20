'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import type { ClientPortalBulkRow } from '@/types/clientPortal';

function parseCsvText(text: string): Array<{ displayName: string; email?: string; phone?: string }> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const rows: Array<{ displayName: string; email?: string; phone?: string }> = [];
  const startIdx = lines[0].includes('이름') || lines[0].toLowerCase().includes('name') ? 1 : 0;

  for (let i = startIdx; i < lines.length; i += 1) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim());
    if (!parts[0]) continue;
    rows.push({
      displayName: parts[0],
      email: parts[1] || undefined,
      phone: parts[2] || undefined,
    });
  }
  return rows;
}

export default function BulkInvitePage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [cohortName, setCohortName] = useState('');
  const [title, setTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [usageEndDate, setUsageEndDate] = useState('');
  const [csvText, setCsvText] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [queueNotify, setQueueNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<ClientPortalBulkRow[]>([]);
  const [notifyQueued, setNotifyQueued] = useState(0);

  const previewRows = useMemo(() => parseCsvText(csvText), [csvText]);

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (next.has(testId)) next.delete(testId);
      else next.add(testId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!cohortName.trim() || !title.trim()) {
      setError('그룹명과 검사 세트 제목을 입력해 주세요.');
      return;
    }
    if (previewRows.length === 0) {
      setError('초대할 내담자 목록을 CSV 형식으로 입력해 주세요.');
      return;
    }
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));
    if (testList.length === 0) {
      setError('배정할 검사를 1개 이상 선택해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await bulkCreateClientPortals({
        cohortName: cohortName.trim(),
        title: title.trim(),
        welcomeMessage: welcomeMessage.trim(),
        usageEndDate: usageEndDate.trim(),
        testList,
        rows: previewRows,
        queueNotify,
      });
      setCreated(result.created);
      setNotifyQueued(result.notifyQueued);
    } catch (err) {
      setError(err instanceof Error ? err.message : '일괄 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!created.length) return;
    const header = '이름,이메일,휴대폰,검사코드,비밀번호,매직링크경로\n';
    const body = created
      .map((r) =>
        [r.displayName, r.email || '', r.phone || '', r.accessCode, r.pin, (r as { magicPath?: string }).magicPath || ''].join(',')
      )
      .join('\n');
    const blob = new Blob(['\uFEFF' + header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wizcoco-invite-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authPending) return <AuthLoadingState className="py-12" message="로그인 확인 중…" />;
  if (showLoginRequired || !user) {
    return (
      <AuthRequiredState
        className="max-w-lg mx-auto mt-24"
        title="전문가 로그인이 필요합니다"
        description="일괄 초대는 전문가 로그인 후 이용할 수 있습니다."
        loginHref="/login?redirect=/counselor/bulk-invite"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-16 px-4">
      <main className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link href="/counselor/" className="text-blue-400 text-sm hover:text-blue-300">
            ← 상담사 홈
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">내담자 일괄 초대</h1>
          <p className="text-slate-400 text-sm mt-1">
            CSV로 최대 500명까지 검사 코드·비밀번호·매직 링크를 일괄 생성합니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800/80 rounded-2xl border border-slate-600 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">그룹명</label>
              <input
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                placeholder="예: 2025 OO고 3학년"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">검사 세트 제목</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
                placeholder="예: 신입생 심리검사"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">안내 메시지</label>
            <textarea
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">사용 기한 (선택)</label>
            <input
              type="date"
              value={usageEndDate}
              onChange={(e) => setUsageEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-200 mb-2">배정 검사</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {counselorAssessmentTestOptions.map((t) => (
                <label key={t.testId} className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedTestIds.has(t.testId)}
                    onChange={() => toggleTest(t.testId)}
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              내담자 목록 (CSV: 이름, 이메일, 휴대폰)
            </label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white font-mono text-sm"
              placeholder={'홍길동,hong@example.com,01012345678\n김영희,,01098765432'}
            />
            <p className="text-xs text-slate-500 mt-1">미리보기: {previewRows.length}명</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={queueNotify} onChange={(e) => setQueueNotify(e.target.checked)} />
            이메일·휴대폰이 있는 경우 통지 큐에 등록 (SMS/메일 발송 준비)
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? '생성 중…' : `${previewRows.length || 0}명 일괄 생성`}
          </button>
        </form>

        {created.length > 0 && (
          <div className="bg-slate-800/80 rounded-2xl border border-emerald-700/40 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-emerald-300">
                생성 완료 {created.length}명
                {notifyQueued > 0 ? ` · 통지 큐 ${notifyQueued}건` : ''}
              </h2>
              <button
                type="button"
                onClick={downloadCsv}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-sm"
              >
                CSV 다운로드
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-300">
                <thead>
                  <tr className="border-b border-slate-600 text-slate-400">
                    <th className="py-2 pr-3">이름</th>
                    <th className="py-2 pr-3">코드</th>
                    <th className="py-2 pr-3">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {created.slice(0, 20).map((r) => (
                    <tr key={r.portalId} className="border-b border-slate-700/50">
                      <td className="py-2 pr-3">{r.displayName}</td>
                      <td className="py-2 pr-3 font-mono text-cyan-300">{r.accessCode}</td>
                      <td className="py-2 pr-3 font-mono">{r.pin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {created.length > 20 && (
                <p className="text-xs text-slate-500 mt-2">외 {created.length - 20}명 — CSV로 전체 확인</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
