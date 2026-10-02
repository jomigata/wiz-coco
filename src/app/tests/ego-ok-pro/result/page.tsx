'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import EgoOkCounselorReport from '@/components/tests/egoOk/EgoOkCounselorReport';
import { computeEgoOkReport } from '@/lib/egoOkScoring';
import { clearEgoOkReportDraft, loadEgoOkReportDraft } from '@/lib/egoOkReportSession';
import { isLocalPsychTestDirectActive } from '@/lib/localPsychTestDirectStart';

function EgoOkResultContent() {
  const searchParams = useSearchParams();
  const localDirect = isLocalPsychTestDirectActive(searchParams);
  const [ready, setReady] = useState(false);
  const draft = useMemo(() => (ready ? loadEgoOkReportDraft() : null), [ready]);

  useEffect(() => {
    setReady(true);
  }, []);

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

  const report = computeEgoOkReport(draft.answers, draft.clientInfo?.gender);

  return (
    <div className="min-h-screen bg-[#070b14] px-4 pt-20 pb-10">
      <div className="mx-auto mb-6 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Link
          href="/tests"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← 검사 목록
        </Link>
        {localDirect ? (
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-300"
            onClick={() => {
              clearEgoOkReportDraft();
              window.location.href = '/tests/ego-ok-pro?localDirect=1';
            }}
          >
            초안 삭제 후 재검사
          </button>
        ) : null}
      </div>
      <EgoOkCounselorReport report={report} clientInfo={draft.clientInfo} localTestMode={localDirect} />
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
