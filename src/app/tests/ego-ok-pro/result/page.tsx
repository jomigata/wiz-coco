'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import EgoOkCounselorReport from '@/components/tests/egoOk/EgoOkCounselorReport';
import { computeEgoOkReport, type EgoOkGender } from '@/lib/egoOkScoring';
import { clearEgoOkReportDraft, loadEgoOkReportDraft, saveEgoOkReportDraft } from '@/lib/egoOkReportSession';
import {
  getLocalPsychTestArchiveEntry,
  LOCAL_ARCHIVE_QUERY_KEY,
  localArchiveListHref,
} from '@/lib/localPsychTestArchive';
import { isLocalPsychTestDirectActive } from '@/lib/localPsychTestDirectStart';
import {
  egoOkGenderToLabel,
  saveStoredTestGender,
  toggleTestGenderOnPageLoad,
} from '@/lib/egoOkTestGender';

function EgoOkResultContent() {
  const searchParams = useSearchParams();
  const localDirect = isLocalPsychTestDirectActive(searchParams);
  const archiveId = searchParams.get(LOCAL_ARCHIVE_QUERY_KEY);
  const [ready, setReady] = useState(false);
  const [testGender, setTestGender] = useState<EgoOkGender | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const draft = useMemo(() => (ready && draftLoaded ? loadEgoOkReportDraft() : null), [ready, draftLoaded]);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!localDirect) {
      setDraftLoaded(true);
      return;
    }
    if (archiveId) {
      const entry = getLocalPsychTestArchiveEntry(archiveId);
      if (entry?.kind === 'ego-ok-pro') {
        saveEgoOkReportDraft({
          answers: entry.payload.answers,
          clientInfo: entry.payload.clientInfo,
        });
        if (entry.payload.testGender) {
          saveStoredTestGender(entry.payload.testGender);
          setTestGender(entry.payload.testGender);
        } else {
          setTestGender(toggleTestGenderOnPageLoad());
        }
        setDraftLoaded(true);
        return;
      }
    }
    setDraftLoaded(true);
    setTestGender(toggleTestGenderOnPageLoad());
  }, [ready, localDirect, archiveId]);

  const reportGenderLabel = localDirect
    ? testGender
      ? egoOkGenderToLabel(testGender)
      : undefined
    : draft?.clientInfo?.gender;

  const reportError = useMemo(() => {
    if (!draft) return null;
    try {
      computeEgoOkReport(draft.answers, reportGenderLabel);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : '채점할 수 없습니다.';
    }
  }, [draft, reportGenderLabel]);

  const report = useMemo(() => {
    if (!draft || reportError) return null;
    return computeEgoOkReport(draft.answers, reportGenderLabel);
  }, [draft, reportGenderLabel, reportError]);

  const handleTestGenderChange = (gender: EgoOkGender) => {
    saveStoredTestGender(gender);
    setTestGender(gender);
  };

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#070b14]">
        <LoadingMessage textClassName="text-slate-300" />
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[#070b14] px-4 text-center">
        <p className="text-slate-300">표시할 검사 결과가 없습니다. 검사를 완료한 뒤 다시 열어 주세요.</p>
        <Link href="/tests/ego-ok-pro?localDirect=1" className="text-sky-400 hover:text-sky-300">
          검사 다시 시작
        </Link>
      </div>
    );
  }

  if (localDirect && testGender === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#070b14]">
        <LoadingMessage textClassName="text-slate-300" />
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[#070b14] px-4 text-center">
        <p className="text-slate-300">{reportError}</p>
        <Link href="/tests/ego-ok-pro?localDirect=1" className="text-sky-400 hover:text-sky-300">
          검사 다시 시작
        </Link>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#070b14] bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.12),transparent)] px-1 pb-0 pt-0 sm:px-3 lg:px-4">
      <div className="fixed inset-x-0 top-16 z-[55] border-b border-white/80 bg-[#070b14]/95 shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[min(100%,112rem)] items-center justify-between gap-2 px-2 py-0 leading-none sm:px-4">
          <Link
            href="/tests?localDirect=1"
            className="my-2 block text-sm leading-snug text-slate-400 transition hover:text-white"
          >
            ← 검사 목록
          </Link>
          {localDirect ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={localArchiveListHref()}
                className="my-2 block text-sm leading-snug text-sky-400 hover:text-sky-300"
              >
                로컬 결과 목록
              </Link>
              <button
                type="button"
                className="my-2 block text-sm leading-snug text-slate-500 hover:text-slate-300"
                onClick={() => {
                  clearEgoOkReportDraft();
                  window.location.href = '/tests/ego-ok-pro?localDirect=1';
                }}
              >
                초안 삭제 후 재검사
              </button>
            </div>
          ) : (
            <span className="py-0 text-sm leading-none text-transparent select-none" aria-hidden>
              ·
            </span>
          )}
        </div>
      </div>
      <EgoOkCounselorReport
        report={report}
        clientInfo={draft.clientInfo}
        localTestMode={localDirect}
        testGender={localDirect ? testGender ?? 'male' : undefined}
        onTestGenderChange={localDirect ? handleTestGenderChange : undefined}
      />
    </div>
  );
}

export default function EgoOkProResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
          <LoadingMessage textClassName="text-slate-300" />
        </div>
      }
    >
      <EgoOkResultContent />
    </Suspense>
  );
}
