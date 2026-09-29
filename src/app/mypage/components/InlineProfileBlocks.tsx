'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { markAuthenticatedTabSession, touchAuthHeartbeat } from '@/utils/authSessionLifecycle';
import { isCounselor } from '@/utils/roleUtils';
import { formatPhoneDisplayOr, formatPhoneWhileTyping } from '@/lib/phoneFormat';
import {
  formatBusinessRegistrationDisplayOr,
  formatBusinessRegistrationWhileTyping,
} from '@/lib/businessRegistrationNumberFormat';
import MypageTaxInvoiceFieldsSection, {
  MypageContactFieldsSection,
  MypageTaxInvoiceDisplaySection,
} from '@/components/mypage/MypageTaxInvoiceSection';
import { FaHeart, FaBuilding, FaKey, FaMapMarkerAlt } from 'react-icons/fa';
import { MypagePremiumBlock, MypagePremiumBlockGrid } from '@/components/mypage/MypagePremiumBlock';
import MypageBirthDateField, { formatBirthDateDisplay } from '@/components/mypage/MypageBirthDateField';
import OrganizationAddressField from '@/components/mypage/OrganizationAddressField';
import { MypageAccountFieldDisplay, mypageFieldEditProps } from '@/components/mypage/MypageAccountField';

const { labelClassName: labelEditCls, fieldClassName: fieldEditCls } = mypageFieldEditProps();

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
  organizationBusinessRegistrationNumber?: string;
  organizationRepresentativeName?: string;
  organizationBusinessType?: string;
  organizationBusinessItem?: string;
  organizationTaxInvoiceEmail?: string;
  reportDisplayName?: string;
  practiceType?: 'solo' | 'organization';
  teamSharingEnabled?: boolean;
  specialties?: string;
  clientFocus?: string;
  reportSignature?: string;
  shareOrganizationInReport?: boolean;
  shareContactInReport?: boolean;
}

export type MypageProfileSection = 'account' | 'counselor' | 'organization';

interface Props {
  user: UserData;
  firebaseUserRole?: string;
  onUpdate: (patch?: Record<string, unknown>) => void;
  section: MypageProfileSection;
}

type EditBlock = 'personal' | 'orgContact' | null;

// ─── 로컬 헬퍼 ──────────────────────────────────────────────────────────────
function roleLabel(role?: string) {
  if (role === 'admin') return '관리자';
  if (role === 'counselor') return '상담사';
  return '일반 회원';
}

function genderLabel(v?: string) {
  if (v === 'male') return '남성';
  if (v === 'female') return '여성';
  if (v === 'other') return '기타';
  return '정보 없음';
}

/** Firestore 저장 payload → 화면 표시용 user 객체로 병합 (부모 state 동기화용 export) */
export function applySavePatch(base: UserData, data: Record<string, unknown>): UserData {
  const next: UserData = { ...base, ...(data as Partial<UserData>) };
  const displayName =
    typeof data.displayName === 'string'
      ? data.displayName
      : typeof data.name === 'string'
        ? data.name
        : undefined;
  if (displayName !== undefined) {
    next.name = displayName;
  }
  return next;
}

// ─── 공통 스타일 ────────────────────────────────────────────────────────────

// ─── 저장 함수 ───────────────────────────────────────────────────────────────
async function saveToFirestore(data: Record<string, unknown>) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('로그인이 필요합니다.');
  await currentUser.getIdToken(true);

  const payload = { ...data };
  if (typeof payload.organizationName === 'string') {
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    const existing = snap.data();
    const cp = existing?.counselorProfile;
    if (cp && typeof cp === 'object' && !Array.isArray(cp)) {
      payload.counselorProfile = {
        ...(cp as Record<string, unknown>),
        organizationName: payload.organizationName,
      };
    }
  }

  await setDoc(
    doc(db, 'users', currentUser.uid),
    { ...payload, updatedAt: serverTimestamp(), uid: currentUser.uid, lastModified: new Date().toISOString() },
    { merge: true },
  );
  if ('displayName' in data && typeof data.displayName === 'string' && data.displayName !== currentUser.displayName) {
    await updateProfile(currentUser, { displayName: data.displayName });
  }
  markAuthenticatedTabSession();
  touchAuthHeartbeat();
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
  compact = false,
}: {
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  saving: boolean;
  locked: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button type="button" onClick={onCancel} disabled={saving} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-300 border border-white/15 hover:bg-white/10 disabled:opacity-50">
              취소
            </button>
            <button type="button" onClick={onSave} disabled={saving} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50">
              {saving ? '저장 중…' : '저장'}
            </button>
          </>
        ) : (
          <button type="button" onClick={onEdit} disabled={locked} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-white bg-sky-600/90 hover:bg-sky-500 disabled:opacity-40">
            수정
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-base font-semibold text-blue-100 flex items-center gap-2">
        {icon ? <span className="text-purple-400">{icon}</span> : null}
        {title ? title : null}
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

function EditFormSaveFooter({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end border-t border-white/10 pt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {saving ? '저장 중…' : '저장'}
      </button>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function InlineProfileBlocks({ user, firebaseUserRole, onUpdate, section }: Props) {
  const [displayUser, setDisplayUser] = useState<UserData>(user);
  const [editingBlock, setEditingBlock] = useState<EditBlock>(null);
  const [saving, setSaving] = useState(false);
  const [blockError, setBlockError] = useState('');
  const [blockSuccess, setBlockSuccess] = useState('');

  useEffect(() => {
    setDisplayUser(user);
  }, [user]);

  // 개인 기본 정보 폼
  const [personalForm, setPersonalForm] = useState({
    displayName: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
  });

  // 상담/운영 정보 폼
  const [orgForm, setOrgForm] = useState({
    organizationName: '',
    organizationBusinessRegistrationNumber: '',
    organizationRepresentativeName: '',
    organizationBusinessType: '',
    organizationBusinessItem: '',
    organizationTaxInvoiceEmail: '',
    organizationManager: '',
    organizationTel: '',
    organizationMobile: '',
    organizationFax: '',
    organizationEmail: '',
    organizationAddress: '',
  });

  const buildOrgSavePayload = () => ({
    organizationName: orgForm.organizationName.trim(),
    organizationBusinessRegistrationNumber: formatBusinessRegistrationWhileTyping(
      orgForm.organizationBusinessRegistrationNumber,
    ).trim(),
    organizationRepresentativeName: orgForm.organizationRepresentativeName.trim(),
    organizationBusinessType: orgForm.organizationBusinessType.trim(),
    organizationBusinessItem: orgForm.organizationBusinessItem.trim(),
    organizationTaxInvoiceEmail: orgForm.organizationTaxInvoiceEmail.trim(),
    organizationManager: orgForm.organizationManager.trim(),
    organizationTel: orgForm.organizationTel.trim(),
    organizationMobile: orgForm.organizationMobile.trim(),
    organizationFax: orgForm.organizationFax.trim(),
    organizationEmail: orgForm.organizationEmail.trim(),
    organizationAddress: orgForm.organizationAddress.trim(),
  });


  const role = firebaseUserRole || displayUser.role;
  const counselor = isCounselor(role);

  const startEdit = (block: EditBlock) => {
    setBlockError('');
    setBlockSuccess('');
    if (block === 'personal') {
      setPersonalForm({
        displayName: displayUser.name || '',
        phoneNumber: displayUser.phoneNumber || '',
        birthDate: displayUser.birthDate || '',
        gender: displayUser.gender || '',
      });
    } else if (block === 'orgContact') {
      setOrgForm({
        organizationName: displayUser.organizationName || '',
        organizationBusinessRegistrationNumber: formatBusinessRegistrationWhileTyping(
          displayUser.organizationBusinessRegistrationNumber || '',
        ),
        organizationRepresentativeName: displayUser.organizationRepresentativeName || '',
        organizationBusinessType: displayUser.organizationBusinessType || '',
        organizationBusinessItem: displayUser.organizationBusinessItem || '',
        organizationTaxInvoiceEmail: displayUser.organizationTaxInvoiceEmail || '',
        organizationManager: displayUser.organizationManager || '',
        organizationTel: displayUser.organizationTel || '',
        organizationMobile: displayUser.organizationMobile || '',
        organizationFax: displayUser.organizationFax || '',
        organizationEmail: displayUser.organizationEmail || '',
        organizationAddress: displayUser.organizationAddress || '',
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
      const patch = applySavePatch(displayUser, data);
      setDisplayUser(patch);
      setBlockSuccess('저장되었습니다.');
      setEditingBlock(null);
      onUpdate(data);
    } catch (e) {
      setBlockError(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const locked = editingBlock !== null;

  // ─── 개인 기본 정보 ─────────────────────────────────────────────────────────
  const personalBody =
    editingBlock === 'personal' ? (
      <div className="space-y-4 rounded-xl bg-black/95 p-4 sm:p-5">
        <div>
          <label className={labelEditCls}>이름</label>
          <input
            className={fieldEditCls}
            value={personalForm.displayName}
            onChange={(e) => setPersonalForm((p) => ({ ...p, displayName: e.target.value }))}
            placeholder="이름"
          />
        </div>
        <div>
          <label className={labelEditCls}>전화번호</label>
          <input
            className={fieldEditCls}
            value={personalForm.phoneNumber}
            onChange={(e) => setPersonalForm((p) => ({ ...p, phoneNumber: e.target.value }))}
            placeholder="010-0000-0000"
          />
        </div>
        <MypageBirthDateField
          labelClassName={labelEditCls}
          fieldClassName={fieldEditCls}
          value={personalForm.birthDate}
          onChange={(birthDate) => setPersonalForm((p) => ({ ...p, birthDate }))}
        />
        <div>
          <label className={labelEditCls}>성별</label>
          <select
            className={fieldEditCls}
            value={personalForm.gender}
            onChange={(e) => setPersonalForm((p) => ({ ...p, gender: e.target.value }))}
          >
            <option value="">선택 안 함</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
        </div>
        <BlockMessage error={blockError} success={blockSuccess} />
        <EditFormSaveFooter
          saving={saving}
          onSave={() =>
            handleSave({
              displayName: personalForm.displayName.trim(),
              name: personalForm.displayName.trim(),
              phoneNumber: personalForm.phoneNumber.trim(),
              birthDate: personalForm.birthDate,
              gender: personalForm.gender,
            })
          }
        />
      </div>
    ) : (
      <div className="space-y-4">
        <MypageAccountFieldDisplay label="이름" value={displayUser.name?.trim() || '정보 없음'} />
        <MypageAccountFieldDisplay
          label="전화번호"
          value={formatPhoneDisplayOr(displayUser.phoneNumber, '정보 없음')}
        />
        <MypageAccountFieldDisplay
          label="생년월일"
          calendarIcon
          value={
            displayUser.birthDate?.trim()
              ? formatBirthDateDisplay(displayUser.birthDate.trim()) || displayUser.birthDate.trim()
              : '정보 없음'
          }
        />
        <MypageAccountFieldDisplay label="성별" selectLike value={genderLabel(displayUser.gender)} />
        <MypageAccountFieldDisplay label="이메일(개인)" value={displayUser.email?.trim() || '정보 없음'} />
      </div>
    );

  const accountInfoBody = (
    <div className="space-y-4">
      <MypageAccountFieldDisplay label="회원 유형" selectLike value={roleLabel(displayUser.role)} />
      <MypageAccountFieldDisplay label="이메일" value={displayUser.email?.trim() || '정보 없음'} />
      <MypageAccountFieldDisplay
        label="가입일"
        value={displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString('ko-KR') : '-'}
      />
      <MypageAccountFieldDisplay
        label="마지막 로그인"
        value={
          displayUser.lastLoginAt
            ? new Date(displayUser.lastLoginAt).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-'
        }
      />
    </div>
  );

  const accountInfoBlock = (
    <MypagePremiumBlock
      index="01 · 계정"
      title="계정 정보"
      description="로그인·회원 유형·가입·접속 이력"
      icon={<FaKey className="h-4 w-4" />}
    >
      {accountInfoBody}
    </MypagePremiumBlock>
  );

  const personalInfoBlock = (
    <MypagePremiumBlock
      index="02 · 개인"
      title="개인 기본 정보"
      description="이름·연락처·생년월일·성별"
      icon={<FaHeart className="h-4 w-4" />}
      headerAction={
        <BlockHeader
          icon={null}
          title=""
          compact
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
            })
          }
          onCancel={cancelEdit}
        />
      }
    >
      {personalBody}
    </MypagePremiumBlock>
  );

  const orgContactBody =
    editingBlock === 'orgContact' ? (
      <div className="space-y-6 rounded-xl bg-black/95 p-4 sm:p-5">
        <MypageContactFieldsSection>
          <div className="space-y-4">
          <div>
            <label className={labelEditCls}>담당자</label>
            <input
              className={fieldEditCls}
              value={orgForm.organizationManager}
              onChange={(e) => setOrgForm((p) => ({ ...p, organizationManager: e.target.value }))}
              placeholder="담당자 이름"
            />
          </div>
          <div>
            <label className={labelEditCls}>전화번호</label>
            <input
              className={fieldEditCls}
              value={orgForm.organizationTel}
              onChange={(e) =>
                setOrgForm((p) => ({ ...p, organizationTel: formatPhoneWhileTyping(e.target.value) }))
              }
              placeholder="02-0000-0000"
            />
          </div>
          <div>
            <label className={labelEditCls}>핸드폰번호</label>
            <input
              className={fieldEditCls}
              value={orgForm.organizationMobile}
              onChange={(e) =>
                setOrgForm((p) => ({ ...p, organizationMobile: formatPhoneWhileTyping(e.target.value) }))
              }
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className={labelEditCls}>팩스번호</label>
            <input
              className={fieldEditCls}
              value={orgForm.organizationFax}
              onChange={(e) =>
                setOrgForm((p) => ({ ...p, organizationFax: formatPhoneWhileTyping(e.target.value) }))
              }
              placeholder="02-0000-0000"
            />
          </div>
          <div>
            <label className={labelEditCls}>연락 이메일</label>
            <input
              className={fieldEditCls}
              type="email"
              value={orgForm.organizationEmail}
              onChange={(e) => setOrgForm((p) => ({ ...p, organizationEmail: e.target.value }))}
              placeholder="contact@example.com"
            />
          </div>
          </div>
        </MypageContactFieldsSection>

        <MypageTaxInvoiceFieldsSection>
          <div>
            <label className={labelEditCls}>사업자등록번호</label>
            <input
              className={fieldEditCls}
              inputMode="numeric"
              value={orgForm.organizationBusinessRegistrationNumber}
              onChange={(e) =>
                setOrgForm((p) => ({
                  ...p,
                  organizationBusinessRegistrationNumber: formatBusinessRegistrationWhileTyping(e.target.value),
                }))
              }
              placeholder="000-00-00000"
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelEditCls}>회사/기관명 (상호)</label>
            <input
              className={fieldEditCls}
              value={orgForm.organizationName}
              onChange={(e) => setOrgForm((p) => ({ ...p, organizationName: e.target.value }))}
              placeholder="사업자등록증 상호"
            />
          </div>
          <div>
            <label className={labelEditCls}>대표자명</label>
            <input
              className={fieldEditCls}
              value={orgForm.organizationRepresentativeName}
              onChange={(e) => setOrgForm((p) => ({ ...p, organizationRepresentativeName: e.target.value }))}
              placeholder="대표자 성명"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelEditCls}>업태</label>
              <input
                className={fieldEditCls}
                value={orgForm.organizationBusinessType}
                onChange={(e) => setOrgForm((p) => ({ ...p, organizationBusinessType: e.target.value }))}
                placeholder="예: 서비스업"
              />
            </div>
            <div>
              <label className={labelEditCls}>종목</label>
              <input
                className={fieldEditCls}
                value={orgForm.organizationBusinessItem}
                onChange={(e) => setOrgForm((p) => ({ ...p, organizationBusinessItem: e.target.value }))}
                placeholder="예: 심리상담"
              />
            </div>
          </div>
          <OrganizationAddressField
            labelClassName={labelEditCls}
            fieldClassName={fieldEditCls}
            value={orgForm.organizationAddress}
            onChange={(organizationAddress) => setOrgForm((p) => ({ ...p, organizationAddress }))}
            placeholder="사업장 주소 (사업자등록증 주소)"
          />
          <div>
            <label className={labelEditCls}>세금계산서 수신 이메일</label>
            <input
              className={fieldEditCls}
              type="email"
              value={orgForm.organizationTaxInvoiceEmail}
              onChange={(e) => setOrgForm((p) => ({ ...p, organizationTaxInvoiceEmail: e.target.value }))}
              placeholder="tax@example.com"
            />
          </div>
        </MypageTaxInvoiceFieldsSection>

        <BlockMessage error={blockError} success={blockSuccess} />
        <EditFormSaveFooter saving={saving} onSave={() => handleSave(buildOrgSavePayload())} />
      </div>
    ) : (
      <div className="space-y-6">
        <MypageContactFieldsSection title="연락·담당 정보" variant="display">
          <div className="grid gap-4 sm:grid-cols-2">
            <MypageAccountFieldDisplay label="담당자" value={displayUser.organizationManager?.trim() || '정보 없음'} />
            <MypageAccountFieldDisplay label="전화" value={formatPhoneDisplayOr(displayUser.organizationTel?.trim(), '—')} />
            <MypageAccountFieldDisplay
              label="휴대폰"
              value={formatPhoneDisplayOr(displayUser.organizationMobile?.trim(), '—')}
            />
            <MypageAccountFieldDisplay label="팩스" value={displayUser.organizationFax?.trim() || '—'} />
            <MypageAccountFieldDisplay
              label="연락 이메일"
              value={displayUser.organizationEmail?.trim() || '—'}
              className="sm:col-span-2"
            />
          </div>
        </MypageContactFieldsSection>

        <div className="space-y-4">
          <MypageTaxInvoiceDisplaySection>
            <MypageAccountFieldDisplay
              label="사업자등록번호"
              value={formatBusinessRegistrationDisplayOr(
                displayUser.organizationBusinessRegistrationNumber,
                '정보 없음',
              )}
            />
            <MypageAccountFieldDisplay label="회사/기관명 (상호)" value={displayUser.organizationName?.trim() || '정보 없음'} />
            <MypageAccountFieldDisplay
              label="대표자명"
              value={displayUser.organizationRepresentativeName?.trim() || '정보 없음'}
            />
            <MypageAccountFieldDisplay label="업태" value={displayUser.organizationBusinessType?.trim() || '—'} />
            <MypageAccountFieldDisplay label="종목" value={displayUser.organizationBusinessItem?.trim() || '—'} />
            <MypageAccountFieldDisplay
              label="세금계산서 수신 이메일"
              value={displayUser.organizationTaxInvoiceEmail?.trim() || '—'}
              className="sm:col-span-2"
            />
          </MypageTaxInvoiceDisplaySection>
          <MypageAccountFieldDisplay
            label="사업장 주소"
            multiline
            value={displayUser.organizationAddress?.trim() || '정보 없음'}
          />
        </div>
      </div>
    );

  const orgContactBlock = counselor ? (
    <MypagePremiumBlock
      index="01 · 기관"
      title="회사/기관"
      description="대외 표기·연락에 사용하는 기관 정보 / 사업자등록증 정보"
      icon={<FaMapMarkerAlt className="h-4 w-4" />}
      headerAction={
        <BlockHeader
          icon={null}
          title=""
          compact
          editing={editingBlock === 'orgContact'}
          saving={saving}
          locked={locked && editingBlock !== 'orgContact'}
          onEdit={() => startEdit('orgContact')}
          onSave={() => handleSave(buildOrgSavePayload())}
          onCancel={cancelEdit}
        />
      }
    >
      {orgContactBody}
    </MypagePremiumBlock>
  ) : null;

  const counselorOrgNotice = (
    <MypagePremiumBlock
      index="01 · 안내"
      title="회사/기관 정보"
      description="상담사 승인 후 편집할 수 있습니다."
      icon={<FaBuilding className="h-4 w-4" />}
    >
      <p className="text-sm leading-relaxed text-slate-400">
        좌측 「상담사 계정」에서 승인을 받으면 기관명·사업자·연락처·주소를 등록할 수 있습니다.
      </p>
    </MypagePremiumBlock>
  );

  if (section === 'account') {
    return (
      <MypagePremiumBlockGrid>
        {accountInfoBlock}
        {personalInfoBlock}
      </MypagePremiumBlockGrid>
    );
  }

  if (section === 'organization') {
    if (!counselor) return counselorOrgNotice;
    return <MypagePremiumBlockGrid>{orgContactBlock}</MypagePremiumBlockGrid>;
  }

  return null;
}
