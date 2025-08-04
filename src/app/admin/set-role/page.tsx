'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminSetRole from '@/components/admin/AdminSetRole';

// 클라이언트 컴포넌트 내부에서 useSearchParams 사용
function AdminSetRoleContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  
  return <AdminSetRole defaultEmail={email} />;
}

// 로딩 상태를 표시할 컴포넌트
function AdminSetRoleLoading() {
  return (
    <motion.div 
      className="flex items-center justify-center py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
        <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-xl text-blue-200">로딩 중입니다...</p>
      </div>
    </motion.div>
  );
}

export default function SetRolePage() {
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
            사용자 권한 설정
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            사용자에게 관리자 권한을 부여하거나 해제할 수 있습니다.
          </p>
        </motion.div>
          
        {/* Suspense로 useSearchParams를 사용하는 컴포넌트 감싸기 */}
        <Suspense fallback={<AdminSetRoleLoading />}>
          <AdminSetRoleContent />
        </Suspense>
        
        <motion.div 
          className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">안내사항</h2>
          <ul className="list-disc list-inside text-blue-200 space-y-2">
            <li>
              관리자 권한 설정은 신중하게 진행해주세요.
            </li>
            <li>
              권한 설정 후에는 해당 사용자가 재로그인해야 관리자 기능을 사용할 수 있습니다.
            </li>
            <li>
              기본 관리자 계정은 'admin@test.com'입니다.
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
} 