'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/RoleGuard';
import {
  createOrgCohortTemplate,
  deleteOrgCohortTemplate,
  fetchOrgCohortTemplates,
  orgBulkCreate,
  type OrgCohortTemplate,
} from '@/lib/orgApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';

const DEFAULT_TESTS = [
  { testId: 'mbti_pro', name: 'MBTI Pro' },
  { testId: 'integrated-assessment', name: '통합 검사' },
];

export default function OrgDispatchPage() {
  const [cohortName, setCohortName] = useState('');
  const [title, setTitle] = useState('');
  const [rowsText, setRowsText] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(
    DEFAULT_TESTS.map((t) => t.testId),
  );
  const [templates, setTemplates] = useState<OrgCohortTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [presetName, setPresetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const testOptions = useMemo(
    () =>
      counselorAssessmentTestOptions.filter(
        (o) => o.testId === 'generic' || o.testId.includes('-') || o.testId === 'mbti_pro',
      ),
    [],
  );

  const reloadTemplates = useCallback(async () => {
    try {
      const list = await fetchOrgCohortTemplates();
      setTemplates(list);
    } catch {
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    void reloadTemplates();
  }, [reloadTemplates]);

  const selectedTests = useMemo(() => {
    const fromOptions = testOptions.filter((o) => selectedTestIds.includes(o.testId));
    if (fromOptions.length) return fromOptions.map((o) => ({ testId: o.testId, name: o.name }));
    return DEFAULT_TESTS;
  }, [selectedTestIds, testOptions]);

  const applyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    if (tpl.title) setTitle(tpl.title);
    setSelectedTestIds((tpl.testList || []).map((t) => t.testId));
    setPresetName(tpl.name);
  };

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId],
    );
  };

  const parseRows = () => {
    return rowsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        return {
          displayName: parts[0] || '내담자',
          email: parts[1] || '',
          phone: parts[2] || '',
        };
      });
  };

  const handleSavePreset = async () => {
    const name = presetName.trim() || cohortName.trim();
    if (!name) {
      setError('프리셋 이름을 입력하세요.');
      return;
    }
    if (selectedTests.length === 0) {
      setError('검사를 1개 이상 선택하세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createOrgCohortTemplate({
        name,
        title: title.trim() || name,
        testList: selectedTests,
      });
      setMessage(`프리셋 "${name}" 저장 완료`);
      await reloadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프리셋 저장 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm('이 프리셋을 삭제할까요?')) return;
    setLoading(true);
    try {
      await deleteOrgCohortTemplate(id);
      if (selectedTemplateId === id) setSelectedTemplateId('');
      setMessage('프리셋이 삭제되었습니다.');
      await reloadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const rows = parseRows();
    if (!cohortName.trim() || rows.length === 0) {
      setError('cohort 이름과 내담자 목록(1줄 1명)이 필요합니다.');
      setLoading(false);
      return;
    }
    if (selectedTests.length === 0) {
      setError('검사를 1개 이상 선택하세요.');
      setLoading(false);
      return;
    }
    try {
      const result = await orgBulkCreate({
        cohortName: cohortName.trim(),
        title: title.trim() || cohortName.trim(),
        rows,
        testList: selectedTests,
        queueNotify: false,
      });
      setMessage(
        `발송 완료 — cohort ${String(result.cohortId || '')}, ${rows.length}명 (기관 선결제·0원)`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '발송 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['org_admin', 'admin']}>
      <div className="p-6 max-w-3xl mx-auto">
        <Link href="/org/dashboard/" className="text-blue-400 text-sm hover:underline">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold text-white mt-4 mb-2">기관 일괄 발송</h1>
        <p className="text-slate-400 text-sm mb-6">
          학급·부서 단위 cohort. 검사 세트 프리셋을 저장해 재사용할 수 있습니다.
        </p>

        {message && (
          <div className="mb-4 rounded-lg bg-emerald-900/40 border border-emerald-600/40 p-4 text-emerald-200 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/40 border border-red-600/40 p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        {templates.length > 0 && (
          <div className="mb-6 rounded-xl border border-white/10 p-4 bg-slate-900/50">
            <h2 className="text-sm font-semibold text-white mb-3">저장된 검사 세트 프리셋</h2>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => applyTemplate(tpl.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      selectedTemplateId === tpl.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    {tpl.name} ({(tpl.testList || []).length}검사)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(tpl.id)}
                    className="text-xs text-red-400 hover:text-red-300"
                    title="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 p-6 bg-slate-900/50">
          <div>
            <label className="block text-sm text-slate-400 mb-1">학급/부서명 (cohort)</label>
            <input
              value={cohortName}
              onChange={(e) => setCohortName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
              placeholder="예: 3학년 2반"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">검사 제목 (선택)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">포함 검사 (다중 선택)</label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-800/50 p-3 space-y-2">
              {testOptions.slice(0, 24).map((opt) => (
                <label key={opt.testId} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTestIds.includes(opt.testId)}
                    onChange={() => toggleTest(opt.testId)}
                    className="rounded"
                  />
                  <span>{opt.name}</span>
                  <span className="text-xs text-slate-500 font-mono">{opt.testId}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              선택됨: {selectedTests.map((t) => t.name).join(', ') || '없음'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-slate-400 mb-1">프리셋 이름 (저장용)</label>
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm"
                placeholder="예: 1학기 기본 세트"
              />
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={handleSavePreset}
              className="px-4 py-2 rounded-lg border border-violet-500/40 text-violet-300 text-sm hover:bg-violet-500/10 disabled:opacity-50"
            >
              현재 선택을 프리셋으로 저장
            </button>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              내담자 목록 (이름, 이메일, 휴대폰 — 쉼표/탭 구분, 1줄 1명)
            </label>
            <textarea
              value={rowsText}
              onChange={(e) => setRowsText(e.target.value)}
              rows={8}
              className="w-full rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-white text-sm font-mono"
              placeholder={'홍길동, student1@school.kr\n김철수'}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? '처리 중…' : '기관 크레딧으로 일괄 발송'}
          </button>
        </form>
      </div>
    </RoleGuard>
  );
}
