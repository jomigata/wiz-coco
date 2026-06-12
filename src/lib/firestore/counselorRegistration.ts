/**
 * 상담사 전환·프로필 저장 (Firestore 클라이언트)
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
  return {
    name: input.name.trim(),
    email: (input.email || email).trim(),
    phone: input.phone.trim(),
    specialization: input.specialization.filter(Boolean),
    experience: Math.max(0, Number(input.experience) || 0),
    education: input.education.trim(),
    bio: input.bio.trim(),
    license: input.license.trim(),
    practiceType: input.practiceType === 'organization' ? 'organization' : 'solo',
    organizationName: input.organizationName.trim(),
    reportDisplayName: (input.reportDisplayName || input.name).trim(),
  };
}

export function validateCounselorProfile(profile: CounselorProfileData): string | null {
  if (!profile.name) return '이름을 입력해주세요.';
  if (!profile.phone) return '전화번호를 입력해주세요.';
  if (profile.specialization.length === 0) return '전문 분야를 최소 하나 이상 선택해주세요.';
  if (profile.practiceType === 'organization' && !profile.organizationName) {
    return '조직/기관명을 입력해주세요.';
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
        education: String(stored.education || ''),
        bio: String(stored.bio || ''),
        license: String(stored.license || ''),
        practiceType: stored.practiceType === 'organization' ? 'organization' : 'solo',
        organizationName: String(stored.organizationName || data.organizationName || ''),
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
      education: '',
      bio: '',
      license: '',
      practiceType: data.practiceType === 'organization' ? 'organization' : 'solo',
      organizationName: String(data.organizationName || ''),
      reportDisplayName: String(data.reportDisplayName || data.name || ''),
    },
  };
}

async function writeCounselorDocuments(
  uid: string,
  email: string,
  profile: CounselorProfileData,
  options: { switchRole: boolean },
) {
  const db = getDb();
  const userRef = doc(db, 'users', uid);
  const now = new Date().toISOString();

  const userPayload: Record<string, unknown> = {
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
    counselorUpdatedAt: now,
    updatedAt: serverTimestamp(),
  };

  if (options.switchRole) {
    userPayload.role = 'counselor';
    userPayload.counselorRegisteredAt = now;
  }

  await setDoc(userRef, userPayload, { merge: true });

  await setDoc(
    doc(db, 'counselors', uid),
    {
      id: uid,
      email: profile.email || email,
      name: profile.name,
      specialization: profile.specialization,
      experience: profile.experience,
      education: profile.education,
      bio: profile.bio,
      license: profile.license,
      phoneNumber: profile.phone,
      practiceType: profile.practiceType,
      organizationName: profile.organizationName,
      isActive: true,
      updatedAt: now,
    },
    { merge: true },
  );

  const { auth } = initializeFirebase();
  if (auth?.currentUser && profile.name) {
    try {
      await updateProfile(auth.currentUser, { displayName: profile.name });
    } catch {
      // displayName 동기화 실패는 무시
    }
  }
}

/** 일반 회원 → 상담사 전환 */
export async function switchToCounselor(
  uid: string,
  email: string,
  input: CounselorProfileData,
): Promise<void> {
  const profile = normalizeProfile(input, email);
  const validationError = validateCounselorProfile(profile);
  if (validationError) throw new Error(validationError);

  await writeCounselorDocuments(uid, email, profile, { switchRole: true });
}

/** 기존 상담사 프로필 수정 */
export async function updateCounselorProfile(
  uid: string,
  email: string,
  input: CounselorProfileData,
): Promise<void> {
  const profile = normalizeProfile(input, email);
  const validationError = validateCounselorProfile(profile);
  if (validationError) throw new Error(validationError);

  await writeCounselorDocuments(uid, email, profile, { switchRole: false });
}
