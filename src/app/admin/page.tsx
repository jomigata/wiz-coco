'use client';

import React from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const quickAccessItems = [
    {
      title: '시스템 대시보드',
      description: '전체 현황을 한눈에 파악하세요',
      href: '/admin/system-dashboard',
      icon: '📊',
      color: 'from-blue-500 to-cyan-500',
      stats: { value: '1,247', label: '총 사용자', change: '+12%' }
    },
    {
      title: '실시간 모니터링',
      description: '활성 사용자와 상담 진행 상황을 실시간으로 확인',
      href: '/admin/realtime-monitoring',
      icon: '⚡',
      color: 'from-green-500 to-emerald-500',
      stats: { value: '47', label: '현재 활성', change: '실시간' }
    },
    {
      title: '사용자 관리',
      description: '상담사와 내담자를 통합 관리',
      href: '/admin/user-management',
      icon: '👥',
      color: 'from-purple-500 to-pink-500',
      stats: { value: '23', label: '상담사', change: '+2' }
    },
    {
      title: '상담 관리',
      description: '상담 일정, 진행 상황, 결과를 관리',
      href: '/admin/counseling-management',
      icon: '💬',
      color: 'from-orange-500 to-red-500',
      stats: { value: '156', label: '진행 중', change: '+8' }
    },
    {
      title: '심리검사 관리',
      description: '검사 생성, 배포, 결과를 분석',
      href: '/admin/psychological-tests',
      icon: '🧠',
      color: 'from-indigo-500 to-purple-500',
      stats: { value: '89', label: '완료된 검사', change: '+15' }
    },
    {
      title: '콘텐츠 관리',
      description: '상담 프로그램, 공지사항, 자료를 관리',
      href: '/admin/content-management',
      icon: '📚',
      color: 'from-teal-500 to-cyan-500',
      stats: { value: '12', label: '프로그램', change: '+3' }
    },
    {
      title: '알림 관리',
      description: '중요 알림 및 이벤트를 관리',
      href: '/admin/notification-management',
      icon: '🔔',
      color: 'from-yellow-500 to-orange-500',
      stats: { value: '5', label: '새 알림', change: '2분 전' }
    },
    {
      title: '시스템 설정',
      description: '기본 설정과 권한을 관리',
      href: '/admin/system-settings',
      icon: '⚙️',
      color: 'from-gray-500 to-slate-500',
      stats: { value: '100%', label: '시스템 상태', change: '정상' }
    },
    {
      title: '데이터 관리',
      description: '백업, 복원, 데이터를 분석',
      href: '/admin/data-management',
      icon: '💾',
      color: 'from-emerald-500 to-green-500',
      stats: { value: '2.3GB', label: '백업 크기', change: '최신' }
    },
    {
      title: '보안 관리',
      description: '보안 설정, 로그 관리, 접근을 제어',
      href: '/admin/security-management',
      icon: '🔐',
      color: 'from-red-500 to-pink-500',
      stats: { value: '99.9%', label: '보안 점수', change: '우수' }
    }
  ];

  const recentActivities = [
    { action: '새로운 사용자 등록', user: '김상담', time: '2분 전', type: 'user' },
    { action: '상담 완료', user: '이내담', time: '15분 전', type: 'counseling' },
    { action: '심리검사 완료', user: '박테스트', time: '1시간 전', type: 'test' },
    { action: '시스템 업데이트', user: '관리자', time: '2시간 전', type: 'system' },
    { action: '새 알림 생성', user: '시스템', time: '3시간 전', type: 'notification' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">관리자 대시보드</h1>
          <p className="text-gray-300 text-lg">전체 시스템을 한눈에 파악하고 빠르게 접근하세요</p>
        </div>

        {/* 전체 현황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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

        {/* 최근 활동 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">최근 활동</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'user' ? 'bg-blue-500/20' :
                    activity.type === 'counseling' ? 'bg-green-500/20' :
                    activity.type === 'test' ? 'bg-purple-500/20' :
                    activity.type === 'system' ? 'bg-yellow-500/20' :
                    'bg-orange-500/20'
                  }`}>
                    <span className="text-lg">
                      {activity.type === 'user' ? '👤' :
                       activity.type === 'counseling' ? '💬' :
                       activity.type === 'test' ? '🧠' :
                       activity.type === 'system' ? '⚙️' : '🔔'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-gray-400 text-sm">{activity.user}</p>
                  </div>
                  <span className="text-gray-400 text-sm">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">시스템 상태</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">서버 상태</span>
                <span className="text-green-400 font-semibold">정상</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">데이터베이스</span>
                <span className="text-green-400 font-semibold">정상</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">API 응답시간</span>
                <span className="text-green-400 font-semibold">120ms</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">메모리 사용률</span>
                <span className="text-yellow-400 font-semibold">67%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">보안 점수</span>
                <span className="text-green-400 font-semibold">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}