'use client';

import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { isCounselor } from '@/utils/roleUtils';
import { FaUser, FaHeart, FaBuilding, FaComment, FaKey } from 'react-icons/fa';

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt: string;
  lastLoginAt?: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  organizationName?: string;
  organizationManager?: string;
  organizationTel?: string;
  organizationMobile?: string;
  organizationFax?: string;
  organizationEmail?: string;
  organizationAddress?: string;
  reportDisplayName?: string;
  practiceType?: 'solo' | 'organization';
  teamSharingEnabled?: boolean;
  specialties?: string;
  clientFocus?: string;
  reportSignature?: string;
  shareOrganizationInReport?: boolean;
  shareContactInReport?: boolean;
}

interface Props {
  user: UserData;
  firebaseUserRole?: string;
  onUpdate: () => void;
}

type EditBlock = 'profile' | 'personal' | 'org' | 'report' | null;

// ─── 로컬 헬퍼 ──────────────────────────────────────────────────────────────
const OCCUPATION_OPTIONS = [
  { value: 'student', label: '학생' },
  { value: 'office', label: '사무/관리직' },
  { value: 'education', label: '교육/연구직' },
  { value: 'healthcare', label: '의료/보건직' },
  { value: 'service_sales', label: '서비스/영업직' },
  { value: 'it', label: 'IT/개발직' },
  { value: 'creative', label: '예술/디자인/콘텐츠' },
  { value: 'public', label: '공공/군경/공무' },
  { value: 'self_employed', label: '자영업/프리랜서' },
  { value: 'job_seeking', label: '구직/휴직/기타' },
];

const OCCUPATION_LABEL: Record<string, string> = Object.fromEntries(
  OCCUPATION_OPTIONS.map((o) => [o.value, o.label]),
);

function roleLabel(role?: string) {
  if (role === 'admin') return '관리자';
  if (role === 'counselor') return '상담사';
  return '일반 회원';
}
function practiceLabel(v?: string) {
  if (v === 'organization') return '조직/기업 운영';
  if (v === 'solo') return '개인 운영';
  return v || '-';
}
function boolLabel(v?: boolean, t = '예', f = '아니오') {
  return v ? t : f;
}
function genderLabel(v?: string) {
  if (v === 'male') return '남성';
  if (v === 'female') return '여성';
  if (v === 'other') return '기타';
  return '정보 없음';
}
function multilineText(v?: string, fallback = '정보 없음') {
  return (v || '').trim() || fallback;
}

// ─── 공통 스타일 ────────────────────────────────────────────────────────────
const fieldCls = 'w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-blue-100 placeholder-blue-300/40 focus:outline-none focus:border-purple-400/60 focus:bg-white/15 transition-colors text-sm';
const labelCls = 'block text-blue-200 text-xs mb-1';
const rowCls = 'flex justify-between gap-4 items-baseline';
const keySpan = 'text-blue-200 shrink-0 text-sm';
const valSpan = 'text-blue-100 text-right break-all text-sm';

// ─── 저장 함수 ───────────────────────────────────────────────────────────────
async function saveToFirestore(data: Record<string, unknown>) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인이 필요합니다.');
  await currentUser.getIdToken(true);
  await setDoc(
    doc(db, 'users', currentUser.uid),
    { ...data, updatedAt: serverTimestamp(), uid: currentUser.uid, lastModified: new Date().toISOString() },
    { merge: true },
  );
  if ('displayName' in data && typeof data.displayName === 'string' && data.displayName !== currentUser.displayName) {
    await updateProfile(currentUser, { displayName: data.displayName });
  }
}

// ─── 블록 헤더 ───────────────────────────────────────────────────────────────
function BlockHeader({
  icon,
  title,
  editing,
  saving,
  locked,
  onEdit,
  onSave,
  onCancel,
}: {
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  saving: boolean;
  locked: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-base font-semibold text-blue-100 flex items-center gap-2">
        <span className="text-purple-400">{icon}</span>
        {title}
      </h3>
      {editing ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-300 bg-white/5 border border-white/15 hover:bg-white/10 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 transition-all shadow-md"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          disabled={locked}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
        >
          수정
        </button>
      )}
    </div>
  );
}

// ─── 상태/에러 메시지 ────────────────────────────────────────────────────────
function BlockMessage({ error, success }: { error: string; success: string }) {
  if (error)
    return (
      <p className="mt-3 text-xs text-red-300 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
        {error}
      </p>
    );
  if (success)
    return (
      <p className="mt-3 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-500/30 rounded-lg px-3 py-2">
        {success}
      </p>
    );
  return null;
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function InlineProfileBlocks({ user, firebaseUserRole, onUpdate }: Props) {
  const [editingBlock, setEditingBlock] = useState<EditBlock>(null);
  const [saving, setSaving] = useState(false);
  const [blockError, setBlockError] = useState('');
  const [blockSuccess, setBlockSuccess] = useState('');

  // 프로필 요약 폼
  const [profileForm, setProfileForm] = useState({
    reportDisplayName: '',
    practiceType: 'solo' as 'solo' | 'organization',
    teamSharingEnabled: false,
    shareContactInReport: true,
  });

  // 개인 기본 정보 폼
  const [personalForm, setPersonalForm] = useState({
    displayName: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    occupation: '',
  });

  // 상담/운영 정보 폼
  const [orgForm, setOrgForm] = useState({
    practiceType: 'solo' as 'solo' | 'organization',
    organizationName: '',
    organizationManager: '',
    organizationTel: '',
    organizationMobile: '',
    organizationFax: '',
    organizationEmail: '',
    organizationAddress: '',
  });

  // 리포트/공유 설정 폼
  const [reportForm, setReportForm] = useState({
    reportDisplayName: '',
    specialties: '',
    clientFocus: '',
    shareOrganizationInReport: true,
    shareContactInReport: true,
    reportSignature: '',
  });

  const role = firebaseUserRole || user.role;
  const counselor = isCounselor(role);

  const startEdit = (block: EditBlock) => {
    setBlockError('');
    setBlockSuccess('');
    if (block === 'profile') {
      setProfileForm({
        reportDisplayName: user.reportDisplayName || user.name || '',
        practiceType: user.practiceType || 'solo',
        teamSharingEnabled: user.teamSharingEnabled ?? false,
        shareContactInReport: user.shareContactInReport ?? true,
      });
    } else if (block === 'personal') {
      setPersonalForm({
        displayName: user.name || '',
        phoneNumber: user.phoneNumber || '',
        birthDate: user.birthDate || '',
        gender: user.gender || '',
        occupation: user.occupation || '',
      });
    } else if (block === 'org') {
      setOrgForm({
        practiceType: user.practiceType || 'solo',
        organizationName: user.organizationName || '',
        organizationManager: user.organizationManager || '',
        organizationTel: user.organizationTel || '',
        organizationMobile: user.organizationMobile || '',
        organizationFax: user.organizationFax || '',
        organizationEmail: user.organizationEmail || '',
        organizationAddress: user.organizationAddress || '',
      });
    } else if (block === 'report') {
      setReportForm({
        reportDisplayName: user.reportDisplayName || user.name || '',
        specialties: user.specialties || '',
        clientFocus: user.clientFocus || '',
        shareOrganizationInReport: user.shareOrganizationInReport ?? true,
        shareContactInReport: user.shareContactInReport ?? true,
        reportSignature: user.reportSignature || '',
      });
    }
    setEditingBlock(block);
  };

  const cancelEdit = () => {
    setEditingBlock(null);
    setBlockError('');
    setBlockSuccess('');
  };

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true);
    setBlockError('');
    setBlockSuccess('');
    try {
      await saveToFirestore(data);
      setBlockSuccess('저장되었습니다.');
      setEditingBlock(null);
      setTimeout(() => {
        setBlockSuccess('');
        onUpdate();
      }, 800);
    } catch (e) {
      setBlockError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const locked = editingBlock !== null;

  // ─── 프로필 요약 블록 ──────────────────────────────────────────────────────
  const profileBlock = (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <BlockHeader
        icon={<FaUser className="w-4 h-4" />}
        title="프로필 요약"
        editing={editingBlock === 'profile'}
        saving={saving}
        locked={locked && editingBlock !== 'profile'}
        onEdit={() => startEdit('profile')}
        onSave={() =>
          handleSave({
            reportDisplayName: profileForm.reportDisplayName.trim(),
            practiceType: profileForm.practiceType,
            teamSharingEnabled: profileForm.teamSharingEnabled,
            shareContactInReport: profileForm.shareContactInReport,
          })
        }
        onCancel={cancelEdit}
      />
      {editingBlock === 'profile' ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>리포트 표기명</label>
            <input
              className={fieldCls}
              value={profileForm.reportDisplayName}
              onChange={(e) => setProfileForm((p) => ({ ...p, reportDisplayName: e.target.value }))}
              placeholder="리포트에 표시될 이름"
            />
          </div>
          {counselor && (
            <>
              <div>
                <label className={labelCls}>운영 형태</label>
                <select
                  className={fieldCls}
                  value={profileForm.practiceType}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, practiceType: e.target.value as 'solo' | 'organization' }))
                  }
                >
                  <option value="solo">개인 운영</option>
                  <option value="organization">조직/기업 운영</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className={labelCls + ' mb-0'}>팀 정보 공유</span>
                <ToggleSwitch
                  checked={profileForm.teamSharingEnabled}
                  onChange={(v) => setProfileForm((p) => ({ ...p, teamSharingEnabled: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className={labelCls + ' mb-0'}>리포트 연락처 노출</span>
                <ToggleSwitch
                  checked={profileForm.shareContactInReport}
                  onChange={(v) => setProfileForm((p) => ({ ...p, shareContactInReport: v }))}
                />
              </div>
            </>
          )}
          <BlockMessage error={blockError} success={blockSuccess} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className={rowCls}>
            <span className={keySpan}>회원 유형</span>
            <span className={valSpan}>{roleLabel(user.role)}</span>
          </div>
          <div className={rowCls}>
            <span className={keySpan}>리포트 표기명</span>
            <span className={valSpan}>{user.reportDisplayName || user.name || '정보 없음'}</span>
          </div>
          <div className={rowCls}>
            <span className={keySpan}>운영 형태</span>
            <span className={valSpan}>
              {counselor ? practiceLabel(user.practiceType) : '개인 이용자'}
            </span>
          </div>
          <div className={rowCls}>
            <span className={keySpan}>팀 정보 공유</span>
            <span className={valSpan}>
              {counselor ? boolLabel(user.teamSharingEnabled, '공유 가능', '개별 운영') : '해당 없음'}
            </span>
          </div>
          <div className={rowCls}>
            <span className={keySpan}>리포트 연락처 노출</span>
            <span className={valSpan}>
              {counselor ? boolLabel(user.shareContactInReport, '노출', '비노출') : '기본'}
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // ─── 개인 기본 정보 블록 ───────────────────────────────────────────────────
  const personalBlock = (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <BlockHeader
        icon={<FaHeart className="w-4 h-4" />}
        title="개인 기본 정보"
        editing={editingBlock === 'personal'}
        saving={saving}
        locked={locked && editingBlock !== 'personal'}
        onEdit={() => startEdit('personal')}
        onSave={() =>
          handleSave({
            displayName: personalForm.displayName.trim(),
            name: personalForm.displayName.trim(),
            phoneNumber: personalForm.phoneNumber.trim(),
            birthDate: personalForm.birthDate,
            gender: personalForm.gender,
            occupation: personalForm.occupation,
          })
        }
        onCancel={cancelEdit}
      />
      {editingBlock === 'personal' ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>이름</label>
            <input
              className={fieldCls}
              value={personalForm.displayName}
              onChange={(e) => setPersonalForm((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="이름"
            />
          </div>
          <div>
            <label className={labelCls}>전화번호</label>
            <input
              className={fieldCls}
              value={personalForm.phoneNumber}
              onChange={(e) => setPersonalForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className={labelCls}>생년월일</label>
            <input
              type="date"
              className={fieldCls + ' [color-scheme:dark]'}
              value={personalForm.birthDate}
              onChange={(e) => setPersonalForm((p) => ({ ...p, birthDate: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelCls}>성별</label>
            <select
              className={fieldCls}
              value={personalForm.gender}
              onChange={(e) => setPersonalForm((p) => ({ ...p, gender: e.target.value }))}
            >
              <option value="">선택 안 함</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>직업/배경</label>
            <select
              className={fieldCls}
              value={personalForm.occupation}
              onChange={(e) => setPersonalForm((p) => ({ ...p, occupation: e.target.value }))}
            >
              <option value="">선택 안 함</option>
              {OCCUPATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <BlockMessage error={blockError} success={blockSuccess} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className={rowCls}><span className={keySpan}>이름</span><span className={valSpan}>{user.name || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>전화번호</span><span className={valSpan}>{user.phoneNumber || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>이메일(개인)</span><span className={valSpan}>{user.email || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>생년월일</span><span className={valSpan}>{user.birthDate || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>성별</span><span className={valSpan}>{genderLabel(user.gender)}</span></div>
          <div className={rowCls}><span className={keySpan}>직업/배경</span><span className={valSpan}>{OCCUPATION_LABEL[user.occupation || ''] || user.occupation || '정보 없음'}</span></div>
        </div>
      )}
    </div>
  );

  // ─── 상담/운영 정보 블록 ───────────────────────────────────────────────────
  const orgBlock = counselor ? (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <BlockHeader
        icon={<FaBuilding className="w-4 h-4" />}
        title="상담/운영 정보"
        editing={editingBlock === 'org'}
        saving={saving}
        locked={locked && editingBlock !== 'org'}
        onEdit={() => startEdit('org')}
        onSave={() =>
          handleSave({
            practiceType: orgForm.practiceType,
            organizationName: orgForm.organizationName.trim(),
            organizationManager: orgForm.organizationManager.trim(),
            organizationTel: orgForm.organizationTel.trim(),
            organizationMobile: orgForm.organizationMobile.trim(),
            organizationFax: orgForm.organizationFax.trim(),
            organizationEmail: orgForm.organizationEmail.trim(),
            organizationAddress: orgForm.organizationAddress.trim(),
          })
        }
        onCancel={cancelEdit}
      />
      {editingBlock === 'org' ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>운영 형태</label>
            <select
              className={fieldCls}
              value={orgForm.practiceType}
              onChange={(e) => setOrgForm((p) => ({ ...p, practiceType: e.target.value as 'solo' | 'organization' }))}
            >
              <option value="solo">개인 운영</option>
              <option value="organization">조직/기업 운영</option>
            </select>
          </div>
          {[
            { key: 'organizationName', label: '회사/기관명', placeholder: '기관명을 입력하세요' },
            { key: 'organizationManager', label: '담당자', placeholder: '담당자 이름' },
            { key: 'organizationTel', label: '전화번호', placeholder: '02-0000-0000' },
            { key: 'organizationMobile', label: '핸드폰번호', placeholder: '010-0000-0000' },
            { key: 'organizationFax', label: '팩스번호', placeholder: '02-0000-0000' },
            { key: 'organizationEmail', label: '이메일', placeholder: 'email@example.com' },
            { key: 'organizationAddress', label: '주소', placeholder: '주소를 입력하세요' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input
                className={fieldCls}
                value={(orgForm as Record<string, string>)[key]}
                onChange={(e) => setOrgForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
              />
            </div>
          ))}
          <BlockMessage error={blockError} success={blockSuccess} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className={rowCls}><span className={keySpan}>운영 형태</span><span className={valSpan}>{practiceLabel(user.practiceType)}</span></div>
          <div className={rowCls}><span className={keySpan}>회사/기관명</span><span className={valSpan}>{user.organizationName?.trim() || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>담당자</span><span className={valSpan}>{user.organizationManager?.trim() || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>전화번호</span><span className={valSpan}>{user.organizationTel?.trim() || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>핸드폰번호</span><span className={valSpan}>{user.organizationMobile?.trim() || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>팩스번호</span><span className={valSpan}>{user.organizationFax?.trim() || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>이메일</span><span className={valSpan}>{user.organizationEmail?.trim() || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>주소</span><span className={valSpan}>{user.organizationAddress?.trim() || '정보 없음'}</span></div>
        </div>
      )}
    </div>
  ) : null;

  // ─── 리포트/공유 설정 블록 ────────────────────────────────────────────────
  const reportBlock = counselor ? (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <BlockHeader
        icon={<FaComment className="w-4 h-4" />}
        title="리포트/공유 설정"
        editing={editingBlock === 'report'}
        saving={saving}
        locked={locked && editingBlock !== 'report'}
        onEdit={() => startEdit('report')}
        onSave={() =>
          handleSave({
            reportDisplayName: reportForm.reportDisplayName.trim(),
            specialties: reportForm.specialties.trim(),
            clientFocus: reportForm.clientFocus.trim(),
            shareOrganizationInReport: reportForm.shareOrganizationInReport,
            shareContactInReport: reportForm.shareContactInReport,
            reportSignature: reportForm.reportSignature.trim(),
          })
        }
        onCancel={cancelEdit}
      />
      {editingBlock === 'report' ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>리포트 표기명</label>
            <input
              className={fieldCls}
              value={reportForm.reportDisplayName}
              onChange={(e) => setReportForm((p) => ({ ...p, reportDisplayName: e.target.value }))}
              placeholder="리포트에 표시될 이름"
            />
          </div>
          <div>
            <label className={labelCls}>전문 영역</label>
            <textarea
              className={fieldCls + ' resize-none'}
              rows={2}
              value={reportForm.specialties}
              onChange={(e) => setReportForm((p) => ({ ...p, specialties: e.target.value }))}
              placeholder="전문 영역을 입력하세요"
            />
          </div>
          <div>
            <label className={labelCls}>주요 대상/활용</label>
            <textarea
              className={fieldCls + ' resize-none'}
              rows={2}
              value={reportForm.clientFocus}
              onChange={(e) => setReportForm((p) => ({ ...p, clientFocus: e.target.value }))}
              placeholder="주요 대상 및 활용 분야"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={labelCls + ' mb-0'}>기관 정보 리포트 노출</span>
            <ToggleSwitch
              checked={reportForm.shareOrganizationInReport}
              onChange={(v) => setReportForm((p) => ({ ...p, shareOrganizationInReport: v }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className={labelCls + ' mb-0'}>연락처 리포트 노출</span>
            <ToggleSwitch
              checked={reportForm.shareContactInReport}
              onChange={(v) => setReportForm((p) => ({ ...p, shareContactInReport: v }))}
            />
          </div>
          <div>
            <label className={labelCls}>리포트 서명</label>
            <textarea
              className={fieldCls + ' resize-none'}
              rows={3}
              value={reportForm.reportSignature}
              onChange={(e) => setReportForm((p) => ({ ...p, reportSignature: e.target.value }))}
              placeholder="리포트 하단에 표시될 서명 문구"
            />
          </div>
          <BlockMessage error={blockError} success={blockSuccess} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className={rowCls}><span className={keySpan}>리포트 표기명</span><span className={valSpan}>{user.reportDisplayName?.trim() || user.name || '정보 없음'}</span></div>
          <div className={rowCls}><span className={keySpan}>전문 영역</span><span className={valSpan}>{multilineText(user.specialties)}</span></div>
          <div className={rowCls}><span className={keySpan}>주요 대상/활용</span><span className={valSpan}>{multilineText(user.clientFocus)}</span></div>
          <div className={rowCls}><span className={keySpan}>기관 정보 리포트 노출</span><span className={valSpan}>{boolLabel(user.shareOrganizationInReport, '노출', '비노출')}</span></div>
          <div className={rowCls}><span className={keySpan}>연락처 리포트 노출</span><span className={valSpan}>{boolLabel(user.shareContactInReport, '노출', '비노출')}</span></div>
          <div className="pt-2 border-t border-white/10">
            <div className="text-blue-200 text-xs mb-1.5">리포트 서명</div>
            <div className="text-blue-100 text-sm whitespace-pre-wrap leading-relaxed">
              {multilineText(user.reportSignature, '설정된 서명이 없습니다.')}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* 계정 정보 (읽기 전용) */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-base font-semibold text-blue-100 flex items-center gap-2 mb-4">
          <FaKey className="w-4 h-4 text-purple-400" />
          계정 정보
        </h3>
        <div className="space-y-3">
          <div className={rowCls}><span className={keySpan}>이메일</span><span className={valSpan}>{user.email || '정보 없음'}</span></div>
          <div className={rowCls}>
            <span className={keySpan}>가입일</span>
            <span className={valSpan}>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
          <div className={rowCls}>
            <span className={keySpan}>마지막 로그인</span>
            <span className={valSpan}>
              {user.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-'}
            </span>
          </div>
        </div>
      </div>

      {profileBlock}
      {personalBlock}
      {orgBlock}
      {reportBlock}
    </div>
  );
}

// ─── 토글 스위치 ─────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-blue-600' : 'bg-white/20'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
