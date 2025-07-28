'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [userDataFromServer, setUserDataFromServer] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '회원가입 처리 중 오류가 발생했습니다.');
      }

      // 서버에서 받은 사용자 데이터 저장
      if (data.userData) {
        setUserDataFromServer(data.userData);
      }

      setStep('verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. 인증 코드 확인
      const verifyResponse = await fetch('/api/auth/register', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || '인증 코드 확인 중 오류가 발생했습니다.');
      }

      // 2. 인증 성공 시 사용자 계정 생성
      const createUserResponse = await fetch('/api/auth/register', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          passwordHash: formData.password, // 실제 구현에서는 해싱된 비밀번호가 들어갑니다
          salt: 'salt' // 실제 구현에서는 서버로부터 받은 솔트가 들어갑니다
        }),
      });

      const createUserData = await createUserResponse.json();

      if (!createUserResponse.ok) {
        throw new Error(createUserData.error || '사용자 계정 생성 중 오류가 발생했습니다.');
      }

      // 3. 회원가입 완료 후 로그인 페이지로 이동
      router.push('/auth/login?verified=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 코드 확인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 인증 코드 재전송 함수
  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '인증 코드 재전송 중 오류가 발생했습니다.');
      }

      alert('인증 코드가 재전송되었습니다. 이메일을 확인해주세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 코드 재전송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {step === 'form' ? '회원가입' : '이메일 인증'}
          </h2>
          <p className="mt-2 text-center text-sm text-blue-200">
            {step === 'form' ? (
              <>
                이미 계정이 있으신가요?{' '}
                <Link href="/auth/login" className="font-medium text-blue-300 hover:text-blue-200">
                  로그인하기
                </Link>
              </>
            ) : (
              '이메일로 전송된 인증 코드를 입력해주세요.'
            )}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {step === 'form' ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-white/20 bg-white/5 text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이메일 주소"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-white/20 bg-white/5 text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호 (8자 이상)"
                />
              </div>
              <div>
                <label htmlFor="name" className="sr-only">이름</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-white/20 bg-white/5 text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </span>
                ) : '회원가입'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerification}>
            <div>
              <p className="text-sm text-blue-200 mb-2">
                <strong>{formData.email}</strong> 주소로 인증 코드를 전송했습니다.
              </p>
              <label htmlFor="verificationCode" className="sr-only">인증 코드</label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-white/20 bg-white/5 text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="인증 코드 6자리"
                maxLength={6}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    확인 중...
                  </span>
                ) : '인증하기'}
              </button>
            </div>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-blue-300 hover:text-blue-200"
              >
                이전으로 돌아가기
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="text-blue-300 hover:text-blue-200"
                disabled={loading}
              >
                인증 코드 재전송
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 