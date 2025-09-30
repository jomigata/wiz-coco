'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { DataSharingRequest } from '@/app/api/data-sharing/route';

export default function DataSharingPage() {
  const { user, loading } = useFirebaseAuth();
  const [requests, setRequests] = useState<DataSharingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    sharedWithEmail: '',
    clientEmail: '',
    sharedData: {
      testResults: true,
      chatHistory: false,
      dailyRecords: false,
      otherMaterials: false
    },
    notes: '',
    expiresAt: ''
  });

  // 공유 요청 목록 조회
  const fetchRequests = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/data-sharing?counselorId=${user.uid}&type=${activeTab}`);
      const result = await response.json();
      
      if (result.success) {
        setRequests(result.data);
      } else {
        setError(result.error || '공유 요청 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('공유 요청 조회 오류:', err);
      setError('공유 요청 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 공유 요청 생성
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sharedWithEmail || !formData.clientEmail) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // 실제 구현에서는 이메일로 상담사 ID를 조회해야 함
      // 여기서는 임시로 처리
      const response = await fetch('/api/data-sharing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharerId: user?.uid,
          sharedWithId: 'temp-shared-with-id', // 실제로는 이메일로 조회한 ID
          clientId: 'temp-client-id', // 실제로는 이메일로 조회한 ID
          sharedData: formData.sharedData,
          notes: formData.notes,
          expiresAt: formData.expiresAt
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFormData({
          sharedWithEmail: '',
          clientEmail: '',
          sharedData: {
            testResults: true,
            chatHistory: false,
            dailyRecords: false,
            otherMaterials: false
          },
          notes: '',
          expiresAt: ''
        });
        setShowCreateForm(false);
        await fetchRequests(); // 목록 새로고침
      } else {
        setError(result.error || '공유 요청 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('공유 요청 생성 오류:', err);
      setError('공유 요청 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 공유 요청 상태 업데이트
  const handleUpdateStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      const response = await fetch('/api/data-sharing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
          notes
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchRequests(); // 목록 새로고침
      } else {
        setError(result.error || '상태 업데이트에 실패했습니다.');
      }
    } catch (err) {
      console.error('상태 업데이트 오류:', err);
      setError('상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 공유 요청 삭제
  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('이 공유 요청을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/data-sharing?requestId=${requestId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchRequests(); // 목록 새로고침
      } else {
        setError(result.error || '요청 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('요청 삭제 오류:', err);
      setError('요청 삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchRequests();
    }
  }, [user, loading, activeTab]);

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
            <h1 className="text-3xl font-bold text-white mb-2">데이터 공유 관리</h1>
            <p className="text-gray-300">다른 상담사와 내담자 데이터를 공유하거나 공유 요청을 관리하세요.</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 탭 메뉴 */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                받은 요청
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                보낸 요청
              </button>
            </div>
          </div>

          {/* 새 공유 요청 버튼 (보낸 요청 탭에서만) */}
          {activeTab === 'sent' && (
            <div className="mb-6">
              <motion.button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {showCreateForm ? '취소' : '+ 새 공유 요청'}
              </motion.button>
            </div>
          )}

          {/* 새 공유 요청 폼 */}
          {showCreateForm && activeTab === 'sent' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gray-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">새 공유 요청</h3>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      공유할 상담사 이메일 *
                    </label>
                    <input
                      type="email"
                      value={formData.sharedWithEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, sharedWithEmail: e.target.value }))}
                      placeholder="상담사 이메일을 입력하세요"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      공유할 내담자 이메일 *
                    </label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="내담자 이메일을 입력하세요"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    공유할 데이터 선택
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(formData.sharedData).map(([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sharedData: {
                              ...prev.sharedData,
                              [key]: e.target.checked
                            }
                          }))}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-600 rounded bg-gray-700"
                        />
                        <span className="ml-2 text-gray-300">
                          {key === 'testResults' && '검사 결과'}
                          {key === 'chatHistory' && '채팅 기록'}
                          {key === 'dailyRecords' && '일상 기록'}
                          {key === 'otherMaterials' && '기타 자료'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    메모
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="공유 목적이나 특별한 지시사항을 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    만료일 (선택사항)
                  </label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={isCreating}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCreating ? '요청 중...' : '공유 요청 보내기'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    취소
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 공유 요청 목록 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">공유 요청을 불러오는 중...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">
                  {activeTab === 'sent' ? '보낸 공유 요청이 없습니다.' : '받은 공유 요청이 없습니다.'}
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {activeTab === 'sent' ? '새 공유 요청을 생성해보세요.' : '다른 상담사로부터 공유 요청을 기다리고 있습니다.'}
                </p>
              </div>
            ) : (
              requests.map((request) => (
                <SharingRequestCard
                  key={request.id}
                  request={request}
                  type={activeTab}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteRequest}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 공유 요청 카드 컴포넌트
function SharingRequestCard({ 
  request, 
  type, 
  onUpdateStatus, 
  onDelete 
}: { 
  request: DataSharingRequest; 
  type: 'sent' | 'received';
  onUpdateStatus: (requestId: string, status: string, notes?: string) => void;
  onDelete: (requestId: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      case 'approved': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'revoked': return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'revoked': return '취소됨';
      default: return status;
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
            <h3 className="text-lg font-semibold text-white">
              {type === 'sent' ? '보낸 요청' : '받은 요청'}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
              {getStatusText(request.status)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <p><span className="text-gray-300">요청일:</span> {new Date(request.requestedAt).toLocaleDateString('ko-KR')}</p>
            {request.respondedAt && (
              <p><span className="text-gray-300">응답일:</span> {new Date(request.respondedAt).toLocaleDateString('ko-KR')}</p>
            )}
            {request.expiresAt && (
              <p><span className="text-gray-300">만료일:</span> {new Date(request.expiresAt).toLocaleDateString('ko-KR')}</p>
            )}
            {request.notes && (
              <p><span className="text-gray-300">메모:</span> {request.notes}</p>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-300 mb-2">공유할 데이터:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(request.sharedData).map(([key, value]) => (
                value && (
                  <span key={key} className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs">
                    {key === 'testResults' && '검사 결과'}
                    {key === 'chatHistory' && '채팅 기록'}
                    {key === 'dailyRecords' && '일상 기록'}
                    {key === 'otherMaterials' && '기타 자료'}
                  </span>
                )
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          {type === 'received' && request.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(request.id, 'approved')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                승인
              </button>
              <button
                onClick={() => onUpdateStatus(request.id, 'rejected')}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                거부
              </button>
            </div>
          )}
          
          {type === 'sent' && request.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onDelete(request.id)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
