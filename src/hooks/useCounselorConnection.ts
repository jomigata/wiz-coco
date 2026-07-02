import { useState, useEffect } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';
import { readSWRCache, writeSWRCache } from '@/utils/staleWhileRevalidateCache';
import { fetchCounselorConnection, type CounselorConnection } from '@/utils/counselorConnectionClient';

export type { CounselorConnection };

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

      const data = await fetchCounselorConnection(user.uid);
      setConnection(data);
      if (cacheKey) writeSWRCache(cacheKey, data, { scope: 'session' });
    } catch (err) {
      console.error('상담사 연결 상태 확인 오류:', err);
      setError('연결 상태 확인 중 오류가 발생했습니다.');
      setConnection({ isConnected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cacheKey) {
      const cached = readSWRCache<CounselorConnection>(cacheKey, { scope: 'session', maxAgeMs: 30 * 60 * 1000 });
      if (cached.data) {
        setConnection(cached.data);
        setLoading(false);
      }
    }
    void checkConnection();
  }, [user?.uid]);

  return {
    connection,
    loading,
    error,
    refetch: checkConnection,
  };
};
