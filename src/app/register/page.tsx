'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { getSession } from 'next-auth/react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AccountIntegrationManager } from '@/utils/accountIntegration';

// 로딩 컴포넌트
const LoadingRegister = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <Navigation />
    <div className="h-20"></div>
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-300 text-lg">회원가입 페이지를 로딩 중입니다...</p>
      </div>
    </div>
  </div>
);

// 클라이언트 컴포넌트
const RegisterContent = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [counselorCode, setCounselorCode] = useState<string>('');
  const [registerError, setRegisterError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showCounselorCode, setShowCounselorCode] = useState<boolean>(false);
  const [emailRegisterOpen, setEmailRegisterOpen] = useState<boolean>(false);
  
  // 로그인 상태 확인
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[Register] 로그인 상태 확인 시작');
        
        const session = await getSession();
        if (session) {
          console.log('[Register] 이미 로그인된 상태:', session);
          setIsLoggedIn(true);
          
          // 마이페이지로 리다이렉트
          setTimeout(() => {
            router.replace('/mypage');
          }, 100);
          return;
        }
        
        console.log('[Register] 인증되지 않은 상태');
      } catch (error) {
        console.error('[Register] 인증 상태 확인 오류:', error);
      }
    };
    
    checkAuthStatus();
  }, [router]);

  useEffect(() => {
    if (registerError) setEmailRegisterOpen(true);
  }, [registerError]);
  
  // 회원가입 처리 함수
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!name.trim()) {
      setRegisterError('이름을 입력해주세요.');
      return;
    }
    
    if (!email || !password) {
      setRegisterError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setRegisterError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    // 비밀번호 길이 검증
    if (password.length < 6) {
      setRegisterError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    // 로딩 상태 시작
    setIsLoading(true);
    setRegisterError('');
    
    try {
      console.log('[Register] 통합 회원가입 시도:', email);
      
      // 통합 회원가입 시도
      const result = await AccountIntegrationManager.signUpWithEmail(email, password, name);
      
      if (result.success) {
        console.log('[Register] 통합 회원가입 성공:', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });

        // 인증코드가 입력된 경우 상담사 연결 처리
        if (counselorCode.trim()) {
          try {
            const verifyResponse = await fetch('/api/verify-counselor-code', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clientId: result.user.uid,
                counselorCode: counselorCode.trim()
              }),
            });

            const verifyResult = await verifyResponse.json();
            
            if (verifyResult.success) {
              console.log('[Register] 상담사 연결 성공:', verifyResult.data);
              // 상담사 연결 성공 시 마이페이지로 리다이렉트
              router.push('/mypage?connected=true');
              return;
            } else {
              console.warn('[Register] 상담사 연결 실패:', verifyResult.error);
              // 상담사 연결 실패해도 회원가입은 성공으로 처리
              router.push('/login?registered=true&counselorConnectionFailed=true');
              return;
            }
          } catch (verifyError) {
            console.error('[Register] 상담사 연결 처리 오류:', verifyError);
            // 상담사 연결 오류가 발생해도 회원가입은 성공으로 처리
            router.push('/login?registered=true&counselorConnectionError=true');
            return;
          }
        } else {
          // 인증코드가 없는 경우 기본 로그인 페이지로 리다이렉트
          router.push('/login?registered=true&emailVerification=sent');
          return;
        }
      } else {
        setRegisterError(result.error || '회원가입 처리 중 오류가 발생했습니다.');
        return;
      }
      
    } catch (error: any) {
      console.error('[Register] 통합 회원가입 오류:', error);
      setRegisterError('회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 처리
  const handleSocialLogin = async (provider: string) => {
    try {
      setIsLoading(true);
      setRegisterError('');
      
      console.log(`[Register] ${provider} 소셜 로그인 시도`);
      
      if (provider === 'google') {
        const result = await AccountIntegrationManager.signInWithGoogle();
        
        if (result.success) {
          console.log('[Register] Google 소셜 로그인 성공:', {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName
          });
          
          // 마이페이지로 리다이렉트
          router.push('/mypage');
        } else {
          setRegisterError(result.error || 'Google 로그인 처리 중 오류가 발생했습니다.');
        }
      } else if (provider === 'naver') {
        const result = await AccountIntegrationManager.signInWithNaver('/mypage');
        if (result.success) {
          return;
        }
        setRegisterError(result.error || '네이버 로그인을 시작할 수 없습니다.');
      } else if (provider === 'kakao') {
        const result = await AccountIntegrationManager.signInWithKakao('/mypage');
        if (result.success) {
          return;
        }
        setRegisterError(result.error || '카카오 로그인을 시작할 수 없습니다.');
      } else {
        setRegisterError('지원하지 않는 로그인 방식입니다.');
      }
    } catch (error: any) {
      console.error(`[Register] ${provider} 로그인 오류:`, error);
      setRegisterError(`${provider} 로그인 처리 중 오류가 발생했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-5 bg-emerald-900/25 p-6 rounded-xl border border-emerald-800/40">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-emerald-100 mb-1">회원가입</h2>
            <p className="text-sm text-emerald-500/90">카카오로 빠른 가입</p>
          </div>

          <div className="space-y-2">
            <motion.button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              className="flex w-full justify-center items-center gap-2 px-4 py-3.5 rounded-lg border border-black/10 bg-[#FEE500] text-[#191919] font-semibold text-[15px] hover:bg-[#F5DC00] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/60 focus:ring-offset-1 focus:ring-offset-emerald-950 transition-colors disabled:opacity-60"
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
              aria-label="카카오로 회원가입"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#191919" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L8.5 21.5c-1.5-1.5-3-3-3-5.5 0-4.521 4.701-8.185 10.5-8.185z"/>
              </svg>
              카카오로 시작하기
            </motion.button>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex justify-center items-center px-2 py-2.5 border border-white/10 bg-white/95 text-gray-800 rounded-lg hover:bg-white transition-colors text-sm disabled:opacity-60"
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
                aria-label="Google로 가입"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="font-medium">Google</span>
                </div>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => handleSocialLogin('naver')}
                className="flex justify-center items-center px-2 py-2.5 border border-[#03C75A] bg-[#03C75A] text-white rounded-lg hover:bg-[#02b351] transition-colors text-sm disabled:opacity-60"
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
                aria-label="네이버로 가입"
              >
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                  </svg>
                  <span className="font-medium">네이버</span>
                </div>
              </motion.button>
            </div>
          </div>

          {registerError && (
            <div className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2" aria-live="assertive">
              {registerError}
            </div>
          )}

          <div className="pt-1 border-t border-emerald-800/40">
            <button
              type="button"
              onClick={() => setEmailRegisterOpen((o) => !o)}
              className="w-full flex items-center justify-center gap-1 py-2 text-xs text-emerald-400/95 hover:text-emerald-300 transition-colors"
              aria-expanded={emailRegisterOpen}
            >
              <span>이메일로 가입</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform ${emailRegisterOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {emailRegisterOpen && (
              <form className="space-y-2 mt-1" onSubmit={handleRegister}>
                <label htmlFor="name" className="sr-only">이름</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                  placeholder="이름"
                />
                <label htmlFor="email" className="sr-only">이메일</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                  placeholder="이메일"
                />
                <label htmlFor="password" className="sr-only">비밀번호</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                  placeholder="비밀번호 (6자 이상)"
                />

                <div className="pt-1 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id="hasCounselorCode"
                      checked={showCounselorCode}
                      onChange={(e) => setShowCounselorCode(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-emerald-700/60 bg-emerald-950/40 text-emerald-600"
                    />
                    <span className="text-[11px] text-emerald-500">상담사 인증코드 (선택)</span>
                  </label>
                  {showCounselorCode && (
                    <div>
                      <label htmlFor="counselorCode" className="sr-only">상담사 인증코드</label>
                      <input
                        id="counselorCode"
                        name="counselorCode"
                        type="text"
                        value={counselorCode}
                        onChange={(e) => setCounselorCode(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                        placeholder="인증코드"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 text-sm font-medium rounded-md text-emerald-50 bg-emerald-800/50 border border-emerald-700/40 hover:bg-emerald-800/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 disabled:opacity-60"
                  disabled={isLoading}
                  aria-label="이메일로 회원가입"
                >
                  {isLoading ? '처리 중…' : '가입하기'}
                </button>
              </form>
            )}
          </div>

          <div className="text-center pt-1">
            <p className="text-[11px] text-emerald-600">
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline">
                로그인
              </Link>
              <span className="mx-2 text-emerald-800">·</span>
              <Link href="/forgot-password" className="text-emerald-500 hover:text-emerald-400 underline-offset-2 hover:underline">
                비밀번호 찾기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 메인 페이지 컴포넌트
const RegisterPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingRegister />}>
      <RegisterContent />
    </Suspense>
  );
};

export default RegisterPage; 