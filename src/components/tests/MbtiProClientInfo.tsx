'use client';

import React, { ChangeEvent, FC, useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface MbtiProClientInfoProps {
  onSubmit: (clientInfo: ClientInfo) => void;
  isPersonalTest?: boolean;
  initialData?: ClientInfo | null;
  onBack?: (clientInfo: ClientInfo) => void;
}

export interface ClientInfo {
  birthYear: number;
  groupCode: string;
  groupPassword?: string;
  gender: string;
  maritalStatus: string;
  name?: string;
  privacyAgreed: boolean;
  phone: string;
}

const MbtiProClientInfo: FC<MbtiProClientInfoProps> = ({ onSubmit, isPersonalTest, initialData, onBack }) => {
  const router = useRouter();
  const [birthYear, setBirthYear] = useState<number>(initialData?.birthYear || 0);
  const [groupCode, setGroupCode] = useState<string>(initialData?.groupCode || '');
  const [groupPassword, setGroupPassword] = useState<string>(initialData?.groupPassword || '');
  const [gender, setGender] = useState<string>(initialData?.gender || '');
  const [maritalStatus, setMaritalStatus] = useState<string>(initialData?.maritalStatus || '');
  const [name, setName] = useState<string>(initialData?.name || '');
  const [showYearSelector, setShowYearSelector] = useState<boolean>(false);
  const [privacyAgreed, setPrivacyAgreed] = useState<boolean>(initialData?.privacyAgreed ?? true);
  const [phone, setPhone] = useState<string>(initialData?.phone || '');
  const [errors, setErrors] = useState<{
    birthYear?: string;
    gender?: string;
    maritalStatus?: string;
    name?: string;
    privacyAgreed?: string;
    phone?: string;
  }>({});
  const [isClient, setIsClient] = useState<boolean>(false);
  
  const birthYearRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const maritalStatusRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setBirthYear(initialData.birthYear || 0);
      setGroupCode(initialData.groupCode || '');
      setGroupPassword(initialData.groupPassword || '');
      setGender(initialData.gender || '');
      setMaritalStatus(initialData.maritalStatus || '');
      setName(initialData.name || '');
      setPrivacyAgreed(initialData.privacyAgreed ?? true);
      setPhone(initialData.phone || '');
    }
  }, [initialData]);

  // 연도 선택기 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showYearSelector && birthYearRef.current && !birthYearRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('.year-selector')) {
        setShowYearSelector(false);
      }
    }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showYearSelector]);

  const validateForm = (): boolean => {
    const newErrors: {
      birthYear?: string;
      gender?: string;
      maritalStatus?: string;
      name?: string;
      privacyAgreed?: string;
      phone?: string;
    } = {};

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    if (!birthYear || birthYear < minYear || birthYear > currentYear) {
      newErrors.birthYear = '올바른 출생년도를 입력해주세요.';
    }

    if (!gender) {
      newErrors.gender = '성별을 선택해주세요.';
    }

    if (!maritalStatus) {
      newErrors.maritalStatus = '결혼 상태를 선택해주세요.';
    }

    if (!name || !name.trim()) {
      newErrors.name = '이름(가명)을 입력해주세요.';
    }

    if (!privacyAgreed) {
      newErrors.privacyAgreed = '개인정보 활용에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const clientInfo: ClientInfo = {
        birthYear,
        groupCode,
        groupPassword,
        gender,
        maritalStatus,
        name: name.trim(),
        privacyAgreed,
        phone: phone.trim()
      };
      
      onSubmit(clientInfo);
    }
  };

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: undefined }));
    }
  };

  const handleMaritalStatusSelect = (selectedStatus: string) => {
    setMaritalStatus(selectedStatus);
    if (errors.maritalStatus) {
      setErrors(prev => ({ ...prev, maritalStatus: undefined }));
    }
  };

  const handlePrivacyChange = () => {
    setPrivacyAgreed(!privacyAgreed);
    if (errors.privacyAgreed) {
      setErrors(prev => ({ ...prev, privacyAgreed: undefined }));
    }
  };

  const currentYear = new Date().getFullYear();
  // 7열 x 15행 = 105년을 한 화면에 표시
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-emerald-950 text-white py-4 px-4 overflow-hidden relative">
      <style jsx>{`
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        .blink-animation {
          animation: blink 1s ease-in-out 3;
        }
      `}</style>
      
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <Navigation />
      
      <div className="h-4"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-white mb-4">
            전문가용 MBTI 검사
          </h1>
          <p className="text-emerald-300 max-w-lg mx-auto">
            검사 진행을 위해 기본 정보를 입력해주세요.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8"
        >
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6" 
            autoComplete="off" 
            autoCapitalize="off" 
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
          >
            {isClient && (
              <div style={{position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden'}}>
                <input type="text" name="username" id="username" autoComplete="username" />
                <input type="password" name="password" id="password" autoComplete="current-password" />
                <input type="email" name="email" id="email" autoComplete="email" />
                <input type="text" name="address" id="address" autoComplete="street-address" />
                <input type="text" name="cc-number" id="cc-number" autoComplete="cc-number" />
                <input type="text" name="cc-exp" id="cc-exp" autoComplete="cc-exp" />
              </div>
            )}

            {/* 이름(가명) */}
            <div className="bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30">
              <div className="mt-2">
                <label htmlFor="name-field" className="block text-sm font-medium text-emerald-300 mb-1">
                  이름(가명) <span className="text-red-400">*</span>
              </label>
                  <input 
                    type="text"
                  id="name-field"
                  name="name_random_field"
                    value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="이름(가명)을 입력하세요"
                    autoComplete="off"
                    autoCorrect="off"
                  autoCapitalize="off"
                    spellCheck="false"
                  ref={nameRef}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name}</p>
                )}
              </div>
            </div>

            {/* 출생년도 */}
            <div className="bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30 relative">
              <div className="mt-2">
                <label htmlFor="birth-year-field" className="block text-sm font-medium text-emerald-300 mb-1">
                  출생년도 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                    id="birth-year-field"
                    name="birth_year_random_name"
                    value={birthYear || ''}
                  onClick={() => setShowYearSelector(true)}
                    readOnly
                    className="w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-pointer"
                    placeholder="출생년도를 선택하세요"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    aria-autocomplete="none"
                    ref={birthYearRef}
                  />
                </div>
                {errors.birthYear && (
                  <p className="mt-2 text-sm text-red-400">{errors.birthYear}</p>
                )}
              </div>
              
              {/* 연도 선택 그리드 */}
              {showYearSelector && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="year-selector absolute top-full left-0 right-0 mt-2 z-50 bg-emerald-900/95 backdrop-blur-sm border border-emerald-700 rounded-lg p-4 shadow-lg"
                  >
                    <div className="grid grid-cols-10 gap-x-2 gap-y-1">
                      {years.map((year, idx) => {
                        const columnIndex = (idx % 10) + 1; // 1~10 (가로)
                        const rowIndex = Math.floor(idx / 10) + 1; // 1~N (세로)
                        const blueBand = (columnIndex >= 4 && columnIndex <= 7) || (rowIndex >= 4 && rowIndex <= 7);
                        return (
                        <motion.button
                          key={year}
                          type="button"
                          onClick={() => {
                            setBirthYear(year);
                            setShowYearSelector(false);
                            if (errors.birthYear) {
                              setErrors(prev => ({ ...prev, birthYear: undefined }));
                            }
                          }}
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(5, 150, 105, 0.3)' }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded transition-colors ${
                            birthYear === year
                              ? 'bg-emerald-600 text-white border-2 border-emerald-500'
                              : `${blueBand ? 'bg-sky-900/30' : 'bg-emerald-800/70'} text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70`
                          }`}
                          style={{ height: '70%' }}
                        >
                          {year}
                        </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* 성별과 결혼상태 */}
            <div className={`grid grid-cols-2 gap-4 ${showYearSelector ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* 성별 */}
              <div className="bg-teal-500/15 p-4 rounded-lg border border-teal-400/20">
                <div className="mt-2">
                  <label className="block text-sm font-medium text-emerald-300 mb-1">
                    성별 <span className="text-red-400">*</span>
              </label>
                  <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                      onClick={() => handleGenderSelect('남성')}
                      whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                      className={`py-3 px-2 text-sm font-medium rounded-lg transition-colors ${
                        gender === '남성'
                          ? 'bg-teal-600 text-white border-2 border-teal-500'
                          : 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-1">👨</span>
                        남성
                      </div>
                </motion.button>
                <motion.button
                  type="button"
                      onClick={() => handleGenderSelect('여성')}
                      whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                      className={`py-3 px-2 text-sm font-medium rounded-lg transition-colors ${
                        gender === '여성'
                          ? 'bg-teal-600 text-white border-2 border-teal-500'
                          : 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-1">👩</span>
                        여성
                      </div>
                </motion.button>
              </div>
              {errors.gender && (
                    <p className="mt-2 text-sm text-red-400">{errors.gender}</p>
              )}
                </div>
            </div>

              {/* 결혼상태 */}
              <div className="bg-teal-500/15 p-4 rounded-lg border border-teal-400/20">
                <div className="mt-2">
                  <label className="block text-sm font-medium text-emerald-300 mb-1">
                    결혼 상태 <span className="text-red-400">*</span>
              </label>
                  <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                      onClick={() => handleMaritalStatusSelect('미혼')}
                      whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                      className={`py-3 px-2 text-sm font-medium rounded-lg transition-colors ${
                    maritalStatus === '미혼'
                          ? 'bg-teal-600 text-white border-2 border-teal-500'
                          : 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-1">💍</span>
                        미혼
                      </div>
                </motion.button>
                <motion.button
                  type="button"
                      onClick={() => handleMaritalStatusSelect('기혼')}
                      whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                      className={`py-3 px-2 text-sm font-medium rounded-lg transition-colors ${
                    maritalStatus === '기혼'
                          ? 'bg-teal-600 text-white border-2 border-teal-500'
                          : 'bg-emerald-800/70 text-emerald-200 border border-emerald-700 hover:bg-emerald-700/70'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <span className="mr-1">💑</span>
                        기혼
                      </div>
                </motion.button>
              </div>
              {errors.maritalStatus && (
                    <p className="mt-2 text-sm text-red-400">{errors.maritalStatus}</p>
              )}
            </div>
                  </div>
                </div>
                
            {/* 검사코드 입력 부분은 별도 화면으로 분리됨 */}

            {/* 개인정보 활용 동의 */}
            <div 
              className={`bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30 hover:bg-emerald-800/40 transition-colors ${showYearSelector ? 'opacity-30 pointer-events-none' : ''}`}
              ref={privacyRef}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // 체크박스 자체 클릭은 기본 동작 유지 (이중 토글 방지)
                if (target.closest('input[type="checkbox"]')) return;
                handlePrivacyChange();
              }}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="privacy"
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={handlePrivacyChange}
                    className="w-4 h-4 text-emerald-600 bg-emerald-900 border-emerald-500 rounded focus:ring-emerald-500 focus:ring-2"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="privacy" className="font-medium text-emerald-200 cursor-pointer select-none">
                    개인정보 활용 동의 <span className="text-red-400">*</span>
                  </label>
                  <p className="text-emerald-300/80 mt-1 cursor-pointer select-none">
                    검사 결과 분석 및 상담을 위한 개인정보 수집·이용에 동의합니다.
                  </p>
                </div>
              </div>
              {errors.privacyAgreed && (
                <p className="mt-2 text-sm text-red-400">{errors.privacyAgreed}</p>
              )}
            </div>

            <div className={`flex justify-between items-center pt-4 ${showYearSelector ? 'opacity-30 pointer-events-none' : ''}`}>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-3 bg-gray-700/60 text-gray-200 font-medium rounded-lg shadow-sm hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-emerald-900"
                onClick={() => {
                  const currentInfo: ClientInfo = {
                    birthYear,
                    groupCode,
                    groupPassword,
                    gender,
                    maritalStatus,
                    name: name.trim(),
                    privacyAgreed,
                    phone: phone.trim()
                  };
                  try {
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('mbti_pro_client_info', JSON.stringify(currentInfo));
                    }
                  } catch {}
                  if (typeof onBack === 'function') {
                    onBack(currentInfo);
                  }
                }}
              >
                이전 페이지
              </motion.button>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900"
              >
                검사 시작하기
              </motion.button>
            </div>
          </form>
        </motion.div>

        <div className="mt-8 text-center text-sm text-emerald-400/70">
          <p>* 필수 항목을 모두 입력해주세요.</p>
          <p>* 개인정보는 검사 목적으로만 사용됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MbtiProClientInfo;