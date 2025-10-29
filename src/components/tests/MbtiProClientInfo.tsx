'use client';

import React, { ChangeEvent, FC, useEffect, useRef, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface MbtiProClientInfoProps {
  onSubmit: (clientInfo: ClientInfo) => void;
  isPersonalTest?: boolean;
}

export interface ClientInfo {
  birthYear: number;
  groupCode: string;
  groupPassword?: string;
  gender: string;
  maritalStatus: string;
  name?: string;
  privacyAgreed: boolean;
  phone: string; // 사용자 전화번호
}

const MbtiProClientInfo: FC<MbtiProClientInfoProps> = ({ onSubmit, isPersonalTest }) => {
  const router = useRouter();
  const [birthYear, setBirthYear] = useState<number>(0);
  const [groupCode, setGroupCode] = useState<string>('');
  const [groupPassword, setGroupPassword] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [maritalStatus, setMaritalStatus] = useState<string>('');
  const [showGroupCodeInput, setShowGroupCodeInput] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [showYearSelector, setShowYearSelector] = useState<boolean>(false);
  const [privacyAgreed, setPrivacyAgreed] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loginId, setLoginId] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [phone, setPhone] = useState<string>(''); // 전화번호 상태 변수 추가
  const [errors, setErrors] = useState<{
    birthYear?: string;
    groupCode?: string;
    groupPassword?: string;
    gender?: string;
    maritalStatus?: string;
    name?: string;
    privacyAgreed?: string;
    phone?: string; // 전화번호 오류 필드 추가
  }>({});
  
  const formRef = useRef<HTMLFormElement>(null);
  const yearSelectorRef = useRef<HTMLDivElement>(null);
  const birthYearRef = useRef<HTMLInputElement>(null);
  const groupCodeRef = useRef<HTMLInputElement>(null);
  const groupPasswordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null); // 전화번호 참조 추가
  const privacyRef = useRef<HTMLInputElement>(null);

  const [formKey, setFormKey] = useState<string>('initial-form-key');
  
  // 모든 자동완성 방지 조치 후 실제 제출할 히든 필드
  const [hiddenGroupCode, setHiddenGroupCode] = useState<string>('');
  const [hiddenGroupPassword, setHiddenGroupPassword] = useState<string>('');
  
  // 폼 임시 상태들
  const [hiddenFieldsKey, setHiddenFieldsKey] = useState<string>('hidden-fields');
  const [gcFieldId, setGcFieldId] = useState<string>('group-code-field');
  const [pwFieldId, setPwFieldId] = useState<string>('password-field');
  const [nameFieldId, setNameFieldId] = useState<string>('name-field');
  const [isClient, setIsClient] = useState<boolean>(false);
  
  // 랜덤 필드 ID 설정을 위한 상태 (regenerateFieldIds 함수보다 먼저 정의)
  const [randomFieldIds, setRandomFieldIds] = useState({
    groupCode: `gc_${Math.random().toString(36).substring(2, 10)}`,
    groupPassword: `pw_${Math.random().toString(36).substring(2, 10)}`,
    name: `nm_${Math.random().toString(36).substring(2, 10)}`,
    phone: `ph_${Math.random().toString(36).substring(2, 10)}`
  });
  
  // 폼을 서버에 제출하기 전에 실제 입력 값을 히든 필드로 복사
  useEffect(() => {
    setHiddenGroupCode(groupCode);
  }, [groupCode]);
  
  useEffect(() => {
    setHiddenGroupPassword(groupPassword);
  }, [groupPassword]);

  // 타이머 변수 추가
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  
  // 필드 ID 랜덤화 함수 (자동 완성 방지)
  const regenerateFieldIds = React.useCallback(() => {
    setRandomFieldIds({
      groupCode: `gc_${Math.random().toString(36).substring(2, 10)}`,
      groupPassword: `pw_${Math.random().toString(36).substring(2, 10)}`,
      name: `nm_${Math.random().toString(36).substring(2, 10)}`,
      phone: `ph_${Math.random().toString(36).substring(2, 10)}`
    });
  }, []);

  // 자동완성 방지를 위한 공통 함수
  const preventAutocomplete = React.useCallback((field: HTMLInputElement, type: string) => {
    // 필드 값 임시 저장
    const currentValue = field.value;
    
    // 속성 변경 및 값 제거 (자동완성 파괴)
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('data-form-type', 'other');
    field.setAttribute('data-lpignore', 'true');
    
    // 새 랜덤 ID/이름 생성 및 적용
    const randomStr = Math.random().toString(36).substring(2, 15);
    field.name = `${type}_${randomStr}`;
    field.id = `${type}_${randomStr}`;
    
    // 필드 값 및 타입 변경
    const originalType = field.type;
    if (originalType !== 'password') {
      field.type = "search";
    }
    field.value = '';
    
    // 짧은 지연 후 원래 상태로 복원
    setTimeout(() => {
      if (originalType !== 'password') {
        field.type = originalType;
      }
      field.value = currentValue;
    }, 30);
  }, []);

  // 이름 필드에 자동 포커스를 위한 상태
  const [focusApplied, setFocusApplied] = useState<boolean>(false);
  
  // 클라이언트 사이드에서만 실행되는 초기화 로직 useEffect 수정
  useEffect(() => {
    // 클라이언트 사이드 체크
    setIsClient(true);
    
    // 초기 랜덤 폼 키 생성
    setFormKey(Math.random().toString(36).substring(2, 10));
    
    // 필드 ID 설정
    setGcFieldId(`gc_${Math.random().toString(36).substr(2, 9)}`);
    setPwFieldId(`pw_${Math.random().toString(36).substr(2, 9)}`);
    setNameFieldId(`nm_${Math.random().toString(36).substr(2, 9)}`);
    setHiddenFieldsKey(`hf_${Math.random().toString(36).substr(2, 9)}`);
    
    // 초기 필드 ID 랜덤화
    regenerateFieldIds();
    
    // 1.5초 후 랜덤한 키들 갱신 (브라우저 자동완성이 로드된 후)
    const timer = setTimeout(() => {
      setFormKey(Math.random().toString(36).substring(2, 10));
      setGcFieldId(`gc_${Math.random().toString(36).substr(2, 9)}`);
      setPwFieldId(`pw_${Math.random().toString(36).substr(2, 9)}`);
      setNameFieldId(`nm_${Math.random().toString(36).substr(2, 9)}`);
      setHiddenFieldsKey(`hf_${Math.random().toString(36).substr(2, 9)}`);
    }, 1500);
    
    // 5초마다 필드 ID 변경 (자동완성 방지 강화)
    const fieldIdInterval = setInterval(regenerateFieldIds, 5000);
    
    // 비밀번호 오버레이 설정 (0.5초 후 활성화)
    const setupPasswordOverlay = () => {
      const passwordOverlay = document.getElementById('password-overlay');
      if (passwordOverlay) {
        // 초기에는 오버레이를 표시하고, 비밀번호 필드에 포커스 이벤트 설정
        passwordOverlay.style.display = 'block';
        
        // 비밀번호 필드 위에 겹치게 설정
        const pwField = groupPasswordRef.current;
        if (pwField) {
          const rect = pwField.getBoundingClientRect();
          passwordOverlay.style.width = `${rect.width}px`;
          passwordOverlay.style.height = `${rect.height}px`;
        }
      }
      
      // birthYear 필드 오버레이 제거 (만약 있다면)
      const birthYearOverlay = document.getElementById('birthyear-overlay');
      if (birthYearOverlay) {
        birthYearOverlay.style.display = 'none';
      }
    };
    
    // DOM이 완전히 로드된 후 0.5초 후에 오버레이 설정
    const overlayTimer = setTimeout(setupPasswordOverlay, 500);
    
    return () => {
      clearInterval(fieldIdInterval);
      clearTimeout(timer);
      clearTimeout(overlayTimer);
      if (timerId) clearTimeout(timerId);
    };
  }, [regenerateFieldIds, timerId]);

  // 이름 필드에 자동 포커스 설정 (별도의 useEffect로 분리)
  useEffect(() => {
    // 자동 포커스 기능 제거함
    setFocusApplied(true); // 포커스 적용된 것으로 간주
  }, [isClient]);

  // 현재 연도 가져오기
  const currentYear = new Date().getFullYear();
  
  // 연도 리스트 생성 (1930년부터 현재 연도까지)
  const years = Array.from({ length: currentYear - 1929 }, (_, i) => currentYear - i);
  
  // 연도 선택기 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (yearSelectorRef.current && !yearSelectorRef.current.contains(event.target as Node)) {
        setShowYearSelector(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [yearSelectorRef]);
  
  // 이전 정보 복원을 위한 이벤트 리스너
  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;
    
    const handleRestoreInfo = (event: Event) => {
      const customEvent = event as CustomEvent<ClientInfo>;
      const info = customEvent.detail;
      
      if (info) {
        console.log('이전 정보 복원 이벤트 수신:', info);
        setBirthYear(info.birthYear || 0);
        setGender(info.gender || '');
        setMaritalStatus(info.maritalStatus || '');
        
        if (info.groupCode) {
          setGroupCode(info.groupCode);
          setShowGroupCodeInput(true);
        }
        
        if (info.groupPassword) {
          setGroupPassword(info.groupPassword);
        }
        
        if (info.name) {
          setName(info.name);
        }
        
        if (info.privacyAgreed) {
          setPrivacyAgreed(true);
        }
      }
    };
    
    formElement.addEventListener('restore-info', handleRestoreInfo);
    
    return () => {
      formElement.removeEventListener('restore-info', handleRestoreInfo);
    };
  }, []);
  
  // 로컬 스토리지에서 이전 정보 로드
  useEffect(() => {
    const loadPreviousInfo = () => {
      if (typeof window !== 'undefined') {
        const savedInfo = localStorage.getItem('mbti_pro_client_info');
        if (savedInfo) {
          try {
            const parsedInfo = JSON.parse(savedInfo) as ClientInfo;
            console.log('로컬 스토리지에서 이전 정보 로드:', parsedInfo);
            
            // 이전 정보 설정
            setBirthYear(parsedInfo.birthYear || 0);
            setGender(parsedInfo.gender || '');
            setMaritalStatus(parsedInfo.maritalStatus || '');
            
            if (parsedInfo.groupCode) {
              setGroupCode(parsedInfo.groupCode);
              setShowGroupCodeInput(true);
            }
            
            if (parsedInfo.groupPassword) {
              setGroupPassword(parsedInfo.groupPassword);
            }
            
            if (parsedInfo.name) {
              setName(parsedInfo.name);
            }
            
            // 개인정보 동의 상태 설정
            setPrivacyAgreed(true);
            
            // 사용된 정보는 로컬 스토리지에서 삭제
            localStorage.removeItem('mbti_pro_client_info');
          } catch (error) {
            console.error('이전 정보 복원 중 오류 발생:', error);
          }
        }
      }
    };
    
    // 컴포넌트 마운트 후 약간의 지연을 두고 로드
    const timer = setTimeout(loadPreviousInfo, 100);
    return () => clearTimeout(timer);
  }, []);
  
  // 전화번호 형식 변환 함수
  const formatPhoneNumber = (value: string): string => {
    // 숫자만 남기기
    const numbers = value.replace(/[^\d]/g, '');
    
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 전화번호 입력 처리
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    // 최대 13자리로 제한 (000-0000-0000 형식)
    if (formattedPhone.length <= 13) {
      setPhone(formattedPhone);
    }
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    // 오류 데이터 초기화
    const newErrors: {
      birthYear?: string;
      groupCode?: string;
      groupPassword?: string;
      gender?: string;
      maritalStatus?: string;
      name?: string;
      privacyAgreed?: string;
      phone?: string; // 전화번호 오류 필드 추가
    } = {};

    // 필수 필드 순서 정의: 이름, 출생연도, 성별, 결혼상태, 검사코드, 비밀번호, 개인정보 수집 및 이용동의
    const requiredFields = [
      {
        key: 'name',
        condition: !name.trim(),
        message: '이름을 입력해주세요.',
        element: nameRef.current,
        focusDelay: 300
      },
      {
        key: 'birthYear',
        condition: !birthYear || birthYear < 1930 || birthYear > currentYear,
        message: '1930년부터 현재까지의 출생연도를 입력해주세요.',
        element: birthYearRef.current,
        focusDelay: 300
      },
      {
        key: 'gender',
        condition: !gender,
        message: '성별을 선택해주세요.',
        element: document.querySelector('[data-error="gender"]') as HTMLElement,
        focusDelay: 300
      },
      {
        key: 'maritalStatus',
        condition: !maritalStatus,
        message: '결혼 상태를 선택해주세요.',
        element: document.querySelector('[data-error="maritalStatus"]') as HTMLElement,
        focusDelay: 300
      },
      {
        key: 'privacyAgreed',
        condition: !privacyAgreed,
        message: '개인정보 수집 및 이용에 동의해주세요.',
        element: privacyRef.current,
        focusDelay: 300
      }
    ];

    // 첫 번째 오류 필드 찾기
    let firstErrorField = null;
    for (const field of requiredFields) {
      if (field.condition) {
        newErrors[field.key as keyof typeof newErrors] = field.message;
        if (!firstErrorField) {
          firstErrorField = field;
        }
      }
    }

    // 전문가 코드 관련 검사 - 개인용 테스트가 아닌 경우에만 그룹 정보 검증
    const hasAnyGroupInfo = groupCode.trim() || groupPassword.trim();

    if (hasAnyGroupInfo && !isPersonalTest) {
      if (!groupCode.trim() || groupCode.length < 3) {
        newErrors.groupCode = '전문가 코드는 최소 3자리 이상이어야 합니다.';
      }

      if (!groupPassword.trim()) {
        newErrors.groupPassword = '비밀번호를 입력해주세요.';
      }
      
      if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
        newErrors.phone = '유효한 전화번호를 입력해주세요.';
      }
    }

    // 오류 상태 업데이트
    setErrors(newErrors);
    
    // 첫 번째 오류 필드가 있으면 해당 위치로 스크롤하고 포커스 설정
    if (firstErrorField?.element) {
      const element = firstErrorField.element;
      // 스크롤 애니메이션
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // 깜빡임 효과 추가
      const blinkClass = 'animate-pulse border-red-500 bg-red-100/10';
      element.classList.add(...blinkClass.split(' '));
      
      // 포커스 설정 (지연 후)
      setTimeout(() => {
        if (element instanceof HTMLInputElement) {
          element.focus();
          
          // 깜빡임 효과 제거
          setTimeout(() => {
            element.classList.remove(...blinkClass.split(' '));
          }, 2000);
        } else if (element === birthYearRef.current) {
          element.click();
          
          // 깜빡임 효과 제거
          setTimeout(() => {
            element.classList.remove(...blinkClass.split(' '));
          }, 2000);
        }
      }, firstErrorField?.focusDelay || 300);
      
      return false;
    }

    // 오류가 없으면 true 반환
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 제출 직전에 히든 필드의 값을 확인하고 복사
    setHiddenGroupCode(groupCode);
    setHiddenGroupPassword(groupPassword);
    
    if (validateForm()) {
      onSubmit({
        birthYear,
        groupCode: hiddenGroupCode, // 히든 필드 값 사용
        groupPassword: hiddenGroupPassword, // 히든 필드 값 사용
        gender,
        maritalStatus,
        name: name,
        privacyAgreed,
        phone: formatPhoneNumber(phone) // 전화번호 형식 변환 적용
      });
    }
  };

  // 그룹코드 입력 버튼 클릭 핸들러
  const handleGroupCodeButtonClick = () => {
    setShowGroupCodeInput(true);
    
    // 상담코드 입력란에 포커스 설정 (약간의 지연 후)
    setTimeout(() => {
      if (groupCodeRef.current) {
        groupCodeRef.current.focus();
      }
    }, 100);
  };

  // 로그인 처리 함수
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 간단한 로그인 처리 (실제로는 서버 API 호출 필요)
    if (loginId === 'admin' && loginPassword === 'password') {
      // 로그인 성공
      setIsLoggedIn(true);
      setLoginError('');
      
      // 로컬 스토리지에 로그인 상태 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({ id: loginId, name: '관리자' }));
      }
    } else {
      // 로그인 실패
      setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };
  
  // 로그아웃 처리 함수
  const handleLogout = () => {
    setIsLoggedIn(false);
    
    // 로컬 스토리지에서 로그인 정보 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
    }
  };
  
  // 로그인 체크 제거됨 - 모든 사용자가 검사 가능

  // 입력 필드 참조
  const nameInputRef = useRef<HTMLInputElement>(null);
  const birthYearInputRef = useRef<HTMLInputElement>(null);

  // 선택된 버튼 색상 관련 함수
  const getGenderButtonColor = () => {
    return gender === '남' ? 'bg-emerald-600' : gender === '여' ? 'bg-emerald-600' : 'bg-emerald-800/70';
  };
  
  // 선택된 성별에 따른 입력 필드 배경색 결정 (출생연도는 항상 bg-emerald-600으로 설정)
  const getInputBackgroundColor = (hasValue: boolean, isForBirthYear: boolean = false) => {
    // 출생연도이고 값이 있을 경우 항상 버튼 색상 반환
    if (isForBirthYear && birthYear > 0) return 'bg-emerald-600';
    
    // 다른 필드는 기존 로직 유지
    if (!hasValue || !gender) return 'bg-emerald-800/70';
    return gender === '남' || gender === '여' ? 'bg-emerald-600' : 'bg-emerald-800/70';
  };
  
  // 상담코드 버튼 배경색 결정
  const getGroupCodeButtonColor = () => {
    return groupCode.trim() ? 'bg-emerald-600' : 'bg-blue-900/50';
  };
  
  // 성별 선택 시 입력 필드 배경색 즉시 업데이트를 별도 useEffect로 분리
  useEffect(() => {
    if (nameInputRef.current) {
      if (name.trim()) {
        // 값이 있으면 항상 검사 시작하기 버튼과 동일한 색상으로 설정 (bg-emerald-600)
        nameInputRef.current.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`;
      } else {
        // 값이 없으면 기본 색상으로 설정
        nameInputRef.current.className = `w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`;
      }
    }
  }, [gender, name]);
  
  // 출생연도 필드 배경색 업데이트는 별도로 처리
  useEffect(() => {
    if (birthYearInputRef.current && birthYear > 0) {
      birthYearInputRef.current.className = `w-full px-4 py-3 rounded-lg ${getInputBackgroundColor(birthYear > 0, true)} border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10`;
    }
  }, [gender, birthYear]);

  // 상태 변경 시 오류 메시지 지우기
  useEffect(() => {
    if (birthYear > 0) {
      setErrors(prev => ({ ...prev, birthYear: undefined }));
    }
  }, [birthYear]);

  useEffect(() => {
    if (gender) {
      setErrors(prev => ({ ...prev, gender: undefined }));
    }
  }, [gender]);

  useEffect(() => {
    if (maritalStatus) {
      setErrors(prev => ({ ...prev, maritalStatus: undefined }));
    }
  }, [maritalStatus]);

  useEffect(() => {
    if (groupCode.trim() && groupCode.length >= 3) {
      setErrors(prev => ({ ...prev, groupCode: undefined }));
    }
  }, [groupCode]);

  useEffect(() => {
    if (groupPassword.trim()) {
      setErrors(prev => ({ ...prev, groupPassword: undefined }));
    }
  }, [groupPassword]);

  useEffect(() => {
    if (name.trim()) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  }, [name]);

  useEffect(() => {
    if (privacyAgreed) {
      setErrors(prev => ({ ...prev, privacyAgreed: undefined }));
    }
  }, [privacyAgreed]);

  // 로그인 체크 제거 - 모든 사용자가 검사 가능하도록 수정
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      // 로그인 상태를 항상 true로 설정 (로그인 체크 제거)
      setIsLoggedIn(true);
      console.log('MbtiProClientInfo: 로그인 체크 제거됨 - 모든 사용자 접근 가능');
    }
  }, []);

  return (
    <div className="min-h-screen bg-emerald-950 text-white py-4 px-4 overflow-hidden relative">
      {/* CSS 애니메이션 추가 */}
      <style jsx>{`
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        .blink-animation {
          animation: blink 1s ease-in-out 3;
        }
      `}</style>
      
      {/* Background pattern */}
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
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* 상단 메뉴 */}
      <Navigation />
      
      {/* 상단 메뉴의 높이만큼 여백 추가 */}
      <div className="h-4"></div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-white mb-4">
            {isPersonalTest ? '개인용 MBTI 검사' : '전문가용 MBTI 검사'}
          </h1>
          <p className="text-emerald-300 max-w-lg mx-auto">
            검사를 시작하기 전에 검사자의 기본 정보를 입력해주세요.
            <br />
            이 정보는 보다 정확한 분석과 결과 해석에 활용됩니다.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-emerald-900/50 backdrop-blur-sm rounded-xl shadow-lg p-8"
        >
          <form 
            id="client-info-form" 
            ref={formRef} 
            onSubmit={handleSubmit} 
            className="space-y-6" 
            autoComplete="off" 
            autoCapitalize="off" 
            autoCorrect="off"
            spellCheck="false"
            key={formKey}
            data-lpignore="true"
            data-form-type="other"
            onKeyDown={(e) => {
              // Tab 키 이벤트 발생 시 처리
              if (e.key === 'Tab') {
                // 필드 ID 재생성 (탭 이후 자동완성 방지)
                setTimeout(regenerateFieldIds, 100);
                
                // 현재 활성화된 요소 가져오기
                const activeElement = document.activeElement as HTMLInputElement;
                if (activeElement && activeElement.tagName === 'INPUT') {
                  // 현재 필드의 자동완성 방지
                  preventAutocomplete(activeElement, activeElement.id.split('_')[0]);
                  
                  // 다음 필드로 이동 직전 모든 필드의 이름과 ID 변경
                  setTimeout(() => {
                    // 모든 입력 필드 가져오기
                    const inputFields = formRef.current?.querySelectorAll('input');
                    if (inputFields) {
                      inputFields.forEach(field => {
                        if (field.type !== 'checkbox' && field.type !== 'hidden') {
                          const fieldId = field.id || '';
                          const prefix = fieldId.split('_')[0] || 'field';
                          const randomStr = Math.random().toString(36).substring(2, 15);
                          field.name = `${prefix}_${randomStr}`;
                          field.id = `${prefix}_${randomStr}`;
                        }
                      });
                    }
                  }, 50);
                }
              }
            }}
          >
            {/* 숨겨진 진짜 제출 필드 (자동완성에 노출되지 않음) - 클라이언트 사이드에서만 렌더링 */}
            {isClient && (
              <>
                <input 
                  type="hidden" 
                  name={`real_group_code_${hiddenFieldsKey}`}
                  value={hiddenGroupCode} 
                />
                <input 
                  type="hidden" 
                  name={`real_group_password_${hiddenFieldsKey}`}
                  value={hiddenGroupPassword} 
                />
              </>
            )}

            {/* 숨겨진 더미 입력 필드 추가 - 브라우저 자동완성 방지용 */}
            {isClient && (
              <div style={{position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, width: 0, overflow: 'hidden'}}>
                {/* 일반적인 로그인 필드 유혹용 더미 (자동완성이 이쪽으로 가도록) */}
                <input type="text" name="username" id="username" autoComplete="username" />
                <input type="password" name="password" id="password" autoComplete="current-password" />
                <input type="email" name="email" id="email" autoComplete="email" />
                
                {/* 크레딧 카드, 주소 등 다른 자동완성 방지용 */}
                <input type="text" name="address" id="address" autoComplete="street-address" />
                <input type="text" name="cc-number" id="cc-number" autoComplete="cc-number" />
                <input type="text" name="cc-exp" id="cc-exp" autoComplete="cc-exp" />
              </div>
            )}

            {/* 이름 입력 */}
            <div className="relative">
              <label htmlFor="nameField" className="block text-sm font-medium text-emerald-300 mb-1">
                이름
              </label>
                  <input 
                    type="text"
                    id="nameField"
                    name="nameField" 
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      // 값이 있으면 즉시 버튼 색상으로 변경
                      const nameInput = e.target as HTMLInputElement;
                      if (e.target.value.trim()) {
                        nameInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`;
                      } else {
                        nameInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`;
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-lg ${name.trim() ? 'bg-emerald-600' : 'bg-emerald-800/70'} border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`}
                    placeholder="이름을 입력해주세요"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    data-form-type="other"
                    data-lpignore="true"
                    aria-autocomplete="none"
                    ref={nameInputRef}
                    onBlur={(e) => {
                      // 다른 필드로 이동할 때 버튼과 동일한 색상으로 변경
                      const value = e.target.value.trim();
                      if (value !== '') {
                        const nameInput = e.target as HTMLInputElement;
                        nameInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`;
                      } else {
                        const nameInput = e.target as HTMLInputElement;
                        nameInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors cursor-text`;
                      }
                    }}
                    onFocus={(e) => {
                      // 자동완성 방지 속성 적용
                      const field = e.target as HTMLInputElement;
                      field.setAttribute("autocomplete", "new-password");
                      
                      // 랜덤 ID 설정으로 자동완성 방지 강화
                      const randomId = `name_${Math.random().toString(36).substring(2, 15)}`;
                      field.id = randomId;
                      field.name = randomId;
                    }}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* 출생연도 입력 */}
            <div className="relative">
              <label htmlFor="birthYear" className="block text-sm font-medium text-emerald-300 mb-1">
                출생연도
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="birthYear"
                  name="birthYear"
                  value={birthYear > 0 ? birthYear : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value === '') {
                      setBirthYear(0);
                      // 값이 비어있으면 기본 색상으로 변경
                      const birthYearInput = e.target as HTMLInputElement;
                      birthYearInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-800 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10`;
                    } else {
                      const numValue = parseInt(value);
                      if (numValue >= 1930 && numValue <= currentYear) {
                        setBirthYear(numValue);
                        // 값 입력시 즉시 배경색 변경 - 항상 버튼 색상 사용
                        const birthYearInput = e.target as HTMLInputElement;
                        birthYearInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10`;
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // 다른 필드로 이동할 때 버튼과 동일한 색상으로 변경
                    const value = e.target.value.replace(/\D/g, '');
                    if (value !== '') {
                      const numValue = parseInt(value);
                      if (numValue >= 1930 && numValue <= currentYear) {
                        const birthYearInput = e.target as HTMLInputElement;
                        birthYearInput.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10`;
                      }
                    }
                  }}
                  onClick={() => setShowYearSelector(true)}
                  onFocus={() => setShowYearSelector(true)}
                  placeholder="출생연도를 선택해주세요"
                  className={`w-full px-4 py-3 rounded-lg ${getInputBackgroundColor(birthYear > 0, true)} border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10`}
                  ref={birthYearInputRef}
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowYearSelector(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {showYearSelector && (
                <div 
                  ref={yearSelectorRef}
                  className="absolute z-10 mt-1 w-full bg-emerald-800 border border-emerald-700 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                >
                  <div className="p-2 overflow-x-auto">
                    <div className="grid grid-cols-6 md:grid-cols-8 gap-1.5">
                      {years.map(year => (
                        <div
                          key={year}
                          data-year={year}
                          className="px-2 py-1.5 text-white bg-emerald-800 hover:bg-emerald-600 cursor-pointer transition-colors rounded-md text-center text-sm"
                          onClick={() => {
                            setBirthYear(year);
                            setShowYearSelector(false);
                            
                            // 배경색 즉시 변경 추가
                            if (birthYearInputRef.current) {
                              birthYearInputRef.current.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-10`;
                            }
                          }}
                        >
                          {year}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {errors.birthYear && (
                <p className="mt-1 text-sm text-red-400">{errors.birthYear}</p>
              )}
            </div>

            {/* 성별 및 결혼 상태 - 한 줄에 배치 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 성별 선택 */}
              <div className="w-full bg-blue-500/15 p-4 rounded-lg border border-blue-400/20">
                <label className="block text-sm font-medium text-emerald-300 mb-3">
                  성별
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    onClick={() => setGender('남')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`py-3 px-2 rounded-lg flex items-center justify-center transition-all text-sm ${
                      gender === '남'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-800/70 text-emerald-200/90 border border-emerald-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L6.382 6H4a1 1 0 000 2h1.382l-.724 2.171a1 1 0 00.65 1.267l.084.017a1 1 0 001.267-.65L7.382 8h4.343l1.632 3.664a1 1 0 001.321.45l.094-.04a1 1 0 00.45-1.321L13.659 7.5 16.5 6.5l.5.5a1 1 0 001.414-1.414l-2-2a1 1 0 00-1.414 0l-2 2A1 1 0 0013.5 7l.5-.5-.5-1L14 5h-3.382l-.724-2.171A1 1 0 009 2z" clipRule="evenodd" />
                  </svg>
                  남성
                </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setGender('여')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`py-3 px-2 rounded-lg flex items-center justify-center transition-all text-sm ${
                      gender === '여'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-800/70 text-emerald-200/90 border border-emerald-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zm-6 8.5a.5.5 0 01.5-.5h2.086a6 6 0 0111.828 0H18.5a.5.5 0 010 1h-1v1a6 6 0 01-12 0v-1h-1a.5.5 0 01-.5-.5z" clipRule="evenodd" />
                  </svg>
                  여성
                </motion.button>
                </div>
                {errors.gender && (
                  <p className="mt-2 text-sm text-red-400" data-error="gender">{errors.gender}</p>
                )}
              </div>

              {/* 결혼 상태 선택 */}
              <div className="w-full bg-teal-500/15 p-4 rounded-lg border border-teal-400/20">
                <label className="block text-sm font-medium text-emerald-300 mb-3">
                  결혼 상태
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    type="button"
                    onClick={() => setMaritalStatus('미혼')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`py-3 px-2 rounded-lg flex items-center justify-center transition-all text-sm ${
                      maritalStatus === '미혼'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-800/70 text-emerald-200/90 border border-emerald-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                  미혼
                </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setMaritalStatus('기혼')}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`py-3 px-2 rounded-lg flex items-center justify-center transition-all text-sm ${
                      maritalStatus === '기혼'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-800/70 text-emerald-200/90 border border-emerald-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  기혼
                  </motion.button>
                </div>
                {errors.maritalStatus && (
                  <p className="mt-2 text-sm text-red-400" data-error="maritalStatus">{errors.maritalStatus}</p>
                )}
              </div>
            </div>

            {/* 검사 코드 및 비밀번호 입력 - 항상 표시 */}
            {!showGroupCodeInput ? (
              <div className="flex justify-end">
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={handleGroupCodeButtonClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-2 ${getGroupCodeButtonColor()} text-emerald-200/80 text-sm font-medium rounded-lg shadow-sm hover:bg-emerald-700/60 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900`}
                  >
                    검사코드 입력 <span className='text-blue-400/50 text-xs'>(선택)</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 border border-blue-500/20 rounded-lg p-4 bg-blue-500/10 max-h-[90vh] overflow-y-auto md:space-y-6 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e40af #1e3a8a30' }}>
                <div className="pb-2 border-b border-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-emerald-300">검사 코드</span>
                    <button 
                      onClick={() => setShowGroupCodeInput(false)} 
                      className="text-blue-400/70 hover:text-blue-400 transition-colors"
                      title="검사코드 입력 숨기기"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* 전문가 코드 및 비밀번호 입력 */}
                <div>
                  <label htmlFor="group-password-field" className="block text-sm font-medium text-blue-300 mb-1">
                    상담 코드 / 비밀번호 <span className="text-blue-400/50 text-xs">(선택)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="autocomplete-blocker">
                      {/* 숨겨진 더미 입력 필드 - 자동완성 혼란을 위한 함정 필드들 - 클라이언트에서만 렌더링 */}
                      {isClient && (
                        <div style={{position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, zIndex: -1, height: '0px', width: '0px', overflow: 'hidden'}}>
                          <input type="text" name="username" autoComplete="username" />
                          <input type="email" name="email" autoComplete="email" />
                          <input type="text" name="name" autoComplete="name" />
                          <input type="text" name="address" autoComplete="address" />
                          <input type="text" name="password" autoComplete="new-password" />
                          <input type="text" name="password" autoComplete="current-password" />
                          <input type="text" style={{display: 'none'}} aria-hidden="true" tabIndex={-1} autoComplete="off" />
                          <input type="password" style={{display: 'none'}} aria-hidden="true" tabIndex={-1} autoComplete="off" />
                        </div>
                      )}
                      
                      {/* 그룹코드 전용 가짜 필드 */}
                      {isClient && (
                        <div style={{position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden'}}>
                          <input type="text" name="prevent-groupcode-1" autoComplete="off" />
                          <input type="text" name="group-code" autoComplete="off" />
                          <input type="text" name="groupcode" autoComplete="off" />
                          <input type="text" name="gc" autoComplete="off" />
                          <input type="text" name="group_id" autoComplete="off" />
                          <input type="text" name="group_code" autoComplete="off" />
                        </div>
                      )}
                      
                      <input
                        type="text"
                        id={randomFieldIds.groupCode}
                        name={`group_code_random_name_${Math.random().toString(36).substring(2, 15)}`}
                        value={groupCode}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setGroupCode(e.target.value);
                          // 값이 있으면 즉시 버튼 색상으로 변경
                          const input = e.target as HTMLInputElement;
                          if (e.target.value.trim()) {
                            input.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`;
                          } else {
                            input.className = `w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`;
                          }
                        }}
                        className={`w-full px-4 py-3 rounded-lg ${groupCode.trim() ? 'bg-emerald-600' : 'bg-emerald-800/70'} border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
                        placeholder="검사 코드 입력"
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                        data-lpignore="true"
                        aria-autocomplete="none"
                        ref={groupCodeRef}
                        onMouseDown={(e) => {
                          // 마우스 클릭 시 강력한 자동완성 방지
                          const field = e.target as HTMLInputElement;
                          
                          // 필드 값 임시 저장
                          const currentValue = field.value;
                          
                          // 모든 자동완성 방지 속성 적용
                          field.setAttribute('autocomplete', 'off');
                          field.setAttribute('autocorrect', 'off');
                          field.setAttribute('autocapitalize', 'off');
                          field.setAttribute('spellcheck', 'false');
                          field.setAttribute('data-form-type', 'other');
                          field.setAttribute('data-lpignore', 'true');
                          field.setAttribute('aria-autocomplete', 'none');
                          
                          // 랜덤 ID와 이름 생성 및 적용 (브라우저 캐시 우회)
                          const randomStr = Math.random().toString(36).substring(2, 15);
                          field.name = `gc_no_autofill_${randomStr}`;
                          field.id = `gc_random_${randomStr}`;
                          
                          // 필드 값 초기화
                          field.value = '';
                          
                          // 약간의 지연 후 원래 상태로 복원
                          setTimeout(() => {
                            field.value = currentValue;
                          }, 20);
                        }}
                        onFocus={(e) => {
                          // 포커스 시 추가 자동완성 방지
                          const field = e.target as HTMLInputElement;
                          
                          // 필드 값 임시 저장
                          const currentValue = field.value;
                          
                          // 읽기 전용으로 일시적 전환 (자동완성 방지)
                          field.readOnly = true;
                          
                          // 자동완성 비활성화 속성 강화
                          field.setAttribute('autocomplete', 'off');
                          field.setAttribute('autocorrect', 'off');
                          field.setAttribute('autocapitalize', 'off');
                          field.setAttribute('spellcheck', 'false');
                          field.setAttribute('data-form-type', 'other');
                          field.setAttribute('data-lpignore', 'true');
                          field.setAttribute('aria-autocomplete', 'none');
                          
                          // 랜덤 ID와 이름 변경 (자동완성 방지)
                          const randomStr = Math.random().toString(36).substring(2, 15);
                          field.name = `gc_no_autofill_${randomStr}`;
                          field.id = `gc_random_${randomStr}`;
                          
                          // 필드 값 초기화 및 임시 속성 설정
                          field.value = '';
                          
                          // 폼 제출 속성 일시적으로 변경 (자동완성 혼란)
                          const formElement = formRef.current;
                          if (formElement) {
                            const originalAction = formElement.getAttribute('action') || '';
                            const originalMethod = formElement.getAttribute('method') || '';
                            
                            formElement.setAttribute('action', '#');
                            formElement.setAttribute('method', 'get');
                            
                            // 짧은 지연 후 원래 상태로 복원
                            setTimeout(() => {
                              formElement.setAttribute('action', originalAction);
                              formElement.setAttribute('method', originalMethod);
                            }, 10);
                          }
                          
                          // 짧은 지연 후 원래 상태로 복원
                          setTimeout(() => {
                            field.readOnly = false;
                            field.value = currentValue;
                            
                            // 포커스 유지
                            field.focus();
                          }, 30);
                        }}
                        onBlur={() => {
                          // 포커스를 잃을 때 히든 필드에 값 복사
                          setHiddenGroupCode(groupCode);
                        }}
                        onKeyDown={(e) => {
                          // 키 입력 시마다 자동완성 방지 속성 갱신
                          if (e.key !== 'Tab') {
                            const field = e.target as HTMLInputElement;
                            
                            // 랜덤 ID 및 자동완성 속성 새로 설정
                            const randomStr = Math.random().toString(36).substring(2, 8);
                            field.setAttribute('autocomplete', `new-password-${randomStr}`);
                            field.name = `gc_typing_${randomStr}`;
                          }
                        }}
                      />
                      {errors.groupCode && (
                        <p className="mt-1 text-sm text-red-400">{errors.groupCode}</p>
                      )}
                    </div>
                    <div className="autocomplete-blocker">
                      {/* 비밀번호 전용 가짜 필드 - 자동완성 함정용 */}
                      {isClient && (
                        <div style={{position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden'}}>
                          <input type="password" name="prevent-password-1" autoComplete="off" />
                          <input type="password" name="password" autoComplete="new-password" />
                          <input type="password" name="pw" autoComplete="new-password" />
                          <input type="password" name="pass" autoComplete="new-password" />
                          <input type="password" name="group_password" autoComplete="off" />
                          <input type="password" name="group_pass" autoComplete="off" />
                        </div>
                      )}

                      {/* 실제로는 사용하지 않는 가짜 입력필드 (자동완성 유인) */}
                      {isClient && (
                        <input 
                          type="password"
                          style={{ 
                            position: 'absolute',
                            opacity: 0,
                            height: 0,
                            width: 0,
                            zIndex: -999,
                            pointerEvents: 'none',
                            overflow: 'hidden',
                            appearance: 'none',
                          }}
                          tabIndex={-1}
                          aria-hidden="true"
                          name="password_decoy"
                          id="password_decoy"
                          autoComplete="current-password"
                        />
                      )}

                      {/* 진짜 비밀번호 필드 (래퍼로 추가 감싸기) */}
                      <div className="relative">
                        {/* 폼 자동 완성 방지를 위한 랜덤 ID 생성 */}
                        <input
                          type="password"
                          id={randomFieldIds.groupPassword}
                          name={`prevent_pw_autofill_${Math.random().toString(36).substring(2, 15)}`}
                          value={groupPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setGroupPassword(e.target.value);
                            // 값이 있으면 즉시 버튼 색상으로 변경
                            const input = e.target as HTMLInputElement;
                            if (e.target.value.trim()) {
                              input.className = `w-full px-4 py-3 rounded-lg bg-emerald-600 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`;
                            } else {
                              input.className = `w-full px-4 py-3 rounded-lg bg-emerald-800/70 border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`;
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-lg ${groupPassword.trim() ? 'bg-emerald-600' : 'bg-emerald-800/70'} border border-emerald-700 text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
                          placeholder="비밀번호를 입력해주세요"
                          autoComplete="new-password"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck="false"
                          data-form-type="other"
                          data-lpignore="true"
                          aria-autocomplete="none"
                          readOnly={false}
                          ref={groupPasswordRef}
                          onMouseDown={(e) => {
                            // 마우스 클릭 시 강력한 자동완성 방지
                            const field = e.target as HTMLInputElement;
                            
                            // 필드 값 임시 저장
                            const currentValue = field.value;
                            
                            // 모든 자동완성 방지 속성 적용
                            field.setAttribute('autocomplete', 'off');
                            field.setAttribute('autocorrect', 'off');
                            field.setAttribute('autocapitalize', 'off');
                            field.setAttribute('spellcheck', 'false');
                            field.setAttribute('data-form-type', 'other');
                            field.setAttribute('data-lpignore', 'true');
                            field.setAttribute('aria-autocomplete', 'none');
                            
                            // 랜덤 ID와 이름 생성 및 적용 (브라우저 캐시 우회)
                            const randomStr = Math.random().toString(36).substring(2, 15);
                            field.name = `pw_no_autofill_${randomStr}`;
                            field.id = `pw_random_${randomStr}`;
                            
                            // 필드 값 초기화
                            field.value = '';
                            
                            // 약간의 지연 후 원래 상태로 복원
                            setTimeout(() => {
                              field.value = currentValue;
                            }, 20);
                          }}
                          onFocus={(e) => {
                            // 포커스 시 추가 자동완성 방지
                            const field = e.target as HTMLInputElement;
                            
                            // 필드 값 임시 저장
                            const currentValue = field.value;
                            
                            // 읽기 전용으로 일시적 전환 (자동완성 방지)
                            field.readOnly = true;
                            
                            // 자동완성 비활성화 속성 강화
                            field.setAttribute('autocomplete', 'off');
                            field.setAttribute('autocorrect', 'off');
                            field.setAttribute('autocapitalize', 'off');
                            field.setAttribute('spellcheck', 'false');
                            field.setAttribute('data-form-type', 'other');
                            field.setAttribute('data-lpignore', 'true');
                            field.setAttribute('aria-autocomplete', 'none');
                            
                            // 랜덤 ID와 이름 변경 (자동완성 방지)
                            const randomStr = Math.random().toString(36).substring(2, 15);
                            field.name = `pw_no_autofill_${randomStr}`;
                            field.id = `pw_random_${randomStr}`;
                            
                            // 필드 값 초기화 및 임시 속성 설정
                            field.value = '';
                            
                            // 폼 제출 속성 일시적으로 변경 (자동완성 혼란)
                            const formElement = formRef.current;
                            if (formElement) {
                              const originalAction = formElement.getAttribute('action') || '';
                              const originalMethod = formElement.getAttribute('method') || '';
                              
                              formElement.setAttribute('action', '#');
                              formElement.setAttribute('method', 'get');
                              
                              // 짧은 지연 후 원래 상태로 복원
                              setTimeout(() => {
                                formElement.setAttribute('action', originalAction);
                                formElement.setAttribute('method', originalMethod);
                              }, 10);
                            }
                            
                            // 짧은 지연 후 원래 상태로 복원
                            setTimeout(() => {
                              field.readOnly = false;
                              field.value = currentValue;
                              
                              // 포커스 유지
                              field.focus();
                            }, 30);
                          }}
                          onBlur={() => {
                            // 포커스를 잃을 때 히든 필드에 값 복사
                            setHiddenGroupPassword(groupPassword);
                          }}
                          onKeyDown={(e) => {
                            // 키 입력 시마다 자동완성 방지 속성 갱신
                            if (e.key !== 'Tab') {
                              const field = e.target as HTMLInputElement;
                              
                              // 랜덤 ID 및 자동완성 속성 새로 설정
                              const randomStr = Math.random().toString(36).substring(2, 8);
                              field.setAttribute('autocomplete', `new-password-${randomStr}`);
                              field.name = `pw_typing_${randomStr}`;
                            }
                          }}
                        />

                        {/* 이 div는 비밀번호 필드 위에 겹쳐져 자동완성 클릭을 방지합니다 */}
                        {isClient && (
                          <div 
                            id="password-overlay"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 10,
                              cursor: 'pointer',
                              backgroundColor: 'transparent',
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              // 오버레이 제거 후 실제 입력 필드 클릭
                              const overlay = e.target as HTMLDivElement;
                              overlay.style.display = 'none';
                              
                              // 실제 비밀번호 필드에 포커스
                              if (groupPasswordRef.current) {
                                // 비밀번호 필드 자동완성 방지 강화
                                const field = groupPasswordRef.current;
                                field.setAttribute('autocomplete', 'off');
                                field.setAttribute('data-form-type', 'other');
                                field.setAttribute('data-lpignore', 'true');
                                
                                // 랜덤 이름 생성 및 적용 (자동완성 방지 강화)
                                const randomStr = Math.random().toString(36).substring(2, 15);
                                field.name = `pw_overlay_click_${randomStr}`;
                                field.id = `pw_overlay_${randomStr}`;
                                
                                // 포커스 적용
                                field.focus();
                                
                                // 2초 후 오버레이 복원 (다음 자동완성 방지)
                                setTimeout(() => {
                                  overlay.style.display = 'block';
                                }, 2000);
                              }
                            }}
                          />
                        )}
                      </div>

                      {errors.groupPassword && (
                        <p className="mt-1 text-sm text-red-400">{errors.groupPassword}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 개인정보 활용 동의 */}
            <div 
              className="bg-emerald-800/30 p-4 rounded-lg border border-emerald-700/30 cursor-pointer hover:bg-emerald-800/40 transition-colors"
              onClick={() => setPrivacyAgreed(!privacyAgreed)}
              ref={privacyRef}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="privacy"
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="focus:ring-emerald-500/70 h-4 w-4 text-emerald-600/70 border-emerald-700/50 rounded bg-emerald-900/30"
                    required
                    onClick={(e) => e.stopPropagation()} // 이벤트 버블링 방지
                    ref={privacyRef}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="font-medium text-emerald-300/80">개인정보 수집 및 이용 동의</span>
                  <p className="text-emerald-400/60">입력한 정보는 검사 결과 분석 및 상담 목적으로만 활용됩니다.</p>
                </div>
              </div>
              {errors.privacyAgreed && (
                <p className="mt-2 text-sm text-red-400" data-error="privacyAgreed">{errors.privacyAgreed}</p>
              )}
            </div>

            <div className="flex justify-center pt-4">
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
          <p>* 모든 정보는 암호화되어 안전하게 보관됩니다.</p>
          <p>* 정확한 결과를 위해 올바른 정보를 입력해주세요.</p>
        </div>
      </div>
    </div>
  );
};

export default MbtiProClientInfo;