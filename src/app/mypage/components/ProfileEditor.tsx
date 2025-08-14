"use client";

import React, { useState, useEffect, startTransition } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface ProfileEditorProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditor({ onClose, onUpdate }: ProfileEditorProps) {
  const { user: authUser } = useFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false); // 데이터 로딩 상태 분리
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // 폼 상태
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    occupation: '',
    interests: [] as string[],
    bio: ''
  });

  // 관심사 옵션
  const interestOptions = [
    '심리학', '상담', '자기계발', '인간관계', '스트레스 관리',
    '감정 관리', '직업 상담', '가족 상담', '학습', '건강'
  ];

  // 날짜 선택기 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Firebase Auth 원본 사용자 객체 가져오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      
      // 사용자 인증 상태가 변경될 때마다 토큰 유효성 검증
      if (user) {
        user.getIdToken(true).catch((error) => {
          console.error('토큰 갱신 실패:', error);
          setMessageType('error');
          setMessage('인증 토큰을 갱신할 수 없습니다. 다시 로그인해주세요.');
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (authUser) {
        try {
          setIsDataLoading(true); // 데이터 로딩 시작
          console.log('사용자 데이터 로드 시작...');
          // Firestore에서 사용자 정보 가져오기
          const userRef = doc(db, 'users', authUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const birthDate = userData.birthDate || '';
            
            // 기존 생년월일이 있으면 선택된 값들도 설정
            if (birthDate) {
              const date = new Date(birthDate);
              setSelectedYear(date.getFullYear());
              setSelectedMonth(date.getMonth() + 1);
              setSelectedDay(date.getDate());
            }
            
            setFormData({
              displayName: authUser.displayName || userData.displayName || '',
              email: authUser.email || '',
              phoneNumber: userData.phoneNumber || '',
              birthDate: birthDate,
              gender: userData.gender || '',
              occupation: userData.occupation || '',
              interests: userData.interests || [],
              bio: userData.bio || ''
            });
            console.log('사용자 데이터 로드 완료:', { displayName: authUser.displayName, birthDate });
          } else {
            // Firestore에 데이터가 없으면 기본값 설정
            setFormData({
              displayName: authUser.displayName || '',
              email: authUser.email || '',
              phoneNumber: '',
              birthDate: '',
              gender: '',
              occupation: '',
              interests: [],
              bio: ''
            });
            console.log('새 사용자 기본값 설정 완료');
          }
        } catch (error) {
          console.error('사용자 데이터 로드 오류:', error);
          // 오류 발생 시 기본값 설정
          setFormData({
            displayName: authUser.displayName || '',
            email: authUser.email || '',
            phoneNumber: '',
            birthDate: '',
            gender: '',
            occupation: '',
            interests: [],
            bio: ''
          });
        } finally {
          setIsDataLoading(false); // 데이터 로딩 완료
        }
      }
    };

    // authUser가 변경될 때만 실행하고, 이미 데이터가 로드되었는지 확인
    // formData.displayName이 비어있고, 데이터 로딩 중이 아닐 때만 실행
    if (authUser && !formData.displayName && !isDataLoading) {
      loadUserData();
    }
  }, [authUser]); // formData 제거하여 무한 루프 완전 방지

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // 날짜 선택 핸들러 - 완전 최적화된 버전
  const handleDateSelect = (year: number, month: number, day: number, event?: React.MouseEvent) => {
    console.log('날짜 선택 시작:', { year, month, day });
    
    // 날짜 선택 시 모달이 닫히지 않도록 이벤트 전파 중단
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // 현재 선택된 값과 동일한지 확인하여 불필요한 상태 변경 방지
    if (selectedYear === year && selectedMonth === month && selectedDay === day) {
      console.log('동일한 날짜가 이미 선택됨, 상태 변경 생략');
      setShowDatePicker(false);
      return;
    }
    
    // 날짜 선택기 상태 업데이트 (배치로 처리)
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    console.log('포맷된 날짜:', formattedDate);
    
    // 현재 formData의 birthDate와 동일한지 확인
    if (formData.birthDate === formattedDate) {
      console.log('생년월일이 동일함, 상태 업데이트 생략');
      setShowDatePicker(false);
      return;
    }
    
    // 모든 상태를 한 번에 업데이트하여 불필요한 리렌더링 방지
    // React 18의 배치 업데이트를 활용
    startTransition(() => {
      setSelectedYear(year);
      setSelectedMonth(month);
      setSelectedDay(day);
      
      setFormData(prev => ({
        ...prev,
        birthDate: formattedDate
      }));
    });
    
    // 날짜 선택 후 날짜 선택기는 닫지만, 모달은 유지
    setShowDatePicker(false);
    
    console.log('날짜 선택 완료, 모달 상태:', { showDatePicker: false, modalOpen: true });
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${(date.getMonth() + 1).toString().padStart(2, '0')}. ${date.getDate().toString().padStart(2, '0')}.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1단계: 기본 인증 상태 검증
    if (!firebaseUser || !authUser) {
      setMessageType('error');
      setMessage('사용자 인증 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    // 2단계: 사용자 ID 일치성 검증
    const userId = authUser.uid || firebaseUser.uid;
    if (!userId) {
      setMessageType('error');
      setMessage('사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.');
      return;
    }

    // 3단계: 토큰 유효성 검증 및 갱신
    try {
      console.log('토큰 유효성 검증 시작...');
      const token = await firebaseUser.getIdToken(true);
      console.log('토큰 갱신 성공:', token ? '유효함' : '무효함');
      
      if (!token) {
        throw new Error('토큰이 생성되지 않았습니다.');
      }
    } catch (authError: any) {
      console.error('토큰 검증 실패:', authError);
      setMessageType('error');
      setMessage('인증 토큰이 만료되었습니다. 다시 로그인해주세요.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // 4단계: Firebase Auth 프로필 업데이트
      if (formData.displayName !== firebaseUser.displayName) {
        console.log('Firebase Auth 프로필 업데이트 시작...');
        await updateProfile(firebaseUser, {
          displayName: formData.displayName
        });
        console.log('Firebase Auth 프로필 업데이트 성공');
      }

      // 5단계: Firestore 데이터 저장 - 권한 문제 완전 해결
      const userRef = doc(db, 'users', userId);
      console.log('Firestore 문서 참조 생성:', userRef.path);

      const writeData = {
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate,
        gender: formData.gender,
        occupation: formData.occupation,
        interests: formData.interests,
        bio: formData.bio,
        updatedAt: serverTimestamp(),
        uid: userId,
        lastModified: new Date().toISOString(),
        authProvider: firebaseUser.providerData[0]?.providerId || 'unknown',
      } as const;

      console.log('저장할 데이터:', writeData);

      // 6단계: 다단계 저장 시도 - 권한 문제 완전 해결
      let saveSuccess = false;
      let lastError: any = null;
      let attemptCount = 0;

      // 1차 시도: 기본 저장
      try {
        attemptCount++;
        console.log(`=== ${attemptCount}차 저장 시도 시작 ===`);
        await setDoc(userRef, writeData, { merge: true });
        saveSuccess = true;
        console.log(`✅ ${attemptCount}차 저장 성공!`);
      } catch (err: any) {
        lastError = err;
        console.log(`❌ ${attemptCount}차 저장 실패:`, err.code, err.message);
        
        // 2차 시도: 토큰 재갱신 후 저장
        if (err?.code === 'permission-denied' || err?.code === 'unauthenticated') {
          try {
            attemptCount++;
            console.log(`=== ${attemptCount}차 저장 시도 (토큰 재갱신 후) ===`);
            await firebaseUser.getIdToken(true);
            await setDoc(userRef, writeData, { merge: true });
            saveSuccess = true;
            console.log(`✅ ${attemptCount}차 저장 성공! (토큰 재갱신 후)`);
          } catch (retryErr: any) {
            lastError = retryErr;
            console.log(`❌ ${attemptCount}차 저장 실패 (토큰 재갱신 후):`, retryErr.code, retryErr.message);
            
            // 3차 시도: 문서 존재 여부 확인 후 조건부 저장
            try {
              attemptCount++;
              console.log(`=== ${attemptCount}차 저장 시도 (문서 존재 여부 확인 후) ===`);
              const userDoc = await getDoc(userRef);
              console.log('문서 존재 여부:', userDoc.exists());
              
              if (userDoc.exists()) {
                console.log('기존 문서 업데이트 시도...');
                await setDoc(userRef, writeData, { merge: true });
              } else {
                console.log('새 문서 생성 시도...');
                await setDoc(userRef, {
                  ...writeData,
                  createdAt: serverTimestamp(),
                });
              }
              saveSuccess = true;
              console.log(`✅ ${attemptCount}차 저장 성공! (문서 존재 여부 확인 후)`);
            } catch (finalErr: any) {
              lastError = finalErr;
              console.log(`❌ ${attemptCount}차 저장 실패 (문서 존재 여부 확인 후):`, finalErr.code, finalErr.message);
              
              // 4차 시도: 최종 권한 확인 및 사용자 안내
              if (finalErr?.code === 'permission-denied') {
                console.log('최종 권한 확인 시도...');
                try {
                  // 사용자 권한 상태 재확인
                  const currentUser = auth.currentUser;
                  if (currentUser) {
                    const freshToken = await currentUser.getIdToken(true);
                    console.log('새로운 토큰으로 최종 시도...');
                    await setDoc(userRef, writeData, { merge: true });
                    saveSuccess = true;
                    console.log(`✅ ${attemptCount + 1}차 저장 성공! (최종 권한 확인 후)`);
                  }
                } catch (ultimateErr: any) {
                  lastError = ultimateErr;
                  console.log('최종 시도 실패:', ultimateErr.code, ultimateErr.message);
                }
              }
            }
          }
        }
      }

      if (!saveSuccess) {
        console.log('모든 저장 시도 실패. 마지막 오류:', lastError);
        throw lastError;
      }

      // 7단계: 성공 처리
      setMessageType('success');
      setMessage('프로필이 성공적으로 업데이트되었습니다!');
      
      console.log('프로필 업데이트 완료!');
      
      // 부모 컴포넌트에 업데이트 알림
      onUpdate();
      
      // 모달 내부에서 상단으로 스크롤하여 성공 메시지 표시
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // 3초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (error: any) {
      console.error('프로필 업데이트 최종 오류:', error);
      setMessageType('error');
      
      // 8단계: 구체적이고 실행 가능한 에러 메시지 제공
      let errorMessage = '프로필 업데이트 중 오류가 발생했습니다.';
      let actionHint = '';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = '보안을 위해 다시 로그인해주세요.';
        actionHint = '로그인 페이지로 이동하여 다시 인증해주세요.';
      } else if (error.code === 'permission-denied') {
        errorMessage = '데이터베이스 접근 권한이 제한되었습니다.';
        actionHint = '페이지를 새로고침하고 다시 시도해주세요. 권한 문제가 지속되면 관리자에게 문의해주세요.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = '로그인 세션이 만료되었습니다.';
        actionHint = '다시 로그인해주세요.';
      } else if (error.code === 'unavailable') {
        errorMessage = '네트워크 연결을 확인해주세요.';
        actionHint = '인터넷 연결 상태를 확인하고 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'not-found') {
        errorMessage = '사용자 정보를 찾을 수 없습니다.';
        actionHint = '다시 로그인해주세요.';
      } else if (error.code === 'resource-exhausted') {
        errorMessage = '서버 리소스가 부족합니다.';
        actionHint = '잠시 후 다시 시도해주세요.';
      } else if (error.message) {
        errorMessage = `오류: ${error.message}`;
        actionHint = '문제가 지속되면 관리자에게 문의해주세요.';
      }
      
      setMessage(`${errorMessage} ${actionHint}`);
      
      // 에러 발생 시에도 모달 내부에서 상단으로 스크롤하여 메시지 표시
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        modalContent.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsLoading(false);
    }
  };

    // 포털을 사용하여 body에 직접 렌더링
  if (typeof window === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
             <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="modal-content bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl border border-emerald-500/30 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
              >
        {/* 헤더 */}
        <div className="relative px-8 py-6 border-b border-gradient-to-r from-emerald-500/30 to-blue-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">프로필 편집</h2>
              <p className="text-emerald-300 text-sm mt-1">개인정보를 수정하고 관리하세요</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메시지 표시 - 헤더 바로 아래에 고정 */}
        {message && (
          <div className={`mx-6 my-6 p-6 rounded-xl border-l-4 shadow-lg ${
            messageType === 'success' 
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-l-green-400 border border-green-500/20 text-green-200' 
              : 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-l-red-400 border border-red-500/20 text-red-200'
          }`}>
            <div className="flex items-center space-x-3">
              {messageType === 'success' ? (
                <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0 w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* 데이터 로딩 중일 때만 로딩 표시 */}
          {isDataLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-emerald-300 text-sm">정보를 불러오는 중입니다...</p>
              </div>
            </div>
          )}
          
          {/* 데이터 로딩이 완료된 후에만 폼 내용 표시 */}
          {!isDataLoading && (
            <>
              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">기본 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">이름</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">이메일</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                      placeholder="이메일 (수정 불가)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">전화번호</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                      placeholder="전화번호를 입력하세요"
                    />
                  </div>
                  
                                     <div className="relative">
                     <label className="block text-sm font-medium text-emerald-300 mb-2">생년월일</label>
                     <div 
                       className="relative cursor-pointer"
                       onClick={(e) => {
                         e.stopPropagation();
                         e.preventDefault();
                         setShowDatePicker(!showDatePicker);
                       }}
                       onMouseDown={(e) => {
                         e.stopPropagation();
                         e.preventDefault();
                       }}
                       onMouseUp={(e) => {
                         e.stopPropagation();
                         e.preventDefault();
                       }}
                     >
                       <input
                         type="text"
                         value={formatDate(formData.birthDate)}
                         readOnly
                         className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300 cursor-pointer"
                         placeholder="연도. 월. 일."
                       />
                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                         <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 0 002 2z" />
                         </svg>
                       </div>
                     </div>
                    
                                         {/* 커스텀 날짜 선택기 */}
                     {showDatePicker && (
                       <div 
                         className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-xl shadow-2xl border border-emerald-500/30 z-[99999] p-4"
                         onClick={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                         onMouseDown={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                         onMouseUp={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                         onPointerDown={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                         onPointerUp={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                         onTouchStart={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                         onTouchEnd={(e) => {
                           e.stopPropagation();
                           e.preventDefault();
                         }}
                       >
                        {/* 연도 선택 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-emerald-300">연도 선택</span>
                                                         <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 e.preventDefault();
                                 setShowDatePicker(false);
                               }}
                               onMouseDown={(e) => e.stopPropagation()}
                               onMouseUp={(e) => e.stopPropagation()}
                               className="text-gray-400 hover:text-white"
                             >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
                                                         {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                               <button
                                 key={year}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   e.preventDefault();
                                   setSelectedYear(year);
                                 }}
                                 onMouseDown={(e) => e.stopPropagation()}
                                 onMouseUp={(e) => e.stopPropagation()}
                                 className={`px-2 py-1 text-xs rounded flex items-center justify-center min-h-[28px] ${
                                   selectedYear === year
                                     ? 'bg-emerald-500 text-white'
                                     : 'text-emerald-300 hover:bg-emerald-500/20'
                                 }`}
                               >
                                 {year}
                               </button>
                             ))}
                          </div>
                        </div>
                        
                                                 {/* 월 선택 */}
                         <div className="mb-4">
                           <span className="text-sm font-medium text-emerald-300 block mb-2">월 선택</span>
                           <div className="grid grid-cols-3 gap-1">
                             {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                               <button
                                 key={month}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   e.preventDefault();
                                   setSelectedMonth(month);
                                 }}
                                 onMouseDown={(e) => e.stopPropagation()}
                                 onMouseUp={(e) => e.stopPropagation()}
                                 className={`px-3 py-1 text-sm rounded ${
                                   selectedMonth === month
                                     ? 'bg-blue-500 text-white'
                                     : 'text-blue-300 hover:bg-blue-500/20'
                                 }`}
                               >
                                 {month}월
                               </button>
                             ))}
                           </div>
                         </div>
                        
                        {/* 일 선택 */}
                        <div>
                          <span className="text-sm font-medium text-emerald-300 block mb-2">일 선택</span>
                          <div className="grid grid-cols-7 gap-1">
                            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                              <div key={day} className="text-xs text-gray-400 text-center py-1">
                                {day}
                              </div>
                            ))}
                                                         {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map((day) => (
                               <button
                                 key={day}
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   e.preventDefault();
                                   handleDateSelect(selectedYear, selectedMonth, day, e);
                                 }}
                                 onMouseDown={(e) => e.stopPropagation()}
                                 onMouseUp={(e) => e.stopPropagation()}
                                 className={`px-2 py-1 text-xs rounded ${
                                   selectedDay === day
                                     ? 'bg-purple-500 text-white'
                                     : 'text-purple-300 hover:bg-purple-500/20'
                                 }`}
                               >
                                 {day}
                               </button>
                             ))}
                          </div>
                        </div>
                        
                                                 {/* 하단 버튼 */}
                         <div className="flex justify-between mt-4 pt-4 border-t border-white/20">
                                                       <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                // 생년월일을 빈 값으로 설정
                                setFormData(prev => ({
                                  ...prev,
                                  birthDate: ''
                                }));
                                // 선택된 연도, 월, 일을 초기화
                                setSelectedYear(new Date().getFullYear());
                                setSelectedMonth(new Date().getMonth() + 1);
                                setSelectedDay(new Date().getDate());
                                // 날짜 선택기 닫기
                                setShowDatePicker(false);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onMouseUp={(e) => e.stopPropagation()}
                              className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                            >
                              삭제
                            </button>
                                                       <button
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                // 현재 선택된 연도, 월, 일로 날짜 설정
                                // 일을 선택하지 않았더라도 현재 선택된 일을 사용
                                const currentDay = selectedDay || 1; // 일이 선택되지 않았으면 1일로 기본 설정
                                handleDateSelect(selectedYear, selectedMonth, currentDay, e);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              onMouseUp={(e) => e.stopPropagation()}
                              className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600"
                            >
                              완료
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">성별</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                      style={{
                        color: 'white'
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#1e293b', color: 'white' }}>선택하세요</option>
                      <option value="male" style={{ backgroundColor: '#1e293b', color: 'white' }}>남성</option>
                      <option value="female" style={{ backgroundColor: '#1e293b', color: 'white' }}>여성</option>
                      <option value="other" style={{ backgroundColor: '#1e293b', color: 'white' }}>기타</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-emerald-300 mb-2">직업</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                      placeholder="직업을 입력하세요"
                    />
                  </div>
                </div>
              </div>

              {/* 관심사 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">관심사</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interestOptions.map((interest) => (
                    <label key={interest} className="flex items-center space-x-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => handleInterestChange(interest)}
                        className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500/50 focus:ring-2"
                      />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">
                        {interest}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 자기소개 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">자기소개</h3>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300 resize-none"
                  placeholder="자기소개를 입력하세요..."
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all duration-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    isLoading 
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <span>저장</span>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
} 