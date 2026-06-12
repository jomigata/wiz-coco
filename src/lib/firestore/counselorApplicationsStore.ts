/**
 * 상담사 전환 승인 신청 (counselorApplications)
 */
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import type { CounselorProfileData } from '@/types/counselorProfile';

export type CounselorApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface CounselorApplicationRecord {
  id: string;
  status: CounselorApplicationStatus;
  applicantUid: string;
  personalInfo: CounselorProfileData;
}

const COLLECTION = 'counselorApplications';

function getDb() {
  const { db } = initializeFirebase();
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
  return db;
}

function profileToPersonalInfo(profile: CounselorProfileData) {
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    specialization: profile.specialization,
    experience: profile.experience,
    education: profile.education,
    bio: profile.bio,
    license: profile.license,
    practiceType: profile.practiceType,
    organizationName: profile.organizationName,
    reportDisplayName: profile.reportDisplayName,
  };
}

export async function getUserCounselorApplication(
  uid: string,
): Promise<CounselorApplicationRecord | null> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('applicantUid', '==', uid),
    where('status', 'in', ['pending', 'under_review', 'approved', 'rejected']),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const sorted = [...snap.docs].sort((a, b) => {
    const ta = a.data().submittedAt?.toMillis?.() ?? 0;
    const tb = b.data().submittedAt?.toMillis?.() ?? 0;
    return tb - ta;
  });

  const docSnap = sorted[0];
  const data = docSnap.data();
  const personalInfo = (data.personalInfo || {}) as Partial<CounselorProfileData>;
  return {
    id: docSnap.id,
    status: (data.status || 'pending') as CounselorApplicationStatus,
    applicantUid: String(data.applicantUid || uid),
    personalInfo: {
      name: String(personalInfo.name || ''),
      email: String(personalInfo.email || ''),
      phone: String(personalInfo.phone || ''),
      specialization: Array.isArray(personalInfo.specialization)
        ? personalInfo.specialization.map(String)
        : [],
      experience: Number(personalInfo.experience ?? 0),
      education: String(personalInfo.education || ''),
      bio: String(personalInfo.bio || ''),
      license: String(personalInfo.license || ''),
      practiceType: personalInfo.practiceType === 'organization' ? 'organization' : 'solo',
      organizationName: String(personalInfo.organizationName || ''),
      reportDisplayName: String(personalInfo.reportDisplayName || personalInfo.name || ''),
    },
  };
}

export async function submitCounselorApplication(
  uid: string,
  profile: CounselorProfileData,
): Promise<string> {
  const db = getDb();

  const activeQ = query(
    collection(db, COLLECTION),
    where('applicantUid', '==', uid),
    where('status', 'in', ['pending', 'under_review', 'approved']),
  );
  const activeSnap = await getDocs(activeQ);
  if (!activeSnap.empty) {
    const st = String(activeSnap.docs[0].data().status || 'pending');
    if (st === 'approved') {
      throw new Error('이미 승인된 상담사 계정입니다.');
    }
    throw new Error('이미 검토 중인 상담사 전환 신청이 있습니다.');
  }

  const personalInfo = profileToPersonalInfo(profile);
  const docRef = await addDoc(collection(db, COLLECTION), {
    applicantUid: uid,
    status: 'pending',
    source: 'mypage_settings',
    submittedAt: serverTimestamp(),
    personalInfo,
  });

  return docRef.id;
}

export async function countPendingCounselorApplications(): Promise<number> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.size;
}
