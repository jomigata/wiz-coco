"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUsers, FaUserCheck, FaCog, FaChartBar, FaTags, FaBrain, FaComments, FaBell, FaCogs, FaDatabase, FaFileAlt } from 'react-icons/fa';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { shouldShowAdminMenu } from '@/utils/roleUtils';
import RoleGuard from '@/components/RoleGuard';

// 관리자 대시보드 카드 컴포넌트
const AdminCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = "red",
  stats = null,
  trend = null
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color?: string;
  stats?: { label: string; value: string | number } | null;
  trend?: { value: number; isPositive: boolean } | null;
}) => {
  const colorClasses = {
    red: "from-red-500 to-pink-600",
    blue: "from-blue-500 to-indigo-600", 
    green: "from-green-500 to-emerald-600",
    purple: "from-purple-500 to-violet-600",
    orange: "from-orange-500 to-red-600",
    teal: "from-teal-500 to-cyan-600"
  };

  return (
    <Link href={href}>
      <motion.div 
        className="group relative bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
        whileHover={{ y: -5 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses] || colorClasses.red}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{stats.value}</div>
              <div className="text-sm text-red-200">{stats.label}</div>
              {trend && (
                <div className={`text-xs flex items-center gap-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  <span>{trend.isPositive ? '↗' : '↘'}</span>
                  <span>{Math.abs(trend.value)}%</span>
            </div>
              )}
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-red-200 transition-colors">
          {title}
        </h3>
        <p className="text-red-200 text-sm leading-relaxed">
          {description}
        </p>
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-pink-500/0 group-hover:from-red-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-300"></div>
      </motion.div>
    </Link>
  );
};

// 로딩 컴포넌트
const LoadingAdminPage = () => (
  <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
    <Navigation />
    <div className="h-20"></div>
    
    <div className="container mx-auto px-4 py-6 relative z-10">
      <div className="flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
          <div className="w-16 h-16 border-4 border-red-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-red-200">관리자 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  </main>
);

function AdminPageContent() {
  const { user } = useFirebaseAuth();
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <Navigation />
      <div className="h-20"></div>
      
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 관리자 대시보드 타이틀 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -left-4 -top-8 w-20 h-20 bg-red-500 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-blue-200 to-purple-300 inline-block drop-shadow-lg">
          관리자 대시보드
          </h1>
        <motion.div 
            className="h-1.5 w-32 bg-gradient-to-r from-red-500 via-blue-500 to-purple-500 rounded-full mt-2 shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: 128 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        ></motion.div>
        </motion.div>

        {/* 환영 메시지 */}
      <motion.div 
          className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                안녕하세요, {user?.displayName || '관리자'}님!
              </h2>
              <p className="text-red-200 mt-1">
                시스템 관리와 모니터링을 위한 모든 도구가 준비되어 있습니다.
              </p>
            </div>
          </div>
      </motion.div>

        {/* 시스템 현황 요약 */}
      <motion.div 
          className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">총 사용자</p>
                <p className="text-3xl font-bold text-white">1,247</p>
                <p className="text-green-400 text-xs">+12% 이번 주</p>
              </div>
              <FaUsers className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">활성 상담사</p>
                <p className="text-3xl font-bold text-white">23</p>
                <p className="text-green-400 text-xs">+2 이번 주</p>
              </div>
              <FaUserCheck className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">이번 주 상담</p>
                <p className="text-3xl font-bold text-white">156</p>
                <p className="text-green-400 text-xs">+8% 이번 주</p>
              </div>
              <FaComments className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">시스템 상태</p>
                <p className="text-3xl font-bold text-green-400">정상</p>
                <p className="text-green-400 text-xs">99.9% 가동률</p>
              </div>
              <FaCog className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </motion.div>

        {/* 관리자 기능 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 사용자 관리 */}
          <AdminCard
            title="전체 사용자"
            description="사용자 계정을 관리하고 권한을 설정할 수 있습니다."
            icon={FaUsers}
            href="/admin/users"
            color="red"
            stats={{ label: "총 사용자", value: "1,247" }}
            trend={{ value: 12, isPositive: true }}
          />

          {/* 상담사 인증 */}
          <AdminCard
            title="상담사 인증"
            description="상담사 인증 요청을 검토하고 승인할 수 있습니다."
            icon={FaUserCheck}
            href="/admin/counselor-verification"
            color="blue"
            stats={{ label: "대기 중", value: "5건" }}
          />

          {/* 권한 관리 */}
          <AdminCard
            title="권한 관리"
            description="사용자별 권한과 역할을 설정할 수 있습니다."
            icon={FaCog}
            href="/admin/permissions"
            color="green"
          />

          {/* 대시보드 */}
          <AdminCard
            title="시스템 대시보드"
            description="시스템 현황과 성능 지표를 모니터링할 수 있습니다."
            icon={FaChartBar}
            href="/admin/dashboard"
            color="purple"
            stats={{ label: "실시간", value: "활성" }}
          />

          {/* 검사 코드 관리 */}
          <AdminCard
            title="검사 코드 관리"
            description="전체 검사 코드를 생성하고 관리할 수 있습니다."
            icon={FaTags}
          href="/admin/test-codes"
            color="orange"
            stats={{ label: "활성 코드", value: "2,456개" }}
          />

          {/* 데이터 분석 */}
          <AdminCard
            title="데이터 분석"
            description="사용자 데이터와 상담 통계를 분석할 수 있습니다."
            icon={FaChartBar}
            href="/admin/analytics"
            color="teal"
            stats={{ label: "분석 완료", value: "24시간" }}
          />

          {/* 심리검사 관리 */}
          <AdminCard
            title="심리검사 관리"
            description="심리검사 콘텐츠와 질문을 관리할 수 있습니다."
            icon={FaBrain}
            href="/admin/tests"
            color="blue"
            stats={{ label: "활성 검사", value: "12개" }}
          />

          {/* 상담 프로그램 */}
          <AdminCard
            title="상담 프로그램"
            description="상담 프로그램과 서비스를 관리할 수 있습니다."
            icon={FaComments}
            href="/admin/counseling-programs"
            color="green"
          />

          {/* 공지사항 */}
          <AdminCard
            title="공지사항"
            description="사이트 공지사항과 알림을 관리할 수 있습니다."
            icon={FaBell}
            href="/admin/notices"
            color="purple"
            stats={{ label: "활성 공지", value: "3개" }}
          />

          {/* 사이트 설정 */}
          <AdminCard
            title="사이트 설정"
            description="전체 사이트 설정과 구성을 관리할 수 있습니다."
            icon={FaCogs}
            href="/admin/settings"
            color="red"
          />

          {/* 백업 관리 */}
          <AdminCard
            title="백업 관리"
            description="데이터 백업과 복원을 관리할 수 있습니다."
            icon={FaDatabase}
            href="/admin/backup"
            color="orange"
            stats={{ label: "마지막 백업", value: "2시간 전" }}
          />

          {/* 로그 관리 */}
          <AdminCard
            title="로그 관리"
            description="시스템 로그와 활동 기록을 확인할 수 있습니다."
            icon={FaFileAlt}
            href="/admin/logs"
            color="teal"
            stats={{ label: "오늘 로그", value: "1,234개" }}
          />
        </div>

        {/* 최근 활동 요약 */}
        <motion.div
          className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">최근 시스템 활동</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-red-200">새로운 상담사 인증 요청이 접수되었습니다.</span>
              <span className="text-sm text-red-300 ml-auto">5분 전</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-red-200">시스템 백업이 성공적으로 완료되었습니다.</span>
              <span className="text-sm text-red-300 ml-auto">2시간 전</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-red-200">새로운 사용자 12명이 가입했습니다.</span>
              <span className="text-sm text-red-300 ml-auto">3시간 전</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-red-200">심리검사 결과 분석이 완료되었습니다.</span>
              <span className="text-sm text-red-300 ml-auto">6시간 전</span>
            </div>
          </div>
      </motion.div>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminPageContent />
    </RoleGuard>
  );
} 