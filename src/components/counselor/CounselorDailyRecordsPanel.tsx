'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import { listCounselorClientPortals } from '@/lib/clientPortalApi';
import {
  listCounselorDailyRecords,
  updateCounselorDailyRecordNotes,
} from '@/lib/careAssignmentApi';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import type { CounselorDailyRecordListItem } from '@/types/counselor';

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function recordTypeLabel(type: string): string {
  switch (type) {
    case 'daily_mood':
      return '일일 기분';
    case 'weekly_check':
      return '주간 점검';
    case 'monthly_review':
      return '월간 회고';
    case 'emotion_diary':
      return '감정 일기';
    default:
      return type;
  }
}

function sourceLabel(item: CounselorDailyRecordListItem): string {
  if (item.source === 'portal_care') return '검사실 포털';
  return '마이페이지';
}

function RecordRow({
  item,
  onNotesSaved,
}: {
  item: CounselorDailyRecordListItem;
  onNotesSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(item.counselorNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const clientLabel = item.portalDisplayName || (item.portalId ? '내담자' : '회원');
  const clientHref = item.portalId
    ? `/counselor/clients/${encodeURIComponent(item.portalId)}`
    : null;

  const saveNotes = async () => {
    setSaving(true);
    setError('');
    try {
      await updateCounselorDailyRecordNotes(item.id, notes);
      setEditing(false);
      onNotesSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '메모 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {clientHref ? (
              <Link href={clientHref} className="font-semibold text-white hover:text-sky-300">
                {clientLabel}
              </Link>
            ) : (
              <span className="font-semibold text-white">{clientLabel}</span>
            )}
            <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">
              {sourceLabel(item)}
            </span>
            <span className="rounded bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">
              {recordTypeLabel(item.recordType)}
            </span>
          </div>
          {item.assignmentTitle ? (
            <p className="mt-1 text-xs text-slate-500">과제: {item.assignmentTitle}</p>
          ) : null}
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{item.content || '—'}</p>
        </div>
        <span className="shrink-0 text-xs text-slate-500">{formatDateTime(item.recordedAt)}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        {item.moodScore != null ? (
          <span>
            기분 <strong className="text-slate-200">{item.moodScore}</strong>/10
          </span>
        ) : null}
        {item.stressLevel != null ? (
          <span>
            스트레스 <strong className="text-slate-200">{item.stressLevel}</strong>/10
          </span>
        ) : null}
        {item.energyLevel != null ? (
          <span>
            에너지 <strong className="text-slate-200">{item.energyLevel}</strong>/10
          </span>
        ) : null}
      </div>

      <div className="mt-4 border-t border-white/5 pt-3">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="상담사 메모"
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            />
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void saveNotes()}
                disabled={saving}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {saving ? '저장 중…' : '메모 저장'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setNotes(item.counselorNotes || '');
                  setError('');
                }}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-400"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs text-slate-500">
              {item.counselorNotes ? (
                <>
                  <span className="text-slate-400">메모: </span>
                  {item.counselorNotes}
                </>
              ) : (
                '상담사 메모 없음'
              )}
            </p>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              {item.counselorNotes ? '메모 수정' : '메모 추가'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CounselorDailyRecordsPanel() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const [records, setRecords] = useState<CounselorDailyRecordListItem[]>([]);
  const [summary, setSummary] = useState({ portalCare: 0, mypageShared: 0 });
  const [portalFilter, setPortalFilter] = useState('');
  const [portals, setPortals] = useState<{ portalId: string; displayName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPortals = useCallback(async () => {
    try {
      const data = await listCounselorClientPortals({ status: 'active' });
      setPortals(
        (data.items || []).map((p) => ({
          portalId: p.portalId,
          displayName: p.displayName || '내담자',
        })),
      );
    } catch {
      setPortals([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCounselorDailyRecords({
        portalId: portalFilter || undefined,
        limit: 100,
      });
      setRecords(data.items || []);
      setSummary(data.summary || { portalCare: 0, mypageShared: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : '일상 기록을 불러오지 못했습니다.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [portalFilter]);

  useEffect(() => {
    if (authPending || showLoginRequired) {
      setLoading(false);
      return;
    }
    void loadPortals();
    void load();
  }, [authPending, showLoginRequired, loadPortals, load]);

  useRedirectOnLoginRequiredError(error);

  const filteredCount = useMemo(() => records.length, [records]);

  if (loading) {
    return <p className="py-12 text-center text-sm text-slate-500">일상 기록을 불러오는 중…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">
            내담자가 검사실 포털에서 작성한 일기·기록과, 마이페이지에서 공유한 일상 기록을 한곳에서
            확인합니다. 포털 기록은 치료·과제 할당(T-2-09) 시 자동으로 연동됩니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AuthLink
            href="/counselor/treatment-plans"
            className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            일기 과제 할당
          </AuthLink>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">전체 기록</p>
          <p className="mt-1 text-2xl font-semibold text-white">{filteredCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">검사실 포털</p>
          <p className="mt-1 text-2xl font-semibold text-violet-300">{summary.portalCare}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">마이페이지 공유</p>
          <p className="mt-1 text-2xl font-semibold text-sky-300">{summary.mypageShared}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={portalFilter}
          onChange={(e) => setPortalFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">전체 내담자</option>
          {portals.map((p) => (
            <option key={p.portalId} value={p.portalId}>
              {p.displayName}
            </option>
          ))}
        </select>
        <AuthLink href="/counselor/progress?view=care" className="text-sm text-violet-400 hover:text-violet-300">
          치료·과제 모니터링 →
        </AuthLink>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
          <p className="text-slate-300">표시할 일상 기록이 없습니다.</p>
          <p className="mt-2 text-sm text-slate-500">
            내담자에게 일기·기록 과제를 할당하면 포털에서 작성한 내용이 여기에 표시됩니다.
          </p>
          <AuthLink
            href="/counselor/treatment-plans"
            className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            치료 계획에서 할당하기
          </AuthLink>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((item) => (
            <RecordRow key={item.id} item={item} onNotesSaved={() => void load()} />
          ))}
        </div>
      )}
    </div>
  );
}
