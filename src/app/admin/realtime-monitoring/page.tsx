'use client';

import React, { useState, useEffect } from 'react';

export default function RealtimeMonitoring() {
  const [activeUsers, setActiveUsers] = useState(47);
  const [ongoingSessions, setOngoingSessions] = useState(12);
  const [systemLoad, setSystemLoad] = useState(23);

  // 실시간 데이터 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 3) - 1);
      setOngoingSessions(prev => prev + Math.floor(Math.random() * 2) - 1);
      setSystemLoad(prev => Math.max(0, Math.min(100, prev + Math.floor(Math.random() * 6) - 3)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">실시간 모니터링</h1>
          <p className="text-gray-300">활성 사용자와 상담 진행 상황을 실시간으로 확인하세요</p>
        </div>

        {/* 실시간 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">현재 활성 사용자</p>
                <p className="text-3xl font-bold text-green-400">{activeUsers}</p>
                <p className="text-green-400 text-sm">실시간 업데이트</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">진행 중인 상담</p>
                <p className="text-3xl font-bold text-blue-400">{ongoingSessions}</p>
                <p className="text-blue-400 text-sm">실시간 업데이트</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">시스템 부하</p>
                <p className="text-3xl font-bold text-yellow-400">{systemLoad}%</p>
                <p className="text-yellow-400 text-sm">정상 범위</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* 활성 사용자 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">현재 온라인 사용자</h3>
            <div className="space-y-3">
              {[
                { name: "김상담", role: "상담사", status: "상담 중", time: "2시간 15분" },
                { name: "이내담", role: "내담자", status: "대기 중", time: "5분" },
                { name: "박테스트", role: "내담자", status: "검사 중", time: "12분" },
                { name: "최상담", role: "상담사", status: "온라인", time: "1시간 30분" },
                { name: "정내담", role: "내담자", status: "상담 중", time: "45분" }
              ].map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      user.status === '상담 중' ? 'bg-green-500' : 
                      user.status === '대기 중' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <div>
                      <p className="text-white font-medium">{user.name}</p>
                      <p className="text-gray-400 text-sm">{user.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300 text-sm">{user.status}</p>
                    <p className="text-gray-400 text-xs">{user.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">진행 중인 상담 세션</h3>
            <div className="space-y-3">
              {[
                { counselor: "김상담", client: "이내담", duration: "45분", type: "개인상담" },
                { counselor: "최상담", client: "박테스트", duration: "20분", type: "심리검사" },
                { counselor: "정상담", client: "김내담", duration: "1시간 15분", type: "그룹상담" },
                { counselor: "이상담", client: "최내담", duration: "30분", type: "개인상담" }
              ].map((session, index) => (
                <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-medium">{session.counselor} → {session.client}</p>
                    <span className="text-green-400 text-sm">진행 중</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{session.type}</span>
                    <span>{session.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 시스템 상태 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">시스템 상태</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 text-sm">서버 상태</p>
              <p className="text-green-400 font-bold">정상</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 text-sm">데이터베이스</p>
              <p className="text-green-400 font-bold">정상</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 text-sm">API 응답시간</p>
              <p className="text-green-400 font-bold">120ms</p>
            </div>
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 text-sm">메모리 사용률</p>
              <p className="text-yellow-400 font-bold">67%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
