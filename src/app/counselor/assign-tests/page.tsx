'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { TestAssignment } from '@/types/counselor';

export default function AssignTestsPage() {
  const { user, loading } = useFirebaseAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<TestAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    testType: '',
    testName: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });

  // 사용 가능한 검사 목록
  const availableTests = [
    { type: 'mbti', name: 'MBTI 성격 유형 검사', category: '성격' },
    { type: 'depression', name: '우울증 선별 검사', category: '정신건강' },
    { type: 'anxiety', name: '불안장애 검사', category: '정신건강' },
    { type: 'stress', name: '스트레스 검사', category: '정신건강' },
    { type: 'self-esteem', name: '자존감 검사', category: '자기이해' },
    { type: 'relationship', name: '인간관계 검사', category: '관계' },
    { type: 'career', name: '진로 적성 검사', category: '진로' },
    { type: 'family', name: '가족 관계 검사', category: '가족' }
  ];

  // 내담자 목록 조회
  const fetchClients = async () => {
    if (!user?.uid) return;

    try {
      // 실제 구현에서는 상담사와 연결된 내담자 목록을 조회
      // 여기서는 임시 데이터 사용
      const mockClients = [
        { id: 'client1', name: '김내담', email: 'client1@example.com' },
        { id: 'client2', name: '이내담', email: 'client2@example.com' },
        { id: 'client3', name: '박내담', email: 'client3@example.com' }
      ];
      setClients(mockClients);
    } catch (err) {
      console.error('내담자 목록 조회 오류:', err);
      setError('내담자 목록 조회 중 오류가 발생했습니다.');
    }
  };

  // 검사 할당 목록 조회
  const fetchAssignments = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/test-assignments?counselorId=${user.uid}`);
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

  // 검사 할당
  const handleAssignTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !formData.testType || !formData.testName) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    setIsAssigning(true);
    setError('');

    try {
      const response = await fetch('/api/test-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          counselorId: user?.uid,
          testType: formData.testType,
          testName: formData.testName,
          priority: formData.priority,
          notes: formData.notes
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFormData({
          testType: '',
          testName: '',
          priority: 'medium',
          notes: ''
        });
        setSelectedClient('');
        setShowAssignForm(false);
        await fetchAssignments(); // 목록 새로고침
      } else {
        setError(result.error || '검사 할당에 실패했습니다.');
      }
    } catch (err) {
      console.error('검사 할당 오류:', err);
      setError('검사 할당 중 오류가 발생했습니다.');
    } finally {
      setIsAssigning(false);
    }
  };

  // 검사 상태 업데이트
  const handleUpdateStatus = async (assignmentId: string, status: string) => {
    try {
      const response = await fetch('/api/test-assignments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId,
          status
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchAssignments(); // 목록 새로고침
      } else {
        setError(result.error || '상태 업데이트에 실패했습니다.');
      }
    } catch (err) {
      console.error('상태 업데이트 오류:', err);
      setError('상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchClients();
      fetchAssignments();
    }
  }, [user, loading]);

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">검사 할당 관리</h1>
            <p className="text-gray-300">내담자에게 검사를 할당하고 진행 상황을 관리하세요.</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 새 검사 할당 버튼 */}
          <div className="mb-6">
            <motion.button
              onClick={() => setShowAssignForm(!showAssignForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showAssignForm ? '취소' : '+ 새 검사 할당'}
            </motion.button>
          </div>

          {/* 새 검사 할당 폼 */}
          {showAssignForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gray-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">새 검사 할당</h3>
              <form onSubmit={handleAssignTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      내담자 선택 *
                    </label>
                    <select
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">내담자를 선택하세요</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      우선순위
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="low">낮음</option>
                      <option value="medium">보통</option>
                      <option value="high">높음</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    검사 유형 *
                  </label>
                  <select
                    value={formData.testType}
                    onChange={(e) => {
                      const selectedTest = availableTests.find(test => test.type === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        testType: e.target.value,
                        testName: selectedTest?.name || ''
                      }));
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    <option value="">검사 유형을 선택하세요</option>
                    {availableTests.map((test) => (
                      <option key={test.type} value={test.type}>
                        {test.category} - {test.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    검사명 *
                  </label>
                  <input
                    type="text"
                    value={formData.testName}
                    onChange={(e) => setFormData(prev => ({ ...prev, testName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    메모
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="검사에 대한 특별한 지시사항이나 메모를 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={isAssigning}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isAssigning ? '할당 중...' : '검사 할당'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 검사 할당 목록 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">검사 할당을 불러오는 중...</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">할당된 검사가 없습니다.</p>
                <p className="text-gray-500 text-sm mt-2">새 검사를 할당하여 내담자를 도와주세요.</p>
              </div>
            ) : (
              assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 검사 할당 카드 컴포넌트
function AssignmentCard({ 
  assignment, 
  onUpdateStatus 
}: { 
  assignment: TestAssignment; 
  onUpdateStatus: (assignmentId: string, status: string) => void;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-xl font-semibold text-white">{assignment.testName}</h3>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(assignment.status)}`}>
              {assignment.status === 'assigned' && '할당됨'}
              {assignment.status === 'in_progress' && '진행중'}
              {assignment.status === 'completed' && '완료'}
              {assignment.status === 'cancelled' && '취소됨'}
            </span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(assignment.priority)}`}>
              {assignment.priority === 'high' && '높음'}
              {assignment.priority === 'medium' && '보통'}
              {assignment.priority === 'low' && '낮음'}
            </span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-400">
            <p><span className="text-gray-300">검사 유형:</span> {assignment.testType}</p>
            <p><span className="text-gray-300">할당일:</span> {new Date(assignment.assignedAt).toLocaleDateString('ko-KR')}</p>
            {assignment.completedAt && (
              <p><span className="text-gray-300">완료일:</span> {new Date(assignment.completedAt).toLocaleDateString('ko-KR')}</p>
            )}
            {assignment.notes && (
              <p><span className="text-gray-300">메모:</span> {assignment.notes}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {assignment.status === 'assigned' && (
            <button
              onClick={() => onUpdateStatus(assignment.id, 'in_progress')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              진행중으로 변경
            </button>
          )}
          {assignment.status === 'in_progress' && (
            <button
              onClick={() => onUpdateStatus(assignment.id, 'completed')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              완료로 변경
            </button>
          )}
          {assignment.status !== 'completed' && assignment.status !== 'cancelled' && (
            <button
              onClick={() => onUpdateStatus(assignment.id, 'cancelled')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
