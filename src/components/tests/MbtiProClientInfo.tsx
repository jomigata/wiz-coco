'use client';

import React, { ChangeEvent, FC, useEffect, useRef, useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getMbtiProClientInfoTheme } from '@/config/mbtiProClientInfoTheme';

interface MbtiProClientInfoProps {
  onSubmit: (clientInfo: ClientInfo) => void;
  isPersonalTest?: boolean;
  uiTheme?: 'emerald' | 'portal';
  screenTitle?: string;
  hidePreviousPage?: boolean;
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

const MbtiProClientInfo: FC<MbtiProClientInfoProps> = ({
  onSubmit,
  isPersonalTest,
  uiTheme = 'emerald',
  screenTitle,
  hidePreviousPage = false,
  initialData,
  onBack,
}) => {
  const c = getMbtiProClientInfoTheme(uiTheme);
  const heading =
    screenTitle ?? (isPersonalTest ? '개인용 MBTI 검사' : '전문가용 MBTI 검사');
  const choiceClass = (selected: boolean) =>
    `py-3 px-2 text-sm font-medium rounded-lg transition-colors ${
      selected ? c.choiceSelected : c.choiceIdle
    }`;
  const router = useRouter();
  const [birthYear, setBirthYear] = useState<number>(initialData?.birthYear || 0);
  const [birthYearInput, setBirthYearInput] = useState<string>(initialData?.birthYear ? String(initialData.birthYear) : '');
  const [isYearSelected, setIsYearSelected] = useState<boolean>(false); // 년도 선택 여부 추적
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
  const yearButtonRefs = useRef<HTMLButtonElement[]>([]);
  const yearGridRef = useRef<HTMLDivElement>(null);
  const scrollVelocityRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTouchYRef = useRef<number | null>(null);
  
  const birthYearRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const maritalStatusRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const privacyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 개인용 검사일 때 이름 입력칸에 자동 포커스
  useEffect(() => {
    if ((isPersonalTest || uiTheme === 'portal') && nameRef.current) {
      // 약간의 지연을 주어 DOM이 완전히 렌더링된 후 포커스
      const timer = setTimeout(() => {
        nameRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPersonalTest, uiTheme]);

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setBirthYear(initialData.birthYear || 0);
      setBirthYearInput(initialData.birthYear ? String(initialData.birthYear) : '');
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

  // 연도 선택기 열릴 때 초기 스크롤 위치 설정 (1번째 줄이 맨 위에)
  useEffect(() => {
    if (showYearSelector && yearGridRef.current) {
      yearGridRef.current.scrollTop = 0;
    }
  }, [showYearSelector]);

  // requestAnimationFrame 기반 연속 스크롤 루프
  const startAutoScroll = () => {
    if (rafIdRef.current != null) return;
    const step = () => {
      if (!yearGridRef.current) return;
      const grid = yearGridRef.current;
      const v = scrollVelocityRef.current;
      if (Math.abs(v) > 0.1) {
        grid.scrollTop = grid.scrollTop + v;
      }
      rafIdRef.current = requestAnimationFrame(step);
    };
    rafIdRef.current = requestAnimationFrame(step);
  };

  const stopAutoScroll = () => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    scrollVelocityRef.current = 0;
  };

  // 마우스 위치에 따라 자동 스크롤 (가속도 적용, 최고 속도 50% 감속)
  const handleYearGridMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!yearGridRef.current) return;
    
    const grid = yearGridRef.current;
    const rect = grid.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    const gridHeight = rect.height;
    const scrollHeight = grid.scrollHeight;
    const scrollTop = grid.scrollTop;
    
    // 상단 20% 영역: 위로 스크롤
    const topThreshold = gridHeight * 0.2;
    // 하단 20% 영역: 아래로 스크롤
    const bottomThreshold = gridHeight * 0.8;
    
    if (mouseY < topThreshold && scrollTop > 0) {
      // 상단에 가까울수록 더 빠르게
      const intensity = (topThreshold - mouseY) / topThreshold; // 0~1
      const speed = 2 + intensity * 14; // 50% 감속: 2~16px/frame
      scrollVelocityRef.current = -speed;
      startAutoScroll();
    } else if (mouseY > bottomThreshold && scrollTop < scrollHeight - gridHeight) {
      // 하단에 가까울수록 더 빠르게
      const intensity = (mouseY - bottomThreshold) / (gridHeight - bottomThreshold); // 0~1
      const speed = 2 + intensity * 14; // 2~16px/frame
      scrollVelocityRef.current = speed;
      startAutoScroll();
    } else {
      scrollVelocityRef.current = 0;
    }
  };

  // 휠 스크롤 스무스 처리
  const handleYearGridWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!yearGridRef.current) return;
    e.preventDefault();
    const grid = yearGridRef.current;
    grid.scrollBy({ top: e.deltaY, behavior: 'smooth' });
  };

  // 마우스가 영역을 벗어나면 자동 스크롤 중지
  const handleMouseLeave = () => {
    stopAutoScroll();
  };

  // 터치 스와이프 가속 스크롤
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!yearGridRef.current) return;
    lastTouchYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!yearGridRef.current || lastTouchYRef.current == null) return;
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const dy = lastTouchYRef.current - currentY; // 위로 스와이프(+), 아래로 스와이프(-)
    lastTouchYRef.current = currentY;
    // 스와이프 속도를 가변 속도에 매핑 (감속 반영)
    const maxSpeed = 16; // px/frame
    const speed = Math.max(-maxSpeed, Math.min(maxSpeed, dy));
    scrollVelocityRef.current = speed;
    startAutoScroll();
  };

  const handleTouchEnd = () => {
    stopAutoScroll();
    lastTouchYRef.current = null;
  };

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
    const minYear = currentYear - 99;
    if (!birthYear || birthYear < minYear || birthYear > currentYear) {
      newErrors.birthYear = `올바른 출생년도를 입력해주세요. (${minYear}년~${currentYear}년)`;
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
  // 연도 배열 메모이제이션 (성능 최적화)
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => currentYear - i), [currentYear]);

  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const idxAttr = target.getAttribute('data-year-idx');
    if (idxAttr == null) return;
    const idx = parseInt(idxAttr, 10);
    const cols = 10;
    let next = idx;
    if (e.key === 'ArrowRight') next = Math.min(years.length - 1, idx + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1);
    else if (e.key === 'ArrowDown') next = Math.min(years.length - 1, idx + cols);
    else if (e.key === 'ArrowUp') next = Math.max(0, idx - cols);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = years.length - 1;
    else return;
    e.preventDefault();
    const btn = yearButtonRefs.current[next];
    if (btn) btn.focus();
  };

  return (
    <div className={c.shell}>
      <style jsx>{`
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        .blink-animation {
          animation: blink 1s ease-in-out 3;
        }
      `}</style>
      
      {!isPersonalTest && uiTheme !== 'portal' && (
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
      )}
      
      {c.showOrbs && (
        <>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </>
      )}

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-white mb-4">{heading}</h1>
          <p className={`${c.subtitle} max-w-lg mx-auto`}>
            검사 진행을 위해 기본 정보를 입력해주세요.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={c.formCard}
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
            <div className={c.sectionBox}>
              <div className="mt-2">
                <label htmlFor="name-field" className={`block text-sm font-medium ${c.label} mb-1`}>
                  이름(가명) <span className="text-red-400">*</span>
              </label>
                  <input 
                    type="text"
                  id="name-field"
                  name="name_random_field"
                    value={name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  className={c.input}
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
            <div className={`${c.sectionBox} relative`}>
              <div className="mt-2">
                <label htmlFor="birth-year-field" className={`block text-sm font-medium ${c.label} mb-1`}>
                  출생년도 <span className="text-red-400">*</span>
              </label>
                
                {/* 입력칸 - 년도 선택 목록 위로 이동 */}
                <div className="relative">
                  <input
                    type="text"
                    id="birth-year-field"
                    name="birth_year_random_name"
                    value={birthYearInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value;
                      // 숫자만 입력 허용, 최대 4자리
                      const numericValue = value.replace(/[^0-9]/g, '').slice(0, 4);
                      setBirthYearInput(numericValue);
                      
                      // 4자리가 입력되면 자동으로 birthYear 업데이트
                      if (numericValue.length === 4) {
                        const year = parseInt(numericValue, 10);
                        const currentYear = new Date().getFullYear();
                        const minYear = currentYear - 99;
                        
                        if (year >= minYear && year <= currentYear) {
                          setBirthYear(year);
                          setShowYearSelector(false); // 입력 완료 시 목록 닫기
                          if (errors.birthYear) {
                            setErrors(prev => ({ ...prev, birthYear: undefined }));
                          }
                        } else {
                          const currentYear = new Date().getFullYear();
                          const minYear = currentYear - 100;
                          setErrors(prev => ({ 
                            ...prev, 
                            birthYear: `올바른 출생년도를 입력해주세요. (${minYear}년~${currentYear}년)` 
                          }));
                        }
                      } else if (numericValue.length > 0) {
                        // 입력 중일 때는 에러 제거
                        if (errors.birthYear) {
                          setErrors(prev => ({ ...prev, birthYear: undefined }));
                        }
                      }
                    }}
                    onFocus={() => {
                      // 입력칸 클릭 시 년도 목록 표시
                      setShowYearSelector(true);
                    }}
                    onBlur={() => {
                      // 포커스가 벗어날 때 약간의 지연을 주어 클릭 이벤트가 먼저 처리되도록
                      const blurTimeout = setTimeout(() => {
                        // 년도 선택 목록에서 선택한 경우에는 검증하지 않음
                        if (isYearSelected) {
                          setIsYearSelected(false); // 플래그 리셋
                          return;
                        }
                        
                        // birthYear가 설정되어 있고 입력값과 일치하면 선택한 값으로 간주
                        if (birthYear > 0 && String(birthYear) === birthYearInput) {
                          // 선택한 값이므로 검증하지 않음
                          return;
                        }
                        
                        // 포커스가 벗어날 때 유효성 검사
                        if (birthYearInput.length === 4) {
                          const year = parseInt(birthYearInput, 10);
                          const currentYear = new Date().getFullYear();
                          const minYear = currentYear - 99;
                          
                          if (year >= minYear && year <= currentYear) {
                            setBirthYear(year);
                          } else {
                            setBirthYearInput('');
                            setBirthYear(0);
                            const currentYear = new Date().getFullYear();
                            const minYear = currentYear - 99;
                            setErrors(prev => ({ 
                              ...prev, 
                              birthYear: `올바른 출생년도를 입력해주세요. (${minYear}년~${currentYear}년)` 
                            }));
                          }
                        } else if (birthYearInput.length > 0 && birthYearInput.length < 4) {
                          // 4자리가 아닌 경우 초기화 (단, birthYear가 설정되어 있지 않은 경우에만)
                          if (birthYear === 0) {
                            setBirthYearInput('');
                            setBirthYear(0);
                            setErrors(prev => ({ 
                              ...prev, 
                              birthYear: '4자리 연도를 입력해주세요.' 
                            }));
                          }
                        }
                        setShowYearSelector(false);
                      }, 300); // 지연 시간을 300ms로 증가하여 선택 이벤트가 먼저 처리되도록
                      
                      // blurTimeout을 ref에 저장하여 선택 시 취소할 수 있도록
                      if (birthYearRef.current) {
                        (birthYearRef.current as any)._blurTimeout = blurTimeout;
                      }
                    }}
                    className={c.input}
                    placeholder="4자리 연도 입력 또는 클릭하여 선택"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    maxLength={4}
                    inputMode="numeric"
                    ref={birthYearRef}
                  />
                </div>
                
                {/* 경고 문구 - 입력칸과 년도 선택 목록 사이 */}
                {errors.birthYear && (
                  <p className="mt-2 text-sm text-red-400">{errors.birthYear}</p>
                )}
                
                {/* 연도 선택 그리드 - 입력칸 바로 아래 표시 */}
              {showYearSelector && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={c.yearPanel}
                  >
                    <div
                      ref={yearGridRef}
                      role="grid"
                      aria-label="출생년도 선택"
                      className={c.yearGrid}
                      style={{ maxHeight: '336px' }}
                      onKeyDown={handleYearKeyDown}
                      onMouseMove={handleYearGridMouseMove}
                      onMouseLeave={handleMouseLeave}
                      onWheel={handleYearGridWheel}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {years.map((year, idx) => {
                        const columnIndex = (idx % 10) + 1;
                        const rowIndex = Math.floor(idx / 10) + 1;
                        const blueBand = (columnIndex >= 4 && columnIndex <= 7) || (rowIndex >= 4 && rowIndex <= 6);
                        const isSelected = birthYear === year;
                        const isYearEndingWith16 = year % 10 === 1 || year % 10 === 6;
                        return (
                        <motion.button
                          key={year}
                          type="button"
                          role="gridcell"
                          ref={(el: HTMLButtonElement | null) => { if (el) yearButtonRefs.current[idx] = el; }}
                          data-year-idx={idx}
                          aria-current={isSelected ? "true" : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              // onBlur의 setTimeout 취소 (이미 실행 중인 검증 방지)
                              if (birthYearRef.current && (birthYearRef.current as any)?._blurTimeout) {
                                clearTimeout((birthYearRef.current as any)._blurTimeout);
                                (birthYearRef.current as any)._blurTimeout = null;
                              }
                              
                              // 선택한 값으로 강제 설정 (입력하던 값 완전히 무시)
                              setIsYearSelected(true); // 선택 플래그 설정
                              
                              // 입력값을 선택한 값으로 강제 덮어쓰기
                              const yearString = String(year);
                              setBirthYearInput(yearString);
                            setBirthYear(year);
                              
                              // 에러 메시지 즉시 제거
                              setErrors(prev => ({ ...prev, birthYear: undefined }));
                              
                              // 목록 닫기
                              setShowYearSelector(false);
                              
                              // 입력칸 포커스 제거하여 onBlur 이벤트 방지
                              setTimeout(() => {
                                if (birthYearRef.current) {
                                  birthYearRef.current.blur();
                                }
                              }, 0);
                          }}
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(5, 150, 105, 0.3)' }}
                          whileTap={{ scale: 0.95 }}
                          className={`relative flex items-center justify-center px-3 py-2.5 min-h-[44px] text-sm font-medium rounded transition-all ${
                            isSelected
                              ? c.yearSelected
                              : `${blueBand ? 'bg-sky-700/50' : c.yearIdle} ${isYearEndingWith16 ? 'text-yellow-200' : ''}`
                          }`}
                        >
                          {isSelected && (
                            <>
                              <span aria-hidden="true" className={`pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 w-3/5 h-[3px] rounded-full ${c.yearSelectedBar}`} />
                              <span aria-hidden="true" className={`pointer-events-none absolute inset-0 rounded-md ring-2 ${c.yearSelectedRing}`} />
                            </>
                          )}
                          <span>{year}</span>
                        </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
                )}
              </div>
              
            </div>

            {/* 성별과 결혼상태 */}
            <div className={`grid grid-cols-2 gap-4 ${showYearSelector ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* 성별 */}
              <div className={c.genderPanel}>
                <div className="mt-2">
                  <label className={`block text-sm font-medium ${c.label} mb-1`}>
                    성별 <span className="text-red-400">*</span>
              </label>
                  <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                      onClick={() => handleGenderSelect('남성')}
                      whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                      className={choiceClass(gender === '남성')}
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
                      className={choiceClass(gender === '여성')}
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
              <div className={c.genderPanel}>
                <div className="mt-2">
                  <label className={`block text-sm font-medium ${c.label} mb-1`}>
                    결혼 상태 <span className="text-red-400">*</span>
              </label>
                  <div className="grid grid-cols-2 gap-2">
                <motion.button
                  type="button"
                      onClick={() => handleMaritalStatusSelect('미혼')}
                      whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                      className={choiceClass(maritalStatus === '미혼')}
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
                      className={choiceClass(maritalStatus === '기혼')}
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
              className={`${c.privacyBox} ${showYearSelector ? 'opacity-30 pointer-events-none' : ''}`}
              ref={privacyRef}
              role="button"
              aria-pressed={privacyAgreed}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePrivacyChange();
                }
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                // 체크박스 또는 해당 라벨 클릭은 기본 동작 유지 (이중 토글 방지)
                if (target.closest('input[type="checkbox"]') || target.closest('label[for="privacy"]')) return;
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
                    className={c.checkbox}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="privacy" className={`font-medium ${c.privacyLabel} cursor-pointer select-none`}>
                    개인정보 활용 동의 <span className="text-red-400">*</span>
                  </label>
                  <p className={`${c.privacyHint} mt-1 cursor-pointer select-none`}>
                    검사 결과 분석 및 상담을 위한 개인정보 수집·이용에 동의합니다.
                  </p>
                </div>
              </div>
              {errors.privacyAgreed && (
                <p className="mt-2 text-sm text-red-400">{errors.privacyAgreed}</p>
              )}
            </div>

            <div className={`flex ${hidePreviousPage ? 'justify-end' : 'justify-between'} items-center pt-4 ${showYearSelector ? 'opacity-30 pointer-events-none' : ''}`}>
              {!hidePreviousPage && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={
                  isPersonalTest || uiTheme === 'portal'
                    ? c.backBtn
                    : 'px-5 py-3 font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 bg-gray-700/60 text-gray-200 hover:bg-gray-700 focus:ring-gray-500'
                }
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
              )}

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={c.submitBtn}
              >
                검사 시작하기
              </motion.button>
            </div>
          </form>
        </motion.div>

        <div className={`mt-8 text-center text-sm ${c.footerHint}`}>
          <p>* 필수 항목을 모두 입력해주세요.</p>
          <p>* 개인정보는 검사 목적으로만 사용됩니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MbtiProClientInfo;