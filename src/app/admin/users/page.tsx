'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';

export default function UsersAdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 pb-16">
      <Navigation />
      
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
              사용자 관리
            </h1>
            <motion.div 
              className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
              initial={{ width: 0 }}
              animate={{ width: 128 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            ></motion.div>
            <p className="mt-4 text-blue-100 max-w-2xl">
              시스템에 등록된 모든 사용자를 관리할 수 있습니다.
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">사용자 목록</h2>
            <p className="text-blue-200 mb-8">현재 개발 중입니다. 곧 사용자 관리 기능이 추가될 예정입니다.</p>
          </motion.div>
        </div>
      </div>
    </main>
  );
} 