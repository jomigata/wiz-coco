'use client';

import React from 'react';

export default function SystemDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">시스템 대시보드</h1>
          <p className="text-gray-300">전체 현황을 한눈에 파악하세요</p>
        </div>

        {/* 주요 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">총 사용자</p>
                <p className="text-3xl font-bold text-white">1,247</p>
                <p className="text-green-400 text-sm">+12% 이번 주</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">활성 상담사</p>
                <p className="text-3xl font-bold text-white">23</p>
                <p className="text-green-400 text-sm">+2 이번 주</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">진행 중인 상담</p>
                <p className="text-3xl font-bold text-white">156</p>
                <p className="text-blue-400 text-sm">+8 오늘</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">완료된 상담</p>
                <p className="text-3xl font-bold text-white">2,341</p>
                <p className="text-green-400 text-sm">+45 이번 주</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 및 그래프 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">사용자 증가 추이</h3>
            <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">차트 영역 (Chart.js 또는 Recharts 구현 예정)</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">상담 유형별 분포</h3>
            <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">파이 차트 영역 (Chart.js 또는 Recharts 구현 예정)</p>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-xl font-semibold text-white mb-4">최근 활동</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-lg">👤</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">새로운 사용자 등록</p>
                <p className="text-gray-400 text-sm">김상담님이 상담사로 등록했습니다.</p>
              </div>
              <span className="text-gray-400 text-sm">2분 전</span>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-lg">💬</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">상담 완료</p>
                <p className="text-gray-400 text-sm">이내담님의 상담이 성공적으로 완료되었습니다.</p>
              </div>
              <span className="text-gray-400 text-sm">15분 전</span>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-lg">🧠</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">심리검사 완료</p>
                <p className="text-gray-400 text-sm">박테스트님이 MBTI 검사를 완료했습니다.</p>
              </div>
              <span className="text-gray-400 text-sm">1시간 전</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
