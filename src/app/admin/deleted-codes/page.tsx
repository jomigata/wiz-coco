'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ConfirmModal from './ConfirmModal';

// 삭제된 테스트 기록 타입 정의
interface DeletedTestRecord {
  code: string;
  timestamp: string;
  testType: string;
  userData?: {
    birthYear?: number;
    gender?: string;
    name?: string;
    testDate?: string;
  };
  deletedAt: string;
  permanentlyDeletedAt?: string;
  hiddenFromUser?: boolean;
}

export default function AdminDeletedCodesPage() {
  const router = useRouter();
  // 상태 관리
  const [deletedRecords, setDeletedRecords] = useState<DeletedTestRecord[]>([]);
  const [permanentlyDeletedRecords, setPermanentlyDeletedRecords] = useState<DeletedTestRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'deleted' | 'permanentlyDeleted'>('deleted');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 로컬 스토리지 키 정의
  const STORAGE_KEYS = {
    DELETED_SELECTED: 'admin_deleted_codes_selected',
    PERMANENTLY_DELETED_SELECTED: 'admin_permanently_deleted_codes_selected',
  };

  useEffect(() => {
    fetchDeletedRecords();
    
    // 로컬 스토리지에서 선택 상태 복원
    if (typeof window !== 'undefined') {
      const storageKey = currentTab === 'deleted' 
        ? STORAGE_KEYS.DELETED_SELECTED 
        : STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED;
        
      const savedSelection = localStorage.getItem(storageKey);
      if (savedSelection) {
        try {
          const parsedSelection = JSON.parse(savedSelection);
          if (Array.isArray(parsedSelection)) {
            setSelectedRecords(parsedSelection);
          }
        } catch (e) {
          console.error('선택 상태 복원 오류:', e);
        }
      }
    }
  }, [currentTab]);

  // 선택 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storageKey = currentTab === 'deleted' 
        ? STORAGE_KEYS.DELETED_SELECTED 
        : STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED;
        
      localStorage.setItem(storageKey, JSON.stringify(selectedRecords));
    }
  }, [selectedRecords, currentTab]);

  const fetchDeletedRecords = () => {
    setIsLoading(true);

    if (typeof window !== 'undefined') {
      // 일반 삭제된 기록 가져오기
      const deletedRecordsStr = localStorage.getItem('deleted_test_records') || '[]';
      let tempDeletedRecords: DeletedTestRecord[] = [];
      
      try {
        tempDeletedRecords = JSON.parse(deletedRecordsStr);
      } catch (e) {
        console.error('삭제 기록 파싱 오류:', e);
        tempDeletedRecords = [];
      }
      
      // 관리자용 영구 삭제 기록 가져오기
      const adminDeletedStr = localStorage.getItem('admin_deleted_records') || '[]';
      let tempAdminDeletedRecords: DeletedTestRecord[] = [];
      
      try {
        tempAdminDeletedRecords = JSON.parse(adminDeletedStr);
      } catch (e) {
        console.error('관리자 삭제 기록 파싱 오류:', e);
        tempAdminDeletedRecords = [];
      }
      
      setDeletedRecords(tempDeletedRecords);
      setPermanentlyDeletedRecords(tempAdminDeletedRecords);
    }
    
    setIsLoading(false);
  };

  // 현재 탭에 따라 표시할 데이터 결정
  const currentRecords = currentTab === 'deleted' ? deletedRecords : permanentlyDeletedRecords;

  // 검색 및 정렬 적용된 기록
  const filteredRecords = currentRecords
    .filter(record => {
      const searchString = (
        record.code + 
        (record.testType || '') + 
        (record.userData?.name || '')
      ).toLowerCase();
      
      return searchTerm === '' || searchString.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
        case 'oldest':
          return new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime();
        case 'codeAsc':
          return a.code.localeCompare(b.code);
        case 'codeDesc':
          return b.code.localeCompare(a.code);
        default:
          return 0;
      }
    });

  // 날짜 형식화
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 선택 토글
  const toggleSelection = (code: string) => {
    setSelectedRecords(prev => 
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  // 전체 선택 토글
  const toggleAllSelection = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(record => record.code));
    }
  };

  // 영구삭제 -> 일반삭제 이동 함수 추가
  const moveToDeletedRecords = () => {
    if (selectedRecords.length === 0 || currentTab !== 'permanentlyDeleted') return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 선택된 영구 삭제 기록 가져오기
        const recordsToMove = permanentlyDeletedRecords.filter(record => 
          selectedRecords.includes(record.code)
        );
        
        // 영구 삭제 시간 삭제 및 일반 삭제 기록으로 변환
        const recordsForDeleted = recordsToMove.map(({ permanentlyDeletedAt, ...rest }) => rest);
        
        // 기존 일반 삭제 기록 가져오기
        const deletedRecordsStr = localStorage.getItem('deleted_test_records') || '[]';
        let currentDeletedRecords = [];
        
        try {
          currentDeletedRecords = JSON.parse(deletedRecordsStr);
        } catch (e) {
          console.error('일반 삭제 기록 파싱 오류:', e);
          currentDeletedRecords = [];
        }
        
        // 기존 일반 삭제 기록에 영구 삭제 기록 추가
        const updatedDeletedRecords = [...currentDeletedRecords, ...recordsForDeleted];
        localStorage.setItem('deleted_test_records', JSON.stringify(updatedDeletedRecords));
        
        // 영구 삭제 기록에서 이동된 항목 제거
        const remainingPermanentlyDeletedRecords = permanentlyDeletedRecords.filter(record =>
          !selectedRecords.includes(record.code)
        );
        localStorage.setItem('admin_deleted_records', JSON.stringify(remainingPermanentlyDeletedRecords));
        
        // 상태 업데이트
        setDeletedRecords([...deletedRecords, ...recordsForDeleted]);
        setPermanentlyDeletedRecords(remainingPermanentlyDeletedRecords);
        
        // 선택 초기화
        setSelectedRecords([]);
        localStorage.setItem(STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED, JSON.stringify([]));
        
        // 일반 삭제 탭으로 전환
        setCurrentTab('deleted');
      }
    } catch (error) {
      console.error('기록 이동 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowRestoreConfirm(false);
    }
  };

  // 선택된 기록 복원 함수
  const restoreSelectedRecords = () => {
    // 영구 삭제 탭에서는 일반 삭제 기록으로 이동
    if (currentTab === 'permanentlyDeleted') {
      moveToDeletedRecords();
      return;
    }
    
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 1. 현재 검사 기록 가져오기
        const testRecordsStr = localStorage.getItem('test_records') || '[]';
        let testRecords = [];
        
        try {
          testRecords = JSON.parse(testRecordsStr);
        } catch (e) {
          console.error('검사 기록 파싱 오류:', e);
          testRecords = [];
        }
        
        // 2. 복원할 기록 선택 - 현재 탭의 기록만 처리
        const recordsToRestore = currentTab === 'deleted'
          ? deletedRecords.filter(record => selectedRecords.includes(record.code))
          : permanentlyDeletedRecords.filter(record => selectedRecords.includes(record.code));
        
        // 3. 복원할 기록에서 삭제 관련 메타데이터 제거
        const cleanedRecordsToRestore = recordsToRestore.map(({ deletedAt, permanentlyDeletedAt, hiddenFromUser, ...rest }) => rest);
        
        // 4. 검사 기록에 복원된 레코드 추가
        const updatedTestRecords = [...testRecords, ...cleanedRecordsToRestore];
        localStorage.setItem('test_records', JSON.stringify(updatedTestRecords));
        
        // 5. 현재 탭에 따라 적절한 저장소에서 복원된 레코드 제거
        if (currentTab === 'deleted') {
          const remainingDeletedRecords = deletedRecords.filter(record =>
            !selectedRecords.includes(record.code)
          );
          localStorage.setItem('deleted_test_records', JSON.stringify(remainingDeletedRecords));
          setDeletedRecords(remainingDeletedRecords);
        } else {
          const remainingPermanentlyDeletedRecords = permanentlyDeletedRecords.filter(record =>
            !selectedRecords.includes(record.code)
          );
          localStorage.setItem('admin_deleted_records', JSON.stringify(remainingPermanentlyDeletedRecords));
          setPermanentlyDeletedRecords(remainingPermanentlyDeletedRecords);
        }
        
        // 6. 선택 초기화
        setSelectedRecords([]);
        
        // 현재 탭에 맞는 저장소 키 선택
        const storageKey = currentTab === 'deleted' 
          ? STORAGE_KEYS.DELETED_SELECTED 
          : STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED;
          
        // 로컬 스토리지에서 선택 상태 초기화
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('기록 복원 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowRestoreConfirm(false);
    }
  };

  // 선택된 기록 완전히 삭제 함수
  const permanentlyDeleteSelectedRecords = () => {
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 현재 탭에 따라 적절한 저장소에서 선택된 항목만 삭제
        if (currentTab === 'deleted') {
          // 일반 삭제된 기록에서 선택된 레코드 제외
          const remainingDeletedRecords = deletedRecords.filter(record =>
            !selectedRecords.includes(record.code)
          );
          localStorage.setItem('deleted_test_records', JSON.stringify(remainingDeletedRecords));
          setDeletedRecords(remainingDeletedRecords);
        } else {
          // 영구 삭제된 기록에서 선택된 레코드 제외
          const remainingPermanentlyDeletedRecords = permanentlyDeletedRecords.filter(record =>
            !selectedRecords.includes(record.code)
          );
          localStorage.setItem('admin_deleted_records', JSON.stringify(remainingPermanentlyDeletedRecords));
          setPermanentlyDeletedRecords(remainingPermanentlyDeletedRecords);
        }
        
        // 선택 초기화
        setSelectedRecords([]);
        
        // 현재 탭에 맞는 저장소 키 선택
        const storageKey = currentTab === 'deleted' 
          ? STORAGE_KEYS.DELETED_SELECTED 
          : STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED;
          
        // 로컬 스토리지에서 선택 상태 초기화
        localStorage.setItem(storageKey, JSON.stringify([]));
      }
    } catch (error) {
      console.error('영구 삭제 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden">
      <div className="flex min-h-screen pt-4 pb-12">
        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 px-8 py-6 overflow-x-auto">
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
                  삭제된 코드 관리
                </h1>
                <motion.div 
                  className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
                  initial={{ width: 0 }}
                  animate={{ width: 128 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                ></motion.div>
                <p className="mt-4 text-blue-100 max-w-2xl">
                  삭제된 검사 코드를 관리하고 복구할 수 있습니다. 총 <span className="font-semibold">{deletedRecords.length + permanentlyDeletedRecords.length}</span>개의 삭제된 코드가 있습니다.
                </p>
              </motion.div>
              
              {/* 탭 메뉴 */}
              <motion.div 
                className="mb-6 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white/20 flex">
                  <button
                    onClick={() => {
                      // 현재 선택 상태를 로컬 스토리지에 저장
                      if (currentTab !== 'deleted') {
                        localStorage.setItem(STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED, JSON.stringify(selectedRecords));
                        
                        // 탭 변경 및 이전에 저장된 deleted 탭의 선택 항목 복원
                        setCurrentTab('deleted');
                        
                        // 로컬 스토리지에서 삭제 탭의 선택 상태 가져오기
                        const savedSelection = localStorage.getItem(STORAGE_KEYS.DELETED_SELECTED);
                        if (savedSelection) {
                          try {
                            const parsedSelection = JSON.parse(savedSelection);
                            if (Array.isArray(parsedSelection)) {
                              setSelectedRecords(parsedSelection);
                            } else {
                              setSelectedRecords([]);
                            }
                          } catch (e) {
                            console.error('선택 상태 복원 오류:', e);
                            setSelectedRecords([]);
                          }
                        } else {
                          setSelectedRecords([]);
                        }
                      }
                    }}
                    className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                      currentTab === 'deleted'
                        ? 'bg-gradient-to-r from-purple-600/70 to-indigo-600/70 text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    일반 삭제 기록
                  </button>
                  <button
                    onClick={() => {
                      // 현재 선택 상태를 로컬 스토리지에 저장
                      if (currentTab !== 'permanentlyDeleted') {
                        localStorage.setItem(STORAGE_KEYS.DELETED_SELECTED, JSON.stringify(selectedRecords));
                        
                        // 탭 변경 및 이전에 저장된 permanentlyDeleted 탭의 선택 항목 복원
                        setCurrentTab('permanentlyDeleted');
                        
                        // 로컬 스토리지에서 영구 삭제 탭의 선택 상태 가져오기
                        const savedSelection = localStorage.getItem(STORAGE_KEYS.PERMANENTLY_DELETED_SELECTED);
                        if (savedSelection) {
                          try {
                            const parsedSelection = JSON.parse(savedSelection);
                            if (Array.isArray(parsedSelection)) {
                              setSelectedRecords(parsedSelection);
                            } else {
                              setSelectedRecords([]);
                            }
                          } catch (e) {
                            console.error('선택 상태 복원 오류:', e);
                            setSelectedRecords([]);
                          }
                        } else {
                          setSelectedRecords([]);
                        }
                      }
                    }}
                    className={`px-6 py-3 rounded-lg transition-colors flex items-center ${
                      currentTab === 'permanentlyDeleted'
                        ? 'bg-gradient-to-r from-red-600/70 to-pink-600/70 text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                    </svg>
                    영구 삭제 기록
                  </button>
                </div>
              </motion.div>
              
              {/* 검색 및 필터링 컨트롤 */}
              <motion.div 
                className="mb-6 flex flex-col md:flex-row gap-4 items-center bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검사 코드 또는 이름으로 검색"
                    className="w-full pl-10 pr-4 py-2 border-none bg-white/5 text-white placeholder-red-300/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div className="flex-shrink-0">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2 border-none bg-blue-600/40 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    style={{
                      backgroundColor: '#1d4ed8'
                    }}
                  >
                    <option value="newest" style={{backgroundColor: '#1e40af', color: 'white'}}>최근 삭제순</option>
                    <option value="oldest" style={{backgroundColor: '#1e40af', color: 'white'}}>오래된 삭제순</option>
                    <option value="codeAsc" style={{backgroundColor: '#1e40af', color: 'white'}}>코드 오름차순</option>
                    <option value="codeDesc" style={{backgroundColor: '#1e40af', color: 'white'}}>코드 내림차순</option>
                  </select>
                </div>
              </motion.div>
              
              {isLoading ? (
                <motion.div 
                  className="flex items-center justify-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
                    <div className="w-16 h-16 border-4 border-red-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-red-200">삭제된 기록을 불러오는 중입니다...</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {selectedRecords.length > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <p className="text-red-200">선택된 항목: {selectedRecords.length}개</p>
                      <button
                        onClick={() => setShowRestoreConfirm(true)}
                        className="px-4 py-2 bg-green-600/60 hover:bg-green-600/80 text-white rounded-lg transition-colors flex items-center"
                        disabled={isProcessing}
                      >
                        <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        {currentTab === 'deleted' ? '사용자에게 복원' : '일반삭제로 이동'}
                      </button>
                    </div>
                  )}
                  
                  {filteredRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/20">
                        <thead className="bg-white/5">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-red-300 tracking-wider">
                              <input
                                type="checkbox"
                                id="select-all-header"
                                checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                                onChange={toggleAllSelection}
                                className="w-4 h-4 text-red-600 border-white/30 rounded focus:ring-red-500"
                              />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-red-300 tracking-wider">
                              검사결과 코드
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-red-300 tracking-wider">
                              검사 유형
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-red-300 tracking-wider">
                              이름
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-red-300 tracking-wider">
                              삭제 일시
                            </th>
                            {currentTab === 'permanentlyDeleted' && (
                              <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-red-300 tracking-wider">
                                영구 삭제 일시
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredRecords.map((record) => (
                            <tr 
                              key={record.code} 
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  id={`select-${record.code}`}
                                  checked={selectedRecords.includes(record.code)}
                                  onChange={() => toggleSelection(record.code)}
                                  className="w-4 h-4 text-red-600 border-white/30 rounded focus:ring-red-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-white font-medium">{record.code}</div>
                                <div className="text-gray-300 text-sm">{new Date(record.timestamp).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-white">
                                {record.testType || '알 수 없음'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-white">
                                {record.userData?.name || '이름 없음'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">
                                {formatDate(record.deletedAt)}
                              </td>
                              {currentTab === 'permanentlyDeleted' && (
                                <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">
                                  {record.permanentlyDeletedAt ? formatDate(record.permanentlyDeletedAt) : '-'}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-300/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg text-red-200">
                        {currentTab === 'deleted' 
                          ? '사용자가 삭제한 검사 코드가 없습니다.' 
                          : '영구 삭제된 검사 코드가 없습니다.'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
            
            {/* 복원/이동/삭제 확인 모달 */}
            <ConfirmModal
              open={showRestoreConfirm}
              title={currentTab === 'deleted' ? '기록 복원 확인' : '일반 삭제 기록으로 이동'}
              description={currentTab === 'deleted'
                ? `선택한 ${selectedRecords.length}개의 검사 기록을\n사용자의 기록으로 복원하시겠습니까?\n\n복원된 기록은 사용자 기록에서 다시 확인할 수 있습니다.`
                : `선택한 ${selectedRecords.length}개의 검사 기록을\n일반 삭제 기록으로 이동하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
              confirmText={currentTab === 'deleted' ? '복원하기' : '일반삭제로 이동'}
              cancelText="취소"
              onConfirm={restoreSelectedRecords}
              onCancel={() => setShowRestoreConfirm(false)}
              confirmColor={currentTab === 'deleted' ? 'green' : 'blue'}
              icon={currentTab === 'deleted' ? (
                <svg className="w-12 h-12 text-green-200 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-12 h-12 text-blue-200 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
              )}
              loading={isProcessing}
            />
            <ConfirmModal
              open={showDeleteConfirm}
              title="영구 삭제 확인"
              description={`선택한 ${selectedRecords.length}개의 검사 기록을\n정말로 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
              confirmText="완전히 삭제"
              cancelText="취소"
              onConfirm={permanentlyDeleteSelectedRecords}
              onCancel={() => setShowDeleteConfirm(false)}
              confirmColor="red"
              icon={
                <svg className="w-12 h-12 text-red-200 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
              loading={isProcessing}
            />
          </div>
        </main>
      </div>
    </div>
  );
} 