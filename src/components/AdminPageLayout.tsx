import React from 'react';

interface AdminPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminPageLayout({ title, children }: AdminPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-300 text-lg">전문 관리 시스템</p>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          {children}
        </div>
      </div>
    </div>
  );
}
