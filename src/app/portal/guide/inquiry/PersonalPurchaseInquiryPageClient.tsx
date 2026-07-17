'use client';

import { useState } from 'react';
import Link from 'next/link';
import HomeSectionShell from '@/components/home/HomeSectionShell';
import PageHierarchyBreadcrumb from '@/components/navigation/PageHierarchyBreadcrumb';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';
import { resolvePortalHierarchy } from '@/lib/pageHierarchyNav';
import { portalLoginHref } from '@/lib/portalLoginIntent';

const packageOptions = [
  { value: '', label: '아직 정하지 않았어요' },
  { value: 'Basic', label: 'Basic (5,000원)' },
  { value: 'Premium', label: 'Premium (15,000원)' },
  { value: 'Pro', label: 'Pro (50,000원)' },
  { value: 'custom', label: '맞춤 상담 · 기타' },
];

export default function PersonalPurchaseInquiryPageClient() {
  const nav = resolvePortalHierarchy('/portal/guide/inquiry');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [packageInterest, setPackageInterest] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/personal-purchase-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, packageInterest, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.error || '문의 전송에 실패했습니다.');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '문의 전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0f1628] text-slate-100 ${APP_HEADER_PT}`}>
      <HomeSectionShell tone="hero" className="py-10 md:py-14" showBottomFade={false}>
        <div className="container mx-auto max-w-xl px-4">
          {nav ? (
            <PageHierarchyBreadcrumb crumbs={nav.crumbs} className="mb-6" />
          ) : null}
          <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">
            개인 구매 문의
          </h1>
          <p className="text-sm leading-relaxed text-slate-400 md:text-base">
            파일럿 단계에서는 결제·코드 발급을 문의 접수 후 안내해 드립니다. 아래 양식을 작성해 주시면
            담당자가 이메일로 회신합니다.
          </p>
        </div>
      </HomeSectionShell>

      <HomeSectionShell tone="steps" className="py-10 md:py-14">
        <div className="container mx-auto max-w-xl px-4">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-6 text-center">
              <p className="text-lg font-medium text-emerald-100">문의가 접수되었습니다</p>
              <p className="mt-2 text-sm text-emerald-200/80">
                입력하신 이메일로 순차적으로 안내드리겠습니다.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/portal/guide"
                  className="rounded-xl border border-white/15 px-5 py-2.5 text-sm text-slate-200 hover:bg-white/[0.06]"
                >
                  검사 시작 안내로
                </Link>
                <Link
                  href={portalLoginHref('start')}
                  className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105"
                >
                  검사 시작
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">이름 *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                  placeholder="홍길동"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">이메일 *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                  placeholder="example@email.com"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">휴대폰 (선택)</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                  placeholder="010-0000-0000"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">관심 패키지</span>
                <select
                  value={packageInterest}
                  onChange={(e) => setPackageInterest(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101f38] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                >
                  {packageOptions.map((opt) => (
                    <option key={opt.value || 'none'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-slate-300">문의 내용 *</span>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                  placeholder="관심 검사 영역, 희망 일정, 기타 요청 사항을 적어 주세요."
                />
              </label>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                {loading ? '전송 중…' : '문의 보내기'}
              </button>
            </form>
          )}
        </div>
      </HomeSectionShell>
    </div>
  );
}
