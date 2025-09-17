'use client';

import React, { useState } from 'react';

export default function CounselingManagement() {
  const [activeTab, setActiveTab] = useState('ongoing');

  const counselingSessions = [
    { id: 1, counselor: "김상담", client: "이내담", type: "개인상담", status: "진행중", startTime: "14:00", duration: "45분", progress: 75 },
    { id: 2, counselor: "최상담", client: "박테스트", type: "심리검사", status: "완료", startTime: "13:00", duration: "60분", progress: 100 },
    { id: 3, counselor: "정상담", client: "김내담", type: "그룹상담", status: "예정", startTime: "15:30", duration: "90분", progress: 0 },
    { id: 4, counselor: "이상담", client: "최내담", type: "개인상담", status: "진행중", startTime: "14:30", duration: "50분", progress: 60 },
    { id: 5, counselor: "박상담", client: "정내담", type: "심리검사", status: "완료", startTime: "12:00", duration: "45분", progress: 100 }
  ];

  const filteredSessions = counselingSessions.filter(session => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return session.status === '진행중';
    if (activeTab === 'scheduled') return session.status === '예정';
    if (activeTab === 'completed') return session.status === '완료';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">상담 관리</h1>
          <p className="text-gray-300">상담 일정, 진행 상황, 결과를 관리하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">총 상담 세션</p>
                <p className="text-3xl font-bold text-white">{counselingSessions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">진행 중</p>
                <p className="text-3xl font-bold text-yellow-400">{counselingSessions.filter(s => s.status === '진행중').length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">예정</p>
                <p className="text-3xl font-bold text-blue-400">{counselingSessions.filter(s => s.status === '예정').length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">완료</p>
                <p className="text-3xl font-bold text-green-400">{counselingSessions.filter(s => s.status === '완료').length}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
          <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
            {[
              { id: 'all', label: '전체 상담', count: counselingSessions.length },
              { id: 'ongoing', label: '진행 중', count: counselingSessions.filter(s => s.status === '진행중').length },
              { id: 'scheduled', label: '예정', count: counselingSessions.filter(s => s.status === '예정').length },
              { id: 'completed', label: '완료', count: counselingSessions.filter(s => s.status === '완료').length }
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

        {/* 상담 세션 목록 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">상담 세션 목록</h3>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
                새 상담 예약
              </button>
            </div>

            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div key={session.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        <span className="text-indigo-400 font-medium">
                          {session.counselor.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{session.counselor} → {session.client}</h4>
                        <p className="text-gray-400 text-sm">{session.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.status === '진행중' ? 'bg-yellow-500/20 text-yellow-400' :
                        session.status === '예정' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {session.status}
                      </span>
                      <span className="text-gray-400 text-sm">{session.startTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="text-gray-400 text-sm">진행 시간</p>
                        <p className="text-white font-medium">{session.duration}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">진행률</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-700 rounded-full">
                            <div 
                              className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${session.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{session.progress}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-indigo-400 hover:text-indigo-300 text-sm px-3 py-1 rounded border border-indigo-500/30">
                        상세보기
                      </button>
                      {session.status === '진행중' && (
                        <button className="text-green-400 hover:text-green-300 text-sm px-3 py-1 rounded border border-green-500/30">
                          참여하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
