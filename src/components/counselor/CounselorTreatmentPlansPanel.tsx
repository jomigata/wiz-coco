'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import {
  getCareProgramById,
  listCareProgramSummaries,
  CATEGORY_LABELS,
} from '@/data/careProgramCatalog';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
import { createCareAssignments, listCareAssignments } from '@/lib/careAssignmentApi';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type { CareProgramCategory, CareProgramSummary } from '@/types/careProgram';
import type { CounselorClientPortalListItem } from '@/types/clientPortal';
import type { CounselorCareAssignmentListItem, CareAssignmentPriority } from '@/types/careAssignment';

function formatDateInput(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function progressBadge(item: CounselorCareAssignmentListItem): { text: string; className: string } {
  const p = item.progress;
  if (!p) return { text: '진행 없음', className: 'text-slate-500' };
  if (p.status === 'completed') return { text: `완료 ${p.progressPercent}%`, className: 'text-emerald-300' };
  if (p.status === 'in_progress') return { text: `진행 ${p.progressPercent}%`, className: 'text-sky-300' };
  return { text: '미시작', className: 'text-amber-300' };
}

function ProgramCard({
  program,
  selected,
  onSelect,
}: {
  program: CareProgramSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? 'border-violet-500/60 bg-violet-500/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{program.title}</p>
          {program.subtitle ? <p className="mt-0.5 text-xs text-slate-400">{program.subtitle}</p> : null}
        </div>
        <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
          {program.durationWeeks}주
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-slate-500">{program.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
          {program.categoryLabel}
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
          {program.totalSessions}세션
        </span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
          {program.difficultyLabel}
        </span>
      </div>
    </button>
  );
}

export default function CounselorTreatmentPlansPanel() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const [categoryFilter, setCategoryFilter] = useState<'' | CareProgramCategory>('');
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [clients, setClients] = useState<CounselorClientPortalListItem[]>([]);
  const [cohorts, setCohorts] = useState<{ cohortId: string; cohortName: string }[]>([]);
  const [clientQuery, setClientQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState('');
  const [selectedPortalIds, setSelectedPortalIds] = useState<Set<string>>(new Set());
  const [instructions, setInstructions] = useState('');
  const [priority, setPriority] = useState<CareAssignmentPriority>('medium');
  const [dueAt, setDueAt] = useState('');
  const [notify, setNotify] = useState(true);
  const [assignments, setAssignments] = useState<CounselorCareAssignmentListItem[]>([]);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  const programs = useMemo(
    () => listCareProgramSummaries({ category: categoryFilter || undefined }),
    [categoryFilter],
  );

  const selectedProgram = useMemo(() => {
    if (!selectedProgramId) return null;
    return getCareProgramById(selectedProgramId) ?? programs.find((p) => p.programId === selectedProgramId) ?? null;
  }, [selectedProgramId, programs]);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    setError('');
    try {
      const data = await listCounselorClientPortals({
        status: 'active',
        cohortId: cohortFilter || undefined,
        q: clientQuery.trim() || undefined,
      });
      setClients(data.items || []);
      setCohorts(data.cohorts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '내담자 목록을 불러오지 못했습니다.');
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, [cohortFilter, clientQuery]);

  const loadAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const data = await listCareAssignments({ status: 'active', limit: 30 });
      setAssignments(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '할당 목록을 불러오지 못했습니다.');
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoadingClients(false);
      setLoadingAssignments(false);
      return;
    }
    void loadClients();
    void loadAssignments();
  }, [authPending, showLoginRequired, loadClients, loadAssignments]);

  useRedirectOnLoginRequiredError(error);

  useEffect(() => {
    if (selectedProgram?.defaultDueDays) {
      setDueAt(formatDateInput(selectedProgram.defaultDueDays));
    }
  }, [selectedProgram?.programId, selectedProgram?.defaultDueDays]);

  const togglePortal = (portalId: string) => {
    setSelectedPortalIds((prev) => {
      const next = new Set(prev);
      if (next.has(portalId)) next.delete(portalId);
      else next.add(portalId);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedPortalIds(new Set(clients.map((c) => c.portalId)));
  };

  const clearSelection = () => setSelectedPortalIds(new Set());

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgram) {
      setError('치료 프로그램을 선택해 주세요.');
      return;
    }
    if (selectedPortalIds.size === 0) {
      setError('할당할 내담자를 1명 이상 선택해 주세요.');
      return;
    }

    setAssigning(true);
    setError('');
    setResultMsg('');
    try {
      const result = await createCareAssignments({
        portalIds: Array.from(selectedPortalIds),
        type: 'treatment_program',
        title: selectedProgram.title,
        description: selectedProgram.description,
        instructions: instructions.trim() || undefined,
        priority,
        programId: selectedProgram.programId,
        dueAt: dueAt || undefined,
        notify,
        source: 'manual',
      });
      setResultMsg(
        `할당 ${result.assigned}건 · 생략 ${result.skipped}건 · 실패 ${result.failed}건 · 알림 큐 ${result.notify.sent}건`,
      );
      if (result.assigned > 0) {
        clearSelection();
        setInstructions('');
        void loadAssignments();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '치료 계획 할당에 실패했습니다.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6 px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            치료 프로그램 카탈로그에서 과제를 선택하고, 내담자 검사실에 할당합니다. 할당 후 내담자는
            포털에서 과제를 확인할 수 있습니다 (T-2-05 탭 연동 예정).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuthLink
            href="/counselor/clients"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            내담자 CRM
          </AuthLink>
          <button
            type="button"
            onClick={() => {
              void loadClients();
              void loadAssignments();
            }}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            새로고침
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {resultMsg ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {resultMsg}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-300">프로그램 카탈로그</h2>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as '' | CareProgramCategory)}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
            >
              <option value="">전체 분류</option>
              {(Object.keys(CATEGORY_LABELS) as CareProgramCategory[]).map((id) => (
                <option key={id} value={id}>
                  {CATEGORY_LABELS[id]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {programs.map((program) => (
              <ProgramCard
                key={program.programId}
                program={program}
                selected={selectedProgramId === program.programId}
                onSelect={() => setSelectedProgramId(program.programId)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          {!selectedProgram ? (
            <p className="py-16 text-center text-sm text-slate-500">왼쪽에서 치료 프로그램을 선택하세요.</p>
          ) : (
            <form onSubmit={(e) => void handleAssign(e)} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedProgram.title}</h2>
                <p className="mt-1 text-sm text-slate-400">{selectedProgram.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{selectedProgram.durationWeeks}주</span>
                  <span>·</span>
                  <span>{selectedProgram.totalSessions}세션</span>
                  <span>·</span>
                  <span>{selectedProgram.categoryLabel}</span>
                </div>
              </div>

              {'sessions' in selectedProgram && selectedProgram.sessions?.length ? (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-500">세션 미리보기</p>
                  <ul className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-white/5 bg-black/20 p-3 text-xs text-slate-400">
                    {selectedProgram.sessions.slice(0, 6).map((s) => (
                      <li key={s.id}>
                        W{s.week} · {s.title}
                      </li>
                    ))}
                    {selectedProgram.sessions.length > 6 ? (
                      <li className="text-slate-500">외 {selectedProgram.sessions.length - 6}세션</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">
                    내담자 선택 ({selectedPortalIds.size}명)
                  </p>
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={selectAllVisible} className="text-sky-400 hover:text-sky-300">
                      전체 선택
                    </button>
                    <button type="button" onClick={clearSelection} className="text-slate-400 hover:text-slate-200">
                      선택 해제
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void loadClients();
                    }}
                    placeholder="이름·연락처 검색"
                    className="min-w-[12rem] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => void loadClients()}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-300"
                  >
                    검색
                  </button>
                  <select
                    value={cohortFilter}
                    onChange={(e) => setCohortFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="">전체 그룹</option>
                    {cohorts.map((c) => (
                      <option key={c.cohortId} value={c.cohortId}>
                        {c.cohortName || c.cohortId}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10">
                  {loadingClients ? (
                    <p className="px-4 py-8 text-center text-xs text-slate-500">내담자 불러오는 중…</p>
                  ) : clients.length === 0 ? (
                    <p className="px-4 py-8 text-center text-xs text-slate-500">활성 내담자가 없습니다.</p>
                  ) : (
                    <ul className="divide-y divide-white/5">
                      {clients.map((client) => (
                        <li key={client.portalId}>
                          <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03]">
                            <input
                              type="checkbox"
                              checked={selectedPortalIds.has(client.portalId)}
                              onChange={() => togglePortal(client.portalId)}
                              className="rounded border-white/20"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm text-white">{client.displayName || '내담자'}</span>
                              <span className="block text-xs text-slate-500">
                                {client.cohortName || '개별'} · 진행 {client.progress.percent}%
                              </span>
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-slate-500">
                  우선순위
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as CareAssignmentPriority)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                  </select>
                </label>
                <label className="block text-xs text-slate-500">
                  마감일
                  <input
                    type="date"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                  />
                </label>
              </div>

              <label className="block text-xs text-slate-500">
                상담사 메모·안내 (내담자에게 표시)
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="예: 매주 화·목 저녁에 15분씩 실천해 주세요."
                  className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="rounded border-white/20"
                />
                할당 시 이메일/SMS 알림 큐에 등록
              </label>

              <button
                type="submit"
                disabled={assigning || selectedPortalIds.size === 0}
                className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {assigning
                  ? '할당 중…'
                  : `${selectedPortalIds.size}명에게 「${selectedProgram.title}」 할당`}
              </button>
            </form>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">활성 치료 할당</h2>
        {loadingAssignments ? (
          <p className="text-sm text-slate-500">할당 목록을 불러오는 중…</p>
        ) : assignments.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-500">
            아직 활성 치료 할당이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                  <th className="px-4 py-3 font-medium">프로그램</th>
                  <th className="px-4 py-3 font-medium">내담자</th>
                  <th className="px-4 py-3 font-medium">마감</th>
                  <th className="px-4 py-3 font-medium">진행</th>
                  <th className="px-4 py-3 font-medium">할당일</th>
                  <th className="px-4 py-3 font-medium">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assignments.map((item) => {
                  const badge = progressBadge(item);
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.programId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/counselor/clients/${encodeURIComponent(item.portalId)}`}
                          className="text-slate-200 hover:text-sky-300"
                        >
                          {item.portalDisplayName || '내담자'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{item.dueAt || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${badge.className}`}>{badge.text}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDateTime(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/counselor/clients/${encodeURIComponent(item.portalId)}`}
                          className="text-xs text-sky-400 hover:text-sky-300"
                        >
                          상세
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
