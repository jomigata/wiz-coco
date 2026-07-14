'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  COUNSELOR_REGIONS,
  COUNSELOR_SPECIALIZATIONS,
  EMPTY_COUNSELOR_PROFILE,
  type CounselorProfileData,
} from '@/types/counselorProfile';
import {
  loadCounselorProfile,
  saveCounselorProfileDraft,
  validateCounselorProfile,
} from '@/lib/firestore/counselorRegistration';
import {
  getUserCounselorApplication,
  submitCounselorApplication,
  type CounselorApplicationStatus,
} from '@/lib/firestore/counselorApplicationsStore';
import { notifyAdminCounselorApplication } from '@/lib/counselorApplicationApi';
import { uploadCounselorApplicationAttachments } from '@/lib/counselorApplicationFiles';
import { isCounselor } from '@/utils/roleUtils';
import type { CounselorAttachmentItem } from '@/types/counselorApplication';
import CounselorApplicationAttachmentsField from '@/app/mypage/settings/components/CounselorApplicationAttachmentsField';

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

type Props = {
  uid: string;
  email: string;
  role?: string;
};

function statusMessage(status: CounselorApplicationStatus | null, counselor: boolean): string {
  if (counselor) return '승인된 상담사 계정입니다.';
  if (status === 'pending' || status === 'under_review') return '관리자 승인 검토 중입니다.';
  if (status === 'rejected') return '반려되었습니다. 내용을 수정해 다시 신청할 수 있습니다.';
  return '필수 항목만 입력하면 빠르게 신청할 수 있습니다.';
}

export default function CounselorApplicationForm({ uid, email, role }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<CounselorApplicationStatus | null>(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [attachmentItems, setAttachmentItems] = useState<CounselorAttachmentItem[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [profile, setProfile] = useState<CounselorProfileData>({
    ...EMPTY_COUNSELOR_PROFILE,
    email,
  });

  const counselor = isCounselor(role);
  const pending = applicationStatus === 'pending' || applicationStatus === 'under_review';
  const readOnly = pending || counselor;

  useEffect(() => {
    if (!loading && (counselor || applicationStatus === 'approved')) {
      router.replace('/counselor/');
    }
  }, [loading, counselor, applicationStatus, router]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [loaded, application] = await Promise.all([
          loadCounselorProfile(uid),
          getUserCounselorApplication(uid),
        ]);
        if (cancelled) return;
        setProfile({
          ...EMPTY_COUNSELOR_PROFILE,
          ...loaded.profile,
          email,
          reportDisplayName: loaded.profile?.reportDisplayName || loaded.profile?.name || '',
        });
        setApplicationStatus(application?.status ?? null);
        setAdminReviewNotes(application?.reviewNotes ?? '');
        setAttachmentItems(
          (application?.attachments || []).map((attachment) => ({
            source: 'saved' as const,
            attachment,
          })),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, email]);

  const toggleSpecialization = (item: string) => {
    if (readOnly) return;
    setProfile((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(item)
        ? prev.specialization.filter((s) => s !== item)
        : [...prev.specialization, item],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError('');
    setSuccess('');
    setAttachmentError('');

    const draft = {
      ...profile,
      email,
      reportDisplayName: profile.name.trim(),
    };
    const validationError = validateCounselorProfile(draft);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      const savedAttachments = attachmentItems
        .filter((item): item is Extract<CounselorAttachmentItem, { source: 'saved' }> => item.source === 'saved')
        .map((item) => item.attachment);
      const localFiles = attachmentItems
        .filter((item): item is Extract<CounselorAttachmentItem, { source: 'local' }> => item.source === 'local')
        .map((item) => item.file);
      const uploaded = localFiles.length ? await uploadCounselorApplicationAttachments(uid, localFiles) : [];
      const allAttachments = [...savedAttachments, ...uploaded];

      await saveCounselorProfileDraft(uid, email, draft);
      const applicationId = await submitCounselorApplication(uid, draft, allAttachments);
      setApplicationStatus('pending');
      setAdminReviewNotes('');
      setAttachmentItems(allAttachments.map((attachment) => ({ source: 'saved', attachment })));
      const { emailed } = await notifyAdminCounselorApplication(applicationId, draft);
      setSuccess(
        emailed
          ? '신청이 접수되었습니다. 승인 결과는 이메일로 안내됩니다.'
          : '신청이 접수되었습니다. 관리자 승인 후 상담사 메뉴를 이용할 수 있습니다.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '신청에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400 text-sm">
        불러오는 중…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-5 text-center">
        <span className="inline-block rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] font-medium tracking-wide text-sky-200">
          Professional Application
        </span>
        <h1 className="mt-3 text-2xl font-semibold text-white tracking-tight">전문가·상담사 신청</h1>
        <p className="mt-2 text-sm text-slate-400">{statusMessage(applicationStatus, counselor)}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-900/60 p-5 sm:p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
        {pending && (
          <div className="mb-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span className="font-semibold text-amber-50">승인신청중</span> — 검토가 끝날 때까지 수정할 수 없습니다.
          </div>
        )}

        {adminReviewNotes && (pending || applicationStatus === 'rejected') && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-200">
            <p className="text-xs text-slate-500 mb-1">관리자 메모</p>
            <p className="whitespace-pre-wrap">{adminReviewNotes}</p>
          </div>
        )}

        {counselor ? (
          <div className="text-center py-6 space-y-4">
            <p className="text-emerald-200 text-sm">이미 승인된 상담사입니다.</p>
            <Link
              href="/counselor/"
              className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500"
            >
              상담사 대시보드
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>이름 *</label>
                <input
                  className={inputCls}
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="실명 또는 활동명"
                  required
                  readOnly={readOnly}
                />
              </div>
              <div>
                <label className={labelCls}>로그인 이메일 *</label>
                <input className={`${inputCls} text-slate-400`} value={email} readOnly aria-readonly />
              </div>
              <div>
                <label className={labelCls}>전화번호 *</label>
                <input
                  className={inputCls}
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  required
                  readOnly={readOnly}
                />
              </div>
              <div>
                <label className={labelCls}>활동 지역 *</label>
                <select
                  className={inputCls}
                  value={profile.region}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, region: e.target.value, education: e.target.value }))
                  }
                  disabled={readOnly}
                  required
                >
                  <option value="">선택</option>
                  {COUNSELOR_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>경력 (년)</label>
                <input
                  className={inputCls}
                  type="number"
                  min={0}
                  value={profile.experience}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, experience: parseInt(e.target.value, 10) || 0 }))
                  }
                  readOnly={readOnly}
                />
              </div>
              <div>
                <label className={labelCls}>운영 형태</label>
                <select
                  className={inputCls}
                  value={profile.practiceType}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      practiceType: e.target.value as CounselorProfileData['practiceType'],
                    }))
                  }
                  disabled={readOnly}
                >
                  <option value="solo">개인</option>
                  <option value="organization">기관/회사</option>
                </select>
              </div>
            </div>

            {profile.practiceType === 'organization' && (
              <div>
                <label className={labelCls}>기관명/회사명 *</label>
                <input
                  className={inputCls}
                  value={profile.organizationName}
                  onChange={(e) => setProfile((p) => ({ ...p, organizationName: e.target.value }))}
                  placeholder="소속 기관명"
                  readOnly={readOnly}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>전문 분야 * (복수 선택)</label>
              <div className="flex flex-wrap gap-2 mt-1 max-h-28 overflow-y-auto pr-1">
                {COUNSELOR_SPECIALIZATIONS.map((item) => {
                  const active = profile.specialization.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={readOnly}
                      onClick={() => toggleSpecialization(item)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-sky-500/25 text-sky-100 border border-sky-400/40'
                          : 'bg-white/5 text-slate-400 border border-slate-200 hover:border-slate-200'
                      } ${readOnly ? 'opacity-70 cursor-default' : ''}`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <CounselorApplicationAttachmentsField
              items={attachmentItems}
              onChange={setAttachmentItems}
              disabled={saving}
              readOnly={readOnly}
              error={attachmentError}
              onError={setAttachmentError}
            />

            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                {success}
              </p>
            )}

            {!pending && (
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-50"
              >
                {saving ? '제출 중…' : applicationStatus === 'rejected' ? '다시 신청하기' : '신청하기'}
              </button>
            )}
          </form>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/mypage/settings/" className="text-blue-600 hover:text-blue-700">
          마이페이지 설정
        </Link>
        {' · '}
        <Link href="/" className="hover:text-slate-300">
          홈
        </Link>
      </p>
    </div>
  );
}
