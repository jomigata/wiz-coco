'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { db } from '@/lib/firebase';

export type MypageUserProfile = {
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
  interests?: string[];
  bio?: string;
  organizationName?: string;
  organizationManager?: string;
  organizationTel?: string;
  organizationMobile?: string;
  organizationFax?: string;
  organizationEmail?: string;
  organizationAddress?: string;
  organizationBusinessRegistrationNumber?: string;
  reportDisplayName?: string;
  practiceType?: 'solo' | 'organization';
  teamSharingEnabled?: boolean;
  specialties?: string;
  clientFocus?: string;
  reportSignature?: string;
  shareOrganizationInReport?: boolean;
  shareContactInReport?: boolean;
};

function normalizeDateValue(v: unknown): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as { toDate?: () => Date }).toDate === 'function') {
    const d = (v as { toDate: () => Date }).toDate();
    return d instanceof Date ? d.toISOString() : '';
  }
  if (typeof v === 'object' && v !== null && 'seconds' in v) {
    const seconds = Number((v as { seconds?: number }).seconds);
    if (!Number.isFinite(seconds)) return '';
    return new Date(seconds * 1000).toISOString();
  }
  return '';
}

export function useMypageUserProfile() {
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  const [user, setUser] = useState<MypageUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (firebaseLoading) return;
    if (!firebaseUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const userData: MypageUserProfile = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || undefined,
      role: firebaseUser.role || 'user',
      createdAt: firebaseUser.metadata?.creationTime || '',
      lastLoginAt: firebaseUser.metadata?.lastSignInTime || '',
    };

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const d = userDoc.data();
        Object.assign(userData, {
          name: d.name || d.displayName || userData.name || '',
          email: d.email || userData.email || '',
          phoneNumber: d.phoneNumber || '',
          birthDate: d.birthDate || '',
          gender: d.gender || '',
          occupation: d.occupation || '',
          reportDisplayName: d.reportDisplayName || '',
          practiceType: d.practiceType || 'solo',
          teamSharingEnabled: Boolean(d.teamSharingEnabled),
          specialties: d.specialties || '',
          clientFocus: d.clientFocus || '',
          reportSignature: d.reportSignature || '',
          shareOrganizationInReport: Boolean(d.shareOrganizationInReport),
          shareContactInReport: Boolean(d.shareContactInReport),
          interests: d.interests || [],
          bio: d.bio || '',
          organizationName: d.organizationName || d.companyName || '',
          organizationManager: d.organizationManager || d.managerName || '',
          organizationTel: d.organizationTel || d.tel || '',
          organizationMobile: d.organizationMobile || d.mobile || '',
          organizationFax: d.organizationFax || d.fax || '',
          organizationEmail: d.organizationEmail || '',
          organizationAddress: d.organizationAddress || d.address || '',
          organizationBusinessRegistrationNumber:
            d.organizationBusinessRegistrationNumber || d.businessRegistrationNumber || '',
          createdAt: normalizeDateValue(d.createdAt) || userData.createdAt,
          lastLoginAt: normalizeDateValue(d.lastLoginAt) || userData.lastLoginAt,
        });
      }
    } catch {
      // Firestore 미동기화 시 Firebase Auth 정보만 사용
    }

    setUser(userData);
    setLoading(false);
  }, [firebaseLoading, firebaseUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolvedUser = useMemo((): MypageUserProfile | null => {
    if (user) return user;
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || undefined,
      role: firebaseUser.role || 'user',
      createdAt: firebaseUser.metadata?.creationTime || '',
      lastLoginAt: firebaseUser.metadata?.lastSignInTime || '',
    };
  }, [user, firebaseUser]);

  return {
    user: resolvedUser,
    firebaseUser,
    loading: firebaseLoading || loading,
    reload: load,
  };
}
