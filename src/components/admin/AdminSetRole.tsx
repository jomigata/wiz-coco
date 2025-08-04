'use client';

import React, { useState } from 'react';

interface AdminSetRoleProps {
  defaultEmail?: string;
}

const AdminSetRole: React.FC<AdminSetRoleProps> = ({ defaultEmail = '' }) => {
  const [email, setEmail] = useState<string>(defaultEmail);
  const [adminSecret, setAdminSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleInfo, setRoleInfo] = useState<{ email: string; role: string; name: string } | null>(null);

  // 사용자 역할 조회
  const checkUserRole = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);
    setRoleInfo(null);

    try {
      const response = await fetch(`/api/admin/check-role?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '역할 확인 중 오류가 발생했습니다.');
      }

      if (data.success && data.user) {
        setRoleInfo({
          email: data.user.email,
          role: data.user.role,
          name: data.user.name
        });
        setMessage(`${data.user.email} 사용자의 현재 역할: ${data.user.role}`);
      } else {
        setError('사용자 정보를 찾을 수 없습니다.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '역할 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 권한 설정
  const setAdminRole = async () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      return;
    }

    if (!adminSecret) {
      setError('관리자 비밀키를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, adminSecret }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '관리자 설정 중 오류가 발생했습니다.');
      }

      if (data.success) {
        setMessage(data.message);
        // 성공 후 역할 정보 업데이트
        if (data.user) {
          setRoleInfo({
            email: data.user.email,
            role: data.user.role,
            name: data.user.name
          });
        }
      } else {
        setError(data.error || '알 수 없는 오류가 발생했습니다.');
      }
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
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          사용자 이메일
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="관리자로 설정할 이메일"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={checkUserRole}
          disabled={isLoading}
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
          <p className="text-sm text-blue-700">이메일: {roleInfo.email}</p>
          <p className="text-sm text-blue-700">이름: {roleInfo.name}</p>
          <p className="text-sm text-blue-700">
            역할: <span className={`font-semibold ${roleInfo.role === 'admin' ? 'text-purple-700' : 'text-blue-700'}`}>
              {roleInfo.role === 'admin' ? '관리자' : '일반 사용자'}
            </span>
          </p>
        </div>
      )}
      
      {roleInfo && roleInfo.role !== 'admin' && (
        <>
          <div className="mb-6">
            <label htmlFor="adminSecret" className="block text-sm font-medium text-gray-700 mb-1">
              관리자 비밀키
            </label>
            <input
              type="password"
              id="adminSecret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="관리자 권한 설정에 필요한 비밀키"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              * 기본값은 'admin_secret_key_123'입니다.
            </p>
          </div>
          
          <button
            onClick={setAdminRole}
            disabled={isLoading || !adminSecret}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '관리자 권한 설정'}
          </button>
        </>
      )}
      
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
    </div>
  );
};

export default AdminSetRole; 