'use client';

import Link from 'next/link';
import HomeSectionShell from '@/components/home/HomeSectionShell';
import { APP_HEADER_PT } from '@/lib/appChromeLayout';
import { portalLoginHref } from '@/lib/portalLoginIntent';

const codeReceiveSteps = [
  {
    step: '01',
    title: '코드·비밀번호 전달받기',
    desc: '담당 상담사·센터, 학교·기관 담당자가 문자·이메일·카카오로 나의코드와 4자리 PIN을 보내 줍니다.',
  },
  {
    step: '02',
    title: '검사실 입장',
    desc: '홈의 「검사 시작」 또는 받은 링크로 이동해 코드와 PIN을 입력합니다. 회원가입은 필요 없습니다.',
  },
  {
    step: '03',
    title: '배정 검사 진행',
    desc: '상담사·기관이 미리 배정한 검사 항목을 순서대로 완료합니다. 결과는 담당자 안내에 따라 확인합니다.',
  },
];

const selfPurchaseSteps = [
  {
    step: '01',
    title: '목적·패키지 선택',
    desc: '스트레스 점검, 정서·기분, 진로·적성 등 관심 영역에 맞는 개인 패키지를 고릅니다.',
  },
  {
    step: '02',
    title: '결제·코드 발급',
    desc: '결제 완료 후 이메일·문자로 나의코드와 PIN이 발급됩니다. (파일럿 단계는 문의 후 수동 발급)',
  },
  {
    step: '03',
    title: '직접 검사·리포트',
    desc: '검사실에서 진행하고 요약·심층 리포트를 확인합니다. 필요 시 상담 연결 옵션을 선택할 수 있습니다.',
  },
];

const assessmentIdeas = [
  {
    tag: '가볍게 시작',
    title: '3분 마음 체크 → 관심 영역 확장',
    desc: '부담 없는 6문항 스크리닝으로 피로·기분·수면 패턴을 먼저 확인한 뒤, 결과에 맞는 단일 영역 검사(스트레스·우울 등)로 이어가는 방식이 좋습니다.',
    fit: '처음 심리검사를 해보는 분, SNS·자기이해 목적',
  },
  {
    tag: '단일 영역',
    title: '스트레스·불안 OR 우울·정서 집중',
    desc: '한 번에 여러 검사를 하기보다, 현재 가장 불편한 영역 하나를 15~25분 내외로 집중 측정합니다. 해석 부담이 적고 행동 계획을 세우기 쉽습니다.',
    fit: '번아웃·불안·기분 저하가 주된 고민인 경우',
  },
  {
    tag: '성격·진로',
    title: '성격 유형 + 진로·적성 조합',
    desc: 'MBTI·에니어그램 등 성격 검사와 진로·직무 적성 검사를 묶어 「나를 이해 → 방향 탐색」 흐름으로 진행합니다. 상담 없이도 자기 탐색에 유용합니다.',
    fit: '진로 전환, 이직·적성 고민, 자기 이해',
  },
  {
    tag: '주기 모니터링',
    title: '월 1회 미니 체크 + 분기별 심층',
    desc: '매달 짧은 체크로 변화를 추적하고, 3개월마다 한 번 심층 리포트로 패턴을 비교합니다. 「진단」보다 「웰니스 관리」에 가깝습니다.',
    fit: '장기적으로 마음 건강을 관리하고 싶은 분',
  },
  {
    tag: '해석 지원',
    title: '리포트 + 선택 상담 연결',
    desc: '혼자 해석이 어려운 경우 Pro 등급처럼 리포트와 함께 협회 상담사 매칭 안내를 받습니다. 결과를 행동·상담 계획으로 연결할 때 적합합니다.',
    fit: '결과 해석·후속 조치가 필요한 경우',
  },
];

const selfPackages = [
  {
    name: 'Basic',
    price: '5,000원',
    desc: '미니 검사 후 요약·패턴 정리',
    features: ['요약 리포트', '6문항 확장 해석', '1년 열람'],
  },
  {
    name: 'Premium',
    price: '15,000원',
    desc: '스트레스·정서 패턴 심층 분석',
    features: ['심층 리포트', '대처 전략 제안', '1년 열람'],
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '50,000원',
    desc: '심층 리포트 + 상담 연결 안내',
    features: ['Pro 등급 리포트', '상담사 매칭 안내', '우선 지원'],
  },
];

export default function PortalGuidePageClient() {
  return (
    <div className={`min-h-screen bg-[#0f1628] text-slate-100 ${APP_HEADER_PT}`}>
      <HomeSectionShell tone="hero" className="py-14 md:py-20" showBottomFade={false}>
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-sky-300/70 hover:text-sky-200"
          >
            ← 홈
          </Link>
          <span className="mb-4 inline-block rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-200/90">
            검사 시작 안내
          </span>
          <h1 className="mb-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            검사코드 받는 방법
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-400 md:text-base">
            상담사·기관을 통해 코드를 받는 일반적인 방법과, 개인이 직접 구매해 검사하는 방법을
            안내합니다.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={portalLoginHref('start')}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 hover:brightness-105"
            >
              검사 시작
            </Link>
            <a
              href="mailto:wizcocoai@gmail.com?subject=WizCoCo%20개인%20검사코드%20구매%20문의"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-medium text-slate-200 hover:bg-white/[0.08]"
            >
              개인 구매 문의
            </a>
          </div>
        </div>
      </HomeSectionShell>

      <HomeSectionShell tone="steps" className="py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold text-white">① 상담사·기관 통해 받기</h2>
            <p className="mt-2 text-sm text-slate-400">
              가장 일반적인 방법 — 담당 전문가가 검사를 배정하고 코드를 보내 줍니다.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {codeReceiveSteps.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 text-center"
              >
                <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-sky-400/75">
                  STEP {s.step}
                </p>
                <h3 className="mb-2 text-lg font-medium text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-slate-500">
            학교·기업·센터 일괄 검사도 동일하게 코드만 받으면 별도 가입 없이 진행할 수 있습니다.
          </p>
        </div>
      </HomeSectionShell>

      <HomeSectionShell tone="channel" className="py-16 md:py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold text-white">② 개인이 직접 구매해 진행하기</h2>
            <p className="mt-2 text-sm text-slate-400">
              상담 전문가를 거치지 않고, 본인이 패키지를 선택·결제 후 검사코드를 받는 방법입니다.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {selfPurchaseSteps.map((s) => (
              <div
                key={s.step}
                className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-6 text-center"
              >
                <p className="mb-3 text-[11px] font-medium tracking-[0.2em] text-violet-300/80">
                  STEP {s.step}
                </p>
                <h3 className="mb-2 text-lg font-medium text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {selfPackages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-xl border p-5 ${
                  pkg.highlighted
                    ? 'border-violet-400/35 bg-violet-500/10 ring-1 ring-violet-400/20'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-violet-300/80">
                  {pkg.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-white">{pkg.price}</p>
                <p className="mt-2 text-sm text-slate-400">{pkg.desc}</p>
                <ul className="mt-4 space-y-1.5 text-xs text-slate-300">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-violet-400" aria-hidden>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-violet-400/25 bg-violet-950/20 p-5 text-center">
            <p className="text-sm text-slate-300">
              파일럿 단계에서는 결제·코드 발급을{' '}
              <strong className="text-white">이메일 문의</strong>로 안내해 드립니다. PG 자동 결제는
              순차 도입 예정입니다.
            </p>
            <a
              href="mailto:wizcocoai@gmail.com?subject=WizCoCo%20개인%20검사코드%20구매%20문의"
              className="mt-4 inline-flex rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              개인 검사코드 구매 문의
            </a>
          </div>
        </div>
      </HomeSectionShell>

      <HomeSectionShell tone="trust" className="py-16 md:py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold text-white">어떤 검사를 하면 좋을까요?</h2>
            <p className="mt-2 text-sm text-slate-400">
              상담사 없이 진행할 때 추천하는 검사 구성 아이디어입니다.
            </p>
          </div>
          <div className="space-y-4">
            {assessmentIdeas.map((idea) => (
              <article
                key={idea.title}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-5 sm:px-6"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-200">
                    {idea.tag}
                  </span>
                  <h3 className="text-base font-semibold text-white sm:text-lg">{idea.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{idea.desc}</p>
                <p className="mt-2 text-xs text-slate-500">
                  <span className="text-slate-400">추천 대상:</span> {idea.fit}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-950/20 p-5">
            <p className="text-sm leading-relaxed text-amber-100/90">
              <strong className="text-amber-50">참고:</strong> 개인 직접 구매 경로의 검사·리포트는
              자기 이해·웰니스 참고용이며, 의학적 진단을 대체하지 않습니다. 증상이 심하거나 위기
              상황이면 전문 상담·의료 기관을 이용해 주세요.
            </p>
          </div>
        </div>
      </HomeSectionShell>

      <section className="border-t border-white/[0.06] py-12">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <p className="mb-4 text-sm text-slate-400">이미 코드를 받으셨나요?</p>
          <Link
            href={portalLoginHref('start')}
            className="inline-flex items-center gap-2 text-base font-semibold text-sky-300 hover:text-sky-200"
          >
            검사실로 이동 →
          </Link>
        </div>
      </section>
    </div>
  );
}
