'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  COUNSELOR_SPECIALIZATIONS,
  EMPTY_COUNSELOR_PROFILE,
  type CounselorProfileData,
} from '@/types/counselorProfile';
import {
  loadCounselorProfile,
  saveCounselorProfileDraft,
  updateCounselorProfile,
  validateCounselorProfile,
} from '@/lib/firestore/counselorRegistration';
import {
  getUserCounselorApplication,
  submitCounselorApplication,
  type CounselorApplicationStatus,
} from '@/lib/firestore/counselorApplicationsStore';
import { notifyAdminCounselorApplication } from '@/lib/counselorApplicationApi';
import { isCounselor, isAdmin } from '@/utils/roleUtils';

const fieldCls =
  'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm';
const labelCls = 'block text-blue-200 text-xs mb-1';

interface Props {
  uid: string;
  email: string;
  role?: string;
}

function statusLabel(status: CounselorApplicationStatus | null): string {
  if (status === 'pending' || status === 'under_review') return '승인 대기';
  if (status === 'approved') return '승인됨';
  if (status === 'rejected') return '반려됨';
  return '';
}

export default function CounselorSwitchPanel({ uid, email, role }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<CounselorApplicationStatus | null>(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [profile, setProfile] = useState<CounselorProfileData>({
    ...EMPTY_COUNSELOR_PROFILE,
    email,
  });

  const counselor = isCounselor(role);
  const admin = isAdmin(role);
  const pending = applicationStatus === 'pending' || applicationStatus === 'under_review';
  const rejected = applicationStatus === 'rejected';
  const readOnlyForm = pending;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loaded, application] = await Promise.all([
          loadCounselorProfile(uid),
          getUserCounselorApplication(uid),
        ]);
        if (cancelled) return;
        setProfile({
          ...EMPTY_COUNSELOR_PROFILE,
          ...loaded.profile,
          email: loaded.profile?.email || email,
        });
        setApplicationStatus(application?.status ?? null);
        setAdminReviewNotes(application?.reviewNotes ?? '');
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '상담사 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, email]);

  const toggleSpecialization = (item: string, checked: boolean) => {
    if (readOnlyForm) return;
    setProfile((prev) => ({
      ...prev,
      specialization: checked
        ? [...prev.specialization, item]
        : prev.specialization.filter((s) => s !== item),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const validationError = validateCounselorProfile(profile);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      if (counselor) {
        await updateCounselorProfile(uid, email, profile);
        setSuccess('상담사 정보가 저장되었습니다.');
      } else {
        await saveCounselorProfileDraft(uid, email, profile);
        const applicationId = await submitCounselorApplication(uid, profile);
        setApplicationStatus('pending');
        const { emailed } = await notifyAdminCounselorApplication(applicationId, profile);
        setSuccess(
          emailed
            ? '상담사 전환 승인을 요청했습니다. 관리자 검토 후 이메일로 안내됩니다.'
            : '상담사 전환 승인을 요청했습니다. 관리자 승인 후 상담사 메뉴를 이용할 수 있습니다.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-4 border-t border-white/10">
        <p className="text-blue-300 text-sm">상담사 정보를 불러오는 중...</p>
      </div>
    );
  }

  const subtitle = counselor
    ? '상담사 기본 정보를 관리합니다.'
    : pending
      ? '관리자 승인을 기다리는 중입니다.'
      : rejected
        ? '신청이 반려되었습니다. 내용을 수정해 다시 요청할 수 있습니다.'
        : '승인 후 상담사 메뉴·내담자 연결 기능을 사용할 수 있습니다.';

  return (
    <div className="pt-4 border-t border-white/10">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left group"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="text-white font-medium group-hover:text-emerald-200 transition-colors">
            상담사 계정
          </p>
          {!expanded && (
            <p className="text-blue-300 text-sm mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {counselor && (
            <span className="px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-300">
              {admin ? '관리자' : '상담사'}
            </span>
          )}
          {!counselor && pending && (
            <span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-200">
              {statusLabel(applicationStatus)}
            </span>
          )}
          {!counselor && rejected && (
            <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">반려됨</span>
          )}
          <svg
            className={`w-5 h-5 text-blue-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          <p className="text-blue-300 text-sm">{subtitle}</p>

          {adminReviewNotes && !counselor && (pending || rejected || applicationStatus === 'approved') && (
            <div
              className={`rounded-lg p-3 border text-sm ${
                rejected
                  ? 'bg-red-500/10 border-red-500/25 text-red-100'
                  : pending
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-100'
              }`}
            >
              <p className="text-xs font-medium mb-1 opacity-80">관리자 안내</p>
              <p className="whitespace-pre-wrap">{adminReviewNotes}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>이름 *</label>
                <input
                  className={fieldCls}
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="실명 또는 활동명"
                  required
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelCls}>리포트 표기명</label>
                <input
                  className={fieldCls}
                  value={profile.reportDisplayName}
                  onChange={(e) => setProfile((p) => ({ ...p, reportDisplayName: e.target.value }))}
                  placeholder="검사 리포트에 표시될 이름"
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelCls}>이메일</label>
                <input className={fieldCls} value={profile.email || email} readOnly />
              </div>
              <div>
                <label className={labelCls}>전화번호 *</label>
                <input
                  className={fieldCls}
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="010-0000-0000"
                  required
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelCls}>경력 (년)</label>
                <input
                  className={fieldCls}
                  type="number"
                  min={0}
                  value={profile.experience}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, experience: parseInt(e.target.value, 10) || 0 }))
                  }
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelCls}>자격증 번호</label>
                <input
                  className={fieldCls}
                  value={profile.license}
                  onChange={(e) => setProfile((p) => ({ ...p, license: e.target.value }))}
                  placeholder="상담 관련 자격증 (선택)"
                  readOnly={readOnlyForm}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>운영 형태</label>
              <select
                className={fieldCls}
                value={profile.practiceType}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    practiceType: e.target.value as CounselorProfileData['practiceType'],
                  }))
                }
                disabled={readOnlyForm}
              >
                <option value="solo">개인 운영</option>
                <option value="organization">조직/기관 운영</option>
              </select>
            </div>

            {profile.practiceType === 'organization' && (
              <div>
                <label className={labelCls}>조직/기관명 *</label>
                <input
                  className={fieldCls}
                  value={profile.organizationName}
                  onChange={(e) => setProfile((p) => ({ ...p, organizationName: e.target.value }))}
                  placeholder="소속 기관 또는 센터명"
                  readOnly={readOnlyForm}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>학력</label>
              <input
                className={fieldCls}
                value={profile.education}
                onChange={(e) => setProfile((p) => ({ ...p, education: e.target.value }))}
                placeholder="예: OO대학교 상담심리학 석사"
                readOnly={readOnlyForm}
              />
            </div>

            <div>
              <label className={labelCls}>전문 분야 * (복수 선택)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {COUNSELOR_SPECIALIZATIONS.map((item) => (
                  <label
                    key={item}
                    className={`flex items-center gap-2 text-sm text-blue-100 ${readOnlyForm ? 'opacity-70' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.specialization.includes(item)}
                      onChange={(e) => toggleSpecialization(item, e.target.checked)}
                      disabled={readOnlyForm}
                      className="rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>소개</label>
              <textarea
                className={`${fieldCls} min-h-[88px] resize-y`}
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="상담 경험, 상담 철학 등을 간단히 작성해주세요."
                readOnly={readOnlyForm}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              {counselor ? (
                <>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white text-sm font-medium transition-colors"
                  >
                    {saving ? '저장 중...' : '상담사 정보 저장'}
                  </button>
                  <Link
                    href="/counselor"
                    className="px-5 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                  >
                    상담사 대시보드
                  </Link>
                </>
              ) : pending ? (
                <p className="text-sm text-amber-200/90">
                  승인 완료 전까지 신청 내용 수정·재제출은 불가합니다.
                </p>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white text-sm font-medium transition-colors"
                >
                  {saving ? '요청 중...' : rejected ? '다시 승인 요청' : '상담사 전환 승인 요청'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
