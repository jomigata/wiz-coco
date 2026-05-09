import { useState, useEffect } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';

export interface CounselorConnection {
  isConnected: boolean;
  counselorId?: string;
  counselorCode?: string;
  counselorInfo?: {
    name?: string;
    email?: string;
    specialization?: string[];
  };
  assignedAt?: string;
  sharedData?: {
    testResults: boolean;
    chatHistory: boolean;
    dailyRecords: boolean;
    otherMaterials: boolean;
  };
}

export const useCounselorConnection = () => {
  const { user } = useFirebaseAuth();
  const [connection, setConnection] = useState<CounselorConnection>({ isConnected: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const cacheKey = user?.uid ? `swr:counselor-connection:${user.uid}` : '';

  const checkConnection = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      // 1) 캐시가 있으면 즉시 보여주고, 네트워크는 백그라운드로
      const cached = cacheKey
        ? readSWRCache<CounselorConnection>(cacheKey, { scope: 'session', maxAgeMs: 5 * 60 * 1000 })
        : { data: null, isFresh: false, savedAt: null };
      if (cached.data) {
        setConnection(cached.data);
        setLoading(false);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await fetch(`/api/verify-counselor-code?clientId=${user.uid}`);
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // JSON이 아니면 에러로 처리 (HTML 에러 페이지 등)
        throw new Error('Invalid response format');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setConnection(result.data);
        if (cacheKey) writeSWRCache(cacheKey, result.data, { scope: 'session' });
      } else {
        setError(result.error || '연결 상태 확인에 실패했습니다.');
        setConnection({ isConnected: false });
        if (cacheKey) writeSWRCache(cacheKey, { isConnected: false }, { scope: 'session' });
      }
    } catch (err) {
      console.error('상담사 연결 상태 확인 오류:', err);
      setError('연결 상태 확인 중 오류가 발생했습니다.');
      setConnection({ isConnected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 탭/페이지 진입 즉시 캐시 반영 → 1초 뒤에 재검증(서버 응답 갱신)
    if (cacheKey) {
      const cached = readSWRCache<CounselorConnection>(cacheKey, { scope: 'session', maxAgeMs: 30 * 60 * 1000 });
      if (cached.data) {
        setConnection(cached.data);
        setLoading(false);
      }
    }
    const t = setTimeout(() => {
      void checkConnection();
    }, 1200);
    return () => clearTimeout(t);
  }, [user?.uid]);

  return {
    connection,
    loading,
    error,
    refetch: checkConnection
  };
};
