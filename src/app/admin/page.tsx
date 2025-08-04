'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  UsersIcon, 
  TagIcon, 
  TicketIcon, 
  ClockIcon, 
  DocumentTextIcon,
  ChevronRightIcon,
  ChartPieIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue = '0%',
  color 
}) => {
  return (
    <motion.div 
      className={`bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/10`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <p className="text-sm text-blue-200">{description}</p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className={`flex items-center text-sm ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 
              'text-blue-300'
            }`}>
              {trend === 'up' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === 'down' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trendValue}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface QuickLinkProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const QuickLink: React.FC<QuickLinkProps> = ({ href, title, description, icon, color }) => {
  return (
    <Link href={href}>
      <motion.div 
        className="bg-white/10 backdrop-blur-md rounded-xl p-5 shadow-lg border border-white/10 hover:bg-white/15 transition-colors group cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${color}`}>
              {icon}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-white">{title}</h3>
              <p className="text-sm text-blue-200">{description}</p>
            </div>
          </div>
          <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        </div>
      </motion.div>
    </Link>
  );
};

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    todayTests: 0,
    totalTestCodes: 0,
    availableTestCodes: 0,
    usedTestCodes: 0,
    averageCompletionTime: '0'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // 통계 데이터 로드
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 여기서 실제 API 호출을 구현할 수 있습니다.
        // 지금은 시뮬레이션 데이터를 사용합니다.
        setTimeout(() => {
          setStats({
            totalUsers: 127,
            totalTests: 562,
            todayTests: 24,
            totalTestCodes: 800,
            availableTestCodes: 638,
            usedTestCodes: 162,
            averageCompletionTime: '6:32'
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("통계 데이터 로드 오류:", error);
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // 애니메이션 설정
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };
  
  return (
    <>
      {/* 페이지 타이틀 */}
      <div className="mb-8">
        <motion.h1 
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          관리자 대시보드
        </motion.h1>
        <motion.div 
          className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
          initial={{ width: 0 }}
          animate={{ width: 128 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        ></motion.div>
      </div>

      {/* 요약 카드 */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatsCard 
          title="총 사용자"
          value={stats.totalUsers}
          description="등록된 사용자 수"
          icon={<UsersIcon className="h-6 w-6 text-white" />}
          trend="up"
          trendValue="12% 증가"
          color="bg-blue-600/30"
        />
        <StatsCard 
          title="총 검사 수행"
          value={stats.totalTests}
          description="모든 검사 유형 포함"
          icon={<ChartBarIcon className="h-6 w-6 text-white" />}
          trend="up"
          trendValue="8% 증가"
          color="bg-indigo-600/30"
        />
        <StatsCard 
          title="오늘 검사"
          value={stats.todayTests}
          description="오늘 수행된 검사"
          icon={<ClockIcon className="h-6 w-6 text-white" />}
          color="bg-purple-600/30"
        />
      </motion.div>

      {/* 검사 코드 상태 */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatsCard 
          title="총 코드"
          value={stats.totalTestCodes}
          description="생성된 모든 코드"
          icon={<TagIcon className="h-6 w-6 text-white" />}
          color="bg-blue-600/30"
        />
        <StatsCard 
          title="가용 코드"
          value={stats.availableTestCodes}
          description="사용 가능한 코드"
          icon={<TicketIcon className="h-6 w-6 text-white" />}
          color="bg-green-600/30"
        />
        <StatsCard 
          title="사용된 코드"
          value={stats.usedTestCodes}
          description="소진된 코드 수"
          icon={<DocumentTextIcon className="h-6 w-6 text-white" />}
          color="bg-red-600/30"
        />
      </motion.div>

      {/* 빠른 작업 링크 */}
      <h2 className="text-2xl font-bold text-white mb-4">빠른 작업</h2>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <QuickLink 
          href="/admin/test-codes"
          title="코드 관리"
          description="검사 코드 생성 및 관리"
          icon={<TagIcon className="h-6 w-6 text-white" />}
          color="bg-blue-600/30"
        />
        <QuickLink 
          href="/admin/client"
          title="사용자 관리"
          description="사용자 계정 관리"
          icon={<UserGroupIcon className="h-6 w-6 text-white" />}
          color="bg-indigo-600/30"
        />
        <QuickLink 
          href="/admin/mbti-analysis"
          title="MBTI 분석"
          description="MBTI 검사 결과 분석"
          icon={<ChartPieIcon className="h-6 w-6 text-white" />}
          color="bg-purple-600/30"
        />
        <QuickLink 
          href="/admin/analytics"
          title="데이터 분석"
          description="데이터 분석 및 통계"
          icon={<ChartBarIcon className="h-6 w-6 text-white" />}
          color="bg-green-600/30"
        />
      </motion.div>
    </>
  );
} 