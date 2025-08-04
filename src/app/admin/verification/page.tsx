'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import UserSearchForm from '@/components/admin/UserSearchForm';
import VerificationCodeTable from '@/components/admin/VerificationCodeTable';
import Pagination from '@/components/admin/Pagination';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';

// 인증 코드 인터페이스
interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expires: string;
  createdAt: string;
}

export default function AdminVerificationPage() {
  const router = useRouter();
  
  // 상태 관리
  const [codes, setCodes] = useState<VerificationCode[]>([]);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCodes, setTotalCodes] = useState(0);
  const [deleteEmail, setDeleteEmail] = useState('');
  
  // 인증 코드 목록 조회
  const fetchCodes = async (page: number = 1, search: string = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 더 많은 목업 데이터 생성
      const mockCodes = [
        {
          id: '1',
          email: 'user1@example.com',
          code: '123456',
          expires: new Date(Date.now() + 3600000).toISOString(), // 1시간 후 만료
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          email: 'user2@example.com',
          code: '654321',
          expires: new Date(Date.now() - 3600000).toISOString(), // 1시간 전 만료
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '3',
          email: 'admin@okmbti.com',
          code: '111222',
          expires: new Date(Date.now() + 7200000).toISOString(), // 2시간 후 만료
          createdAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: '4',
          email: 'test@okmbti.com',
          code: '333444',
          expires: new Date(Date.now() + 1800000).toISOString(), // 30분 후 만료
          createdAt: new Date(Date.now() - 900000).toISOString()
        },
        {
          id: '5',
          email: 'newuser@example.com',
          code: '555666',
          expires: new Date(Date.now() + 900000).toISOString(), // 15분 후 만료
          createdAt: new Date(Date.now() - 300000).toISOString()
        }
      ];
      
      // 검색어가 있는 경우 필터링
      const filteredCodes = search 
        ? mockCodes.filter(code => code.email.toLowerCase().includes(search.toLowerCase()))
        : mockCodes;
      
      // 페이지네이션 적용
      const itemsPerPage = 10;
      const totalItems = filteredCodes.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
      const validPage = Math.min(Math.max(1, page), totalPages);
      const startIndex = (validPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
      
      const paginatedCodes = filteredCodes.slice(startIndex, endIndex);
      
      setCodes(paginatedCodes);
      setTotalPages(totalPages);
      setTotalCodes(totalItems);
      setCurrentPage(validPage);
      
      // 오류 상태 초기화
      setError(null);
    } catch (err) {
      console.error('인증 코드 목록 조회 오류:', err);
      setError('인증 코드 목록을 불러오는 중 오류가 발생했습니다. 관리자에게 문의하세요.');
      setCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 인증 코드 목록 조회
  useEffect(() => {
    fetchCodes(currentPage, searchTerm);
  }, []);

  // 인증 코드 삭제 모달 열기
  const handleDeleteCode = (codeId: string) => {
    const code = codes.find(c => c.id === codeId);
    if (code) {
      setCodeToDelete(codeId);
      setDeleteEmail(code.email);
      setIsDeleteModalOpen(true);
    }
  };

  // 인증 코드 삭제
  const handleConfirmDelete = async () => {
    if (!codeToDelete) return;
    
    try {
      // 실제 API 호출 대신 클라이언트 측에서 해당 코드를 제거
      setCodes(prevCodes => prevCodes.filter(code => code.id !== codeToDelete));
      setIsDeleteModalOpen(false);
      setCodeToDelete(null);
      
      // 코드 수가 감소했으므로 totalCodes 업데이트
      setTotalCodes(prevTotal => prevTotal - 1);
    } catch (err) {
      console.error('인증 코드 삭제 오류:', err);
      setError('인증 코드 삭제 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    }
  };

  // 만료된 인증 코드 일괄 삭제
  const handleCleanupExpiredCodes = async () => {
    setIsLoading(true);
    
    try {
      // 현재 시간 기준으로 만료된 코드 필터링
      const now = new Date();
      
      // 만료된 코드 개수 계산
      const expiredCodesCount = codes.filter(code => {
        const expiresDate = new Date(code.expires);
        return expiresDate <= now;
      }).length;
      
      // 만료되지 않은 코드만 유지
      setCodes(prevCodes => prevCodes.filter(code => {
        const expiresDate = new Date(code.expires);
        return expiresDate > now;
      }));
      
      // 총 코드 개수에서 만료된 코드 개수를 뺌
      setTotalCodes(prevTotal => prevTotal - expiredCodesCount);
      
      // 사용자에게 알림
      alert(`${expiredCodesCount}개의 만료된 인증 코드가 삭제되었습니다.`);
    } catch (err) {
      console.error('만료된 인증 코드 삭제 오류:', err);
      setError('만료된 인증 코드 삭제 중 오류가 발생했습니다. 관리자에게 문의하세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 인증 코드 만료 여부 확인
  const isExpired = (expiresDate: string): boolean => {
    const now = new Date();
    const expiresTime = new Date(expiresDate);
    return now > expiresTime;
  };

  // 검색 처리
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    fetchCodes(1, term);
  };

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCodes(page, searchTerm);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            이메일 인증 관리
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            회원가입 시 생성된 이메일 인증 코드를 관리할 수 있습니다. 총 <span className="font-semibold">{totalCodes}</span>개의 인증 코드가 있습니다.
          </p>
        </motion.div>
        
        {/* 검색 및 필터 */}
        <motion.div
          className="mb-6 flex flex-col md:flex-row justify-between gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <UserSearchForm onSearch={handleSearch} />
          
          <button
            onClick={handleCleanupExpiredCodes}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            만료된 인증 코드 삭제
          </button>
        </motion.div>
        
        {/* 에러 메시지 */}
        {error && (
          <motion.div
            className="mb-6 bg-red-800/30 border border-red-700/30 px-4 py-3 rounded-lg text-red-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </motion.div>
        )}
        
        {/* 인증 코드 테이블 */}
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
                <p className="mt-4 text-blue-200">인증 코드 정보를 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <VerificationCodeTable
              codes={codes}
              onDelete={handleDeleteCode}
              isExpired={isExpired}
            />
          )}
        </motion.div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </motion.div>
        )}
      </div>
      
      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          title="삭제 확인"
          message={`${deleteEmail}의 인증 코드를 삭제하시겠습니까?`}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
} 