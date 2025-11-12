'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

interface MbtiProCodeInputProps {
  onSubmit: (codeData: { groupCode: string; groupPassword: string }) => void;
  initialData?: { groupCode: string; groupPassword: string } | null;
  isPersonalTest?: boolean;
}

const MbtiProCodeInput: React.FC<MbtiProCodeInputProps> = ({ onSubmit, initialData, isPersonalTest = false }) => {
  const [groupCode, setGroupCode] = useState<string>(initialData?.groupCode || '');
  const [groupPassword, setGroupPassword] = useState<string>(initialData?.groupPassword || '');
  const [errors, setErrors] = useState<{
    groupCode?: string;
    groupPassword?: string;
  }>({});
  const [isClient, setIsClient] = useState<boolean>(false);
  
  const groupCodeRef = useRef<HTMLInputElement>(null);
  const groupPasswordRef = useRef<HTMLInputElement>(null);
  
  // 랜덤 필드 ID 설정을 위한 상태
  const [randomFieldIds, setRandomFieldIds] = useState({
    groupCode: `gc_${Math.random().toString(36).substring(2, 10)}`,
    groupPassword: `pw_${Math.random().toString(36).substring(2, 10)}`
  });

  useEffect(() => {
    setIsClient(true);
    
    // 필드 ID 랜덤화 함수
    const regenerateFieldIds = () => {
      setRandomFieldIds({
        groupCode: `gc_${Math.random().toString(36).substring(2, 10)}`,
        groupPassword: `pw_${Math.random().toString(36).substring(2, 10)}`
      });
    };
    
    // 초기 필드 ID 랜덤화
    regenerateFieldIds();
    
    // 5초마다 필드 ID 변경 (자동완성 방지 강화)
    const fieldIdInterval = setInterval(regenerateFieldIds, 5000);
    
    return () => {
      clearInterval(fieldIdInterval);
    };
  }, []);

  // 로컬스토리지에서 초기값 복원 (페이지 간 이동 시 유지)
  // 단, initialData가 명시적으로 null이면 복원하지 않음 (새로 시작하기 클릭 시)
  useEffect(() => {
    try {
      if (initialData === undefined && typeof window !== 'undefined') {
        const saved = localStorage.getItem('mbti_pro_code_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          setGroupCode(parsed.groupCode || '');
          setGroupPassword(parsed.groupPassword || '');
        }
      } else if (initialData === null) {
        // 새로 시작하기로 명시적으로 null이 전달된 경우 초기화
        setGroupCode('');
        setGroupPassword('');
      }
    } catch {}
  }, [initialData]);

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: {
      groupCode?: string;
      groupPassword?: string;
    } = {};

    // 검사코드는 선택사항이므로 빈 값도 허용
    if (groupCode.trim() && groupCode.length < 3) {
      newErrors.groupCode = '검사코드는 최소 3자리 이상이어야 합니다.';
    }

    // 비밀번호는 검사코드가 있을 때만 필수
    if (groupCode.trim() && !groupPassword.trim()) {
      newErrors.groupPassword = '비밀번호를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const data = {
        groupCode: groupCode.trim(),
        groupPassword: groupPassword.trim()
      };
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('mbti_pro_code_data', JSON.stringify(data));
        }
      } catch {}
      onSubmit(data);
    }
  };

  // 상태 변경 시 오류 메시지 지우기
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
      
      {/* 단색 배경 유지: 그리드 제거 */}
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* 상단 메뉴 - 개인용 검사에서는 제거 */}
      {!isPersonalTest && <Navigation />}
      
      {/* 상단 메뉴의 높이만큼 여백 추가 */}
      {!isPersonalTest && <div className="h-4"></div>}

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-white mb-4">
            {isPersonalTest ? '개인용 MBTI 검사' : '전문가용 MBTI 검사'}
          </h1>
          <p className="text-emerald-300 max-w-lg mx-auto">
            검사코드가 없어도 검사를 진행할 수 있습니다.
            <br />
            검사코드는 상담사가 제공한 경우에만 입력하세요.
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
            {/* 숨겨진 더미 입력 필드 추가 - 브라우저 자동완성 방지용 */}
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

            {/* 검사코드 입력 섹션 */}
            <div className="space-y-6 border border-blue-500/20 rounded-lg p-4 bg-blue-500/10">
              <div className="pb-2 border-b border-white/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-emerald-300">검사 코드</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="group-password-field" className="block text-sm font-medium text-blue-300 mb-1">
                  검사 코드 / 비밀번호 <span className="text-blue-400/50 text-xs">(선택)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="autocomplete-blocker">
                    <input
                      type="text"
                      id={randomFieldIds.groupCode}
                      name={`group_code_random_name_${Math.random().toString(36).substring(2, 15)}`}
                      value={groupCode}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setGroupCode(e.target.value);
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
                    />
                    {errors.groupCode && (
                      <p className="mt-1 text-sm text-red-400">{errors.groupCode}</p>
                    )}
                  </div>
                  <div className="autocomplete-blocker">
                    <input
                      type="password"
                      id={randomFieldIds.groupPassword}
                      name={`prevent_pw_autofill_${Math.random().toString(36).substring(2, 15)}`}
                      value={groupPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setGroupPassword(e.target.value);
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
                      ref={groupPasswordRef}
                    />
                    {errors.groupPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.groupPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow-md hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-900"
              >
                다음 단계로
              </motion.button>
            </div>
          </form>
        </motion.div>

        <div className="mt-8 text-center text-sm text-emerald-400/70">
          <p>* 검사코드가 없어도 검사를 진행할 수 있습니다.</p>
          <p>* 검사코드는 상담사가 제공한 경우에만 입력하세요.</p>
        </div>
      </div>
    </div>
  );
};

export default MbtiProCodeInput;
