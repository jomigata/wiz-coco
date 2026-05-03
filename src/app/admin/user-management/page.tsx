'use client';

import React, { useState } from 'react';

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('all');

  const users = [
    { id: 1, name: "김상담", email: "kim@example.com", role: "상담사", status: "활성", joinDate: "2024-01-15", lastActive: "2시간 전" },
    { id: 2, name: "이내담", email: "lee@example.com", role: "내담자", status: "활성", joinDate: "2024-02-20", lastActive: "5분 전" },
    { id: 3, name: "박테스트", email: "park@example.com", role: "내담자", status: "활성", joinDate: "2024-03-10", lastActive: "1시간 전" },
    { id: 4, name: "최상담", email: "choi@example.com", role: "상담사", status: "비활성", joinDate: "2024-01-05", lastActive: "3일 전" },
    { id: 5, name: "정내담", email: "jung@example.com", role: "내담자", status: "활성", joinDate: "2024-03-25", lastActive: "30분 전" }
  ];

  const filteredUsers = users.filter(user => {
    if (activeTab === 'all') return true;
    if (activeTab === 'counselors') return user.role === '상담사';
    if (activeTab === 'clients') return user.role === '내담자';
    if (activeTab === 'active') return user.status === '활성';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">사용자 관리</h1>
          <p className="text-gray-300">상담사와 내담자를 통합 관리하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">총 사용자</p>
                <p className="text-3xl font-bold text-white">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">상담사</p>
                <p className="text-3xl font-bold text-white">{users.filter(u => u.role === '상담사').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">내담자</p>
                <p className="text-3xl font-bold text-white">{users.filter(u => u.role === '내담자').length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">활성 사용자</p>
                <p className="text-3xl font-bold text-white">{users.filter(u => u.status === '활성').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700 mb-6">
          <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
            {[
              { id: 'all', label: '전체 사용자', count: users.length },
              { id: 'counselors', label: '상담사', count: users.filter(u => u.role === '상담사').length },
              { id: 'clients', label: '내담자', count: users.filter(u => u.role === '내담자').length },
              { id: 'active', label: '활성 사용자', count: users.filter(u => u.status === '활성').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-slate-900 rounded-lg border border-slate-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">사용자 목록</h3>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                새 사용자 추가
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">이름</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">이메일</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">역할</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">상태</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">가입일</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">마지막 활동</th>
                    <th className="text-left py-3 px-4 text-gray-300 font-medium">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                            <span className="text-indigo-400 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-white font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{user.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === '상담사' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === '활성' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-300">{user.joinDate}</td>
                      <td className="py-4 px-4 text-gray-300">{user.lastActive}</td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button className="text-indigo-400 hover:text-indigo-300 text-sm">
                            편집
                          </button>
                          <button className="text-red-400 hover:text-red-300 text-sm">
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
