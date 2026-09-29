'use client';

import React, { useEffect, useState } from 'react';
import { LoadingMessage } from '@/components/ui/LoadingMessage';
import Link from 'next/link';
import {
  COUNSELOR_REGIONS,
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
import { uploadCounselorApplicationAttachments } from '@/lib/counselorApplicationFiles';
import { markCounselorResultSeen, shouldNotifyCounselorResult } from '@/utils/counselorApplicationNotification';
import { isCounselor, isAdmin } from '@/utils/roleUtils';
import type { CounselorAttachmentItem } from '@/types/counselorApplication';
import CounselorApplicationAttachmentsField from '@/app/mypage/settings/components/CounselorApplicationAttachmentsField';
import {
  careerStartYearOptions,
  formatCareerYearsLabel,
} from '@/lib/counselorCareerYear';
import { formatPhoneDisplay, formatPhoneDisplayOr, formatPhoneWhileTyping } from '@/lib/phoneFormat';
import { MypageAccountFieldDisplay, mypageFieldEditProps } from '@/components/mypage/MypageAccountField';

const { labelClassName: labelEditCls, fieldClassName: fieldEditCls } = mypageFieldEditProps();

export const MYPAGE_COUNSELOR_ACCOUNT_FORM_ID = 'mypage-counselor-account-form';

interface Props {
  uid: string;
  email: string;
  role?: string;
  /** 마이페이지 프리미엄 블록 안에 넣을 때 */
  embedded?: boolean;
  /** embedded + 승인된 상담사: 헤더 수정 버튼과 연동 */
  mypageEditing?: boolean;
  formId?: string;
  onSaved?: () => void;
}

function statusLabel(status: CounselorApplicationStatus | null): string {
  if (status === 'pending' || status === 'under_review') return '승인 대기';
  if (status === 'approved') return '승인됨';
  if (status === 'rejected') return '반려됨';
  return '';
}

function StatusBadge({
  label,
  toneClass,
  showNotify,
}: {
  label: string;
  toneClass: string;
  showNotify: boolean;
}) {
  return (
    <span className={`relative inline-flex px-2 py-1 rounded text-xs ${toneClass}`}>
      {label}
      {showNotify && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none ring-2 ring-indigo-950/80"
          aria-label="미확인 결과 1건"
        >
          1
        </span>
      )}
    </span>
  );
}

export default function CounselorSwitchPanel({
  uid,
  email,
  role,
  embedded = false,
  mypageEditing = false,
  formId,
  onSaved,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [reviewedAt, setReviewedAt] = useState('');
  const [applicationStatus, setApplicationStatus] = useState<CounselorApplicationStatus | null>(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [unreadResult, setUnreadResult] = useState(false);
  const [attachmentItems, setAttachmentItems] = useState<CounselorAttachmentItem[]>([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [profile, setProfile] = useState<CounselorProfileData>({
    ...EMPTY_COUNSELOR_PROFILE,
    email,
  });

  const counselor = isCounselor(role);
  const admin = isAdmin(role);
  const pending = applicationStatus === 'pending' || applicationStatus === 'under_review';
  const rejected = applicationStatus === 'rejected';
  const hasResult = applicationStatus === 'approved' || rejected;
  const readOnlyForm = pending;

  const markResultSeen = () => {
    if (applicationId && reviewedAt && hasResult) {
      markCounselorResultSeen(applicationId, reviewedAt);
      setUnreadResult(false);
    }
  };

  const refreshUnread = () => {
    if (!applicationId || !reviewedAt || !hasResult) {
      setUnreadResult(false);
      return;
    }
    setUnreadResult(shouldNotifyCounselorResult(applicationStatus, reviewedAt, applicationId));
  };

  useEffect(() => {
    if (embedded) setExpanded(true);
  }, [embedded]);

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
          phone: loaded.profile?.phone
            ? formatPhoneDisplay(loaded.profile.phone) || loaded.profile.phone
            : '',
        });
        setApplicationStatus(application?.status ?? null);
        setAdminReviewNotes(application?.reviewNotes ?? '');
        setApplicationId(application?.id ?? '');
        setReviewedAt(application?.reviewedAt ?? '');
        setAttachmentItems(
          (application?.attachments || []).map((attachment) => ({
            source: 'saved' as const,
            attachment,
          })),
        );
        const status = application?.status ?? null;
        const appId = application?.id ?? '';
        const reviewed = application?.reviewedAt ?? '';
        const isResult = status === 'approved' || status === 'rejected';
        setUnreadResult(
          isResult && appId && reviewed
            ? shouldNotifyCounselorResult(status, reviewed, appId)
            : false,
        );
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

  useEffect(() => {
    refreshUnread();
  }, [applicationId, reviewedAt, applicationStatus, hasResult]);

  useEffect(() => {
    const onSeen = () => refreshUnread();
    window.addEventListener('wizcoco:counselor-result-seen', onSeen);
    return () => window.removeEventListener('wizcoco:counselor-result-seen', onSeen);
  }, [applicationId, reviewedAt, applicationStatus, hasResult]);

  useEffect(() => {
    if (expanded) markResultSeen();
  }, [expanded, applicationId, reviewedAt, hasResult]);

  const toggleSpecialization = (item: string, checked: boolean) => {
    if (readOnlyForm) return;
    setProfile((prev) => ({
      ...prev,
      specialization: checked
        ? [...prev.specialization, item]
        : prev.specialization.filter((s) => s !== item),
    }));
  };

  const handleToggleExpanded = () => {
    setExpanded((v) => {
      const next = !v;
      if (next) markResultSeen();
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setAttachmentError('');

    const validationError = validateCounselorProfile(profile);
    if (validationError) {
      setError(validationError);
      setSaving(false);
      return;
    }

    try {
      if (counselor) {
        await updateCounselorProfile(uid, email, profile);
        setSuccess('저장되었습니다.');
        onSaved?.();
      } else {
        const savedAttachments = attachmentItems
          .filter((item): item is Extract<CounselorAttachmentItem, { source: 'saved' }> => item.source === 'saved')
          .map((item) => item.attachment);
        const localFiles = attachmentItems
          .filter((item): item is Extract<CounselorAttachmentItem, { source: 'local' }> => item.source === 'local')
          .map((item) => item.file);

        const uploaded = localFiles.length
          ? await uploadCounselorApplicationAttachments(uid, localFiles)
          : [];
        const allAttachments = [...savedAttachments, ...uploaded];

        await saveCounselorProfileDraft(uid, email, profile);
        const newApplicationId = await submitCounselorApplication(uid, profile, allAttachments);
        setApplicationId(newApplicationId);
        setReviewedAt('');
        setApplicationStatus('pending');
        setAdminReviewNotes('');
        setAttachmentItems(allAttachments.map((attachment) => ({ source: 'saved', attachment })));
        const { emailed } = await notifyAdminCounselorApplication(newApplicationId, profile);
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
      <div className={embedded ? '' : 'pt-4 border-t border-white/10'}>
        <LoadingMessage layout="inline" message="상담사 정보를 로딩중…" textClassName="text-blue-300 text-sm" />
      </div>
    );
  }

  const subtitle = counselor
    ? '상담사 기본 정보를 관리합니다.'
    : pending
      ? '관리자 승인을 기다리는 중입니다.'
      : rejected
        ? '신청이 반려되었습니다. 내용을 수정해 다시 요청할 수 있습니다.'
        : applicationStatus === 'approved'
          ? '상담사 전환이 승인되었습니다.'
          : '승인 후 상담사 메뉴·내담자 연결 기능을 사용할 수 있습니다.';

  const showEmbeddedSummary = embedded && counselor && !mypageEditing;
  const showFormBody = embedded ? (counselor ? mypageEditing : true) : expanded;
  const hideAttachments = embedded;
  const hideCounselorFooter = embedded && counselor;

  const embeddedSummary = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MypageAccountFieldDisplay label="이름" value={profile.name || '—'} />
        <MypageAccountFieldDisplay label="리포트 표기명" value={profile.reportDisplayName || profile.name || '—'} />
        <MypageAccountFieldDisplay label="이메일" value={profile.email || email || '—'} />
        <MypageAccountFieldDisplay label="핸드폰" value={formatPhoneDisplayOr(profile.phone, '—')} />
        <MypageAccountFieldDisplay
          label="경력"
          value={profile.careerStartYear ? formatCareerYearsLabel(profile.careerStartYear) : '미등록'}
        />
        <MypageAccountFieldDisplay
          label="운영 형태"
          selectLike
          value={profile.practiceType === 'organization' ? '조직/기관 운영' : '개인 운영'}
        />
        <MypageAccountFieldDisplay label="지역" selectLike value={profile.region || '—'} />
        <MypageAccountFieldDisplay label="기관명/회사명" value={profile.organizationName || '—'} />
      </div>
      <MypageAccountFieldDisplay
        label="전문 분야"
        value={profile.specialization.length ? profile.specialization.join(', ') : '—'}
      />
      <MypageAccountFieldDisplay label="소개" multiline value={profile.bio?.trim() || '—'} />
    </div>
  );

  return (
    <div className={embedded ? '' : 'pt-4 border-t border-white/10'}>
      {!embedded ? (
      <button
        type="button"
        onClick={handleToggleExpanded}
        className="w-full flex items-center justify-between gap-3 text-left group"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="text-white font-medium group-hover:text-emerald-200 transition-colors">
            상담사 계정
          </p>
          {!expanded && (
            <>
              <p className="text-blue-300 text-sm mt-0.5 truncate">{subtitle}</p>
              {adminReviewNotes && !counselor && hasResult && (
                <p className="text-xs text-amber-200/90 mt-1 line-clamp-2">
                  관리자 메모: {adminReviewNotes}
                </p>
              )}
            </>
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
            <StatusBadge label="반려됨" toneClass="bg-red-500/20 text-red-300" showNotify={unreadResult} />
          )}
          {!counselor && applicationStatus === 'approved' && (
            <StatusBadge label="승인됨" toneClass="bg-emerald-500/20 text-emerald-300" showNotify={unreadResult} />
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
      ) : (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {counselor && (
            <span className="rounded-md border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
              {admin ? '관리자' : '상담사'}
            </span>
          )}
          {!counselor && pending && (
            <span className="rounded-md border border-amber-400/25 bg-amber-500/15 px-2 py-0.5 text-xs text-amber-100">
              {statusLabel(applicationStatus)}
            </span>
          )}
          {!counselor && rejected && (
            <StatusBadge label="반려됨" toneClass="bg-red-500/20 text-red-300" showNotify={unreadResult} />
          )}
          {!counselor && applicationStatus === 'approved' && (
            <StatusBadge label="승인됨" toneClass="bg-emerald-500/20 text-emerald-300" showNotify={unreadResult} />
          )}
          <p className="w-full text-xs leading-relaxed text-slate-400">{subtitle}</p>
        </div>
      )}

      {(embedded || expanded) && (
        <div className={embedded ? 'space-y-4' : 'mt-4 space-y-4'}>
          {!embedded ? <p className="text-blue-300 text-sm">{subtitle}</p> : null}

          {showEmbeddedSummary ? embeddedSummary : null}

          {showFormBody ? (
          <>
          {adminReviewNotes && !counselor && (pending || hasResult) && (
            <div
              className={`rounded-lg p-3 border text-sm ${
                rejected
                  ? 'bg-red-500/10 border-red-500/25 text-red-100'
                  : pending
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-100'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-100'
              }`}
            >
              <p className="text-xs font-medium mb-1 opacity-80">관리자 메모</p>
              <p className="whitespace-pre-wrap">{adminReviewNotes}</p>
            </div>
          )}

          <form
            id={formId}
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl bg-black/95 p-4 sm:p-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelEditCls}>이름 *</label>
                <input
                  className={fieldEditCls}
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  placeholder="실명 또는 활동명"
                  required
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelEditCls}>리포트 표기명</label>
                <input
                  className={fieldEditCls}
                  value={profile.reportDisplayName}
                  onChange={(e) => setProfile((p) => ({ ...p, reportDisplayName: e.target.value }))}
                  placeholder="검사 리포트에 표시될 이름"
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelEditCls}>이메일</label>
                <input className={fieldEditCls} value={profile.email || email} readOnly />
              </div>
              <div>
                <label className={labelEditCls}>핸드폰 *</label>
                <input
                  className={fieldEditCls}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, phone: formatPhoneWhileTyping(e.target.value) }))
                  }
                  placeholder="010-0000-0000"
                  required
                  readOnly={readOnlyForm}
                />
              </div>
              <div>
                <label className={labelEditCls}>경력 (년도)</label>
                <select
                  className={fieldEditCls}
                  value={profile.careerStartYear || ''}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      careerStartYear: parseInt(e.target.value, 10) || undefined,
                    }))
                  }
                  disabled={readOnlyForm}
                >
                  <option value="">시작 연도 선택</option>
                  {careerStartYearOptions().map((y) => (
                    <option key={y} value={y}>
                      {formatCareerYearsLabel(y)}
                    </option>
                  ))}
                </select>
                {profile.careerStartYear ? (
                  <p className="mt-1.5 text-[11px] text-sky-200/70">
                    {formatCareerYearsLabel(profile.careerStartYear)}
                  </p>
                ) : null}
              </div>
              <div>
                <label className={labelEditCls}>기관명/회사명</label>
                <input
                  className={fieldEditCls}
                  value={profile.organizationName}
                  onChange={(e) => setProfile((p) => ({ ...p, organizationName: e.target.value }))}
                  placeholder="소속 기관 또는 회사명 (선택)"
                  readOnly={readOnlyForm}
                />
              </div>
            </div>

            <div>
              <label className={labelEditCls}>운영 형태</label>
              <select
                className={fieldEditCls}
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

            <div>
              <label className={labelEditCls}>지역 *</label>
              <select
                className={fieldEditCls}
                value={profile.region}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, region: e.target.value, education: e.target.value }))
                }
                disabled={readOnlyForm}
                required
              >
                <option value="">지역을 선택하세요</option>
                {COUNSELOR_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelEditCls}>전문 분야 * (복수 선택)</label>
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
                      readOnly={readOnlyForm}
                      tabIndex={readOnlyForm ? -1 : 0}
                      className={`h-4 w-4 shrink-0 rounded border-white/40 bg-slate-800/90 accent-emerald-300 focus:ring-emerald-500 focus:ring-offset-0 ${
                        readOnlyForm ? 'pointer-events-none' : 'cursor-pointer'
                      }`}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={labelEditCls}>소개</label>
              <textarea
                className={`${fieldEditCls} min-h-[88px] resize-y`}
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="상담 경험, 상담 철학 등을 간단히 작성해주세요."
                readOnly={readOnlyForm}
              />
            </div>

            {!hideAttachments ? (
            <CounselorApplicationAttachmentsField
              items={attachmentItems}
              onChange={setAttachmentItems}
              disabled={saving}
              readOnly={readOnlyForm || counselor}
              namesOnly={counselor}
              error={attachmentError}
              onError={setAttachmentError}
            />
            ) : null}

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

            {!hideCounselorFooter ? (
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
            ) : hideCounselorFooter && counselor && mypageEditing ? (
              <div className="flex justify-end border-t border-white/10 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
                >
                  {saving ? '저장 중…' : '저장'}
                </button>
              </div>
            ) : null}
          </form>
          </>
          ) : null}
        </div>
      )}
    </div>
  );
}
