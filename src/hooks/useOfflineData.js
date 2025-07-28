import { useState, useEffect, useCallback } from 'react';
import * as idb from '@/utils/indexedDB';
import { api, fetchWithRetry } from '@/utils/apiUtils';

/**
 * 온/오프라인 상태를 감지하고 데이터를 관리하는 커스텀 훅
 * @param {Object} options - 옵션 객체
 * @returns {Object} - 데이터 관리 함수 및 상태
 */
export function useOfflineData(options = {}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [pendingOperations, setPendingOperations] = useState(0);
  
  // 초기 오프라인 상태 확인 및 업데이트
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 초기 상태 설정
      setIsOnline(navigator.onLine);
      
      // 네트워크 상태 이벤트 리스너 등록
      const handleOnline = () => {
        console.log('네트워크 연결됨');
        setIsOnline(true);
        
        // 자동 동기화 설정된 경우 동기화 실행
        if (options.autoSync !== false) {
          syncData();
        }
      };
      
      const handleOffline = () => {
        console.log('네트워크 연결 끊김');
        setIsOnline(false);
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // 초기 대기 중인 작업 수 확인
      refreshPendingOperations();
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);
  
  // 대기 중인 작업 수 갱신
  const refreshPendingOperations = useCallback(async () => {
    try {
      const pendingOps = await idb.getPendingSyncOperations();
      setPendingOperations(pendingOps.length);
    } catch (error) {
      console.error('대기 중인 작업 조회 오류:', error);
    }
  }, []);
  
  // 테스트 데이터 저장 (온/오프라인 자동 처리)
  const saveTestData = useCallback(async (testData) => {
    try {
      if (!testData || !testData.code) {
        throw new Error('유효하지 않은 테스트 데이터입니다.');
      }
      
      // 온라인 상태인 경우
      if (isOnline) {
        try {
          // 서버에 데이터 저장 시도
          await fetchWithRetry(() => api.post('/api/save-test-result', testData));
          console.log('온라인 모드: 서버에 테스트 데이터 저장 성공');
          
          // 로컬 스토리지에도 저장 (오프라인 사용 대비)
          await idb.saveTestData(testData);
          
          return { success: true, online: true, code: testData.code };
        } catch (error) {
          console.warn('온라인 모드에서 서버 저장 실패, 오프라인 모드로 전환:', error);
          
          // 서버 저장 실패 시 IndexedDB에만 저장
          await idb.saveTestData(testData);
          
          return { 
            success: true, 
            online: false, 
            code: testData.code,
            error: error.message
          };
        }
      } else {
        // 오프라인 상태인 경우
        console.log('오프라인 모드: IndexedDB에 테스트 데이터 저장');
        await idb.saveTestData(testData);
        
        return { success: true, online: false, code: testData.code };
      }
    } catch (error) {
      console.error('테스트 데이터 저장 오류:', error);
      return { success: false, error: error.message };
    } finally {
      // 대기 중인 작업 수 갱신
      refreshPendingOperations();
    }
  }, [isOnline]);
  
  // 테스트 데이터 조회 (온/오프라인 자동 처리)
  const getTestData = useCallback(async (code) => {
    try {
      if (!code) {
        throw new Error('테스트 코드가 필요합니다.');
      }
      
      // 온라인 상태인 경우
      if (isOnline) {
        try {
          // 서버에서 데이터 조회 시도
          const onlineData = await fetchWithRetry(() => 
            api.get(`/api/test-results/${code}`)
          );
          
          console.log('온라인 모드: 서버에서 테스트 데이터 조회 성공');
          
          // 로컬 캐싱 (오프라인 사용 대비)
          if (onlineData) {
            await idb.saveTestData(onlineData);
          }
          
          return { success: true, online: true, data: onlineData };
        } catch (error) {
          console.warn('온라인 모드에서 서버 조회 실패, 로컬 데이터 확인:', error);
          
          // 서버 조회 실패 시 IndexedDB에서 조회
          const offlineData = await idb.getTestData(code);
          
          if (offlineData) {
            return { 
              success: true, 
              online: false, 
              data: offlineData,
              fromCache: true,
              error: error.message
            };
          } else {
            throw new Error('테스트 데이터를 찾을 수 없습니다.');
          }
        }
      } else {
        // 오프라인 상태인 경우
        console.log('오프라인 모드: IndexedDB에서 테스트 데이터 조회');
        const offlineData = await idb.getTestData(code);
        
        if (offlineData) {
          return { success: true, online: false, data: offlineData, fromCache: true };
        } else {
          throw new Error('오프라인 상태에서 테스트 데이터를 찾을 수 없습니다.');
        }
      }
    } catch (error) {
      console.error('테스트 데이터 조회 오류:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline]);
  
  // 모든 테스트 데이터 조회 (온/오프라인 자동 처리)
  const getAllTestData = useCallback(async (options = {}) => {
    try {
      // 온라인 상태인 경우
      if (isOnline) {
        try {
          // 서버에서 데이터 조회 시도
          const onlineData = await fetchWithRetry(() => 
            api.get('/api/test-results', { params: options })
          );
          
          console.log('온라인 모드: 서버에서 모든 테스트 데이터 조회 성공');
          
          // 로컬 캐싱 (오프라인 사용 대비)
          if (Array.isArray(onlineData)) {
            for (const data of onlineData) {
              if (data && data.code) {
                await idb.saveTestData(data);
              }
            }
          }
          
          return { success: true, online: true, data: onlineData };
        } catch (error) {
          console.warn('온라인 모드에서 서버 조회 실패, 로컬 데이터 확인:', error);
          
          // 서버 조회 실패 시 IndexedDB에서 조회
          const offlineData = await idb.getAllTestData(options);
          
          return { 
            success: true, 
            online: false, 
            data: offlineData,
            fromCache: true,
            error: error.message
          };
        }
      } else {
        // 오프라인 상태인 경우
        console.log('오프라인 모드: IndexedDB에서 모든 테스트 데이터 조회');
        const offlineData = await idb.getAllTestData(options);
        
        return { success: true, online: false, data: offlineData, fromCache: true };
      }
    } catch (error) {
      console.error('모든 테스트 데이터 조회 오류:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline]);
  
  // 데이터 동기화 처리
  const syncData = useCallback(async () => {
    if (!isOnline) {
      console.log('오프라인 상태입니다. 동기화를 건너뜁니다.');
      return { success: false, reason: 'offline' };
    }
    
    setSyncStatus('syncing');
    
    try {
      console.log('데이터 동기화 시작...');
      
      // IndexedDB 동기화 실행
      const syncResult = await idb.performBackgroundSync(async (operations) => {
        let synced = 0;
        let failed = 0;
        
        // 각 작업 처리
        for (const op of operations) {
          try {
            // 작업 상태 업데이트
            await idb.updateSyncStatus(op.id, 'syncing');
            
            if (op.type === 'saveTestData' && op.data) {
              // 테스트 데이터 저장 작업
              await api.post('/api/save-test-result', op.data);
              
              // 성공 상태 업데이트
              await idb.updateSyncStatus(op.id, 'completed', {
                syncedAt: new Date().toISOString()
              });
              
              synced++;
            } else {
              // 지원되지 않는 작업 유형
              await idb.updateSyncStatus(op.id, 'failed', {
                error: '지원되지 않는 작업 유형'
              });
              
              failed++;
            }
          } catch (error) {
            console.error(`작업 ${op.id} 동기화 실패:`, error);
            
            // 실패 상태 업데이트
            await idb.updateSyncStatus(op.id, 'failed', {
              error: error.message,
              failedAt: new Date().toISOString()
            });
            
            failed++;
          }
        }
        
        return { synced, failed };
      });
      
      console.log('동기화 결과:', syncResult);
      setLastSyncResult({
        ...syncResult,
        timestamp: new Date().toISOString()
      });
      
      // 대기 중인 작업 수 갱신
      refreshPendingOperations();
      
      setSyncStatus(syncResult.success ? 'success' : 'error');
      return syncResult;
    } catch (error) {
      console.error('동기화 중 오류 발생:', error);
      
      setLastSyncResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      setSyncStatus('error');
      return { success: false, error: error.message };
    }
  }, [isOnline]);
  
  // 앱 설정 저장
  const saveSetting = useCallback(async (key, value) => {
    try {
      await idb.saveSetting(key, value);
      return { success: true };
    } catch (error) {
      console.error('설정 저장 오류:', error);
      return { success: false, error: error.message };
    }
  }, []);
  
  // 앱 설정 조회
  const getSetting = useCallback(async (key) => {
    try {
      const value = await idb.getSetting(key);
      return { success: true, value };
    } catch (error) {
      console.error('설정 조회 오류:', error);
      return { success: false, error: error.message };
    }
  }, []);
  
  return {
    isOnline,
    syncStatus,
    lastSyncResult,
    pendingOperations,
    saveTestData,
    getTestData,
    getAllTestData,
    syncData,
    saveSetting,
    getSetting,
    refreshPendingOperations,
  };
}

export default useOfflineData; 