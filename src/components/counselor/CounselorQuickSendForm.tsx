'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { pushWithAuthSession } from '@/utils/authSessionLifecycle';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { bulkCreateClientPortals } from '@/lib/clientPortalApi';
import { prependCounselorAssessmentToListCache, type CounselorAssessment } from '@/lib/assessmentApi';
import { formatPhoneDisplay, normalizeRecipientPhone } from '@/lib/phoneFormat';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import AuthLink from '@/components/auth/AuthLink';
import {
  COUNSELOR_SEND_TEMPLATES,
  QUICK_SEND_MESSAGE,
  resolveTemplateTestList,
  type CounselorSendTemplateId,
} from '@/data/counselorSendTemplates';

const INPUT =
  'w-full rounded-lg border border-white/15 bg-[#121f38]/95 px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/35 focus:border-sky-400/55 disabled:opacity-55';

type Props = {
  variant?: 'page' | 'modal';
  onClose?: () => void;
  onIssued?: () => void;
  fullFormHref?: string;
  onShowFullForm?: () => void;
};

export default function CounselorQuickSendForm({
  variant = 'page',
  onIssued,
  fullFormHref = '/counselor/assessments/new?full=1',
  onShowFullForm,
}: Props) {
  const router = useRouter();
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [templateId, setTemplateId] = useState<CounselorSendTemplateId | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const template = COUNSELOR_SEND_TEMPLATES.find((t) => t.id === templateId) ?? null;
  const testList = template ? resolveTemplateTestList(template) : [];

  const finish = (assessmentId: string) => {
    if (variant === 'modal') {
      onIssued?.();
      return;
    }
    const href = assessmentId
      ? `/counselor/assessments/progress?assessmentId=${encodeURIComponent(assessmentId)}`
      : '/counselor/assessments';
    pushWithAuthSession(router, href);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!template || testList.length === 0) {
      setError('기본 · 관계 · 스트레스 중 하나를 골라 주세요.');
      return;
    }
    const name = displayName.trim();
    if (!name) {
      setError('내담자 이름을 입력해 주세요.');
      return;
    }
    const phoneNorm = normalizeRecipientPhone(phone);
    if (!phoneNorm) {
      setError('휴대폰 번호를 입력해 주세요. 카톡·문자로 링크를 보냅니다.');
      return;
    }

    setLoading(true);
    try {
      const title = `${template.name} · ${name}`.slice(0, 200);
      const result = await bulkCreateClientPortals({
        cohortName: name.slice(0, 120),
        title,
        welcomeMessage: QUICK_SEND_MESSAGE,
        testList,
        codeCategory: 'individual',
        rows: [
          {
            displayName: name,
            phone: phoneNorm,
            queueNotify: true,
          },
        ],
        queueNotify: true,
      });

      const assessmentId = result.assessmentId || '';
      const accessCode = result.joinAccessCode || result.created?.[0]?.joinAccessCode || '';
      if (assessmentId && accessCode) {
        const optimistic: CounselorAssessment = {
          id: assessmentId,
          accessCode,
          counselorId: user?.uid || '',
          title,
          issueType: 'individual',
          targetAudience: '개인',
          welcomeMessage: QUICK_SEND_MESSAGE,
          testList,
          createdAt: new Date().toISOString(),
          cohortName: name,
          codeCategory: 'individual',
          dispatchSentCount: 1,
          dispatchFailedCount: 0,
          testCompleteCount: 0,
          testIncompleteCount: 1,
        };
        prependCounselorAssessmentToListCache(optimistic);
      }
      finish(assessmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : '보내기에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authPending) {
    return <AuthLoadingState className="py-8" message="로그인 정보를 로딩중…" />;
  }
  if (showLoginRequired) {
    return (
      <AuthRequiredState description="로그인한 상태에서 검사를 보낼 수 있습니다." />
    );
  }

  const fullLink = onShowFullForm ? (
    <button
      type="button"
      onClick={onShowFullForm}
      className="text-xs text-sky-400 hover:text-sky-300"
    >
      여러 명·엑셀로 보내기
    </button>
  ) : (
    <AuthLink href={fullFormHref} className="text-xs text-sky-400 hover:text-sky-300">
      여러 명·엑셀로 보내기
    </AuthLink>
  );

  return (
    <CounselorPageSection
      title="검사 보내기"
      dense
      description="세트 고르기 → 이름·번호 → 보내기. 내담자는 가입하지 않습니다."
      toolbar={fullLink}
    >
      <form onSubmit={handleSend} className="mx-auto flex max-w-xl flex-col gap-5 p-1">
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">1. 어떤 검사인가요?</p>
          <div className="grid grid-cols-3 gap-2">
            {COUNSELOR_SEND_TEMPLATES.map((item) => {
              const active = templateId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={loading}
                  onClick={() => setTemplateId(item.id)}
                  className={`rounded-xl border px-3 py-4 text-left transition-colors ${
                    active
                      ? 'border-sky-400/60 bg-sky-500/20 text-white'
                      : 'border-white/12 bg-[#121f38]/80 text-slate-200 hover:border-sky-400/30'
                  }`}
                >
                  <span className="block text-base font-bold">{item.name}</span>
                  <span className="mt-1 block text-xs text-slate-400">{item.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-200">2. 누구에게 보낼까요?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-400">이름</span>
              <input
                className={INPUT}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="내담자 이름"
                autoComplete="name"
                disabled={loading}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-slate-400">휴대폰</span>
              <input
                className={INPUT}
                value={phone}
                onChange={(e) => setPhone(formatPhoneDisplay(e.target.value) || e.target.value)}
                placeholder="010-0000-0000"
                inputMode="tel"
                autoComplete="tel"
                disabled={loading}
              />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-xs font-medium text-slate-400">보낼 문구 (수정하지 않아도 됩니다)</p>
          <p className="mt-1 text-sm text-slate-200">{QUICK_SEND_MESSAGE}</p>
        </div>

        {error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? '보내는 중…' : '3. 보내기'}
        </button>
      </form>
      <CounselorActionProgressOverlay
        open={loading}
        title="보내는 중…"
        message="상담코드를 만들고 카톡·문자로 링크를 넣고 있습니다."
      />
    </CounselorPageSection>
  );
}
