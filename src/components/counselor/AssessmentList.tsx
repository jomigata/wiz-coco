'use client';

import React from 'react';
import Link from 'next/link';
import type { CounselorAssessment } from '@/lib/assessmentApi';

interface AssessmentListProps {
  assessments: CounselorAssessment[];
  createdCode?: string | null;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export default function AssessmentList({ assessments, createdCode }: AssessmentListProps) {
  if (assessments.length === 0 && !createdCode) {
    return (
      <div className="bg-slate-800/80 rounded-xl border border-slate-600 p-8 text-center">
        <p className="text-slate-400 mb-4">등록된 참여 코드 패키지가 없습니다.</p>
        <Link
          href="/counselor/assessments/new"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          첫 패키지 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {createdCode && (
        <div className="rounded-lg bg-green-900/30 border border-green-600/50 p-4 text-green-200 text-sm">
          패키지가 생성되었습니다. 참여 코드: <strong className="font-mono tracking-widest">{createdCode}</strong>
          — 내담자에게 이 코드를 전달하세요.
        </div>
      )}
      <div className="bg-slate-800/80 rounded-xl border border-slate-600 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-600 bg-slate-800">
                <th className="px-4 py-3 text-slate-300 font-medium">제목</th>
                <th className="px-4 py-3 text-slate-300 font-medium">참여 코드</th>
                <th className="px-4 py-3 text-slate-300 font-medium">대상</th>
                <th className="px-4 py-3 text-slate-300 font-medium">검사 수</th>
                <th className="px-4 py-3 text-slate-300 font-medium">생성일</th>
                <th className="px-4 py-3 text-slate-300 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white font-medium">{a.title || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-cyan-400 tracking-wider">{a.accessCode}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.targetAudience || '개인'}</td>
                  <td className="px-4 py-3 text-slate-300">{(a.testList || []).length}개</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/counselor/assessments/${a.id}/progress`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      진행 현황
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
