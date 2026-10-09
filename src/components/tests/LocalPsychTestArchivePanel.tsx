'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  clearLocalPsychTestArchive,
  formatLocalArchiveWhen,
  getLocalPsychTestArchiveEntry,
  listLocalPsychTestArchive,
  localArchiveEgoOkResultHref,
  localArchiveListHref,
  removeLocalPsychTestArchive,
  type LocalPsychTestArchiveEntry,
} from '@/lib/localPsychTestArchive';
import { isLocalPsychTestServer, withLocalPsychTestDirectHref } from '@/lib/localPsychTestDirectStart';

function openHref(entry: LocalPsychTestArchiveEntry): string {
  if (entry.kind === 'ego-ok-pro') {
    return localArchiveEgoOkResultHref(entry.id);
  }
  return `${localArchiveListHref()}&focus=${encodeURIComponent(entry.id)}`;
}

function summaryLine(entry: LocalPsychTestArchiveEntry): string {
  if (entry.kind === 'ego-ok-pro') {
    const n = Object.keys(entry.payload.answers || {}).length;
    return `응답 ${n}문항 · ${entry.payload.clientInfo?.name ?? '로컬테스트'}`;
  }
  if (entry.kind === 'mbti-pro') {
    return entry.payload.mbtiType ? `유형 ${entry.payload.mbtiType}` : '전문가용 MBTI 응답 저장';
  }
  if (entry.kind === 'mbti' || entry.kind === 'inside-mbti') {
    return entry.payload.summaryLine ?? `응답 ${Object.keys(entry.payload.answers || {}).length}문항`;
  }
  const name = entry.payload.studentInfo?.name ?? '로컬테스트';
  return `통합 리포트 · ${name}`;
}

export default function LocalPsychTestArchivePanel({
  focusId,
  compact,
}: {
  focusId?: string | null;
  compact?: boolean;
}) {
  const [entries, setEntries] = useState<LocalPsychTestArchiveEntry[]>([]);
  const [focusEntry, setFocusEntry] = useState<LocalPsychTestArchiveEntry | null>(null);

  const refresh = useCallback(() => {
    setEntries(listLocalPsychTestArchive());
  }, []);

  useEffect(() => {
    if (!isLocalPsychTestServer()) return;
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!focusId) {
      setFocusEntry(null);
      return;
    }
    setFocusEntry(getLocalPsychTestArchiveEntry(focusId));
  }, [focusId, entries]);

  if (!isLocalPsychTestServer()) return null;

  const listHref = withLocalPsychTestDirectHref('/tests/local-archive');

  if (compact) {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-4 backdrop-blur-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-amber-100">로컬 테스트 결과 보관함</h3>
          <Link href={listHref} className="text-xs text-amber-200/90 underline hover:text-amber-50">
            전체 목록 ({entries.length})
          </Link>
        </div>
        <p className="mb-3 text-xs text-amber-200/70">
          dev 전용 · 브라우저 localStorage · prod 배포에는 포함되지 않습니다.
        </p>
        {entries.length === 0 ? (
          <p className="text-xs text-slate-400">아직 저장된 결과가 없습니다. 로컬 테스트 모드로 검사를 완료하면 자동 저장됩니다.</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
            {entries.slice(0, 5).map((e) => (
              <li key={e.id}>
                <Link href={openHref(e)} className="block rounded-lg bg-black/20 px-3 py-2 hover:bg-black/35">
                  <span className="font-medium text-white">{e.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-400">
                    {formatLocalArchiveWhen(e.savedAt)} · {summaryLine(e)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {focusEntry && focusEntry.kind !== 'ego-ok-pro' ? (
        <div className="rounded-xl border border-white/10 bg-slate-900/80 p-5">
          <h2 className="text-lg font-semibold text-white">{focusEntry.title}</h2>
          <p className="mt-1 text-xs text-slate-400">{formatLocalArchiveWhen(focusEntry.savedAt)}</p>
          <p className="mt-3 text-sm text-slate-300">{summaryLine(focusEntry)}</p>
          <pre className="mt-4 max-h-[min(50vh,420px)] overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-300">
            {JSON.stringify(focusEntry.payload, null, 2)}
          </pre>
        </div>
      ) : null}

      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">로컬 테스트 결과 목록</h2>
            <p className="mt-1 text-xs text-slate-400">임시 보관 · 이 PC·브라우저에만 저장</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
              onClick={() => refresh()}
            >
              새로고침
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-400/40 px-3 py-1.5 text-xs text-rose-200 hover:bg-rose-950/40"
              onClick={() => {
                if (!window.confirm('로컬 보관함의 모든 결과를 삭제할까요?')) return;
                clearLocalPsychTestArchive();
                refresh();
                setFocusEntry(null);
              }}
            >
              전체 삭제
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-slate-400">저장된 결과가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{e.title}</p>
                  <p className="text-xs text-slate-400">
                    {formatLocalArchiveWhen(e.savedAt)} · {summaryLine(e)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={openHref(e)}
                    className="rounded-lg bg-sky-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500"
                  >
                    {e.kind === 'ego-ok-pro' ? '보고서 열기' : '상세'}
                  </Link>
                  <button
                    type="button"
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                    onClick={() => {
                      removeLocalPsychTestArchive(e.id);
                      refresh();
                    }}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
