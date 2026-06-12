/**
 * 상담사 프로필 저장 (승인 후 수정용)
 */
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import type { CounselorProfileData } from '@/types/counselorProfile';

function getDb() {
  const { db } = initializeFirebase();
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
  return db;
}

function normalizeProfile(input: CounselorProfileData, email: string): CounselorProfileData {
  const region = (input.region || input.education || '').trim();
  const organizationName = (input.organizationName || input.license || '').trim();
  return {
    name: input.name.trim(),
    email: (input.email || email).trim(),
    phone: input.phone.trim(),
    specialization: input.specialization.filter(Boolean),
    experience: Math.max(0, Number(input.experience) || 0),
    region,
    education: region,
    bio: input.bio.trim(),
    license: '',
    practiceType: input.practiceType === 'organization' ? 'organization' : 'solo',
    organizationName,
    reportDisplayName: (input.reportDisplayName || input.name).trim(),
  };
}

export function validateCounselorProfile(profile: CounselorProfileData): string | null {
  if (!profile.name) return '이름을 입력해주세요.';
  if (!profile.phone) return '전화번호를 입력해주세요.';
  if (!profile.region?.trim()) return '지역을 선택해주세요.';
  if (profile.specialization.length === 0) return '전문 분야를 최소 하나 이상 선택해주세요.';
  if (profile.practiceType === 'organization' && !profile.organizationName) {
    return '기관명/회사명을 입력해주세요.';
  }
  return null;
}

export async function loadCounselorProfile(uid: string): Promise<{
  profile: CounselorProfileData | null;
  role: string;
}> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) {
    return { profile: null, role: 'user' };
  }

  const data = snap.data() as Record<string, unknown>;
  const role = String(data.role || 'user');
  const stored = data.counselorProfile as Partial<CounselorProfileData> | undefined;

  if (stored && typeof stored === 'object') {
    const region = String(stored.region || stored.education || '');
    return {
      role,
      profile: {
        name: String(stored.name || data.name || data.displayName || ''),
        email: String(stored.email || data.email || ''),
        phone: String(stored.phone || data.phoneNumber || ''),
        specialization: Array.isArray(stored.specialization)
          ? stored.specialization.map(String)
          : String(data.specialties || '')
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
        experience: Number(stored.experience ?? 0),
        region,
        education: region,
        bio: String(stored.bio || ''),
        license: String(stored.license || ''),
        practiceType: stored.practiceType === 'organization' ? 'organization' : 'solo',
        organizationName: String(stored.organizationName || data.organizationName || stored.license || ''),
        reportDisplayName: String(stored.reportDisplayName || data.reportDisplayName || stored.name || ''),
      },
    };
  }

  return {
    role,
    profile: {
      name: String(data.name || data.displayName || ''),
      email: String(data.email || ''),
      phone: String(data.phoneNumber || ''),
      specialization: String(data.specialties || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      experience: 0,
      region: '',
      education: '',
      bio: '',
      license: '',
      practiceType: data.practiceType === 'organization' ? 'organization' : 'solo',
      organizationName: String(data.organizationName || ''),
      reportDisplayName: String(data.reportDisplayName || data.name || ''),
    },
  };
}

async function writeCounselorProfileFields(
  uid: string,
  email: string,
  profile: CounselorProfileData,
  options: { profileComplete: boolean },
) {
  const db = getDb();
  const now = new Date().toISOString();

  await setDoc(
    doc(db, 'users', uid),
    {
      counselorProfileComplete: options.profileComplete,
      counselorProfile: profile,
      name: profile.name,
      displayName: profile.name,
      phoneNumber: profile.phone,
      email: profile.email || email,
      specialties: profile.specialization.join(', '),
      practiceType: profile.practiceType,
      organizationName: profile.organizationName,
      reportDisplayName: profile.reportDisplayName,
      counselorUpdatedAt: now,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  const { auth } = initializeFirebase();
  if (auth?.currentUser && profile.name) {
    try {
      await updateProfile(auth.currentUser, { displayName: profile.name });
    } catch {
      // ignore
    }
  }
}

/** 승인 전 신청용 — users 문서에 초안만 저장 (role 변경 없음) */
export async function saveCounselorProfileDraft(
  uid: string,
  email: string,
  input: CounselorProfileData,
): Promise<void> {
  const profile = normalizeProfile(input, email);
  const validationError = validateCounselorProfile(profile);
  if (validationError) throw new Error(validationError);
  await writeCounselorProfileFields(uid, email, profile, { profileComplete: false });
}

/** 관리자 승인 — role·프로필·counselors 문서 반영 */
export async function finalizeCounselorApproval(
  uid: string,
  rawPersonalInfo: Partial<CounselorProfileData> | Record<string, unknown>,
): Promise<void> {
  const email = String(rawPersonalInfo.email || '');
  const profile = normalizeProfile(
    {
      name: String(rawPersonalInfo.name || ''),
      email,
      phone: String(rawPersonalInfo.phone || ''),
      specialization: Array.isArray(rawPersonalInfo.specialization)
        ? rawPersonalInfo.specialization.map(String)
        : [],
      experience: Number(rawPersonalInfo.experience ?? 0),
      region: String(rawPersonalInfo.region || rawPersonalInfo.education || ''),
      education: String(rawPersonalInfo.region || rawPersonalInfo.education || ''),
      bio: String(rawPersonalInfo.bio || ''),
      license: String(rawPersonalInfo.license || ''),
      practiceType: rawPersonalInfo.practiceType === 'organization' ? 'organization' : 'solo',
      organizationName: String(rawPersonalInfo.organizationName || rawPersonalInfo.license || ''),
      reportDisplayName: String(
        rawPersonalInfo.reportDisplayName || rawPersonalInfo.name || '',
      ),
    },
    email,
  );

  const db = getDb();
  await setDoc(
    doc(db, 'users', uid),
    {
      role: 'counselor',
      roleUpdatedAt: serverTimestamp(),
      counselorProfileComplete: true,
      counselorProfile: profile,
      name: profile.name,
      displayName: profile.name,
      phoneNumber: profile.phone,
      email: profile.email || email,
      specialties: profile.specialization.join(', '),
      practiceType: profile.practiceType,
      organizationName: profile.organizationName,
      reportDisplayName: profile.reportDisplayName,
      counselorUpdatedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await setDoc(
    doc(db, 'counselors', uid),
    {
      id: uid,
      email: profile.email || email,
      name: profile.name,
      specialization: profile.specialization,
      experience: profile.experience,
      region: profile.region,
      education: profile.region,
      bio: profile.bio,
      license: profile.license,
      phoneNumber: profile.phone,
      practiceType: profile.practiceType,
      organizationName: profile.organizationName,
      reportDisplayName: profile.reportDisplayName,
      isActive: true,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

/** 승인된 상담사 프로필 수정 */
export async function updateCounselorProfile(
  uid: string,
  email: string,
  input: CounselorProfileData,
): Promise<void> {
  const profile = normalizeProfile(input, email);
  const validationError = validateCounselorProfile(profile);
  if (validationError) throw new Error(validationError);

  await writeCounselorProfileFields(uid, email, profile, { profileComplete: true });

  const db = getDb();
  await setDoc(
    doc(db, 'counselors', uid),
    {
      id: uid,
      email: profile.email || email,
      name: profile.name,
      specialization: profile.specialization,
      experience: profile.experience,
      region: profile.region,
      education: profile.region,
      bio: profile.bio,
      license: profile.license,
      phoneNumber: profile.phone,
      practiceType: profile.practiceType,
      organizationName: profile.organizationName,
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}
