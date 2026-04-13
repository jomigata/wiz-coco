'use client';

import React, { useMemo, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { initializeFirebase } from '@/lib/firebase';
import type { AppRole } from '@/utils/roleUtils';

interface AdminSetRoleProps {
  defaultUid?: string;
}

const AdminSetRole: React.FC<AdminSetRoleProps> = ({ defaultUid = '' }) => {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [uid, setUid] = useState<string>(defaultUid);
  const [role, setRole] = useState<AppRole>('user');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleInfo, setRoleInfo] = useState<{ uid: string; role: AppRole; email?: string | null } | null>(null);

  const isAdmin = useMemo(() => (user?.role || 'user') === 'admin', [user?.role]);

  // 사용자 역할 조회
  const checkUserRole = async () => {
    if (!uid.trim()) {
      setError('사용자 UID를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);
    setRoleInfo(null);

    try {
      const { db } = initializeFirebase();
      if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
      const ref = doc(db, 'users', uid.trim());
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        setError('해당 UID의 사용자 문서가 없습니다. 사용자가 먼저 로그인해야 합니다.');
        return;
      }
      const data = snap.data() as any;
      const currentRole = (data?.role || 'user') as AppRole;
      setRole(currentRole);
      setRoleInfo({ uid: uid.trim(), role: currentRole, email: data?.email ?? null });
      setMessage(`현재 역할: ${currentRole}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '역할 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 역할 설정
  const setUserRole = async () => {
    if (!uid.trim()) {
      setError('사용자 UID를 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { db } = initializeFirebase();
      if (!db) throw new Error('Firestore가 초기화되지 않았습니다.');
      if (!isAdmin) throw new Error('관리자 권한이 필요합니다.');

      const ref = doc(db, 'users', uid.trim());
      await setDoc(
        ref,
        {
          role,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setRoleInfo((prev) => ({ uid: uid.trim(), role, email: prev?.email ?? null }));
      setMessage(`역할을 ${role}로 설정했습니다.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '관리자 설정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">사용자 권한 관리</h2>
      
      <div className="mb-6">
        <label htmlFor="uid" className="block text-sm font-medium text-gray-700 mb-1">
          사용자 UID
        </label>
        <input
          type="text"
          id="uid"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="예: R3x... (Firebase uid)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
          역할
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as AppRole)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="user">user</option>
          <option value="counselor">counselor</option>
          <option value="admin">admin</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={checkUserRole}
          disabled={isLoading || authLoading}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? '확인 중...' : '역할 확인'}
        </button>
        
        <button
          onClick={() => {
            setAdminSecret('');
            setRoleInfo(null);
            setMessage(null);
            setError(null);
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          초기화
        </button>
      </div>
      
      {roleInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">사용자 정보</h3>
          <p className="text-sm text-blue-700">UID: {roleInfo.uid}</p>
          {roleInfo.email ? <p className="text-sm text-blue-700">이메일: {roleInfo.email}</p> : null}
          <p className="text-sm text-blue-700">
            역할: <span className={`font-semibold ${roleInfo.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
              {roleInfo.role}
            </span>
          </p>
        </div>
      )}
      
      <button
        onClick={setUserRole}
        disabled={isLoading || authLoading || !isAdmin}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? '처리 중...' : '역할 저장'}
      </button>
      
      {message && (
        <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-md border border-green-200">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {!authLoading && user && !isAdmin ? (
        <div className="mt-4 p-3 bg-amber-50 text-amber-900 rounded-md border border-amber-200 text-sm">
          이 기능은 관리자만 사용할 수 있습니다.
        </div>
      ) : null}
    </div>
  );
};

export default AdminSetRole; 