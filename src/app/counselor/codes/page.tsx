'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { CounselorCode } from '@/types/counselor';
import {
  activateCounselorCode,
  createCounselorCode,
  deactivateCounselorCode,
  fetchCounselorCodes,
  updateCounselorCodeName,
} from '@/lib/firestore/counselorCodesStore';

type CodeSortKey = 'codeNumber' | 'codeName' | 'createdAt';
type CodeSortOrder = 'asc' | 'desc';
type CodeSortOption = `${CodeSortKey}-${CodeSortOrder}`;

const CODE_SORT_OPTIONS: { value: CodeSortOption; label: string }[] = [
  { value: 'createdAt-desc', label: '생성일 · 최신순' },
  { value: 'createdAt-asc', label: '생성일 · 오래된순' },
  { value: 'codeNumber-asc', label: '코드번호 · 오름차순' },
  { value: 'codeNumber-desc', label: '코드번호 · 내림차순' },
  { value: 'codeName-asc', label: '상담사명 · 가나다순' },
  { value: 'codeName-desc', label: '상담사명 · 역순' },
];

function sortCounselorCodes(
  list: CounselorCode[],
  sortKey: CodeSortKey,
  order: CodeSortOrder,
): CounselorCode[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'codeNumber') {
      cmp = a.codeNumber.localeCompare(b.codeNumber, 'ko', { numeric: true });
    } else if (sortKey === 'codeName') {
      cmp = a.codeName.localeCompare(b.codeName, 'ko');
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return order === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function parseSortOption(option: CodeSortOption): { sortKey: CodeSortKey; sortOrder: CodeSortOrder } {
  const [sortKey, sortOrder] = option.split('-') as [CodeSortKey, CodeSortOrder];
  return { sortKey, sortOrder };
}

export default function CounselorCodesPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const [codes, setCodes] = useState<CounselorCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [sortOption, setSortOption] = useState<CodeSortOption>('createdAt-desc');

  // 상담사 인증코드 목록 조회
  const fetchCodes = async () => {
    if (!user?.uid) return;
    
    try {
      const data = await fetchCounselorCodes(user.uid);
      setCodes(data);
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
    
    if (!user?.uid) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!newCodeName.trim()) {
      setError('코드명을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      await createCounselorCode(user.uid, newCodeName.trim());
      setNewCodeName('');
      setShowCreateForm(false);
      await fetchCodes();
    } catch (err) {
      console.error('인증코드 생성 오류:', err);
      setError(err instanceof Error ? err.message : '인증코드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 인증코드명 수정
  const handleUpdateCode = async (codeId: string, newName: string) => {
    try {
      await updateCounselorCodeName(codeId, newName);
      await fetchCodes();
    } catch (err) {
      console.error('코드명 수정 오류:', err);
      setError(err instanceof Error ? err.message : '코드명 수정 중 오류가 발생했습니다.');
    }
  };

  // 인증코드 비활성화
  const handleDeactivateCode = async (codeId: string) => {
    if (!confirm('이 인증코드를 비활성화하시겠습니까?')) return;

    try {
      setError('');
      await deactivateCounselorCode(codeId);
      await fetchCodes();
    } catch (err) {
      console.error('인증코드 비활성화 오류:', err);
      setError('인증코드 비활성화 중 오류가 발생했습니다.');
    }
  };

  // 인증코드 재활성화
  const handleActivateCode = async (codeId: string, codeName: string) => {
    if (!confirm('이 인증코드를 다시 활성화하시겠습니까?')) return;

    try {
      setError('');
      await activateCounselorCode(codeId, codeName);
      await fetchCodes();
    } catch (err) {
      console.error('인증코드 활성화 오류:', err);
      setError(err instanceof Error ? err.message : '인증코드 활성화 중 오류가 발생했습니다.');
    }
  };

  const activeCodes = codes.filter((c) => c.isActive);
  const inactiveCodes = codes.filter((c) => !c.isActive);

  const { sortKey, sortOrder } = parseSortOption(sortOption);
  const sortedActiveCodes = useMemo(
    () => sortCounselorCodes(activeCodes, sortKey, sortOrder),
    [activeCodes, sortKey, sortOrder],
  );
  const sortedInactiveCodes = useMemo(
    () => sortCounselorCodes(inactiveCodes, sortKey, sortOrder),
    [inactiveCodes, sortKey, sortOrder],
  );

  useEffect(() => {
    if (user && !authPending) {
      fetchCodes();
    }
    if (showLoginRequired) setIsLoading(false);
  }, [user, authPending, showLoginRequired]);

  if (authPending) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <AuthLoadingState message="로딩 중..." />
      </div>
    );
  }

  if (showLoginRequired) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <AuthRequiredState className="max-w-md w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
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
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white">인증코드 목록</h2>
              {!isLoading && codes.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <p className="text-sm text-gray-400">
                    활성 {activeCodes.length}개 · 비활성 {inactiveCodes.length}개
                  </p>
                  <label className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="shrink-0">정렬</span>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as CodeSortOption)}
                      className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[160px]"
                      aria-label="인증코드 목록 정렬"
                    >
                      {CODE_SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

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
              <>
                {activeCodes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wide">활성</h3>
                    {sortedActiveCodes.map((code) => (
                      <CodeCard
                        key={code.id}
                        code={code}
                        onUpdate={handleUpdateCode}
                        onDeactivate={handleDeactivateCode}
                        onActivate={handleActivateCode}
                      />
                    ))}
                  </div>
                )}

                {inactiveCodes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">비활성</h3>
                    {sortedInactiveCodes.map((code) => (
                      <CodeCard
                        key={code.id}
                        code={code}
                        onUpdate={handleUpdateCode}
                        onDeactivate={handleDeactivateCode}
                        onActivate={handleActivateCode}
                      />
                    ))}
                  </div>
                )}
              </>
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
  onDeactivate,
  onActivate,
}: {
  code: CounselorCode;
  onUpdate: (codeId: string, newName: string) => void;
  onDeactivate: (codeId: string) => void;
  onActivate: (codeId: string, codeName: string) => void;
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
      className={`bg-gray-800 rounded-lg p-6 border ${
        code.isActive ? 'border-gray-700' : 'border-gray-700/60 opacity-80'
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            {isEditing && code.isActive ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            ) : (
              <h3 className="text-xl font-semibold text-white truncate">{code.codeName}</h3>
            )}
            <span
              className={`px-2 py-1 rounded text-sm shrink-0 ${
                code.isActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-600/40 text-gray-400'
              }`}
            >
              {code.isActive ? '활성' : '비활성'}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-400">
            <p>
              <span className="text-gray-300">코드번호:</span> {code.codeNumber}
            </p>
            <p>
              <span className="text-gray-300">생성일:</span>{' '}
              {new Date(code.createdAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {code.isActive ? (
            isEditing ? (
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
            )
          ) : (
            <button
              onClick={() => onActivate(code.id, code.codeName)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              활성화
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
