"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import {
  MEMBERSHIP_PLANS,
  ADDON_CATALOG,
  MembershipTier,
  BillingCycle,
  Subscription,
  AddonFeatureId,
  SubscriptionAddon,
  USER_MEMBERSHIP_FIELD,
  USERS_COLLECTION,
  MEMBERSHIP_COLLECTIONS,
} from '@/types/membership';

interface MembershipTabProps {
  userId: string;
}

function tierLabel(tier: MembershipTier): string {
  if (tier === 'explorer') return 'Explorer (준회원)';
  if (tier === 'professional') return 'Professional (정회원)';
  return 'Clinic (정회원+)';
}

function tierColorClass(tier: MembershipTier): string {
  if (tier === 'explorer') return 'text-emerald-400 bg-emerald-900/30 border-emerald-500/40';
  if (tier === 'professional') return 'text-blue-400 bg-blue-900/30 border-blue-500/40';
  return 'text-purple-400 bg-purple-900/30 border-purple-500/40';
}

function tierIcon(tier: MembershipTier): string {
  if (tier === 'explorer') return '🌱';
  if (tier === 'professional') return '⚡';
  return '🏥';
}

/** Firestore 연결 실패 시 UI만이라도 맞추기 위한 로컬 기본 구독 (Explorer 준회원) */
function buildLocalExplorerSubscription(uid: string): Subscription {
  const now = Timestamp.now();
  return {
    uid,
    tier: 'explorer',
    memberClass: 'associate',
    billingCycle: 'monthly',
    status: 'active',
    basePrice: 0,
    effectiveMonthlyPrice: 0,
    addons: [],
    addonTotal: 0,
    totalMonthlyAmount: 0,
    nextBillingDate: null,
    startedAt: now,
    updatedAt: now,
    credits: { total: 5, used: 0, resetAt: now },
    counselorSeats: 1,
    storageUsedMb: 0,
    activeClientsCount: 0,
  };
}

export default function MembershipTab({ userId }: MembershipTabProps) {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [showAddonManager, setShowAddonManager] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');
  const [pendingPlan, setPendingPlan] = useState<MembershipTier | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Set<AddonFeatureId>>(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  /** true: Firestore에 읽기/쓰기가 되지 않아 메모리상 기본값만 표시 중 (권한 미배포·네트워크 등) */
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  /** users/{uid}.membership 에 구독 객체 저장 (기존 Firestore users 규칙으로 동작) */
  async function mergeMembershipToUser(uid: string, sub: Subscription) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(
      userRef,
      { [USER_MEMBERSHIP_FIELD]: sub, updatedAt: serverTimestamp() },
      { merge: true }
    );
    const snap = await getDoc(userRef);
    const raw = snap.data()?.[USER_MEMBERSHIP_FIELD] as Subscription | undefined;
    if (raw) {
      setSubscription({ ...raw, uid });
      setSelectedAddons(new Set(raw.addons?.map((a) => a.featureId) ?? []));
      setUsingLocalFallback(false);
    }
  }

  /** 최초 진입 시 Explorer 기본값을 users 문서에 기록 */
  async function ensureDefaultMembership(uid: string) {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const defaultSub = {
      uid,
      tier: 'explorer' as const,
      memberClass: 'associate' as const,
      billingCycle: 'monthly' as const,
      status: 'active' as const,
      basePrice: 0,
      effectiveMonthlyPrice: 0,
      addons: [] as SubscriptionAddon[],
      addonTotal: 0,
      totalMonthlyAmount: 0,
      nextBillingDate: null,
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      credits: {
        total: 5,
        used: 0,
        resetAt: serverTimestamp(),
      },
      counselorSeats: 1,
      storageUsedMb: 0,
      activeClientsCount: 0,
    };

    const before = await getDoc(userRef);
    if (!before.exists()) {
      await setDoc(userRef, {
        role: 'user',
        [USER_MEMBERSHIP_FIELD]: defaultSub,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        { [USER_MEMBERSHIP_FIELD]: defaultSub, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }

    const after = await getDoc(userRef);
    const m = after.data()?.[USER_MEMBERSHIP_FIELD] as Subscription | undefined;
    if (m) {
      setSubscription({ ...m, uid });
      setSelectedAddons(new Set(m.addons?.map((a) => a.featureId) ?? []));
      setUsingLocalFallback(false);
    }
  }

  const loadSubscription = useCallback(async () => {
    setErrorMessage('');
    setUsingLocalFallback(false);
    setLoading(true);
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const m = userSnap.data()?.[USER_MEMBERSHIP_FIELD] as Subscription | undefined;
        if (m != null && typeof m === 'object' && 'tier' in m) {
          setSubscription({ ...m, uid: userId });
          setSelectedAddons(new Set(m.addons?.map((a) => a.featureId) ?? []));
          setUsingLocalFallback(false);
          return;
        }
      }

      // 구버전: subscriptions 컬렉션만 쓰던 데이터가 있으면 users 로 한 번 옮김 (권한 있을 때만)
      try {
        const legacyRef = doc(db, MEMBERSHIP_COLLECTIONS.SUBSCRIPTIONS, userId);
        const legacySnap = await getDoc(legacyRef);
        if (legacySnap.exists()) {
          const sub = { ...(legacySnap.data() as Subscription), uid: userId };
          await setDoc(
            userRef,
            { [USER_MEMBERSHIP_FIELD]: sub, updatedAt: serverTimestamp() },
            { merge: true }
          );
          setSubscription(sub);
          setSelectedAddons(new Set(sub.addons?.map((a) => a.featureId) ?? []));
          setUsingLocalFallback(false);
          return;
        }
      } catch {
        // 권한 없음 등 — 무시
      }

      try {
        await ensureDefaultMembership(userId);
      } catch (createErr) {
        console.error('[MembershipTab] users.membership 기본값 저장 실패:', createErr);
        setSubscription(buildLocalExplorerSubscription(userId));
        setSelectedAddons(new Set());
        setUsingLocalFallback(true);
      }
    } catch (err) {
      console.error('[MembershipTab] 멤버십 로드 실패:', err);
      setSubscription(buildLocalExplorerSubscription(userId));
      setSelectedAddons(new Set());
      setUsingLocalFallback(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  // URL 파라미터로 플랜 사전 선택
  useEffect(() => {
    const planParam = searchParams?.get('plan') as MembershipTier | null;
    const cycleParam = searchParams?.get('cycle') as BillingCycle | null;
    if (planParam && ['explorer', 'professional', 'clinic'].includes(planParam)) {
      setPendingPlan(planParam);
      setShowPlanSelector(true);
    }
    if (cycleParam && ['monthly', 'yearly'].includes(cycleParam)) {
      setSelectedCycle(cycleParam);
    }
  }, [searchParams]);

  async function handlePlanChange() {
    if (!pendingPlan) return;
    setSaving(true);
    setErrorMessage('');
    try {
      const base = subscription ?? buildLocalExplorerSubscription(userId);
      const plan = MEMBERSHIP_PLANS.find((p) => p.id === pendingPlan)!;
      const basePrice = plan.monthlyPrice;
      const effectiveMonthlyPrice = selectedCycle === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;

      const availableAddons = ADDON_CATALOG.filter((a) => a.availableFor.includes(pendingPlan));
      const availableAddonIds = new Set(availableAddons.map((a) => a.id));
      const newAddons = base.addons.filter((a) => availableAddonIds.has(a.featureId));
      const addonTotal = newAddons.reduce((sum, a) => {
        const catalog = ADDON_CATALOG.find((c) => c.id === a.featureId);
        return sum + (catalog?.price ?? 0) * a.quantity;
      }, 0);

      const nextBillingDate =
        pendingPlan === 'explorer'
          ? null
          : Timestamp.fromDate(
              (() => {
                const d = new Date();
                d.setMonth(d.getMonth() + 1);
                return d;
              })()
            );

      let credits: Subscription['credits'] | undefined;
      if (pendingPlan === 'explorer') {
        credits = { total: 5, used: 0, resetAt: serverTimestamp() } as Subscription['credits'];
      } else if (pendingPlan === 'professional') {
        credits = { total: 50, used: 0, resetAt: serverTimestamp() } as Subscription['credits'];
      } else {
        credits = undefined;
      }

      const fullSub = {
        ...base,
        uid: userId,
        tier: pendingPlan,
        memberClass: plan.memberClass,
        billingCycle: selectedCycle,
        status: 'active' as const,
        basePrice,
        effectiveMonthlyPrice,
        addons: newAddons,
        addonTotal,
        totalMonthlyAmount: effectiveMonthlyPrice + addonTotal,
        nextBillingDate,
        updatedAt: serverTimestamp(),
        startedAt: base.startedAt,
        credits,
      } as Subscription;

      await mergeMembershipToUser(userId, fullSub);
      setSelectedAddons(new Set(newAddons.map((a) => a.featureId)));
      setShowPlanSelector(false);
      setPendingPlan(null);
      setSuccessMessage(`${plan.nameKo} 플랜으로 변경되었습니다!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch {
      setErrorMessage('플랜 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddonToggle(featureId: AddonFeatureId) {
    if (!subscription) return;
    setSaving(true);
    setErrorMessage('');
    const wasSelected = selectedAddons.has(featureId);
    try {
      const catalog = ADDON_CATALOG.find((a) => a.id === featureId)!;
      let newAddons: SubscriptionAddon[];

      if (wasSelected) {
        newAddons = subscription.addons.filter((a) => a.featureId !== featureId);
        setSelectedAddons((prev) => {
          const s = new Set(prev);
          s.delete(featureId);
          return s;
        });
      } else {
        const newAddon = {
          featureId,
          name: catalog.name,
          price: catalog.price,
          quantity: 1,
          addedAt: serverTimestamp(),
        } as unknown as SubscriptionAddon;
        newAddons = [...subscription.addons, newAddon];
        setSelectedAddons((prev) => {
          const s = new Set(prev);
          s.add(featureId);
          return s;
        });
      }

      const addonTotal = newAddons.reduce((sum, a) => {
        const c = ADDON_CATALOG.find((x) => x.id === a.featureId);
        return sum + (c?.price ?? 0) * a.quantity;
      }, 0);

      const fullSub = {
        ...subscription,
        addons: newAddons,
        addonTotal,
        totalMonthlyAmount: subscription.effectiveMonthlyPrice + addonTotal,
        updatedAt: serverTimestamp(),
      } as Subscription;

      await mergeMembershipToUser(userId, fullSub);
      setSuccessMessage(wasSelected ? `${catalog.name} 해제되었습니다.` : `${catalog.name} 추가되었습니다.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      setErrorMessage('Add-on 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  const currentPlan = MEMBERSHIP_PLANS.find((p) => p.id === (subscription?.tier ?? 'explorer'))!;
  const availableAddonsForCurrentPlan = ADDON_CATALOG.filter((a) =>
    a.availableFor.includes(subscription?.tier ?? 'explorer')
  );
  const isFullMember = subscription?.memberClass === 'full';

  return (
    <div className="space-y-6">
      {/* 알림 메시지 */}
      {successMessage && (
        <div className="px-4 py-3 rounded-xl bg-green-900/40 border border-green-500/50 text-green-300 text-sm">
          ✓ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/50 text-red-300 text-sm">
          ⚠ {errorMessage}
        </div>
      )}

      {usingLocalFallback && (
        <div className="px-4 py-3 rounded-xl bg-amber-900/35 border border-amber-500/50 text-amber-100 text-sm space-y-2">
          <p>
            일시적으로 계정 정보와 동기화하지 못했습니다. 화면에는 기본(준회원·Explorer)만 표시됩니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadSubscription()}
              className="rounded-lg bg-amber-600/80 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
            >
              다시 시도
            </button>
            <span className="text-xs text-amber-200/80">
              네트워크를 확인하거나 잠시 후 다시 시도해 주세요. 계속되면 관리자에게 문의해 주세요.
            </span>
          </div>
        </div>
      )}

      {/* 현재 구독 현황 */}
      <div className={`rounded-2xl border p-6 ${tierColorClass(subscription?.tier ?? 'explorer')}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">현재 구독 플랜</div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{tierIcon(subscription?.tier ?? 'explorer')}</span>
              <div>
                <h3 className="text-xl font-bold text-white">{tierLabel(subscription?.tier ?? 'explorer')}</h3>
                <div className="text-sm opacity-70 mt-0.5">
                  {subscription?.billingCycle === 'yearly' ? '연간 결제' : '월간 결제'}
                  {subscription?.memberClass === 'full' && ` · 월 ${(subscription?.effectiveMonthlyPrice ?? 0).toLocaleString()}원`}
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            {isFullMember && subscription?.totalMonthlyAmount !== undefined && (
              <>
                <div className="text-xs opacity-60">이번달 예정 청구액</div>
                <div className="text-2xl font-bold text-white">{subscription.totalMonthlyAmount.toLocaleString()}원</div>
                <div className="text-xs opacity-60 mt-0.5">
                  기본 {subscription.effectiveMonthlyPrice.toLocaleString()}원
                  {subscription.addonTotal > 0 && ` + Add-on ${subscription.addonTotal.toLocaleString()}원`}
                </div>
              </>
            )}
            {!isFullMember && (
              <div className="text-xl font-bold text-white">무료</div>
            )}
          </div>
        </div>

        {/* 상태 정보 */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {subscription?.tier !== 'clinic' && subscription?.credits && (
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xs opacity-60 mb-1">AI 크레딧</div>
              <div className="font-bold text-white">{subscription.credits.total - subscription.credits.used} / {subscription.credits.total}</div>
            </div>
          )}
          {subscription?.tier === 'clinic' && (
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xs opacity-60 mb-1">AI 크레딧</div>
              <div className="font-bold text-white">무제한</div>
            </div>
          )}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs opacity-60 mb-1">활성 내담자</div>
            <div className="font-bold text-white">{subscription?.activeClientsCount ?? 0}</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs opacity-60 mb-1">저장 공간</div>
            <div className="font-bold text-white">{((subscription?.storageUsedMb ?? 0) / 1024).toFixed(1)} GB</div>
          </div>
          {isFullMember && subscription?.nextBillingDate && (
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xs opacity-60 mb-1">다음 결제일</div>
              <div className="font-bold text-white text-sm">
                {(() => {
                  const d = subscription.nextBillingDate as any;
                  if (!d) return '-';
                  const date = d.toDate ? d.toDate() : new Date(d.seconds * 1000);
                  return date.toLocaleDateString('ko-KR');
                })()}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => setShowPlanSelector(true)}
            className="px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-sm transition-all duration-300"
          >
            플랜 변경
          </button>
          {isFullMember && (
            <button
              onClick={() => setShowAddonManager(true)}
              className="px-5 py-2.5 rounded-xl bg-blue-600/60 hover:bg-blue-600/80 text-white font-semibold text-sm transition-all duration-300"
            >
              ➕ Add-on 관리
            </button>
          )}
          <Link
            href="/membership"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 font-semibold text-sm transition-all duration-300"
          >
            멤버십 비교 보기 ↗
          </Link>
        </div>
      </div>

      {/* 현재 Add-on 목록 */}
      {isFullMember && subscription && subscription.addons.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
          <h4 className="font-semibold text-white mb-4">⊕ 활성 Add-on</h4>
          <div className="space-y-3">
            {subscription.addons.map((addon) => {
              const catalog = ADDON_CATALOG.find((c) => c.id === addon.featureId);
              return (
                <div key={addon.featureId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{catalog?.icon ?? '🔧'}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{addon.name}</div>
                      <div className="text-xs text-gray-400">{addon.price.toLocaleString()}원 / {catalog?.unit}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddonToggle(addon.featureId)}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-medium transition-all"
                  >
                    해제
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-sm">
            <span className="text-gray-400">Add-on 합계</span>
            <span className="font-bold text-white">{subscription.addonTotal.toLocaleString()}원/월</span>
          </div>
        </div>
      )}

      {/* 준회원 업그레이드 유도 */}
      {!isFullMember && (
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6">
          <h4 className="font-bold text-white text-lg mb-2">⚡ 정회원으로 업그레이드하세요</h4>
          <p className="text-gray-300 text-sm mb-4">
            Professional 플랜으로 업그레이드하면 50 AI 크레딧, 최대 30명 내담자 관리, 실시간 AI 코파일럿 등
            모든 핵심 기능을 제한 없이 사용할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setPendingPlan('professional'); setShowPlanSelector(true); }}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all"
            >
              Professional 시작하기 — 월 59,000원
            </button>
            <button
              onClick={() => { setPendingPlan('clinic'); setShowPlanSelector(true); }}
              className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm transition-all"
            >
              Clinic 문의하기 — 월 149,000원~
            </button>
          </div>
        </div>
      )}

      {/* 결제 내역 링크 */}
      {isFullMember && (
        <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5">
          <h4 className="font-semibold text-white mb-3">💳 결제 정보</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>기본 플랜</span>
              <span>{(subscription?.effectiveMonthlyPrice ?? 0).toLocaleString()}원/월</span>
            </div>
            {(subscription?.addonTotal ?? 0) > 0 && (
              <div className="flex justify-between">
                <span>Add-on 합계</span>
                <span>{(subscription?.addonTotal ?? 0).toLocaleString()}원/월</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white border-t border-slate-700 pt-2 mt-2">
              <span>월 총 청구 예정액</span>
              <span>{(subscription?.totalMonthlyAmount ?? 0).toLocaleString()}원</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            결제 수단 변경, 세금계산서 요청 등 결제 관련 문의는 고객센터로 연락해주세요.
          </p>
        </div>
      )}

      {/* 플랜 선택 모달 */}
      {showPlanSelector && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">플랜 변경</h3>
              <button onClick={() => { setShowPlanSelector(false); setPendingPlan(null); }} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* 결제 주기 선택 */}
            <div className="flex gap-2 mb-6">
              {(['monthly', 'yearly'] as BillingCycle[]).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setSelectedCycle(cycle)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${selectedCycle === cycle ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'}`}
                >
                  {cycle === 'monthly' ? '월간 결제' : '연간 결제 (20% 할인)'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {MEMBERSHIP_PLANS.map((plan) => {
                const price = selectedCycle === 'yearly' ? plan.yearlyMonthlyPrice : plan.monthlyPrice;
                const isSelected = pendingPlan === plan.id;
                const isCurrent = subscription?.tier === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setPendingPlan(plan.id)}
                    className={`relative text-left rounded-2xl border-2 p-5 transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-900/30'
                        : isCurrent
                        ? 'border-green-500/50 bg-green-900/20'
                        : 'border-slate-600 hover:border-blue-500/50 bg-slate-800/50'
                    }`}
                  >
                    {isCurrent && <div className="absolute top-2 right-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">현재</div>}
                    <div className="text-3xl mb-2">{plan.icon}</div>
                    <div className="font-bold text-white">{plan.name}</div>
                    <div className="text-xs text-gray-400 mb-3">{plan.nameKo.split(' ')[1]?.replace('(', '').replace(')', '')}</div>
                    <div className="text-xl font-black text-white">
                      {price === 0 ? '무료' : `${price.toLocaleString()}원/월`}
                    </div>
                    {plan.id !== 'explorer' && selectedCycle === 'yearly' && (
                      <div className="text-xs text-yellow-400 mt-1">연 {plan.yearlyTotalPrice.toLocaleString()}원</div>
                    )}
                    <ul className="mt-3 space-y-1">
                      {plan.features.slice(0, 4).map((f) => (
                        <li key={f} className="text-xs text-gray-300 flex items-start gap-1.5">
                          <span className="text-green-400 mt-0.5">✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowPlanSelector(false); setPendingPlan(null); }}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-gray-300 font-semibold hover:bg-slate-600 transition-all"
              >
                취소
              </button>
              <button
                onClick={handlePlanChange}
                disabled={saving || !pendingPlan || pendingPlan === subscription?.tier}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '변경 중...' : pendingPlan === subscription?.tier ? '현재 플랜' : '플랜 변경 확인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add-on 관리 모달 */}
      {showAddonManager && subscription && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Add-on 기능 관리</h3>
              <button onClick={() => setShowAddonManager(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              선택한 Add-on 금액은 기본 플랜 요금과 함께 매월 자동 청구됩니다.
            </p>

            {availableAddonsForCurrentPlan.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <p>현재 플랜에서 사용 가능한 Add-on이 없습니다.</p>
                <p className="text-sm mt-1">Professional 이상 플랜으로 업그레이드하면 Add-on을 사용할 수 있습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableAddonsForCurrentPlan.map((addon) => {
                  const isActive = selectedAddons.has(addon.id);
                  return (
                    <div key={addon.id} className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isActive ? 'border-blue-500/50 bg-blue-900/20' : 'border-slate-600 bg-slate-800/40'}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{addon.icon}</span>
                        <div>
                          <div className="font-semibold text-white">{addon.name}</div>
                          <div className="text-sm text-gray-400">{addon.description}</div>
                          <div className="text-sm font-bold text-blue-300 mt-1">{addon.price.toLocaleString()}원 / {addon.unit}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddonToggle(addon.id)}
                        disabled={saving}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                          isActive
                            ? 'bg-red-900/40 hover:bg-red-900/60 text-red-300'
                            : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {isActive ? '해제' : '추가'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 합계 */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>기본 플랜</span>
                <span>{subscription.effectiveMonthlyPrice.toLocaleString()}원/월</span>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Add-on 합계</span>
                <span>{subscription.addonTotal.toLocaleString()}원/월</span>
              </div>
              <div className="flex justify-between font-bold text-white">
                <span>총 청구 예정액</span>
                <span>{subscription.totalMonthlyAmount.toLocaleString()}원/월</span>
              </div>
            </div>

            <button
              onClick={() => setShowAddonManager(false)}
              className="mt-5 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
            >
              완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
