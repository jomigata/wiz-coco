/**
 * 상담사 전환 승인 신청 (counselorApplications)
 */
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { finalizeCounselorApproval } from '@/lib/firestore/counselorRegistration';
import { mapRawAttachments } from '@/lib/counselorApplicationFiles';
import type { CounselorProfileData } from '@/types/counselorProfile';
import type { CounselorApplicationAttachment } from '@/types/counselorApplication';

export type CounselorApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type AdminApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface AdminCounselorApplicationRow {
  id: string;
  applicantUid: string;
  name: string;
  email: string;
  phone: string;
  /** 기관명/회사명 */
  organizationName: string;
  experience: number;
  specialization: string[];
  /** 활동 지역 */
  region: string;
  status: AdminApplicationStatus;
  appliedDate: string;
  notes: string;
  reviewNotes?: string;
  personalInfo: CounselorProfileData;
  attachments: CounselorApplicationAttachment[];
}

export interface CounselorApplicationRecord {
  id: string;
  status: CounselorApplicationStatus;
  applicantUid: string;
  personalInfo: CounselorProfileData;
  reviewNotes?: string;
  reviewedAt?: string;
  attachments: CounselorApplicationAttachment[];
}

const COLLECTION = 'counselorApplications';

function getDb() {
  const { db } = initializeFirebase();
  if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
  return db;
}

function profileToPersonalInfo(profile: CounselorProfileData) {
  const region = (profile.region || profile.education || '').trim();
  const organizationName = (profile.organizationName || profile.license || '').trim();
  return {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    specialization: profile.specialization,
    experience: profile.experience,
    region,
    education: region,
    bio: profile.bio,
    license: '',
    practiceType: profile.practiceType,
    organizationName,
    reportDisplayName: profile.reportDisplayName,
  };
}

function toDateString(value: unknown): string {
  if (!value) return '';
  const d =
    typeof (value as { toDate?: () => Date })?.toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : value instanceof Date
        ? value
        : typeof value === 'string'
          ? new Date(value)
          : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function normalizeAdminApplicationStatus(status: unknown): AdminApplicationStatus {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function toReviewedAtKey(value: unknown): string {
  if (!value) return '';
  const d =
    typeof (value as { toDate?: () => Date })?.toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : value instanceof Date
        ? value
        : typeof value === 'string'
          ? new Date(value)
          : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return String(d.getTime());
}

function mapPersonalInfo(raw: Partial<CounselorProfileData>): CounselorProfileData {
  const region = String(raw.region || raw.education || '');
  return {
    name: String(raw.name || ''),
    email: String(raw.email || ''),
    phone: String(raw.phone || ''),
    specialization: Array.isArray(raw.specialization) ? raw.specialization.map(String) : [],
    experience: Number(raw.experience ?? 0),
    region,
    education: region,
    bio: String(raw.bio || ''),
    license: String(raw.license || ''),
    practiceType: raw.practiceType === 'organization' ? 'organization' : 'solo',
    organizationName: String(raw.organizationName || raw.license || ''),
    organizationManager: String(raw.organizationManager || ''),
    reportDisplayName: String(raw.reportDisplayName || raw.name || ''),
  };
}

function mapDocToAdminRow(id: string, data: Record<string, unknown>): AdminCounselorApplicationRow {
  const personalInfo = mapPersonalInfo((data.personalInfo || {}) as Partial<CounselorProfileData>);
  return {
    id,
    applicantUid: String(data.applicantUid || ''),
    name: personalInfo.name,
    email: personalInfo.email,
    phone: personalInfo.phone,
    organizationName: personalInfo.organizationName,
    experience: personalInfo.experience,
    specialization: personalInfo.specialization,
    region: personalInfo.region,
    status: normalizeAdminApplicationStatus(data.status),
    appliedDate: toDateString(data.submittedAt),
    notes: personalInfo.bio,
    reviewNotes: typeof data.reviewNotes === 'string' ? data.reviewNotes : undefined,
    personalInfo,
    attachments: mapRawAttachments(data.attachments),
  };
}

export async function listAllCounselorApplications(): Promise<AdminCounselorApplicationRow[]> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), orderBy('submittedAt', 'desc'), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDocToAdminRow(d.id, d.data() as Record<string, unknown>));
}

export async function approveCounselorApplication(params: {
  applicationId: string;
  applicantUid: string;
  personalInfo: CounselorProfileData | Record<string, unknown>;
  reviewerUid: string;
  reviewNotes?: string;
}): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, params.applicationId), {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewerUid: params.reviewerUid,
    reviewNotes: (params.reviewNotes || '').trim(),
  });
  await finalizeCounselorApproval(params.applicantUid, params.personalInfo);
}

export async function rejectCounselorApplication(params: {
  applicationId: string;
  reviewerUid: string;
  reviewNotes?: string;
}): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, params.applicationId), {
    status: 'rejected',
    reviewedAt: serverTimestamp(),
    reviewerUid: params.reviewerUid,
    reviewNotes: (params.reviewNotes || '').trim(),
  });
}

const APPLICATION_STATUS_PRIORITY: Record<CounselorApplicationStatus, number> = {
  approved: 0,
  under_review: 1,
  pending: 2,
  rejected: 3,
};

function pickBestApplicationDoc(
  docs: QueryDocumentSnapshot[],
): QueryDocumentSnapshot | null {
  if (docs.length === 0) return null;
  const sorted = [...docs].sort((a, b) => {
    const sa = (a.data().status || 'pending') as CounselorApplicationStatus;
    const sb = (b.data().status || 'pending') as CounselorApplicationStatus;
    const pa = APPLICATION_STATUS_PRIORITY[sa] ?? 9;
    const pb = APPLICATION_STATUS_PRIORITY[sb] ?? 9;
    if (pa !== pb) return pa - pb;
    const ta = a.data().submittedAt?.toMillis?.() ?? 0;
    const tb = b.data().submittedAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return sorted[0] ?? null;
}

function mapApplicationDoc(
  docSnap: QueryDocumentSnapshot,
  uid: string,
): CounselorApplicationRecord {
  const data = docSnap.data();
  const personalInfo = (data.personalInfo || {}) as Partial<CounselorProfileData>;
  return {
    id: docSnap.id,
    status: (data.status || 'pending') as CounselorApplicationStatus,
    applicantUid: String(data.applicantUid || uid),
    reviewNotes: typeof data.reviewNotes === 'string' ? data.reviewNotes : undefined,
    reviewedAt: toReviewedAtKey(data.reviewedAt),
    personalInfo: mapPersonalInfo(personalInfo),
    attachments: mapRawAttachments(data.attachments),
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
  const docSnap = pickBestApplicationDoc(snap.docs);
  if (!docSnap) return null;
  return mapApplicationDoc(docSnap, uid);
}

/** 승인·반려 등 신청 상태 실시간 구독 (관리자 승인 직후 UI 반영) */
export function subscribeUserCounselorApplication(
  uid: string,
  onChange: (record: CounselorApplicationRecord | null) => void,
): () => void {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('applicantUid', '==', uid),
    where('status', 'in', ['pending', 'under_review', 'approved', 'rejected']),
  );
  return onSnapshot(
    q,
    (snap) => {
      const docSnap = pickBestApplicationDoc(snap.docs);
      onChange(docSnap ? mapApplicationDoc(docSnap, uid) : null);
    },
    () => onChange(null),
  );
}

export async function submitCounselorApplication(
  uid: string,
  profile: CounselorProfileData,
  attachments: CounselorApplicationAttachment[] = [],
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
    attachments,
  });

  return docRef.id;
}

export async function countPendingCounselorApplications(): Promise<number> {
  const db = getDb();
  const q = query(collection(db, COLLECTION), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.size;
}
