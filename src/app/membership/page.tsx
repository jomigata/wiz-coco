"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { MEMBERSHIP_PLANS, ADDON_CATALOG, MembershipPlan, AddonCatalogItem } from '@/types/membership';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

const PLAN_FEATURES_TABLE = [
  {
    category: '고객(내담자) 관리',
    rows: [
      { label: '활동 고객 수', explorer: '최대 3명', professional: '최대 30명', clinic: '무제한', highlight: true },
      { label: '고객 맞춤형 태그', explorer: '기본 5개', professional: '무제한', clinic: '무제한' },
      { label: '데이터 저장 공간', explorer: '1GB', professional: '50GB', clinic: '사용자당 100GB' },
    ],
  },
  {
    category: '핵심 AI 기능 (월 크레딧)',
    rows: [
      { label: 'AI 인테이크 프로파일러', explorer: '5 크레딧', professional: '50 크레딧', clinic: '무제한', highlight: true },
      { label: 'AI 상담 리포트 자동 생성', explorer: '5 크레딧', professional: '50 크레딧', clinic: '무제한', highlight: true },
      { label: '실시간 AI 상담 코파일럿', explorer: false, professional: true, clinic: true },
      { label: 'AI 기반 장기 추적 리포트', explorer: false, professional: true, clinic: true },
    ],
  },
  {
    category: '고급 AI 기능',
    rows: [
      { label: 'AI 슈퍼비전 미러', explorer: false, professional: false, clinic: true, highlight: true },
      { label: 'AI 관계 역학 분석기', explorer: false, professional: false, clinic: true },
      { label: 'AI 위기 신호 사전 감지', explorer: false, professional: false, clinic: true },
      { label: 'AI 상담기법 추천 엔진', explorer: false, professional: false, clinic: true },
      { label: '음성 바이오마커 분석', explorer: false, professional: false, clinic: '별도 요금' },
    ],
  },
  {
    category: '업무 효율 및 관리',
    rows: [
      { label: '개인 예약 링크 공유', explorer: true, professional: true, clinic: true },
      { label: '커뮤니케이션 템플릿', explorer: '3개 저장', professional: '무제한 저장', clinic: '팀 공유 템플릿' },
      { label: '나만의 브랜딩 리포트', explorer: false, professional: '로고 삽입', clinic: '완전 맞춤' },
      { label: '전자 서명 및 보안 문서함', explorer: false, professional: true, clinic: true },
    ],
  },
  {
    category: '팀 기능 및 지원',
    rows: [
      { label: '상담사 계정', explorer: '1개', professional: '1개', clinic: '2개 이상', highlight: true },
      { label: '팀 대시보드 및 관리자 기능', explorer: false, professional: false, clinic: true },
      { label: '고객 데이터 접근 제어', explorer: false, professional: false, clinic: true },
      { label: '고객 지원', explorer: '커뮤니티', professional: '이메일', clinic: '전담 매니저+전화' },
    ],
  },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="text-green-400 text-xl">✓</span>;
  if (value === false) return <span className="text-gray-600 text-xl">✗</span>;
  return <span className="text-sm text-gray-200">{value}</span>;
}

function PlanCard({ plan, billingCycle, onSelect }: { plan: MembershipPlan; billingCycle: 'monthly' | 'yearly'; onSelect: (plan: MembershipPlan) => void }) {
  const price = billingCycle === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-900/80 to-emerald-800/60 border-emerald-500/40 hover:border-emerald-400',
    blue: 'from-blue-900/80 to-blue-800/60 border-blue-500/40 hover:border-blue-400',
    purple: 'from-purple-900/80 to-purple-800/60 border-purple-500/40 hover:border-purple-400',
  };
  const badgeBg: Record<string, string> = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };
  const btnColorMap: Record<string, string> = {
    emerald: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400',
    blue: 'bg-blue-600 hover:bg-blue-500 border-blue-400',
    purple: 'bg-purple-600 hover:bg-purple-500 border-purple-400',
  };

  return (
    <div className={`relative flex flex-col rounded-3xl border-2 bg-gradient-to-br p-8 transition-all duration-300 shadow-2xl ${colorMap[plan.color]} ${plan.popular ? 'scale-105 shadow-blue-500/30' : ''}`}>
      {plan.badge && (
        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-sm font-bold text-white shadow-lg ${badgeBg[plan.color]}`}>
          {plan.badge}
        </div>
      )}

      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{plan.icon}</span>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {plan.memberClass === 'associate' ? '준회원' : '정회원'}
            </div>
            <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
          </div>
        </div>
        <p className="text-gray-300 text-sm">{plan.tagline}</p>
      </div>

      {/* 가격 */}
      <div className="mb-6">
        {price === 0 ? (
          <div className="text-5xl font-black text-white">무료</div>
        ) : (
          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-black text-white">{price.toLocaleString()}</span>
              <span className="text-gray-400 mb-2">원/월</span>
            </div>
            {billingCycle === 'yearly' && (
              <div className="text-sm text-yellow-400 mt-1">
                연간 결제 시 20% 할인 · 연 {plan.yearlyTotalPrice.toLocaleString()}원
              </div>
            )}
            {billingCycle === 'monthly' && (
              <div className="text-xs text-gray-400 mt-1">
                연간 결제 시 월 {plan.yearlyMonthlyPrice.toLocaleString()}원
              </div>
            )}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-1">대상: {plan.targetAudience}</div>
      </div>

      {/* 주요 기능 */}
      <ul className="space-y-2 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-200">
            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
        {plan.limitations?.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-500">
            <span className="text-gray-600 mt-0.5 flex-shrink-0">✗</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA 버튼 */}
      <button
        onClick={() => onSelect(plan)}
        className={`w-full py-3.5 rounded-xl font-bold text-white border-2 transition-all duration-300 ${btnColorMap[plan.color]}`}
      >
        {price === 0 ? '무료로 시작하기' : '지금 시작하기'}
      </button>
    </div>
  );
}

function AddonCard({ addon }: { addon: AddonCatalogItem }) {
  return (
    <div className="bg-slate-800/60 border border-slate-600/50 rounded-2xl p-5 hover:border-blue-500/50 transition-all duration-300">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{addon.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-white">{addon.name}</h4>
          <p className="text-sm text-gray-400 mt-0.5">{addon.description}</p>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-lg font-bold text-blue-300">{addon.price.toLocaleString()}원</span>
              <span className="text-sm text-gray-400"> / {addon.unit}</span>
            </div>
            <div className="flex gap-1">
              {addon.availableFor.map((tier) => (
                <span key={tier} className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  tier === 'explorer' ? 'bg-emerald-800 text-emerald-300' :
                  tier === 'professional' ? 'bg-blue-800 text-blue-300' :
                  'bg-purple-800 text-purple-300'
                }`}>
                  {tier === 'explorer' ? '준회원' : tier === 'professional' ? 'Pro' : 'Clinic'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembershipPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showComparison, setShowComparison] = useState(false);
  const { user } = useFirebaseAuth();

  function handleSelectPlan(plan: MembershipPlan) {
    if (!user) {
      window.location.href = `/login?redirect=/membership`;
      return;
    }
    window.location.href = `/mypage?tab=membership&plan=${plan.id}&cycle=${billingCycle}`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      <Navigation />

      {/* 히어로 섹션 */}
      <section className="pt-28 pb-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium mb-6">
            ⭐ AI 심리케어 멤버십
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            나에게 맞는<br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              멤버십을 선택하세요
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
            무료 준회원부터 기관용 정회원까지 — 규모와 필요에 따라 합리적으로 선택하고,
            언제든지 플랜을 변경할 수 있습니다.
          </p>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            모든 데이터는 개인정보보호법 기준 최고 수준 암호화로 안전하게 보호됩니다.
          </p>
        </div>
      </section>

      {/* 결제 주기 토글 */}
      <div className="flex justify-center mb-12 px-4">
        <div className="inline-flex items-center bg-slate-800/60 border border-slate-600/50 rounded-full p-1.5 gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            월간 결제
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              billingCycle === 'yearly'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            연간 결제
            <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full font-bold">20% 할인</span>
          </button>
        </div>
      </div>

      {/* 플랜 카드 */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {MEMBERSHIP_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              billingCycle={billingCycle}
              onSelect={handleSelectPlan}
            />
          ))}
        </div>
      </section>

      {/* 회원 구분 안내 */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🌱</span>
              <div>
                <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">준회원</div>
                <h3 className="text-xl font-bold text-white">Associate Member</h3>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Explorer 플랜을 통해 무료로 이용 가능한 기본 회원 등급입니다. 플랫폼의 핵심 AI 기능을 체험하고,
              준비가 되었을 때 언제든지 정회원으로 업그레이드할 수 있습니다.
            </p>
            <ul className="space-y-1.5 text-sm">
              {['무료 이용', '기본 AI 기능 체험 (월 5 크레딧)', '최대 3명의 내담자 관리', '커뮤니티 지원'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-gray-300">
                  <span className="text-emerald-400">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/20 border border-blue-500/30 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">정회원</div>
                <h3 className="text-xl font-bold text-white">Full Member</h3>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Professional 또는 Clinic 플랜을 구독하는 프리미엄 회원 등급입니다.
              모든 핵심 AI 기능과 업무 도구를 제한 없이 활용하고, 비즈니스를 성장시킬 수 있습니다.
            </p>
            <ul className="space-y-1.5 text-sm">
              {['무제한 or 대용량 AI 기능', '전문 브랜딩 리포트 제공', '전자 서명 및 보안 문서', '유료 Add-on 기능 선택 추가', '이메일/전담 매니저 지원'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-gray-300">
                  <span className="text-blue-400">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 상세 기능 비교표 */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">상세 기능 비교</h2>
          <p className="text-gray-400">어떤 플랜이 나에게 맞는지 비교해보세요.</p>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="mt-4 px-6 py-2.5 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-300 text-sm hover:bg-blue-600/50 transition-all duration-300"
          >
            {showComparison ? '비교표 숨기기' : '전체 비교표 보기'} {showComparison ? '▲' : '▼'}
          </button>
        </div>

        {showComparison && (
          <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800/80 border-b border-slate-700/50">
                    <th className="text-left px-6 py-5 text-gray-400 font-medium text-sm w-1/3">기능</th>
                    <th className="px-6 py-5 text-center">
                      <div className="text-emerald-400 font-bold text-lg">🌱 Explorer</div>
                      <div className="text-xs text-gray-400 mt-0.5">준회원 · 무료</div>
                    </th>
                    <th className="px-6 py-5 text-center bg-blue-900/20">
                      <div className="text-blue-400 font-bold text-lg">⚡ Professional</div>
                      <div className="text-xs text-gray-400 mt-0.5">정회원 · 59,000원/월</div>
                    </th>
                    <th className="px-6 py-5 text-center">
                      <div className="text-purple-400 font-bold text-lg">🏥 Clinic</div>
                      <div className="text-xs text-gray-400 mt-0.5">정회원+ · 149,000원~</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_FEATURES_TABLE.map((section) => (
                    <React.Fragment key={section.category}>
                      <tr className="bg-slate-800/40">
                        <td colSpan={4} className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {section.category}
                        </td>
                      </tr>
                      {section.rows.map((row, idx) => (
                        <tr key={row.label} className={`border-b border-slate-800/50 ${'highlight' in row && row.highlight ? 'bg-blue-950/20' : idx % 2 === 0 ? 'bg-slate-900/20' : ''}`}>
                          <td className="px-6 py-4 text-sm text-gray-300">{row.label}</td>
                          <td className="px-6 py-4 text-center"><FeatureCell value={row.explorer} /></td>
                          <td className="px-6 py-4 text-center bg-blue-900/10"><FeatureCell value={row.professional} /></td>
                          <td className="px-6 py-4 text-center"><FeatureCell value={row.clinic} /></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Add-on 기능 */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">유료 Add-on 기능</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            정회원은 기본 플랜에 원하는 기능을 자유롭게 추가할 수 있습니다.
            선택한 Add-on 금액은 매월 기본 플랜 요금과 함께 자동 청구됩니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ADDON_CATALOG.map((addon) => (
            <AddonCard key={addon.id} addon={addon} />
          ))}
        </div>
      </section>

      {/* 결제 정책 */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">결제 및 운영 정책</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: '💳',
              title: '결제 수단',
              content: '국내외 신용카드·체크카드, 기관용 계좌이체 및 세금계산서 발행 지원 (Clinic 플랜)',
            },
            {
              icon: '🔄',
              title: '플랜 변경',
              content: '업그레이드는 즉시 적용(일할 계산), 다운그레이드는 다음 결제일부터 적용됩니다.',
            },
            {
              icon: '💰',
              title: '환불 정책',
              content: '연간 결제 중도 해지 시 사용 기간을 월 요금으로 계산 후 차액 환불. 명확한 규정 고지.',
            },
            {
              icon: '🔒',
              title: '데이터 보안',
              content: '모든 데이터는 개인정보보호법 기준 최고 수준으로 암호화하여 저장 및 전송됩니다.',
            },
            {
              icon: '🤖',
              title: 'AI 크레딧이란?',
              content: '1 크레딧 = 리포트 1건 생성. 매월 1일 자동 충전, 잔여 크레딧은 이월되지 않습니다.',
            },
            {
              icon: '📋',
              title: 'AI 활용 동의',
              content: '상담사는 내담자에게 AI 기능 활용을 사전 고지하고, 플랫폼 내에서 전자 동의를 받을 수 있습니다.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <h4 className="font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 면책 조항 */}
      <section className="max-w-3xl mx-auto px-4 mb-20">
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-6 text-sm text-amber-200/80">
          <p className="font-semibold text-amber-300 mb-2">⚠️ AI 서비스 한계 고지</p>
          <p>
            AI가 제공하는 모든 정보는 상담사의 전문적 판단을 돕기 위한 <strong>보조 도구</strong>입니다.
            최종적인 진단과 개입의 책임은 상담사에게 있으며, AI 결과는 임상적 판단을 대체하지 않습니다.
            자세한 내용은{' '}
            <Link href="/terms" className="underline text-amber-300 hover:text-white">이용약관</Link>
            {' '}및{' '}
            <Link href="/privacy" className="underline text-amber-300 hover:text-white">개인정보처리방침</Link>
            을 확인하세요.
          </p>
        </div>
      </section>

      {/* 하단 CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
        <div className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
          <p className="text-gray-300 mb-8">
            무료 준회원으로 시작하여 AI 심리케어 플랫폼의 혁신을 경험해보세요.
            언제든지 정회원으로 업그레이드할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleSelectPlan(MEMBERSHIP_PLANS[0])}
              className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition-all duration-300"
            >
              🌱 무료로 시작하기
            </button>
            <button
              onClick={() => handleSelectPlan(MEMBERSHIP_PLANS[1])}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-all duration-300"
            >
              ⚡ Professional 시작하기
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-6">신용카드 등록 없이 무료로 시작 · 언제든지 해지 가능</p>
        </div>
      </section>
    </div>
  );
}
