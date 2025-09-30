'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useCounselorConnection } from '@/hooks/useCounselorConnection';
import { TestAssignment } from '@/types/counselor';
import Link from 'next/link';

export default function AssignedTestsPage() {
  const { user, loading } = useFirebaseAuth();
  const { connection: counselorConnection, loading: counselorLoading } = useCounselorConnection();
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 검사 할당 목록 조회
  const fetchAssignments = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/test-assignments?clientId=${user.uid}`);
      const result = await response.json();
      
      if (result.success) {
        setAssignments(result.data);
      } else {
        setError(result.error || '검사 할당 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('검사 할당 조회 오류:', err);
      setError('검사 할당 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchAssignments();
    }
  }, [user, loading]);

  if (loading || counselorLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-300 text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  if (!counselorConnection.isConnected) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-400 mb-2">상담사와 연결이 필요합니다</h1>
              <p className="text-gray-300 mb-4">
                할당된 검사를 확인하려면 먼저 상담사와 연결해야 합니다.
              </p>
              <a
                href="/mypage/connect-counselor"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
              >
                상담사 연결하기
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // 검사 유형별 라우트 매핑
  const getTestRoute = (testType: string) => {
    const routes: { [key: string]: string } = {
      'mbti': '/tests/mbti',
      'depression': '/tests/depression-mood',
      'anxiety': '/tests/anxiety-stress',
      'stress': '/tests/anxiety-stress',
      'self-esteem': '/tests/self-esteem',
      'relationship': '/tests/social-communication',
      'career': '/tests/career-work',
      'family': '/tests/family-relations'
    };
    return routes[testType] || '/tests';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">할당된 검사</h1>
            <p className="text-gray-300">
              상담사가 할당한 검사를 확인하고 진행하세요.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 검사 할당 목록 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">할당된 검사를 불러오는 중...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">할당된 검사가 없습니다</h3>
                <p className="text-gray-400">상담사가 검사를 할당하면 여기에 표시됩니다.</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <AssignedTestCard
                  key={assignment.id}
                  assignment={assignment}
                  testRoute={getTestRoute(assignment.testType)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 할당된 검사 카드 컴포넌트
function AssignedTestCard({ 
  assignment, 
  testRoute 
}: { 
  assignment: TestAssignment; 
  testRoute: string;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return '할당됨';
      case 'in_progress': return '진행중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-xl font-semibold text-white">{assignment.testName}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
              {getStatusText(assignment.status)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(assignment.priority)}`}>
              {getPriorityText(assignment.priority)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <p><span className="text-gray-300">검사 유형:</span> {assignment.testType}</p>
            <p><span className="text-gray-300">할당일:</span> {new Date(assignment.assignedAt).toLocaleDateString('ko-KR')}</p>
            {assignment.completedAt && (
              <p><span className="text-gray-300">완료일:</span> {new Date(assignment.completedAt).toLocaleDateString('ko-KR')}</p>
            )}
            {assignment.notes && (
              <p><span className="text-gray-300">상담사 메모:</span> {assignment.notes}</p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            {assignment.status === 'assigned' && (
              <Link
                href={testRoute}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                검사 시작하기
              </Link>
            )}
            {assignment.status === 'in_progress' && (
              <Link
                href={testRoute}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                검사 계속하기
              </Link>
            )}
            {assignment.status === 'completed' && (
              <div className="flex items-center text-emerald-400">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">검사 완료</span>
              </div>
            )}
            {assignment.status === 'cancelled' && (
              <div className="flex items-center text-red-400">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-medium">검사 취소됨</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
