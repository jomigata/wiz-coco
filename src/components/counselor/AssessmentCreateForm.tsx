'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAssessment } from '@/lib/assessmentApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';

export default function AssessmentCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState<'개인' | '그룹'>('개인');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('패키지 제목을 입력해 주세요.');
      return;
    }
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));
    setLoading(true);
    try {
      const result = await createAssessment({
        title: trimmedTitle,
        targetAudience,
        welcomeMessage: welcomeMessage.trim(),
        testList,
      });
      router.push(`/counselor/assessments?created=${result.assessmentId}&code=${result.accessCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '패키지 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
          패키지 제목 <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="예: 2024 상담 그룹 심리검사"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">대상</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetAudience"
              checked={targetAudience === '개인'}
              onChange={() => setTargetAudience('개인')}
              disabled={loading}
              className="text-blue-500"
            />
            <span className="text-white">개인</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="targetAudience"
              checked={targetAudience === '그룹'}
              onChange={() => setTargetAudience('그룹')}
              disabled={loading}
              className="text-blue-500"
            />
            <span className="text-white">그룹</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="welcomeMessage" className="block text-sm font-medium text-slate-300 mb-2">
          안내 메시지 (선택)
        </label>
        <textarea
          id="welcomeMessage"
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          placeholder="내담자에게 보여줄 환영/안내 문구"
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">포함할 검사 선택</label>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800/80 p-3 space-y-2">
          {counselorAssessmentTestOptions.map((t) => (
            <label key={t.testId} className="flex items-center gap-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedTestIds.has(t.testId)}
                onChange={() => toggleTest(t.testId)}
                disabled={loading}
                className="rounded text-blue-500"
              />
              <span className="text-white">{t.name}</span>
              <span className="text-slate-500 text-sm">({t.testId})</span>
            </label>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-1">
          선택한 검사가 참여 코드 입력 후 내담자 대시보드에 표시됩니다.
        </p>
      </div>

      {error && (
        <p className="text-red-400 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '생성 중…' : '패키지 생성'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/counselor/assessments')}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
