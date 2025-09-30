'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useRouter } from 'next/navigation';

export default function ConnectCounselorPage() {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();
  const [counselorCode, setCounselorCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAlreadyConnected, setIsAlreadyConnected] = useState(false);
  const [counselorInfo, setCounselorInfo] = useState<any>(null);

  // 현재 상담사 연결 상태 확인
  useEffect(() => {
    if (user && !loading) {
      checkConnectionStatus();
    }
  }, [user, loading]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/verify-counselor-code?clientId=${user?.uid}`);
      const result = await response.json();
      
      if (result.success && result.data.isConnected) {
        setIsAlreadyConnected(true);
        setCounselorInfo(result.data.counselorInfo);
      }
    } catch (err) {
      console.error('연결 상태 확인 오류:', err);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!counselorCode.trim()) {
      setError('상담사 인증코드를 입력해주세요.');
      return;
    }

    setIsConnecting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/verify-counselor-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: user?.uid,
          counselorCode: counselorCode.trim()
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('상담사와 성공적으로 연결되었습니다!');
        setCounselorInfo(result.data.counselorInfo);
        setIsAlreadyConnected(true);
        
        // 3초 후 마이페이지로 리다이렉트
        setTimeout(() => {
          router.push('/mypage?connected=true');
        }, 3000);
      } else {
        setError(result.error || '상담사 연결에 실패했습니다.');
      }
    } catch (err) {
      console.error('상담사 연결 오류:', err);
      setError('상담사 연결 중 오류가 발생했습니다.');
    } finally {
      setIsConnecting(false);
    }
  };

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

  if (isAlreadyConnected) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
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
              <h1 className="text-2xl font-bold text-emerald-400 mb-2">상담사와 연결됨</h1>
              <p className="text-gray-300 mb-4">
                이미 상담사와 연결되어 있습니다.
              </p>
              {counselorInfo && (
                <div className="bg-gray-800 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">담당 상담사 정보</h3>
                  <p className="text-gray-300">이름: {counselorInfo.name || '정보 없음'}</p>
                  <p className="text-gray-300">이메일: {counselorInfo.email || '정보 없음'}</p>
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
      <Navigation />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">상담사 연결</h1>
              <p className="text-gray-300">
                상담사로부터 받은 인증코드를 입력하여 연결하세요.
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* 성공 메시지 */}
            {success && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-emerald-400">{success}</p>
                <p className="text-emerald-300 text-sm mt-1">
                  잠시 후 마이페이지로 이동합니다...
                </p>
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
                  placeholder="상담사로부터 받은 인증코드를 입력하세요"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                  disabled={isConnecting}
                />
                <p className="mt-2 text-sm text-gray-400">
                  상담사와 연결되면 검사 결과와 일상 기록을 공유할 수 있습니다.
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    연결 중...
                  </div>
                ) : (
                  '상담사와 연결하기'
                )}
              </motion.button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  상담사 인증코드가 없으신가요?
                </p>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    • 기본 검사는 인증코드 없이도 이용할 수 있습니다
                  </p>
                  <p className="text-gray-300 text-sm">
                    • 나중에 상담사와 연결하면 기존 검사 결과를 공유할 수 있습니다
                  </p>
                  <p className="text-gray-300 text-sm">
                    • 상담사 지원을 원하시면 1:1 채팅으로 문의하세요
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
