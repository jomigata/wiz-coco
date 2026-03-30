'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getAssessment, updateAssessment, type CounselorAssessment } from '@/lib/assessmentApi';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';

interface AssessmentEditFormProps {
  assessmentId: string;
}

export default function AssessmentEditForm({ assessmentId }: AssessmentEditFormProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useFirebaseAuth();
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [initial, setInitial] = useState<CounselorAssessment | null>(null);

  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState<'개인' | '그룹'>('개인');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setLoadingData(false);
      return;
    }
    let cancelled = false;
    setLoadingData(true);
    setLoadError('');
    getAssessment(assessmentId)
      .then((data) => {
        if (cancelled) return;
        setInitial(data);
        setTitle(data.title || '');
        setTargetAudience((data.targetAudience === '그룹' ? '그룹' : '개인') as '개인' | '그룹');
        setWelcomeMessage(data.welcomeMessage || '');
        const ids = new Set((data.testList || []).map((t) => t.testId).filter(Boolean));
        setSelectedTestIds(ids);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : '불러오기 실패');
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, [assessmentId, authLoading, user]);

  const canSubmit = Boolean(user) && !authLoading && !loading && !loadingData && initial;

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
      setError('안내 제목을 입력해 주세요.');
      return;
    }
    const testList = counselorAssessmentTestOptions
      .filter((t) => selectedTestIds.has(t.testId))
      .map((t) => ({ testId: t.testId, name: t.name }));
    setLoading(true);
    try {
      await updateAssessment(assessmentId, {
        title: trimmedTitle,
        targetAudience,
        welcomeMessage: welcomeMessage.trim(),
        testList,
      });
      router.push('/counselor/assessments');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loadingData) {
    return <p className="text-slate-400">불러오는 중…</p>;
  }
  if (!user) {
    return (
      <div className="rounded-lg bg-amber-900/20 border border-amber-600/50 p-4 text-amber-200 text-sm">
        로그인이 필요합니다.
      </div>
    );
  }
  if (loadError || !initial) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-600/50 p-4 text-red-300">
        {loadError || '검사코드를 찾을 수 없습니다.'}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => router.push('/counselor/assessments')}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            목록으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-lg bg-slate-800/80 border border-slate-600 p-4 text-sm text-slate-300">
        <span className="text-slate-400">검사코드</span>{' '}
        <span className="font-mono text-cyan-400 tracking-wider">{formatAccessCodeDisplay(initial.accessCode)}</span>
        <p className="text-slate-500 text-xs mt-2">검사코드는 발급 후 변경할 수 없습니다.</p>
        <div className="mt-3 pt-3 border-t border-slate-600">
          <span className="text-slate-400">비밀번호</span>{' '}
          {initial.joinPin ? (
            <span className="font-mono tracking-widest text-cyan-300">{initial.joinPin}</span>
          ) : initial.joinPinConfigured ? (
            <span className="text-amber-400/90 text-sm">비노출(평문 미저장 구간에서 생성된 항목)</span>
          ) : (
            <span className="text-slate-500 text-sm">—</span>
          )}
        </div>
        <p className="text-slate-500 text-xs mt-2">
          비밀번호는 검사코드 목록에서도 동일하게 확인할 수 있습니다. 내담자에게 검사 시 함께 안내해 주세요.
        </p>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
          안내 제목 <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={200}
          className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          이미 제출된 결과가 있어도 안내·검사 구성은 수정할 수 있습니다. 삭제 시에는 목록에서 제거됩니다.
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
          disabled={!canSubmit}
          className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '저장 중…' : '변경 저장'}
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
