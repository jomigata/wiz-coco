import React from 'react';
import { wizWorkspaceClasses } from '@/components/layout/wizDesignTokens';

interface AdminPageLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminPageLayout({ title, children }: AdminPageLayoutProps) {
  return (
    <div className={`${wizWorkspaceClasses.page} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">{title}</h1>
          <p className="text-slate-600 text-lg">전문 관리 시스템</p>
        </div>

        <div className={wizWorkspaceClasses.card}>{children}</div>
      </div>
    </div>
  );
}
