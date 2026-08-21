'use client';

import React, { useState } from 'react';
import { adminGrantOrgCredits, type OrganizationRecord } from '@/lib/orgApi';

const EVENT_PRESETS = [
  { id: 'workshop', label: '연수·세미나 (500)', amount: 500, reason: 'event_workshop' },
  { id: 'member_trial', label: '회원 체험 (100)', amount: 100, reason: 'event_member_trial' },
  { id: 'open_day', label: '오픈데이 (200)', amount: 200, reason: 'event_open_day' },
] as const;

type Props = {
  orgs: OrganizationRecord[];
  onGranted: (message: string) => void;
  onError: (message: string) => void;
};

export default function AdminOrgEventCreditsPanel({ orgs, onGranted, onError }: Props) {
  const [orgId, setOrgId] = useState('');
  const [presetId, setPresetId] = useState<(typeof EVENT_PRESETS)[number]['id']>('member_trial');
  const [loading, setLoading] = useState(false);

  const preset = EVENT_PRESETS.find((p) => p.id === presetId) ?? EVENT_PRESETS[1];

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = orgId.trim();
    if (!id) {
      onError('기관을 선택해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await adminGrantOrgCredits(id, preset.amount, preset.reason);
      onGranted(`${preset.label} — ${preset.amount} 크레딧 지급 완료`);
    } catch (err) {
      onError(err instanceof Error ? err.message : '지급 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleGrant(e)}
      className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-6 mb-8 space-y-4"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">협회 행사 · 체험 코드 (일괄 선결제)</h2>
        <p className="mt-1 text-sm text-slate-400">
          연수·회원 체험 등 행사용으로 기관에 검사 크레딧을 한 번에 넣습니다. 담당 상담사가 기관 잔액으로
          발송합니다.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-400">기관 선택</label>
        <select
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white"
          required
        >
          <option value="">— 기관 선택 —</option>
          {orgs.map((o) => {
            const id = o.organizationId || o.id || '';
            return (
              <option key={id} value={id}>
                {o.name} (잔액 {o.creditBalance ?? 0})
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-sm text-slate-400">행사 유형</label>
        <div className="flex flex-wrap gap-2">
          {EVENT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetId(p.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                presetId === p.id
                  ? 'bg-amber-600 text-white'
                  : 'border border-white/15 text-slate-300 hover:bg-white/5'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !orgId}
        className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? '지급 중…' : `${preset.amount.toLocaleString()} 크레딧 일괄 지급`}
      </button>
    </form>
  );
}
