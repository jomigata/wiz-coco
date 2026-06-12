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
  switchToCounselor,
  updateCounselorProfile,
} from '@/lib/firestore/counselorRegistration';
import { isCounselor, isAdmin } from '@/utils/roleUtils';

const fieldCls =
  'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm';
const labelCls = 'block text-blue-200 text-xs mb-1';

interface Props {
  uid: string;
  email: string;
  role?: string;
}

export default function CounselorSwitchPanel({ uid, email, role }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<CounselorProfileData>({
    ...EMPTY_COUNSELOR_PROFILE,
    email,
  });

  const counselor = isCounselor(role);
  const admin = isAdmin(role);
  const [becameCounselor, setBecameCounselor] = useState(false);
  const counselorActive = counselor || becameCounselor;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadCounselorProfile(uid);
        if (cancelled) return;
        setProfile({
          ...EMPTY_COUNSELOR_PROFILE,
          ...loaded.profile,
          email: loaded.profile?.email || email,
        });
        if (counselorActive) setExpanded(true);
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
  }, [uid, email, counselorActive]);

  const toggleSpecialization = (item: string, checked: boolean) => {
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

    try {
      if (counselorActive) {
        await updateCounselorProfile(uid, email, profile);
        setSuccess('상담사 정보가 저장되었습니다.');
      } else {
        await switchToCounselor(uid, email, profile);
        setBecameCounselor(true);
        setSuccess('상담사로 전환되었습니다. 상담사 메뉴를 이용할 수 있습니다.');
        setExpanded(true);
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

  return (
    <div className="pt-4 border-t border-white/10 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-medium">상담사 계정</p>
          <p className="text-blue-300 text-sm mt-1">
            {counselorActive
              ? '상담사 기본 정보를 관리합니다.'
              : '상담사로 전환하고 내담자 연결·검사 관리 기능을 사용할 수 있습니다.'}
          </p>
        </div>
        {counselorActive && (
          <span className="shrink-0 px-2 py-1 rounded text-xs bg-emerald-500/20 text-emerald-300">
            {admin ? '관리자' : '상담사'}
          </span>
        )}
      </div>

      {!counselorActive && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/30 transition-colors text-sm font-medium"
        >
          <span>{expanded ? '상담사 전환 폼 닫기' : '상담사로 전환하기'}</span>
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {(counselorActive || expanded) && (
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
              />
            </div>
            <div>
              <label className={labelCls}>리포트 표기명</label>
              <input
                className={fieldCls}
                value={profile.reportDisplayName}
                onChange={(e) => setProfile((p) => ({ ...p, reportDisplayName: e.target.value }))}
                placeholder="검사 리포트에 표시될 이름"
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
              />
            </div>
            <div>
              <label className={labelCls}>자격증 번호</label>
              <input
                className={fieldCls}
                value={profile.license}
                onChange={(e) => setProfile((p) => ({ ...p, license: e.target.value }))}
                placeholder="상담 관련 자격증 (선택)"
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
            />
          </div>

          <div>
            <label className={labelCls}>전문 분야 * (복수 선택)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {COUNSELOR_SPECIALIZATIONS.map((item) => (
                <label
                  key={item}
                  className="flex items-center gap-2 text-sm text-blue-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={profile.specialization.includes(item)}
                    onChange={(e) => toggleSpecialization(item, e.target.checked)}
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
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white text-sm font-medium transition-colors"
            >
              {saving ? '저장 중...' : counselorActive ? '상담사 정보 저장' : '상담사로 전환'}
            </button>
            {counselorActive && (
              <Link
                href="/counselor"
                className="px-5 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                상담사 대시보드
              </Link>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
