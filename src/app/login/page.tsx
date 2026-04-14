'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AccountIntegrationManager } from '@/utils/accountIntegration';
// 로딩 컴포넌트
const LoadingLogin = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
    <Navigation />
    <div className="h-20"></div>
    <div className="flex-grow flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-emerald-300 text-lg">로그인 페이지를 로딩 중입니다...</p>
      </div>
    </div>
  </div>
);

// 클라이언트 컴포넌트
const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, signIn: firebaseSignIn } = useFirebaseAuth();
  const registered = searchParams.get('registered') === 'true';
  const emailVerification = searchParams.get('emailVerification');
  const redirectUrl = searchParams.get('redirect') || '/';
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(registered);
  const [emailVerificationMessage, setEmailVerificationMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [passwordResetSent, setPasswordResetSent] = useState<boolean>(false);
  const [showSnsLogin, setShowSnsLogin] = useState<boolean>(false);
  const [duplicateEmail, setDuplicateEmail] = useState<string>('');
  const [accountSuggestions, setAccountSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [emailLoginOpen, setEmailLoginOpen] = useState<boolean>(false);
  
  // 이메일 인증 메시지 설정
  useEffect(() => {
    if (emailVerification === 'sent') {
      setEmailVerificationMessage('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요.');
    } else if (emailVerification === 'failed') {
      setEmailVerificationMessage('회원가입은 완료되었지만 인증 이메일 발송에 실패했습니다.');
    }
  }, [emailVerification]);
  
  // Firebase 인증 상태 확인
  useEffect(() => {
    console.log('[Login] Firebase 인증 상태:', { user, loading });
    
    if (!loading && user) {
      console.log('[Login] 이미 로그인된 상태:', user);
      
      // 리다이렉트 처리
      setTimeout(() => {
        router.replace(redirectUrl);
      }, 100);
    }
  }, [user, loading, router, redirectUrl]);

  useEffect(() => {
    if (loginError && !showSnsLogin) setEmailLoginOpen(true);
  }, [loginError, showSnsLogin]);
  
  // 통합 로그인 처리 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!email || !password) {
      setLoginError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    
    // 로딩 상태 시작
    setIsLoading(true);
    setLoginError('');
    setShowSnsLogin(false);
    
    try {
      console.log('[Login] 통합 로그인 시도:', email);
      
      // 통합 로그인 시도 (이메일 기반으로 모든 방법 시도)
      const result = await AccountIntegrationManager.unifiedSignIn(email, password);
      
      if (result.success) {
        console.log('[Login] 통합 로그인 성공:', {
          method: result.method,
          user: result.user
        });
        
        // 리다이렉트 처리
        setTimeout(() => {
          router.replace(redirectUrl);
        }, 100);
      } else {
        // 에러 메시지 설정
        let errorMsg = result.error || '로그인 처리 중 오류가 발생했습니다.';
        let isDuplicateAccount = false;
        
        if (result.error?.includes('등록되지 않은 이메일') || result.error?.includes('user-not-found')) {
          errorMsg = '등록되지 않은 이메일입니다.';
          // SNS 제안은 표시하지 않음
        } else if (result.error?.includes('SNS로 가입되어 있습니다')) {
          errorMsg = 'SNS로 가입되어 있습니다. SNS 로그인을 이용하세요.';
          isDuplicateAccount = true;
          // SNS 인증 방법 표시
          if (result.snsAuthMethods && result.snsAuthMethods.length > 0) {
            setAccountSuggestions(result.snsAuthMethods.map((method: string) => {
              switch(method) {
                case 'google': return 'Google 계정으로 로그인해보세요.';
                case 'naver': return 'Naver 계정으로 로그인해보세요.';
                case 'kakao': return 'Kakao 계정으로 로그인해보세요.';
                default: return `${method} 계정으로 로그인해보세요.`;
              }
            }));
            setShowSuggestions(true);
          }
        } else if (result.error?.includes('비밀번호가 일치하지 않습니다') || result.error?.includes('wrong-password')) {
          errorMsg = '비밀번호가 일치하지 않습니다.';
          // SNS 제안은 표시하지 않음
        } else if (result.error?.includes('invalid-email')) {
          errorMsg = '올바르지 않은 이메일 형식입니다.';
        } else if (result.error?.includes('user-disabled')) {
          errorMsg = '비활성화된 계정입니다.';
        } else if (result.error?.includes('too-many-requests')) {
          errorMsg = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
        } else if (result.error?.includes('account-exists-with-different-credential')) {
          errorMsg = '이 이메일로 가입된 계정이 다른 로그인 방식으로 존재합니다.';
          isDuplicateAccount = true;
        } else if (result.error?.includes('email-already-in-use')) {
          errorMsg = '이미 사용 중인 이메일입니다.';
          isDuplicateAccount = true;
        }
        
        setLoginError(errorMsg);
        
        // 중복 계정 에러인 경우 SNS 로그인 화면 표시
        if (isDuplicateAccount) {
          setDuplicateEmail(email);
          setShowSnsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('[Login] Firebase 로그인 오류:', error);
      
      // 중복 계정 에러 체크
      if (error.code === 'auth/account-exists-with-different-credential' || 
          error.code === 'auth/email-already-in-use') {
        setLoginError('이 이메일로 가입된 계정이 다른 로그인 방식으로 존재합니다.');
        setDuplicateEmail(email);
        setShowSnsLogin(true);
      } else {
        setLoginError('로그인 처리 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google 로그인 처리
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setLoginError('');
      setShowSnsLogin(false);
      
      console.log('[Login] Google 로그인 시도');
      
      const result = await AccountIntegrationManager.signInWithGoogle();
      
      if (result.success) {
        console.log('[Login] Google 로그인 성공:', {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        });
        
        // 리다이렉트 처리
        setTimeout(() => {
          router.replace(redirectUrl);
        }, 100);
      } else {
        let errorMessage = result.error || 'Google 로그인 처리 중 오류가 발생했습니다.';
        
        if (result.needsAccountLinking) {
          errorMessage = '이 이메일은 다른 방법으로 이미 가입되어 있습니다.';
          setShowSnsLogin(true);
        }
        
        setLoginError(errorMessage);
      }
      
    } catch (error: any) {
      console.error('[Login] Google 로그인 오류:', error);
      setLoginError('Google 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Kakao 로그인 처리 (OAuth 페이지로 이동 → 콜백에서 Custom Token 로그인)
  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    setShowSnsLogin(false);
    const result = await AccountIntegrationManager.signInWithKakao(redirectUrl);
    if (!result.success) {
      setLoginError(result.error || '카카오 로그인을 시작할 수 없습니다.');
      setIsLoading(false);
    }
  };

  // Naver 로그인 처리
  const handleNaverLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    setShowSnsLogin(false);
    const result = await AccountIntegrationManager.signInWithNaver(redirectUrl);
    if (!result.success) {
      setLoginError(result.error || '네이버 로그인을 시작할 수 없습니다.');
      setIsLoading(false);
    }
  };

  // 비밀번호 재설정 이메일 보내기
  const handlePasswordReset = async () => {
    if (!email) {
      setLoginError('비밀번호 재설정을 위해 먼저 이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      setLoginError('');
      
      console.log('[Login] 비밀번호 재설정 이메일 발송 시도:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('[Login] 비밀번호 재설정 이메일 발송 성공');
      setPasswordResetSent(true);
      setLoginError('');
      
    } catch (error: any) {
      console.error('[Login] 비밀번호 재설정 이메일 발송 오류:', error);
      
      let errorMsg = '비밀번호 재설정 이메일 발송 중 오류가 발생했습니다.';
      if (error.code === 'auth/user-not-found') {
        errorMsg = '등록되지 않은 이메일 주소입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = '올바르지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMsg = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      }
      setLoginError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // SNS 로그인 화면으로 돌아가기
  const handleBackToEmailLogin = () => {
    setShowSnsLogin(false);
    setDuplicateEmail('');
    setLoginError('');
  };

  // 이메일 입력 시 계정 제안 (실제 로그인 시도 후에만 표시)
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // 이메일 입력 시에는 제안을 표시하지 않음
    setShowSuggestions(false);
    setAccountSuggestions([]);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full space-y-5 bg-emerald-900/25 p-6 rounded-xl border border-emerald-800/40">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-emerald-100 mb-1">로그인</h2>
            <p className="text-sm text-emerald-500/90">카카오로 빠른 로그인</p>
          </div>

          {/* 회원가입 성공 메시지 */}
          {registrationSuccess && !emailVerificationMessage && (
            <div className="bg-emerald-800/50 text-emerald-200 p-4 rounded-lg text-center mb-4">
              회원가입이 완료되었습니다. 로그인해주세요.
            </div>
          )}

          {/* 이메일 인증 관련 메시지 */}
          {emailVerificationMessage && (
            <div className={`p-4 rounded-lg text-center mb-4 ${
              emailVerification === 'sent' 
                ? 'bg-blue-800/50 text-blue-200 border border-blue-600/50' 
                : 'bg-amber-800/50 text-amber-200 border border-amber-600/50'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {emailVerification === 'sent' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                )}
                <span className="font-semibold">
                  {emailVerification === 'sent' ? '이메일 인증 발송됨' : '인증 이메일 발송 실패'}
                </span>
              </div>
              <p className="text-sm">{emailVerificationMessage}</p>
              {emailVerification === 'sent' && (
                <p className="text-xs mt-2 opacity-75">
                  이메일을 받지 못하셨나요? 스팸 폴더를 확인해보세요.
                </p>
              )}
            </div>
          )}

          {/* 비밀번호 재설정 성공 메시지 */}
          {passwordResetSent && (
            <div className="bg-green-800/50 text-green-200 border border-green-600/50 p-4 rounded-lg text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold">비밀번호 재설정 이메일 발송됨</span>
              </div>
              <p className="text-sm">
                {email}로 비밀번호 재설정 링크를 보냈습니다.<br/>
                이메일을 확인하여 비밀번호를 재설정해주세요.
              </p>
              <p className="text-xs mt-2 opacity-75">
                이메일을 받지 못하셨나요? 스팸 폴더를 확인해보세요.
              </p>
            </div>
          )}

          {/* SNS 가입 알림 및 로그인 안내 */}
          {showSnsLogin && duplicateEmail && (
            <div className="bg-blue-800/50 text-blue-200 border border-blue-600/50 p-4 rounded-lg text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold">SNS 계정으로 가입됨</span>
              </div>
              <p className="text-sm mb-3">
                <strong>{duplicateEmail}</strong>은(는) SNS로 가입되어 있습니다.<br/>
                SNS 로그인을 이용하세요.
              </p>
              <button
                onClick={handleBackToEmailLogin}
                className="text-xs text-blue-300 hover:text-blue-200 underline"
              >
                이메일 로그인으로 돌아가기
              </button>
            </div>
          )}

          {/* SNS 로그인 (카카오 우선) */}
          <div className="space-y-2">
            {showSnsLogin && (
              <p className="text-center text-xs text-emerald-400">소셜 로그인으로 진행해 주세요.</p>
            )}
            <motion.button
              onClick={handleKakaoLogin}
              className="flex w-full justify-center items-center gap-2 px-4 py-3.5 rounded-lg border border-black/10 bg-[#FEE500] text-[#191919] font-semibold text-[15px] hover:bg-[#F5DC00] focus:outline-none focus:ring-2 focus:ring-[#FEE500]/60 focus:ring-offset-1 focus:ring-offset-emerald-950 transition-colors disabled:opacity-60"
              whileTap={{ scale: 0.99 }}
              disabled={isLoading}
              aria-label="카카오로 로그인"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path fill="#191919" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L8.5 21.5c-1.5-1.5-3-3-3-5.5 0-4.521 4.701-8.185 10.5-8.185z"/>
              </svg>
              카카오로 로그인
            </motion.button>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                onClick={handleGoogleLogin}
                className="flex justify-center items-center px-2 py-2.5 border border-white/10 bg-white/95 text-gray-800 rounded-lg hover:bg-white transition-colors text-sm disabled:opacity-60"
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
                aria-label="Google로 로그인"
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
                onClick={handleNaverLogin}
                className="flex justify-center items-center px-2 py-2.5 border border-[#03C75A] bg-[#03C75A] text-white rounded-lg hover:bg-[#02b351] transition-colors text-sm disabled:opacity-60"
                whileTap={{ scale: 0.99 }}
                disabled={isLoading}
                aria-label="네이버로 로그인"
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

          {showSnsLogin && loginError && (
            <div className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2" aria-live="assertive">
              {loginError}
            </div>
          )}

          {!showSnsLogin && loginError && (
            <div className="text-red-300/95 text-xs text-center bg-red-500/15 border border-red-500/25 rounded-md px-3 py-2" aria-live="assertive">
              {loginError}
            </div>
          )}

          {/* 이메일 로그인 (접기/펼치기 · 소형) */}
          {!showSnsLogin && (
            <div className="pt-1 border-t border-emerald-800/40">
              <button
                type="button"
                onClick={() => setEmailLoginOpen((o) => !o)}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs text-emerald-400/95 hover:text-emerald-300 transition-colors"
                aria-expanded={emailLoginOpen}
              >
                <span>이메일로 로그인</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${emailLoginOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {emailLoginOpen && (
                <form className="space-y-2 mt-1" onSubmit={handleLogin}>
                  <div className="relative">
                    <label htmlFor="email" className="sr-only">이메일</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                      placeholder="이메일"
                    />
                    {showSuggestions && accountSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-emerald-950 border border-emerald-800/60 rounded-md shadow-md z-10">
                        <div className="p-2">
                          <div className="text-[11px] text-emerald-500 mb-1">로그인 제안</div>
                          {accountSuggestions.map((suggestion, index) => (
                            <div key={index} className="text-[11px] text-emerald-300/90 py-0.5">
                              • {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <label htmlFor="password" className="sr-only">비밀번호</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-emerald-800/60 bg-emerald-950/40 placeholder-emerald-600 text-emerald-100 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                    placeholder="비밀번호"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 text-sm font-medium rounded-md text-emerald-50 bg-emerald-800/50 border border-emerald-700/40 hover:bg-emerald-800/70 focus:outline-none focus:ring-1 focus:ring-emerald-500/60 disabled:opacity-60"
                    disabled={isLoading}
                    aria-label="이메일로 로그인"
                  >
                    {isLoading ? '처리 중…' : '로그인'}
                  </button>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isLoading || passwordResetSent}
                      className="text-[11px] text-emerald-500 hover:text-emerald-400 disabled:opacity-50"
                    >
                      {passwordResetSent ? '재설정 메일 발송됨' : '비밀번호 찾기'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="text-center pt-1">
            <p className="text-[11px] text-emerald-600">
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline">
                회원가입
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
const LoginPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingLogin />}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;