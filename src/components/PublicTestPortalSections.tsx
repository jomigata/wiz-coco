'use client';

import Link from 'next/link';
import HomeSectionShell from '@/components/home/HomeSectionShell';

const steps = [
  {
    step: '01',
    title: '코드 입력',
    desc: '안내 받은 검사 코드와 4자리 비밀번호를 입력합니다.',
  },
  {
    step: '02',
    title: '검사 진행',
    desc: '배정된 심리검사를 차분한 환경에서 순서대로 진행합니다.',
  },
  {
    step: '03',
    title: '결과 확인',
    desc: '완료 후 담당 전문가 또는 검사실에서 결과를 확인합니다.',
  },
];

const faqs = [
  {
    q: '검사 코드는 어디서 받나요?',
    a: '담당 기관·전문가에게 전달받은 코드와 비밀번호를 사용합니다.',
  },
  {
    q: '회원가입이 필요한가요?',
    a: '별도 회원가입 없이 검사 코드와 비밀번호만으로 진행할 수 있습니다.',
  },
  {
    q: '링크로 바로 들어갈 수 있나요?',
    a: '문자·이메일로 받은 링크를 누르면 검사실로 바로 이동할 수 있습니다.',
  },
];

export default function PublicTestPortalSections() {
  return (
    <>
      <HomeSectionShell tone="steps" className="py-20 md:py-24">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3 block">
              How it works
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              검사 진행 방법
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {steps.map((s) => (
              <div
                key={s.step}
                className="relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-7 md:p-8 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
              >
                <div className="text-[11px] font-medium tracking-[0.2em] text-sky-400/75 mb-4">
                  STEP {s.step}
                </div>
                <h3 className="text-lg font-medium text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </HomeSectionShell>

      <HomeSectionShell tone="faq" className="py-20 md:py-24">
        <div className="container max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-white text-center mb-10 tracking-tight">
            자주 묻는 질문
          </h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-6 py-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]"
              >
                <h3 className="font-medium text-sky-100/85 mb-2 text-[15px]">{f.q}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-10">
            <Link
              href="/portal/login/"
              className="inline-flex items-center gap-2 text-sm font-medium text-sky-300/90 hover:text-sky-200 transition-colors"
            >
              검사 시작하기
              <span aria-hidden>→</span>
            </Link>
          </p>
        </div>
      </HomeSectionShell>
    </>
  );
}
