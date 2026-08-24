'use client';

import React from 'react';
import {
  portalHomeTestButtonLabel,
  portalHomeTestsSubtitle,
  type PortalHomeOverview,
  type PortalHomeTestItem,
} from '@/lib/portalHomeTask';
import {
  PORTAL_CARE_MANAGER_TITLE,
  PORTAL_MY_TEST_LIST_LABEL,
  portalCareManagerDisplayName,
} from '@/lib/portalCareManagerLabels';

type Props = {
  displayName: string;
  counselorName?: string;
  counselorEmail?: string;
  overview: PortalHomeOverview;
  onTestAction: (item: PortalHomeTestItem) => void;
  onCareAction?: () => void;
  onOpenMySpace: () => void;
};

export default function PortalHomeHero({
  displayName,
  counselorName,
  counselorEmail,
  overview,
  onTestAction,
  onCareAction,
  onOpenMySpace,
}: Props) {
  const managerLabel = portalCareManagerDisplayName(counselorName);
  const allTestsDone = overview.totalTests > 0 && overview.pendingTests === 0;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-600 bg-gradient-to-b from-slate-800/90 to-slate-900/90 p-6 shadow-xl">
        <p className="text-sm text-slate-400">내 검사실</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{displayName}님</h1>

        <div className="mt-5 flex items-start gap-3 rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-lg"
            aria-hidden
          >
            👤
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-200/80">
              {PORTAL_CARE_MANAGER_TITLE}
            </p>
            <p className="mt-0.5 truncate text-base font-semibold text-white">{managerLabel}</p>
            {counselorEmail ? (
              <p className="mt-0.5 truncate text-xs text-slate-400">{counselorEmail}</p>
            ) : null}
            {allTestsDone ? (
              <p className="mt-2 inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium text-emerald-200">
                검사 케어 매니저 확인 중
              </p>
            ) : overview.pendingTests > 0 ? (
              <p className="mt-2 inline-flex items-center rounded-full border border-cyan-500/40 bg-cyan-950/40 px-2.5 py-0.5 text-xs font-medium text-cyan-200">
                검사 케어 매니저와 함께 진행 중
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/35 bg-cyan-950/20 p-6 shadow-lg shadow-cyan-950/20">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-cyan-200">오늘 할 일</p>
          <button
            type="button"
            onClick={onOpenMySpace}
            className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/40 hover:bg-white/5"
          >
            {PORTAL_MY_TEST_LIST_LABEL} →
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {portalHomeTestsSubtitle(overview.pendingTests, overview.totalTests)}
        </p>

        {overview.testItems.length > 0 ? (
          <div className="mt-4 space-y-2">
            {overview.testItems.map((item, index) => {
              const enabled = !item.completed;
              return (
                <button
                  key={`${item.assessmentId}:${item.testId}`}
                  type="button"
                  disabled={!enabled}
                  onClick={() => enabled && onTestAction(item)}
                  className={`w-full rounded-xl px-4 py-3.5 text-left text-base font-bold transition active:scale-[0.99] ${
                    enabled
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-900/30 hover:bg-cyan-400'
                      : 'cursor-not-allowed border border-slate-600/80 bg-slate-800/50 text-slate-500'
                  }`}
                >
                  {portalHomeTestButtonLabel(item, index)}
                </button>
              );
            })}
          </div>
        ) : null}

        {overview.careTask && onCareAction ? (
          <button
            type="button"
            onClick={onCareAction}
            className="mt-3 w-full rounded-xl border border-violet-500/40 bg-violet-950/30 px-4 py-3.5 text-left text-base font-bold text-violet-100 transition hover:bg-violet-950/50 active:scale-[0.99]"
          >
            {overview.careTask.title} 하기
          </button>
        ) : null}

        {allTestsDone && overview.totalTests > 0 ? (
          <p className="mt-4 text-sm text-emerald-200/90">
            배정된 검사를 모두 마쳤습니다. 검사 케어 매니저가 결과를 확인합니다.
          </p>
        ) : null}
      </section>
    </div>
  );
}
