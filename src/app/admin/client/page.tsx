'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import UserSearchForm from '@/components/admin/UserSearchForm';
import UserTable from '@/components/admin/UserTable';
import UserDetailModal from '@/components/admin/UserDetailModal';
import UserEditModal from '@/components/admin/UserEditModal';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import Pagination from '@/components/admin/Pagination';

// 사용자 인터페이스
interface User {
  id: string;
  name: string;
  email: string;
  mbti: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    testResults: number;
    mbtiTests: number;
  };
}

// 사용자 상세 정보 인터페이스
interface UserDetail extends User {
  testResults: {
    id: string;
    code: string;
    testType: string;
    testDate: string;
    mbtiType: string | null;
  }[];
  mbtiTests: {
    id: string;
    result: string;
    testedAt: string;
    testType: string;
  }[];
}

export default function AdminClientPage() {
  const router = useRouter();
  
  // 상태 관리
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // 사용자 목록 조회
  const fetchUsers = async (page: number = 1, search: string = '') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await fetch(`/api/users?${params.toString()}`, {
        headers: {
          'x-api-key': 'admin-secret-key',
        }
      });
      
      if (!response.ok) {
        throw new Error('사용자 목록을 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.totalUsers);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error('사용자 목록 조회 오류:', err);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 사용자 상세 정보 조회
  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'x-api-key': 'admin-secret-key',
        }
      });
      
      if (!response.ok) {
        throw new Error('사용자 정보를 가져오는데 실패했습니다.');
      }
      
      const data = await response.json();
      return data.user;
    } catch (err) {
      console.error('사용자 상세 정보 조회 오류:', err);
      setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 컴포넌트 마운트 시 사용자 목록 조회
  useEffect(() => {
    fetchUsers(currentPage, searchTerm);
  }, []);

  // 사용자 상세 정보 보기
  const handleViewDetails = async (userId: string) => {
    const userDetail = await fetchUserDetails(userId);
    
    if (userDetail) {
      setSelectedUser(userDetail);
      setIsDetailModalOpen(true);
    }
  };

  // 사용자 정보 수정 모달 열기
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  // 사용자 정보 수정
  const handleSaveUser = async (userId: string, userData: { name: string; email: string; mbti: string | null }) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin-secret-key',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '사용자 정보 수정에 실패했습니다.');
      }
      
      // 수정 성공 시 사용자 목록 다시 조회
      fetchUsers(currentPage, searchTerm);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('사용자 정보 수정 오류:', err);
      setError(err instanceof Error ? err.message : '사용자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // 사용자 삭제 모달 열기
  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };

  // 사용자 삭제
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': 'admin-secret-key',
        },
      });
      
      if (!response.ok) {
        throw new Error('사용자 삭제에 실패했습니다.');
      }
      
      // 삭제 성공 시 사용자 목록 다시 조회
      fetchUsers(currentPage, searchTerm);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('사용자 삭제 오류:', err);
      setError('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  // 검색 처리
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchUsers(1, term); // 검색 시 첫 페이지로 이동
  };

  // 페이지네이션 처리
  const handlePageChange = (page: number) => {
    fetchUsers(page, searchTerm);
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
            사용자 관리
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            시스템에 등록된 모든 사용자를 관리하고 검사 기록을 확인할 수 있습니다.
          </p>
        </motion.div>

        {/* 검색 폼 */}
        <div className="mb-6">
          <UserSearchForm onSearch={handleSearch} />
        </div>

        {/* 사용자 테이블 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/10 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">사용자 목록</h2>
            <p className="text-blue-200 text-sm">총 {totalUsers}명의 사용자</p>
          </div>
          
          <UserTable 
            users={users}
            isLoading={isLoading}
            onViewDetails={handleViewDetails}
            onEditUser={handleEditUser}
            onDeleteUser={handleDeleteUser}
          />
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-100 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        {/* 사용자 상세 정보 모달 */}
        {selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
          />
        )}

        {/* 사용자 정보 수정 모달 */}
        {userToEdit && (
          <UserEditModal 
            user={userToEdit} 
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveUser}
          />
        )}

        {/* 사용자 삭제 확인 모달 */}
        {userToDelete && (
          <DeleteConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            title="사용자 삭제"
            message={`${userToDelete.name || userToDelete.email} 사용자를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
          />
        )}
      </div>
    </div>
  );
} 