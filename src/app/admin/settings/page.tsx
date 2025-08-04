'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserIcon, KeyIcon, ArrowPathIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminSettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsTab, setSettingsTab] = useState<'roles' | 'system' | 'backup'>('roles');
  
  // 정렬 상태 추가
  const [sortField, setSortField] = useState<keyof User | null>('role');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 사용자 데이터 로드
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: {
            'x-api-key': 'admin-secret-key'
          }
        });
        
        if (!response.ok) {
          throw new Error('사용자 데이터를 불러오는 데 실패했습니다.');
        }
        
        const data = await response.json();
        setUsers(data.users || []);
        setIsLoading(false);
      } catch (err) {
        console.error('사용자 데이터 로드 오류:', err);
        setError(err instanceof Error ? err.message : '사용자 데이터를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // 사용자 역할 변경 처리
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // API 호출 (실제 구현에서는 서버에 요청)
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'admin-secret-key'
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (response.ok) {
        // 로컬 상태 업데이트
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        console.log(`사용자 역할이 ${newRole}로 성공적으로 변경되었습니다.`);
      }
    } catch (err) {
      console.error('사용자 역할 변경 오류:', err);
    }
  };

  // 정렬 처리 함수
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 필터링 및 정렬된 사용자 목록
  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // 날짜 필드 처리
      if (sortField === 'createdAt' || sortField === 'lastLoginAt') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // 문자열 필드 처리
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // null 값 처리
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null) return sortDirection === 'asc' ? -1 : 1;
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

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
            시스템 설정
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            사용자 권한, 시스템 설정 및 백업 관리를 수행할 수 있습니다.
          </p>
        </motion.div>

        {/* 탭 메뉴 */}
        <div className="mb-6 flex border-b border-white/10">
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              settingsTab === 'roles' 
                ? 'text-blue-300 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setSettingsTab('roles')}
          >
            사용자 역할 관리
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              settingsTab === 'system' 
                ? 'text-blue-300 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setSettingsTab('system')}
          >
            시스템 설정
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm focus:outline-none ${
              settingsTab === 'backup' 
                ? 'text-blue-300 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setSettingsTab('backup')}
          >
            백업 관리
          </button>
        </div>

        {settingsTab === 'roles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 사용자 역할 관리 섹션 */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 mb-8">
              <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 mr-2 text-blue-300" />
                  사용자 역할 관리
                </h2>
                
                {/* 검색창 */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="사용자 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* 사용자 목록 */}
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-300">{error}</div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">검색 결과가 없습니다.</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-left">
                        <th 
                          className="p-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            이름
                            {sortField === 'name' && (
                              <svg className={`ml-1 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center">
                            이메일
                            {sortField === 'email' && (
                              <svg className={`ml-1 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('role')}
                        >
                          <div className="flex items-center">
                            역할
                            {sortField === 'role' && (
                              <svg className={`ml-1 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center">
                            가입일
                            {sortField === 'createdAt' && (
                              <svg className={`ml-1 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          className="p-4 font-medium text-gray-300 cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort('lastLoginAt')}
                        >
                          <div className="flex items-center">
                            마지막 로그인
                            {sortField === 'lastLoginAt' && (
                              <svg className={`ml-1 h-4 w-4 transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th className="p-4 font-medium text-gray-300">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4 text-white">{user.name}</td>
                          <td className="p-4 text-white">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {user.role === 'admin' ? '관리자' : '일반 사용자'}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 text-gray-300">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="p-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="bg-blue-600/40 border border-blue-400/30 rounded px-3 py-1 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{
                                backgroundColor: '#1d4ed8'
                              }}
                            >
                              <option value="user" style={{backgroundColor: '#1e40af', color: 'white'}}>일반 사용자</option>
                              <option value="admin" style={{backgroundColor: '#1e40af', color: 'white'}}>관리자</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {settingsTab === 'system' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <KeyIcon className="h-6 w-6 mr-2 text-blue-300" />
              시스템 설정
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 p-5 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">API 키 관리</h3>
                <p className="text-sm text-blue-200 mb-4">시스템 API 키를 생성하고 관리합니다.</p>
                <div className="flex items-center mb-4 bg-white/5 p-3 rounded">
                  <input
                    type="text"
                    value="admin-secret-key"
                    readOnly
                    className="flex-1 bg-transparent border-none text-white focus:outline-none"
                  />
                  <button className="ml-2 p-2 bg-blue-600/60 hover:bg-blue-600/80 rounded text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
                <button className="px-4 py-2 bg-blue-600/60 hover:bg-blue-600/80 text-white text-sm rounded transition-colors">
                  새 API 키 생성
                </button>
              </div>
              
              <div className="bg-white/5 p-5 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">이메일 서비스 설정</h3>
                <p className="text-sm text-blue-200 mb-4">이메일 발송 서비스 설정을 관리합니다.</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">발신자 이메일</label>
                    <input
                      type="email"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">SMTP 서버</label>
                    <input
                      type="text"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.example.com"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {settingsTab === 'backup' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <ArrowPathIcon className="h-6 w-6 mr-2 text-blue-300" />
              백업 관리
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-3">백업 일정</h3>
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-white">자동 백업</div>
                  <div className="relative inline-block w-12 h-6">
                    <input type="checkbox" className="opacity-0 w-0 h-0" id="toggle" defaultChecked />
                    <label
                      htmlFor="toggle"
                      className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-400 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 before:checked:transform before:checked:translate-x-6 checked:bg-blue-600"
                    ></label>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">매일 자정에 자동으로 데이터베이스를 백업합니다.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">마지막 백업</h4>
                  <p className="text-gray-300">2023-10-30 03:45:22</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">다음 예정 백업</h4>
                  <p className="text-gray-300">2023-10-31 00:00:00</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-3">수동 백업</h3>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center">
                <ArrowPathIcon className="h-5 w-5 mr-2" />
                지금 백업 실행
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 