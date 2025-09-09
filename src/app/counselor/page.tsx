"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUsers, FaCalendarAlt, FaClipboardList, FaChartBar, FaLightbulb, FaKey, FaStickyNote, FaFileMedical, FaChartLine } from 'react-icons/fa';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { shouldShowCounselorMenu } from '@/utils/roleUtils';
import RoleGuard from '@/components/RoleGuard';

// 상담사 대시보드 카드 컴포넌트
const CounselorCard = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = "blue",
  stats = null 
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  color?: string;
  stats?: { label: string; value: string | number } | null;
}) => {
  const colorClasses = {
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
          <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {stats && (
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{stats.value}</div>
              <div className="text-sm text-blue-200">{stats.label}</div>
            </div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-200 transition-colors">
          {title}
        </h3>
        <p className="text-blue-200 text-sm leading-relaxed">
          {description}
        </p>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-xl transition-all duration-300"></div>
      </motion.div>
    </Link>
  );
};

// 로딩 컴포넌트
const LoadingCounselorPage = () => (
  <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
    <Navigation />
    <div className="h-20"></div>
    
    <div className="container mx-auto px-4 py-6 relative z-10">
      <div className="flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-blue-200">상담사 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  </main>
);

function CounselorPageContent() {
  const { user } = useFirebaseAuth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <Navigation />
      <div className="h-20"></div>
      
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 상담사 대시보드 타이틀 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -left-4 -top-8 w-20 h-20 bg-green-500 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-blue-200 to-purple-300 inline-block drop-shadow-lg">
            상담사 대시보드
          </h1>
          <motion.div 
            className="h-1.5 w-32 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full mt-2 shadow-lg"
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
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                안녕하세요, {user?.displayName || '상담사'}님!
              </h2>
              <p className="text-blue-200 mt-1">
                오늘도 내담자들과 함께 성장하는 하루가 되시길 바랍니다.
              </p>
            </div>
          </div>
        </motion.div>

        {/* 상담사 기능 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 내담자 관리 */}
          <CounselorCard
            title="내담자 목록"
            description="담당하고 있는 내담자들의 정보를 확인하고 관리할 수 있습니다."
            icon={FaUsers}
            href="/counselor/clients"
            color="green"
            stats={{ label: "활성 내담자", value: "12" }}
          />

          {/* 상담 일정 */}
          <CounselorCard
            title="상담 일정"
            description="상담 일정을 확인하고 새로운 상담을 예약할 수 있습니다."
            icon={FaCalendarAlt}
            href="/counselor/schedule"
            color="blue"
            stats={{ label: "오늘 상담", value: "3건" }}
          />

          {/* 상담 기록 */}
          <CounselorCard
            title="상담 기록"
            description="상담 세션의 내용을 기록하고 관리할 수 있습니다."
            icon={FaClipboardList}
            href="/counselor/sessions"
            color="purple"
            stats={{ label: "이번 주", value: "8회" }}
          />

          {/* 검사 결과 분석 */}
          <CounselorCard
            title="검사 결과 분석"
            description="내담자들의 심리검사 결과를 분석하고 해석할 수 있습니다."
            icon={FaChartBar}
            href="/counselor/test-results"
            color="orange"
            stats={{ label: "분석 완료", value: "15건" }}
          />

          {/* 검사 추천 */}
          <CounselorCard
            title="검사 추천"
            description="내담자에게 적합한 심리검사를 추천할 수 있습니다."
            icon={FaLightbulb}
            href="/counselor/test-recommendations"
            color="teal"
          />

          {/* 검사 코드 관리 */}
          <CounselorCard
            title="검사 코드 관리"
            description="내담자용 검사 코드를 생성하고 관리할 수 있습니다."
            icon={FaKey}
            href="/counselor/test-codes"
            color="blue"
            stats={{ label: "활성 코드", value: "24개" }}
          />

          {/* 상담 노트 */}
          <CounselorCard
            title="상담 노트"
            description="상담 내용을 체계적으로 기록하고 관리할 수 있습니다."
            icon={FaStickyNote}
            href="/counselor/notes"
            color="green"
          />

          {/* 치료 계획 */}
          <CounselorCard
            title="치료 계획"
            description="내담자별 맞춤 치료 계획을 수립하고 관리할 수 있습니다."
            icon={FaFileMedical}
            href="/counselor/treatment-plans"
            color="purple"
          />

          {/* 진행 상황 */}
          <CounselorCard
            title="진행 상황"
            description="치료 진행 상황을 추적하고 모니터링할 수 있습니다."
            icon={FaChartLine}
            href="/counselor/progress"
            color="orange"
            stats={{ label: "진행 중", value: "9명" }}
          />
        </div>

        {/* 최근 활동 요약 */}
        <motion.div
          className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-xl font-bold text-white mb-4">최근 활동</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-blue-200">김○○님과의 상담이 완료되었습니다.</span>
              <span className="text-sm text-blue-300 ml-auto">2시간 전</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-200">이○○님의 MBTI 검사 결과가 분석되었습니다.</span>
              <span className="text-sm text-blue-300 ml-auto">4시간 전</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-blue-200">박○○님의 치료 계획이 업데이트되었습니다.</span>
              <span className="text-sm text-blue-300 ml-auto">1일 전</span>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function CounselorPage() {
  return (
    <RoleGuard allowedRoles={['counselor']}>
      <CounselorPageContent />
    </RoleGuard>
  );
}
