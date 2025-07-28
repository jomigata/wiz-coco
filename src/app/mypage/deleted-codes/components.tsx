'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

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
  result?: any;
  deletedAt: string;
}

// 삭제코드 컨텐츠 컴포넌트
export function DeletedCodesContent({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [deletedRecords, setDeletedRecords] = useState<DeletedTestRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');

  // 삭제된 기록 가져오기
  useEffect(() => {
    fetchDeletedRecords();
  }, []);

  // 선택된 레코드 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSelections = localStorage.getItem('selected-deleted-records');
        if (savedSelections) {
          const selections = JSON.parse(savedSelections);
          if (Array.isArray(selections)) {
            setSelectedRecords(selections);
          }
        }
      } catch (e) {
        console.error('선택된 레코드 로드 오류:', e);
      }
    }
  }, []);

  // 선택된 레코드가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected-deleted-records', JSON.stringify(selectedRecords));
    }
  }, [selectedRecords]);

  // 로컬 스토리지에서 삭제된 테스트 기록 가져오기
  const fetchDeletedRecords = () => {
    try {
      setIsLoading(true);
      
      if (typeof window !== 'undefined') {
        const deletedRecordsStr = localStorage.getItem('deleted_test_records');
        
        if (deletedRecordsStr) {
          const parsedRecords = JSON.parse(deletedRecordsStr);
          
          if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
            // 정렬 (기본: 최신순)
            const sortedRecords = parsedRecords.sort((a, b) => {
              return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
            });
            
            setDeletedRecords(sortedRecords);
          } else {
            setDeletedRecords([]);
          }
        } else {
          // 개발 테스트용 더미 데이터
          const dummyDeletedRecords = [
            {
              code: 'MB23-ABCD1',
              timestamp: '2023-11-15T09:30:00',
              testType: 'MBTI 검사',
              userData: { name: '홍길동', birthYear: 1990, gender: '남성' },
              deletedAt: '2023-12-20T14:30:00'
            },
            {
              code: 'MB23-EFGH2',
              timestamp: '2023-11-20T15:45:00',
              testType: 'MBTI 검사',
              userData: { name: '김철수', birthYear: 1985, gender: '남성' },
              deletedAt: '2023-12-18T10:15:00'
            },
            {
              code: 'MB23-IJKL3',
              timestamp: '2023-11-25T11:20:00',
              testType: 'MBTI 검사',
              userData: { name: '이영희', birthYear: 1992, gender: '여성' },
              deletedAt: '2023-12-15T16:45:00'
            }
          ];
          setDeletedRecords(dummyDeletedRecords);
        }
      }
    } catch (error) {
      console.error('삭제된 기록 로드 오류:', error);
      setDeletedRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 기록 얻기
  const filteredRecords = deletedRecords.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.code.toLowerCase().includes(searchLower) ||
      record.testType.toLowerCase().includes(searchLower) ||
      (record.userData?.name && record.userData.name.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    if (sortOrder === 'newest') {
      return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
    } else if (sortOrder === 'oldest') {
      return new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime();
    } else if (sortOrder === 'codeAsc') {
      return a.code.localeCompare(b.code);
    } else if (sortOrder === 'codeDesc') {
      return b.code.localeCompare(a.code);
    }
    return 0;
  });

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
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

  // 선택 토글 함수
  const toggleSelection = (code: string) => {
    if (selectedRecords.includes(code)) {
      setSelectedRecords(prev => prev.filter(c => c !== code));
    } else {
      setSelectedRecords(prev => [...prev, code]);
    }
  };

  // 전체 선택 토글 함수
  const toggleAllSelection = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(record => record.code));
    }
  };

  // 선택된 기록 복원 함수
  const restoreSelectedRecords = () => {
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 1. 삭제된 기록에서 복원할 레코드 찾기
        const recordsToRestore = deletedRecords.filter(record => 
          selectedRecords.includes(record.code)
        );
        
        // 2. 기존 테스트 기록 가져오기
        const testRecordsStr = localStorage.getItem('test_records') || '[]';
        const testRecords = JSON.parse(testRecordsStr);
        
        // 3. 복원할 레코드 추가
        const restoredRecords = recordsToRestore.map(record => {
          const { deletedAt, ...restoredRecord } = record;
          return {
            ...restoredRecord,
            status: '완료'
          };
        });
        
        // 4. 테스트 기록 업데이트
        const updatedTestRecords = [...testRecords, ...restoredRecords];
        localStorage.setItem('test_records', JSON.stringify(updatedTestRecords));
        
        // 5. MBTI 테스트 기록도 함께 복원 (mbti-user-test-records에 추가)
        const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records') || '[]';
        let mbtiRecords = [];
        
        try {
          mbtiRecords = JSON.parse(mbtiRecordsStr);
        } catch (e) {
          console.error('MBTI 테스트 기록 파싱 오류:', e);
          mbtiRecords = [];
        }
        
        // MBTI 관련 레코드만 필터링하여 추가
        const mbtiRestoredRecords = restoredRecords
          .filter(record => record.testType.toLowerCase().includes('mbti'))
          .map(record => ({
            testCode: record.code,
            testType: record.testType,
            timestamp: record.timestamp,
            userData: record.userData,
            result: record.result
          }));
        
        if (mbtiRestoredRecords.length > 0) {
          const updatedMbtiRecords = [...mbtiRecords, ...mbtiRestoredRecords];
          localStorage.setItem('mbti-user-test-records', JSON.stringify(updatedMbtiRecords));
          console.log(`${mbtiRestoredRecords.length}개의 MBTI 테스트 기록 복원 완료`);
        }
        
        // 6. 삭제된 기록에서 복원된 레코드 제거
        const remainingDeletedRecords = deletedRecords.filter(record =>
          !selectedRecords.includes(record.code)
        );
        
        // 7. 삭제된 기록 업데이트
        localStorage.setItem('deleted_test_records', JSON.stringify(remainingDeletedRecords));
        setDeletedRecords(remainingDeletedRecords);
        
        // 8. 선택 초기화
        setSelectedRecords([]);
        
        console.log(`${restoredRecords.length}개의 기록 복원 완료`);
      }
    } catch (error) {
      console.error('기록 복원 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowRestoreConfirm(false);
    }
  };

  // 선택된 기록 영구 삭제 함수
  const permanentlyDeleteSelectedRecords = () => {
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 1. 영구 삭제할 레코드 정보 수집
        const recordsToMove = deletedRecords.filter(record => 
          selectedRecords.includes(record.code)
        );
        
        // 2. 관리자용 영구 삭제 저장소에 추가
        const adminDeletedStr = localStorage.getItem('admin_deleted_records') || '[]';
        let adminDeletedRecords = [];
        
        try {
          adminDeletedRecords = JSON.parse(adminDeletedStr);
        } catch (e) {
          console.error('관리자 삭제 기록 파싱 오류:', e);
          adminDeletedRecords = [];
        }
        
        // 각 레코드에 영구 삭제 시간 기록
        const recordsWithPermanentDelete = recordsToMove.map(record => ({
          ...record,
          permanentlyDeletedAt: new Date().toISOString(),
          hiddenFromUser: true
        }));
        
        // 관리자용 삭제 기록 업데이트
        const updatedAdminRecords = [...adminDeletedRecords, ...recordsWithPermanentDelete];
        localStorage.setItem('admin_deleted_records', JSON.stringify(updatedAdminRecords));
        
        // 3. 삭제된 기록에서 선택된 레코드 제외
        const remainingDeletedRecords = deletedRecords.filter(record =>
          !selectedRecords.includes(record.code)
        );
        
        // 4. 삭제된 기록 업데이트
        localStorage.setItem('deleted_test_records', JSON.stringify(remainingDeletedRecords));
        setDeletedRecords(remainingDeletedRecords);
        
        // 5. 선택 초기화
        setSelectedRecords([]);
      }
    } catch (error) {
      console.error('영구 삭제 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <main className={`relative ${!isEmbedded ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden min-h-screen pt-16 pb-12' : ''}`}>
      {!isEmbedded && (
        <>
          <Navigation />
          <div className="h-20"></div>
          
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
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </>
      )}
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 마이페이지 타이틀 */}
        {!isEmbedded && (
          <motion.div 
            className="mb-8 relative"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
              마이페이지
            </h1>
            <motion.div 
              className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: 128 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            ></motion.div>
          </motion.div>
        )}
        
        {/* 탭 메뉴 추가 */}
        {!isEmbedded && (
          <motion.div 
            className="flex border-b border-white/20 mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Link
              href="/mypage?tab=profile"
              className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
            >
              기본 정보
            </Link>
            <Link
              href="/mypage?tab=records"
              className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
            >
              검사 기록
            </Link>
            <Link
              href="/mypage?tab=stats"
              className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
            >
              통계 보기
            </Link>
            <Link
              href="/mypage/deleted-codes"
              className="px-4 py-2 font-medium text-blue-200 border-b-2 border-blue-200"
            >
              삭제코드
            </Link>
          </motion.div>
        )}
        
        {/* 삭제된 코드 섹션 제목 */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-blue-100">삭제된 코드 관리</h2>
          <p className="mt-2 text-blue-200 max-w-2xl">
            이전에 삭제한 검사 코드 기록을 확인하고, 필요한 기록은 복원하거나 영구적으로 삭제할 수 있습니다.
          </p>
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
              <svg className="h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검사 코드 또는 이름으로 검색"
              className="w-full pl-10 pr-4 py-2 border-none bg-white/5 text-white placeholder-blue-300/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex-shrink-0">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border-none bg-blue-800/80 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest" className="bg-blue-800 text-white">최근 삭제순</option>
              <option value="oldest" className="bg-blue-800 text-white">오래된 삭제순</option>
              <option value="codeAsc" className="bg-blue-800 text-white">코드 오름차순</option>
              <option value="codeDesc" className="bg-blue-800 text-white">코드 내림차순</option>
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
              <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-blue-200">삭제된 기록을 불러오는 중입니다...</p>
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-blue-200">선택된 항목: {selectedRecords.length}개</p>
                  <button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="px-4 py-2 bg-green-600/60 hover:bg-green-600/80 text-white rounded-lg transition-colors flex items-center"
                    disabled={isProcessing}
                  >
                    <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    복원하기
                  </button>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600/60 hover:bg-red-600/80 text-white rounded-lg transition-colors flex items-center"
                  disabled={isProcessing}
                >
                  <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  영구 삭제
                </button>
              </div>
            )}
            
            {filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/20">
                  <thead className="bg-white/5">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-blue-300 tracking-wider">
                        <input
                          type="checkbox"
                          id="select-all-header"
                          checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                          onChange={toggleAllSelection}
                          className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-blue-300 tracking-wider">
                        검사결과 코드
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                        검사 유형
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                        검사 일시
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                        고유번호/예명/별명
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                        삭제 일시
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredRecords.map((record) => (
                      <tr key={record.code} className="hover:bg-white/10 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.code)}
                            onChange={() => toggleSelection(record.code)}
                            className="w-4 h-4 text-blue-600 border-white/30 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-300">
                          {record.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                          {record.testType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                          {formatDate(record.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                          {record.userData?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white text-center">
                          {formatDate(record.deletedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-blue-400/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-white">삭제된 코드가 없습니다</h3>
                <p className="mt-1 text-blue-200">아직 삭제된 검사 기록이 없거나 검색 조건에 맞는 항목이 없습니다.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      {/* 복원 확인 모달 */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-blue-900/80 backdrop-blur-sm rounded-xl p-6 max-w-md w-full mx-4 border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">복원 확인</h3>
            <p className="text-blue-200 mb-6">
              선택한 {selectedRecords.length}개의 검사 기록을 복원하시겠습니까? 복원된 기록은 검사 기록 목록에서 다시 확인할 수 있습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 bg-blue-800/50 text-white rounded hover:bg-blue-700/50 transition-colors"
                disabled={isProcessing}
              >
                취소
              </button>
              <button
                onClick={restoreSelectedRecords}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : "복원하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 영구 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-blue-900/80 backdrop-blur-sm rounded-xl p-6 max-w-md w-full mx-4 border border-white/20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">영구 삭제 확인</h3>
            <p className="text-blue-200 mb-2">
              선택한 {selectedRecords.length}개의 검사 기록을 영구적으로 삭제하시겠습니까?
            </p>
            <p className="text-red-300 mb-6 font-medium">
              이 작업은 취소할 수 없으며, 모든 데이터가 완전히 삭제됩니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-blue-800/50 text-white rounded hover:bg-blue-700/50 transition-colors"
                disabled={isProcessing}
              >
                취소
              </button>
              <button
                onClick={permanentlyDeleteSelectedRecords}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : "영구 삭제"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
} 