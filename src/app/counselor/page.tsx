'use client';

import React from 'react';
import Link from 'next/link';

export default function CounselorDashboard() {
  const quickAccessItems = [
    {
      title: '내담자 목록',
      description: '담당 내담자를 관리하세요',
      href: '/counselor/clients',
      icon: '👥',
      color: 'from-blue-500 to-cyan-500',
      stats: { value: '24', label: '담당 내담자', change: '+3' }
    },
    {
      title: '상담 일정',
      description: '상담 일정을 관리하세요',
      href: '/counselor/schedule',
      icon: '📅',
      color: 'from-green-500 to-emerald-500',
      stats: { value: '8', label: '오늘 상담', change: '2시간 후' }
    },
    {
      title: '상담 기록',
      description: '상담 세션을 기록하세요',
      href: '/counselor/sessions',
      icon: '📝',
      color: 'from-purple-500 to-pink-500',
      stats: { value: '156', label: '총 상담', change: '+12' }
    },
    {
      title: '치료 계획',
      description: '치료 계획을 수립하세요',
      href: '/counselor/treatment-plans',
      icon: '📋',
      color: 'from-orange-500 to-red-500',
      stats: { value: '18', label: '진행 중', change: '+2' }
    },
    {
      title: '검사 결과 분석',
      description: '내담자 검사 결과를 분석하세요',
      href: '/counselor/test-results',
      icon: '📊',
      color: 'from-indigo-500 to-purple-500',
      stats: { value: '89', label: '완료된 검사', change: '+5' }
    },
    {
      title: '검사 추천',
      description: '맞춤 검사를 추천하세요',
      href: '/counselor/test-recommendations',
      icon: '🎯',
      color: 'from-teal-500 to-cyan-500',
      stats: { value: '12', label: '추천 대기', change: '+3' }
    },
    {
      title: '검사 코드 패키지',
      description: '6자리 검사 코드로 내담자 검사 패키지를 만들고 진행 현황을 보세요',
      href: '/counselor/assessments',
      icon: '📦',
      color: 'from-cyan-500 to-blue-500',
      stats: { value: '패키지', label: '목록·진행현황', change: '바로가기' }
    },
    {
      title: '검사 코드 관리',
      description: '검사 코드를 생성하고 관리하세요',
      href: '/counselor/test-codes',
      icon: '🔑',
      color: 'from-yellow-500 to-orange-500',
      stats: { value: '45', label: '활성 코드', change: '+2' }
    },
    {
      title: '상담 노트',
      description: '상담 내용을 기록하세요',
      href: '/counselor/notes',
      icon: '📋',
      color: 'from-gray-500 to-slate-500',
      stats: { value: '234', label: '총 노트', change: '+8' }
    },
    {
      title: '진행 상황',
      description: '치료 진행 상황을 추적하세요',
      href: '/counselor/progress',
      icon: '📈',
      color: 'from-emerald-500 to-green-500',
      stats: { value: '78%', label: '평균 진행률', change: '+5%' }
    },
    {
      title: '상담 자료',
      description: '상담 자료를 관리하세요',
      href: '/counselor/resources',
      icon: '📚',
      color: 'from-red-500 to-pink-500',
      stats: { value: '67', label: '자료 수', change: '+4' }
    }
  ];

  const recentActivities = [
    { action: '새로운 상담 완료', client: '이내담', time: '30분 전', type: 'counseling' },
    { action: '검사 결과 분석 완료', client: '박테스트', time: '1시간 전', type: 'test' },
    { action: '치료 계획 업데이트', client: '김상담', time: '2시간 전', type: 'treatment' },
    { action: '상담 노트 작성', client: '최내담', time: '3시간 전', type: 'note' },
    { action: '진행 상황 업데이트', client: '정상담', time: '4시간 전', type: 'progress' }
  ];

  const upcomingSessions = [
    { client: '김내담', time: '14:00', type: '개별상담', status: '예정' },
    { client: '이상담', time: '15:30', type: '그룹상담', status: '예정' },
    { client: '박내담', time: '16:00', type: '개별상담', status: '예정' },
    { client: '최상담', time: '17:00', type: '가족상담', status: '예정' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">상담사 대시보드</h1>
          <p className="text-gray-300 text-lg">내담자와 상담을 효율적으로 관리하세요</p>
        </div>

        {/* 전체 현황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">담당 내담자</p>
                <p className="text-3xl font-bold text-white">24</p>
                <p className="text-green-400 text-sm">+3 이번 주</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
          </div>
            </div>
        </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">오늘 상담</p>
                <p className="text-3xl font-bold text-white">8</p>
                <p className="text-blue-400 text-sm">2시간 후 시작</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">총 상담 기록</p>
                <p className="text-3xl font-bold text-white">156</p>
                <p className="text-purple-400 text-sm">+12 이번 주</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
        </div>
      </div>
    </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">진행 중인 치료</p>
                <p className="text-3xl font-bold text-white">18</p>
                <p className="text-orange-400 text-sm">+2 이번 주</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 접근 버튼들 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">빠른 접근</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quickAccessItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{item.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-bold">{item.stats.value}</span>
                    <span className="text-gray-400">{item.stats.label}</span>
                  </div>
                  <div className="text-xs text-cyan-400 mt-1">{item.stats.change}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 하단 섹션들 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 최근 활동 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">최근 활동</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'counseling' ? 'bg-blue-500/20' :
                    activity.type === 'test' ? 'bg-purple-500/20' :
                    activity.type === 'treatment' ? 'bg-orange-500/20' :
                    activity.type === 'note' ? 'bg-green-500/20' :
                    'bg-cyan-500/20'
                  }`}>
                    <span className="text-lg">
                      {activity.type === 'counseling' ? '💬' :
                       activity.type === 'test' ? '📊' :
                       activity.type === 'treatment' ? '📋' :
                       activity.type === 'note' ? '📝' : '📈'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-gray-400 text-sm">{activity.client}</p>
                  </div>
                  <span className="text-gray-400 text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
      </div>
      
          {/* 오늘의 상담 일정 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">오늘의 상담 일정</h3>
            <div className="space-y-4">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                      <span className="text-cyan-400 text-sm font-bold">{session.time}</span>
            </div>
            <div>
                      <p className="text-white font-medium">{session.client}</p>
                      <p className="text-gray-400 text-sm">{session.type}</p>
            </div>
          </div>
                  <span className="text-cyan-400 text-sm font-medium">{session.status}</span>
                </div>
              ))}
            </div>
        </div>

          {/* 상담 통계 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">상담 통계</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">이번 주 상담</span>
                <span className="text-green-400 font-semibold">12회</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">평균 상담 시간</span>
                <span className="text-blue-400 font-semibold">45분</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">완료율</span>
                <span className="text-green-400 font-semibold">95%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">내담자 만족도</span>
                <span className="text-yellow-400 font-semibold">4.8/5.0</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">진행 중인 치료</span>
                <span className="text-purple-400 font-semibold">18건</span>
              </div>
            </div>
            </div>
            </div>
          </div>
      </div>
  );
}