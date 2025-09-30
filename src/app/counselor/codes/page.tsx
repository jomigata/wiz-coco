'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { CounselorCode } from '@/types/counselor';

export default function CounselorCodesPage() {
  const { user, loading } = useFirebaseAuth();
  const [codes, setCodes] = useState<CounselorCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 상담사 인증코드 목록 조회
  const fetchCodes = async () => {
    if (!user?.uid) return;
    
    try {
      const response = await fetch(`/api/counselor-codes?counselorId=${user.uid}`);
      const result = await response.json();
      
      if (result.success) {
        setCodes(result.data);
      } else {
        setError(result.error || '인증코드 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('인증코드 조회 오류:', err);
      setError('인증코드 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 새 인증코드 생성
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCodeName.trim()) {
      setError('코드명을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/counselor-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          counselorId: user?.uid,
          codeName: newCodeName.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setNewCodeName('');
        setShowCreateForm(false);
        await fetchCodes(); // 목록 새로고침
      } else {
        setError(result.error || '인증코드 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('인증코드 생성 오류:', err);
      setError('인증코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 인증코드명 수정
  const handleUpdateCode = async (codeId: string, newName: string) => {
    try {
      const response = await fetch('/api/counselor-codes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeId,
          codeName: newName
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchCodes(); // 목록 새로고침
      } else {
        setError(result.error || '코드명 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('코드명 수정 오류:', err);
      setError('코드명 수정 중 오류가 발생했습니다.');
    }
  };

  // 인증코드 비활성화
  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm('이 인증코드를 비활성화하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/counselor-codes?codeId=${codeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchCodes(); // 목록 새로고침
      } else {
        setError(result.error || '인증코드 비활성화에 실패했습니다.');
      }
    } catch (err) {
      console.error('인증코드 비활성화 오류:', err);
      setError('인증코드 비활성화 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchCodes();
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
            <h1 className="text-3xl font-bold text-white mb-2">상담사 인증코드 관리</h1>
            <p className="text-gray-300">내담자와 연결할 수 있는 인증코드를 생성하고 관리하세요.</p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 새 인증코드 생성 버튼 */}
          <div className="mb-6">
            <motion.button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showCreateForm ? '취소' : '+ 새 인증코드 생성'}
            </motion.button>
          </div>

          {/* 새 인증코드 생성 폼 */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gray-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">새 인증코드 생성</h3>
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div>
                  <label htmlFor="codeName" className="block text-sm font-medium text-gray-300 mb-2">
                    코드명 (내담자가 입력할 이름)
                  </label>
                  <input
                    type="text"
                    id="codeName"
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    placeholder="예: 김상담사, 심리상담센터A 등"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    코드명은 변경 가능하지만, 자동 생성되는 코드번호는 변경할 수 없습니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    type="submit"
                    disabled={isCreating}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isCreating ? '생성 중...' : '인증코드 생성'}
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

          {/* 인증코드 목록 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">인증코드를 불러오는 중...</p>
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg">생성된 인증코드가 없습니다.</p>
                <p className="text-gray-500 text-sm mt-2">새 인증코드를 생성하여 내담자와 연결하세요.</p>
              </div>
            ) : (
              codes.map((code) => (
                <CodeCard
                  key={code.id}
                  code={code}
                  onUpdate={handleUpdateCode}
                  onDeactivate={handleDeactivateCode}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 인증코드 카드 컴포넌트
function CodeCard({ 
  code, 
  onUpdate, 
  onDeactivate 
}: { 
  code: CounselorCode; 
  onUpdate: (codeId: string, newName: string) => void;
  onDeactivate: (codeId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(code.codeName);

  const handleSave = () => {
    if (editName.trim() && editName !== code.codeName) {
      onUpdate(code.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(code.codeName);
    setIsEditing(false);
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
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            ) : (
              <h3 className="text-xl font-semibold text-white">{code.codeName}</h3>
            )}
            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-sm">
              활성
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400">
            <p><span className="text-gray-300">코드번호:</span> {code.codeNumber}</p>
            <p><span className="text-gray-300">생성일:</span> {new Date(code.createdAt).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => onDeactivate(code.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                비활성화
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
