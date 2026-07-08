'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  fetchComprehensiveReportsForResult,
  generateAssessmentReport,
  reportGenerateCreditCost,
  saveReportAnnotations,
} from '@/lib/aiReportApi';
import { printComprehensiveReport } from '@/lib/assessmentReportPrint';
import type { ComprehensiveReportResponse } from '@/types/aiUsage';

type Props = {
  resultId: string;
  testLabel?: string;
  clientLabel?: string;
  accessCode?: string;
  compact?: boolean;
};

type ReportState = ComprehensiveReportResponse & {
  testType?: string;
  clientLabel?: string;
  accessCode?: string;
};

export default function AssessmentComprehensiveReportButton({
  resultId,
  testLabel,
  clientLabel,
  accessCode,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [report, setReport] = useState<ReportState | null>(null);
  const [notes, setNotes] = useState('');
  const [treatment, setTreatment] = useState('');

  function applyReport(res: ComprehensiveReportResponse) {
    setReport({
      ...res,
      testType: res.testType || testLabel,
      clientLabel: res.clientLabel || clientLabel,
      accessCode: res.accessCode || accessCode,
    });
    setNotes(res.counselorNotes || '');
    setTreatment(res.recommendedTreatment || '');
  }

  async function loadCached(): Promise<boolean> {
    try {
      const reports = await fetchComprehensiveReportsForResult(resultId);
      const latest = reports[0];
      if (!latest?.content) return false;
      applyReport({
        reportId: latest.id,
        title: latest.title || `${testLabel || '검사'} 종합 리포트`,
        summary: latest.content,
        sections: latest.metadata?.sections || [],
        counselorNotes: latest.metadata?.counselorNotes || '',
        recommendedTreatment: latest.metadata?.recommendedTreatment || '',
        cached: true,
        creditsCharged: 0,
        modelId: latest.modelId || null,
        testType: latest.testType,
        clientLabel: latest.clientLabel,
        accessCode: latest.metadata?.accessCode,
      });
      return true;
    } catch {
      return false;
    }
  }

  const runGenerate = async (forceRegenerate?: boolean) => {
    setLoading(true);
    setError('');
    setSaveMsg('');
    try {
      const res = await generateAssessmentReport(resultId, { forceRegenerate });
      applyReport(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '종합 리포트 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const openPanel = async () => {
    setOpen(true);
    setError('');
    setSaveMsg('');
    const hasCache = await loadCached();
    if (!hasCache) {
      await runGenerate(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!report?.reportId) return;
    setSaving(true);
    setSaveMsg('');
    setError('');
    try {
      const updated = await saveReportAnnotations(report.reportId, {
        counselorNotes: notes,
        recommendedTreatment: treatment,
      });
      setSaveMsg('저장되었습니다.');
      setReport((prev) =>
        prev
          ? {
              ...prev,
              counselorNotes: updated.metadata?.counselorNotes || notes,
              recommendedTreatment: updated.metadata?.recommendedTreatment || treatment,
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!report) return;
    printComprehensiveReport({
      title: report.title || '종합 검사 리포트',
      subtitle: report.testType || testLabel,
      clientLabel: report.clientLabel || clientLabel,
      testName: report.testType || testLabel,
      accessCode: report.accessCode || accessCode,
      summary: report.summary,
      sections: report.sections,
      counselorNotes: notes,
      recommendedTreatment: treatment,
    });
  };

  const creditCost = reportGenerateCreditCost(false);
  const regenCost = reportGenerateCreditCost(true);

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => void openPanel()}
        className={
          compact
            ? 'text-xs px-2 py-1 rounded border border-emerald-400/40 text-emerald-200 hover:bg-emerald-950/40 disabled:opacity-50'
            : 'text-xs px-3 py-1.5 rounded-lg border border-emerald-400/40 text-emerald-200 hover:bg-emerald-950/40 disabled:opacity-50'
        }
      >
        {loading ? '생성 중…' : `종합 리포트 (${creditCost} 크레딧)`}
      </button>

      {error && !open && <p className="text-xs text-red-300 mt-1">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-emerald-500/30 bg-slate-950 p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {report?.title || 'AI 종합 검사 리포트'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {testLabel || '검사'}
                  {clientLabel ? ` · ${clientLabel}` : ''}
                  {report?.cached
                    ? ' · 캐시 (무료 열람)'
                    : report && report.creditsCharged > 0
                      ? ` · ${report.creditsCharged} AI 크레딧 차감`
                      : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                닫기
              </button>
            </div>

            {loading && !report ? (
              <p className="text-slate-400 text-sm py-8 text-center">
                AI가 종합 리포트를 작성하는 중…
              </p>
            ) : error && !report ? (
              <p className="text-red-300 text-sm">{error}</p>
            ) : report ? (
              <div className="space-y-5">
                <section className="rounded-lg border border-violet-500/20 bg-violet-950/20 p-4">
                  <h4 className="text-sm font-semibold text-violet-200 mb-2">종합 요약</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{report.summary}</p>
                </section>

                {report.sections.map((sec) => (
                  <section key={sec.heading} className="rounded-lg border border-white/10 p-4">
                    <h4 className="text-sm font-semibold text-blue-200 mb-2">{sec.heading}</h4>
                    <ul className="list-disc ml-4 text-sm text-slate-300 space-y-1">
                      {sec.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </section>
                ))}

                <section className="rounded-lg border border-emerald-500/20 p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-emerald-200">상담사 코멘트 (T-4-05)</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="내담자·보호자에게 전달할 상담사 메모…"
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-slate-200"
                  />
                  <h4 className="text-sm font-semibold text-emerald-200">추천 치료·개입</h4>
                  <textarea
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    rows={3}
                    placeholder="권장 상담·치료 프로그램, 추가 검사 등…"
                    className="w-full rounded-lg bg-slate-900 border border-white/10 px-3 py-2 text-sm text-slate-200"
                  />
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      disabled={saving || !report.reportId}
                      onClick={() => void handleSaveNotes()}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {saving ? '저장 중…' : '메모 저장'}
                    </button>
                    {saveMsg && <span className="text-xs text-emerald-400">{saveMsg}</span>}
                  </div>
                </section>
              </div>
            ) : null}

            {error && report && <p className="text-red-300 text-sm mt-3">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {report && (
                <>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-400/40 text-blue-200 hover:bg-blue-950/40"
                  >
                    PDF / 인쇄
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void runGenerate(true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 disabled:opacity-50"
                  >
                    재생성 ({regenCost} 크레딧, 50% 할인)
                  </button>
                </>
              )}
              <Link
                href="/counselor/credits"
                className="text-xs px-3 py-1.5 rounded-lg text-violet-300 hover:text-violet-200"
              >
                AI 크레딧 충전 →
              </Link>
            </div>

            <p className="mt-4 text-[11px] text-slate-600">
              AI 초안은 진단이 아닌 상담 참고 자료입니다. 상담사 검토·메모 후 인쇄·전달하세요.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
