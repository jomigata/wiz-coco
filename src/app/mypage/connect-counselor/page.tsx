'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useRouter } from 'next/navigation';
import {
  connectCounselorByCode,
  fetchCounselorConnection,
  type CounselorConnection,
} from '@/utils/counselorConnectionClient';
import { fetchCounselorCodes } from '@/lib/firestore/counselorCodesStore';
import { isCounselor } from '@/utils/roleUtils';
import type { CounselorCode } from '@/types/counselor';

export default function ConnectCounselorPage() {
  const { user, authPending, showLoginRequired } = useAuthResolved();
  const { user: authUser } = useFirebaseAuth();
  const router = useRouter();
  const [counselorCode, setCounselorCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [connection, setConnection] = useState<CounselorConnection | null>(null);
  const [myCodes, setMyCodes] = useState<CounselorCode[]>([]);

  const role = authUser?.role;
  const counselorUser = isCounselor(role);

  useEffect(() => {
    if (user?.uid && !authPending) {
      void checkConnectionStatus();
    }
  }, [user?.uid, authPending]);

  useEffect(() => {
    if (!counselorUser || !user?.uid || authPending) {
      setMyCodes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const codes = await fetchCounselorCodes(user.uid);
        if (!cancelled) setMyCodes(codes.filter((c) => c.isActive));
      } catch {
        if (!cancelled) setMyCodes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [counselorUser, user?.uid, authPending]);

  const checkConnectionStatus = async () => {
    if (!user?.uid) return;
    try {
      const data = await fetchCounselorConnection(user.uid);
      if (data.isConnected) {
        setIsAlreadyConnected(true);
        setConnection(data);
      }
    } catch (err) {
      console.error('연결 상태 확인 오류:', err);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!counselorCode.trim()) {
      setError('상담사 인증코드를 입력해주세요.');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const result = await connectCounselorByCode(user.uid, counselorCode.trim());
      setSuccess(
        result.isSelfConnection
          ? '상담사 셀프 연결이 완료되었습니다. 본인 계정으로 검사·기록을 관리할 수 있습니다.'
          : '상담사와 성공적으로 연결되었습니다!',
      );
      setConnection({
        isConnected: true,
        counselorId: result.counselorId,
        counselorCode: result.counselorCode,
        counselorInfo: result.counselorInfo,
        isSelfConnection: result.isSelfConnection,
      });
      setIsAlreadyConnected(true);

      setTimeout(() => {
        router.push('/mypage?connected=true');
      }, 3000);
    } catch (err) {
      console.error('상담사 연결 오류:', err);
      setError(err instanceof Error ? err.message : '상담사 연결 중 오류가 발생했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelfConnect = async (code: CounselorCode) => {
    if (!user?.uid) return;
    setCounselorCode(code.codeNumber);
    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const result = await connectCounselorByCode(user.uid, code.codeNumber);
      setSuccess('상담사 셀프 연결이 완료되었습니다.');
      setConnection({
        isConnected: true,
        counselorId: result.counselorId,
        counselorCode: result.counselorCode,
        counselorInfo: result.counselorInfo,
        isSelfConnection: true,
      });
      setIsAlreadyConnected(true);
      setTimeout(() => router.push('/mypage?connected=true'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : '셀프 연결에 실패했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

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

  if (isAlreadyConnected && connection) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-emerald-400 mb-2">
                {connection.isSelfConnection ? '상담사 셀프 연결됨' : '상담사와 연결됨'}
              </h1>
              <p className="text-gray-300 mb-4">
                {connection.isSelfConnection
                  ? '본인 상담사 계정과 연결되어 있습니다.'
                  : '이미 상담사와 연결되어 있습니다.'}
              </p>
              {connection.counselorInfo && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
                  <h3 className="text-lg font-semibold text-white mb-2">담당 상담사 정보</h3>
                  <p className="text-gray-300">이름: {connection.counselorInfo.name || '정보 없음'}</p>
                  <p className="text-gray-300">이메일: {connection.counselorInfo.email || '정보 없음'}</p>
                  {connection.counselorCode && (
                    <p className="text-gray-400 text-sm mt-1">코드: {connection.counselorCode}</p>
                  )}
                </div>
              )}
              <button
                onClick={() => router.push('/mypage')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                마이페이지로 이동
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-16 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-8"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">상담사 연결</h1>
              <p className="text-gray-300">
                상담사로부터 받은 <strong className="text-white font-medium">8자리 코드번호</strong> 또는 코드명을
                입력하세요.
              </p>
            </div>

            {counselorUser && myCodes.length > 0 && (
              <div className="mb-6 bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-4">
                <h2 className="text-indigo-200 font-medium mb-2">상담사 셀프 연결</h2>
                <p className="text-indigo-300/90 text-sm mb-3">
                  본인이 발급한 코드로 내 계정을 상담사와 연결할 수 있습니다. (테스트·데모용)
                </p>
                <div className="space-y-2">
                  {myCodes.map((code) => (
                    <button
                      key={code.id}
                      type="button"
                      disabled={isConnecting}
                      onClick={() => void handleSelfConnect(code)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-left transition-colors disabled:opacity-50"
                    >
                      <span className="text-white text-sm font-medium">{code.codeName}</span>
                      <span className="text-indigo-200 font-mono text-sm">{code.codeNumber}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-emerald-400">{success}</p>
                <p className="text-emerald-300 text-sm mt-1">잠시 후 마이페이지로 이동합니다...</p>
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-6">
              <div>
                <label htmlFor="counselorCode" className="block text-sm font-medium text-gray-300 mb-2">
                  상담사 인증코드
                </label>
                <input
                  type="text"
                  id="counselorCode"
                  value={counselorCode}
                  onChange={(e) => setCounselorCode(e.target.value)}
                  placeholder="8자리 코드번호 또는 코드명"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  disabled={isConnecting}
                />
                <p className="mt-2 text-sm text-gray-400">
                  상담사와 연결되면 검사 결과와 일상 기록을 공유할 수 있습니다. 상담사는 본인 코드로 셀프 연결도
                  가능합니다.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    연결 중...
                  </div>
                ) : (
                  '상담사와 연결하기'
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">상담사 인증코드가 없으신가요?</p>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>• 기본 검사는 인증코드 없이도 이용할 수 있습니다</p>
                  <p>• 나중에 상담사와 연결하면 기존 검사 결과를 공유할 수 있습니다</p>
                  <p>
                    • 상담사로 활동하려면{' '}
                    <Link href="/mypage/settings" className="text-blue-400 hover:text-blue-300 underline">
                      설정 → 상담사 계정
                    </Link>
                    에서 전환 승인을 요청하세요
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
