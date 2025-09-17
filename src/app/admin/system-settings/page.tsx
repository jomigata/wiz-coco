'use client';

import React from 'react';

export default function SystemSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">시스템 설정</h1>
          <p className="text-gray-300">기본 설정과 권한을 관리하세요</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <p className="text-gray-400 text-center py-12">시스템 설정 페이지 (구현 예정)</p>
        </div>
      </div>
    </div>
  );
}
