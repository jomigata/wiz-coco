'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import ConfirmModal from '../deleted-codes/ConfirmModal';

interface TestPrefix {
  code: string;
  name: string;
  description: string;
  count: number;
  lastGenerated: string | null;
  active: boolean;
}

// 관리 버튼 간 부드러운 전환을 위한 버튼 스타일
const buttonBaseStyle = "inline-flex items-center transition-all duration-200";

export default function TestPrefixPage() {
  const router = useRouter();
  const [prefixes, setPrefixes] = useState<TestPrefix[]>([
    { code: 'MP', name: '전문가용 MBTI 검사', description: '전문가 심리상담사를 위한 MBTI 검사', count: 0, lastGenerated: null, active: true },
    { code: 'MA', name: '개인용 MBTI 검사', description: '일반 개인 사용자를 위한 MBTI 검사', count: 0, lastGenerated: null, active: true },
    { code: 'MG', name: '그룹형 MBTI 검사', description: '기업 및 단체를 위한 MBTI 검사', count: 0, lastGenerated: null, active: true },
    { code: 'MI', name: '인사이드 MBTI 검사', description: '두 사람의 MBTI 관계 분석 검사', count: 0, lastGenerated: null, active: true },
    { code: 'EP', name: '전문가용 이고-오케이 검사', description: '전문가를 위한 이고-오케이 검사', count: 0, lastGenerated: null, active: true },
    { code: 'EA', name: '개인용 이고-오케이 검사', description: '일반 개인용 이고-오케이 검사', count: 0, lastGenerated: null, active: true },
    { code: 'EG', name: '그룹형 이고-오케이 검사', description: '단체용 이고-오케이 검사', count: 0, lastGenerated: null, active: true },
    { code: 'AP', name: '전문가용 애니어그램 검사', description: '전문가를 위한 애니어그램 검사', count: 0, lastGenerated: null, active: true },
    { code: 'AA', name: '개인용 애니어그램 검사', description: '일반 개인용 애니어그램 검사', count: 0, lastGenerated: null, active: true },
    { code: 'AG', name: '그룹형 애니어그램 검사', description: '단체용 애니어그램 검사', count: 0, lastGenerated: null, active: true },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
  const [editMode, setEditMode] = useState<string | null>(null);
  const [newPrefix, setNewPrefix] = useState<TestPrefix>({
    code: '',
    name: '',
    description: '',
    count: 0,
    lastGenerated: null,
    active: true
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetCode, setDeleteTargetCode] = useState<string | null>(null);

  // 애니메이션 변수
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // 코드 접두사 데이터 로드
  useEffect(() => {
    const loadPrefixData = async () => {
      try {
        setLoading(true);
        // API 호출
        const response = await fetch('/api/test-prefix');
        
        if (response.ok) {
          const data = await response.json();
          // 서버로부터 접두사 데이터를 받아 업데이트
          if (data.prefixes && Array.isArray(data.prefixes)) {
            setPrefixes(data.prefixes);
          }
        } else {
          // API가 아직 구현되지 않았거나 오류가 발생한 경우 기본값 유지
          console.warn('접두사 API가 응답하지 않습니다. 기본값을 사용합니다.');
          setMessage({ 
            text: 'API 연결에 실패했습니다. 기본 데이터를 표시합니다.', 
            type: 'info' 
          });
        }
      } catch (error) {
        console.error('접두사 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPrefixData();
  }, []);

  // 접두사 추가/수정 처리
  const handleSavePrefix = async () => {
    // 입력 검증
    if (!newPrefix.code || !newPrefix.name) {
      setMessage({ text: '코드와 이름은 필수 입력 항목입니다.', type: 'error' });
      return;
    }
    
    // 코드는 정확히 2자리 알파벳으로 구성되어야 함
    if (!/^[A-Z]{2}$/.test(newPrefix.code)) {
      setMessage({ text: '코드는 정확히 2자리 대문자 알파벳이어야 합니다.', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      
      // 편집 모드인 경우 업데이트
      if (editMode) {
        // 기존 접두사 찾기
        const updatedPrefixes = prefixes.map(prefix => 
          prefix.code === editMode ? { ...newPrefix } : prefix
        );
        
        setPrefixes(updatedPrefixes);
        setMessage({ text: '접두사가 성공적으로 업데이트되었습니다.', type: 'success' });
      } else {
        // 새 접두사 추가
        // 중복 검사
        if (prefixes.some(prefix => prefix.code === newPrefix.code)) {
          setMessage({ text: '이미 존재하는 코드입니다.', type: 'error' });
          setLoading(false);
          return;
        }
        
        // 접두사 목록에 추가
        setPrefixes([...prefixes, { ...newPrefix }]);
        setMessage({ text: '새로운 접두사가 추가되었습니다.', type: 'success' });
      }
      
      // 입력 폼 초기화
      setNewPrefix({
        code: '',
        name: '',
        description: '',
        count: 0,
        lastGenerated: null,
        active: true
      });
      
      // 편집 모드 종료
      setEditMode(null);
    } catch (error) {
      console.error('접두사 저장 오류:', error);
      setMessage({ text: '접두사 저장 중 오류가 발생했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 접두사 편집 모드 설정
  const handleEditPrefix = (code: string) => {
    const prefixToEdit = prefixes.find(prefix => prefix.code === code);
    if (prefixToEdit) {
      setNewPrefix({ ...prefixToEdit });
      setEditMode(code);
    }
  };

  // 접두사 상태 토글 (활성/비활성)
  const handleToggleActive = (code: string) => {
    const updatedPrefixes = prefixes.map(prefix => {
      if (prefix.code === code) {
        return { ...prefix, active: !prefix.active };
      }
      return prefix;
    });
    
    setPrefixes(updatedPrefixes);
  };

  // 접두사 삭제
  const handleDeletePrefix = (code: string) => {
    // 기본 제공 접두사는 삭제 불가
    const isDefaultPrefix = ['MP', 'MA', 'MG', 'MI', 'EP', 'EA', 'EG', 'AP', 'AA', 'AG'].includes(code);
    if (isDefaultPrefix) {
      setMessage({ text: '기본 제공되는 접두사는 삭제할 수 없습니다.', type: 'error' });
      return;
    }
    setDeleteTargetCode(code);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePrefix = () => {
    if (!deleteTargetCode) return;
    const updatedPrefixes = prefixes.filter(prefix => prefix.code !== deleteTargetCode);
    setPrefixes(updatedPrefixes);
    setMessage({ text: '접두사가 삭제되었습니다.', type: 'success' });
    setShowDeleteConfirm(false);
    setDeleteTargetCode(null);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // 접두사 코드에 따른 검사 URL 가져오기
  const getTestUrl = (prefix: string): string => {
    // 접두사 유형별 매핑
    const urlMap: Record<string, string> = {
      // MBTI 검사
      'MP': '/tests/mbti_pro',    // 전문가용 MBTI
      'MA': '/tests/mbti',        // 개인용 MBTI
      'MG': '/tests/mbti_group',  // 그룹형 MBTI
      'MI': '/tests/inside-mbti', // 인사이드 MBTI
      
      // 이고-오케이 검사
      'EP': '/tests/ego_ok_pro',  // 전문가용 이고-오케이
      'EA': '/tests/ego_ok',      // 개인용 이고-오케이
      'EG': '/tests/ego_ok_group',// 그룹형 이고-오케이
      
      // 애니어그램 검사
      'AP': '/tests/enneagram_pro',    // 전문가용 애니어그램
      'AA': '/tests/enneagram',        // 개인용 애니어그램
      'AG': '/tests/enneagram_group'   // 그룹형 애니어그램
    };
    
    return urlMap[prefix] || '/tests'; // 일치하는 URL이 없으면 검사 메인 페이지로
  };
  
  // 검사 페이지로 이동
  const navigateToTest = (prefix: string) => {
    const testUrl = getTestUrl(prefix);
    router.push(testUrl);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* 타이틀 섹션 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300">
            접두사 관리
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            검사 코드 생성을 위한 접두사를 관리하고 설정할 수 있습니다.
          </p>
        </motion.div>

        {/* 알림 메시지 */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border relative ${
            message.type === 'success' ? 'bg-green-900/30 border-green-500/30 text-green-300' :
            message.type === 'error' ? 'bg-red-900/30 border-red-500/30 text-red-300' :
            'bg-blue-900/30 border-blue-500/30 text-blue-300'
          }`}>
            <div className="flex items-center">
              <div className="mr-3">
                {message.type === 'success' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {message.type === 'error' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {message.type === 'info' && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p>{message.text}</p>
            </div>
            <button 
              className="absolute top-4 right-4 text-sm" 
              onClick={() => setMessage({ text: '', type: null })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70 hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        
        {/* 접두사 추가/편집 폼 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            {editMode ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                접두사 편집
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                새 접두사 추가
              </>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-blue-300 mb-1">코드 (2자리 대문자)</label>
              <input
                type="text"
                value={newPrefix.code}
                onChange={(e) => setNewPrefix({...newPrefix, code: e.target.value.toUpperCase()})}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={2}
                placeholder="예: MP"
                disabled={!!editMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-300 mb-1">이름</label>
              <input
                type="text"
                value={newPrefix.name}
                onChange={(e) => setNewPrefix({...newPrefix, name: e.target.value})}
                className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 전문가용 MBTI 검사"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-blue-300 mb-1">설명</label>
            <textarea
              value={newPrefix.description}
              onChange={(e) => setNewPrefix({...newPrefix, description: e.target.value})}
              className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="검사에 대한 간략한 설명"
            />
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="active"
              checked={newPrefix.active}
              onChange={(e) => setNewPrefix({...newPrefix, active: e.target.checked})}
              className="h-4 w-4 text-blue-600 bg-white/5 border-white/10 rounded focus:ring-blue-500 focus:ring-offset-gray-900"
            />
            <label htmlFor="active" className="ml-2 text-sm text-blue-200">활성 상태</label>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSavePrefix}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-700/20 hover:shadow-blue-700/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </>
              ) : (
                <>
                  {editMode ? '수정 완료' : '추가하기'}
                </>
              )}
            </button>
            {editMode && (
              <button
                onClick={() => {
                  setEditMode(null);
                  setNewPrefix({
                    code: '',
                    name: '',
                    description: '',
                    count: 0,
                    lastGenerated: null,
                    active: true
                  });
                }}
                className="px-4 py-2 bg-gray-600/50 hover:bg-gray-600/70 text-white rounded-lg font-medium transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
        
        {/* 접두사 목록 테이블 */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                    코드
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                    이름
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                    설명
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                    생성 수
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                    마지막 생성
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                    상태
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {prefixes.map((prefix) => (
                  <tr 
                    key={prefix.code} 
                    className="hover:bg-blue-800/20 transition-all duration-200 hover:shadow-md transform hover:-translate-y-px"
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300 hover:text-blue-100 hover:underline cursor-pointer transition-colors"
                      onClick={() => navigateToTest(prefix.code)}
                      title={`${prefix.code} 검사 페이지로 이동`}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {prefix.code}
                      </div>
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-blue-200 hover:text-blue-100 cursor-pointer transition-colors"
                      onClick={() => navigateToTest(prefix.code)}
                      title={`${prefix.name} 페이지로 이동`}
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {prefix.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-200 max-w-xs truncate group relative">
                      <div className="tooltip-container">
                        {prefix.description}
                        <div className="opacity-0 bg-gray-900 text-white text-xs rounded py-2 px-3 absolute z-10 group-hover:opacity-100 transition-opacity duration-300 -left-1/4 -top-2 w-64 shadow-lg">
                          {prefix.description}
                          <div className="tooltip-arrow" data-popper-arrow></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-200 hover:text-blue-100 transition-all font-mono">
                        {prefix.count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-200 hover:text-blue-100 transition-all">
                        {formatDate(prefix.lastGenerated)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        prefix.active 
                          ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                          : 'bg-red-900/30 text-red-300 border border-red-500/30'
                      } transition-colors cursor-default`}>
                        {prefix.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditPrefix(prefix.code)}
                          className={`${buttonBaseStyle} text-blue-400 hover:text-blue-100 p-1.5 rounded-lg bg-blue-800/20 hover:bg-blue-700/40 transition-colors`}
                          title="접두사 설정 편집하기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActive(prefix.code)}
                          className={`${buttonBaseStyle} ${
                            prefix.active 
                              ? 'text-red-400 hover:text-red-100 bg-red-800/20 hover:bg-red-700/40' 
                              : 'text-green-400 hover:text-green-100 bg-green-800/20 hover:bg-green-700/40'
                          } p-1.5 rounded-lg transition-colors`}
                          title={prefix.active ? '비활성화하기' : '활성화하기'}
                        >
                          {prefix.active ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeletePrefix(prefix.code)}
                          className={`${buttonBaseStyle} text-red-400 hover:text-red-100 p-1.5 rounded-lg bg-red-800/20 hover:bg-red-700/40 transition-colors ${['MP', 'MA', 'MG', 'EP', 'EA', 'EG', 'AP', 'AA', 'AG'].includes(prefix.code) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={['MP', 'MA', 'MG', 'EP', 'EA', 'EG', 'AP', 'AA', 'AG'].includes(prefix.code)}
                          title={['MP', 'MA', 'MG', 'EP', 'EA', 'EG', 'AP', 'AA', 'AG'].includes(prefix.code) 
                            ? '기본 접두사는 삭제할 수 없습니다' 
                            : '접두사 삭제하기'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {prefixes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-blue-200">
                      등록된 접두사가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          open={showDeleteConfirm}
          title="정말 삭제하시겠습니까?"
          description={deleteTargetCode ? `선택한 접두사(${deleteTargetCode})를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.` : ''}
          confirmText="삭제하기"
          cancelText="취소"
          onConfirm={confirmDeletePrefix}
          onCancel={() => { setShowDeleteConfirm(false); setDeleteTargetCode(null); }}
          confirmColor="red"
          icon={<svg className="w-12 h-12 text-red-200 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
        />
      </div>
    </div>
  );
}