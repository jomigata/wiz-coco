import { useState, useEffect } from 'react';
import { useFirebaseAuth } from './useFirebaseAuth';

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

  const checkConnection = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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
      } else {
        setError(result.error || '연결 상태 확인에 실패했습니다.');
        setConnection({ isConnected: false });
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
    checkConnection();
  }, [user?.uid]);

  return {
    connection,
    loading,
    error,
    refetch: checkConnection
  };
};
