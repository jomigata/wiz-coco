// 오프라인 큐 관리 유틸리티
// Firebase 저장 실패 시 LocalStorage에 큐에 저장하고, 온라인 복귀 시 자동 동기화

interface QueuedOperation {
  id: string;
  type: 'save' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: string;
  retryCount: number;
}

const QUEUE_KEY = 'firebase_sync_queue';
const MAX_RETRY_COUNT = 3;

/**
 * 오프라인 큐에 작업 추가
 */
export function addToOfflineQueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): void {
  try {
    if (typeof window === 'undefined') return;
    
    const queue = getOfflineQueue();
    const newOperation: QueuedOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    
    queue.push(newOperation);
    
    // 최대 100개까지만 유지
    if (queue.length > 100) {
      queue.shift(); // 가장 오래된 항목 제거
    }
    
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log('✅ 오프라인 큐에 작업 추가:', newOperation.id);
  } catch (error) {
    console.error('오프라인 큐 추가 오류:', error);
  }
}

/**
 * 오프라인 큐에서 작업 가져오기
 */
export function getOfflineQueue(): QueuedOperation[] {
  try {
    if (typeof window === 'undefined') return [];
    
    const queueStr = localStorage.getItem(QUEUE_KEY);
    if (!queueStr) return [];
    
    return JSON.parse(queueStr);
  } catch (error) {
    console.error('오프라인 큐 로드 오류:', error);
    return [];
  }
}

/**
 * 오프라인 큐에서 작업 제거
 */
export function removeFromOfflineQueue(operationId: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    const queue = getOfflineQueue();
    const filteredQueue = queue.filter(op => op.id !== operationId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
    console.log('✅ 오프라인 큐에서 작업 제거:', operationId);
  } catch (error) {
    console.error('오프라인 큐 제거 오류:', error);
  }
}

/**
 * 오프라인 큐의 모든 작업 처리 (온라인 복귀 시)
 */
export async function processOfflineQueue(): Promise<void> {
  try {
    if (typeof window === 'undefined') return;
    
    const queue = getOfflineQueue();
    if (queue.length === 0) {
      console.log('오프라인 큐가 비어있습니다.');
      return;
    }
    
    console.log(`🔄 오프라인 큐 처리 시작 (${queue.length}개 작업)`);
    
    const { initializeFirebase } = await import('@/lib/firebase');
    const { testResults } = await import('@/utils/firebaseIntegration');
    initializeFirebase();
    
    const processedIds: string[] = [];
    const failedIds: string[] = [];
    
    for (const operation of queue) {
      try {
        // 재시도 횟수 확인
        if (operation.retryCount >= MAX_RETRY_COUNT) {
          console.warn(`⚠️ 작업 ${operation.id} 재시도 횟수 초과, 큐에서 제거`);
          failedIds.push(operation.id);
          continue;
        }
        
        // 작업 타입에 따라 처리
        if (operation.type === 'save' && operation.collection === 'test_results') {
          await testResults.saveTestResult(operation.data);
          processedIds.push(operation.id);
          console.log(`✅ 오프라인 큐 작업 처리 완료: ${operation.id}`);
        } else {
          console.warn(`⚠️ 지원하지 않는 작업 타입: ${operation.type}`);
          failedIds.push(operation.id);
        }
      } catch (error) {
        console.error(`❌ 오프라인 큐 작업 처리 실패: ${operation.id}`, error);
        
        // 재시도 횟수 증가
        operation.retryCount++;
        
        // 재시도 횟수가 최대치에 도달하지 않았으면 큐에 다시 저장
        if (operation.retryCount < MAX_RETRY_COUNT) {
          // 큐 업데이트는 나중에 한 번에 처리
        } else {
          failedIds.push(operation.id);
        }
      }
    }
    
    // 처리된 작업 제거
    processedIds.forEach(id => removeFromOfflineQueue(id));
    failedIds.forEach(id => removeFromOfflineQueue(id));
    
    // 재시도가 필요한 작업 업데이트
    const remainingQueue = getOfflineQueue();
    const updatedQueue = remainingQueue.map(op => {
      const operation = queue.find(q => q.id === op.id);
      if (operation && operation.retryCount > op.retryCount) {
        return { ...op, retryCount: operation.retryCount };
      }
      return op;
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    
    console.log(`✅ 오프라인 큐 처리 완료: ${processedIds.length}개 성공, ${failedIds.length}개 실패`);
  } catch (error) {
    console.error('오프라인 큐 처리 오류:', error);
  }
}

/**
 * 온라인 상태 모니터링 및 자동 동기화
 */
export function setupOfflineSync(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  let isOnline = navigator.onLine;
  let syncInterval: NodeJS.Timeout | null = null;
  
  const handleOnline = async () => {
    console.log('🌐 온라인 상태 복귀, 오프라인 큐 동기화 시작');
    isOnline = true;
    
    // 즉시 동기화 시도
    await processOfflineQueue();
    
    // 주기적으로 동기화 (5분마다)
    if (syncInterval) {
      clearInterval(syncInterval);
    }
    syncInterval = setInterval(async () => {
      if (navigator.onLine) {
        await processOfflineQueue();
      }
    }, 5 * 60 * 1000); // 5분
  };
  
  const handleOffline = () => {
    console.log('📴 오프라인 상태, 오프라인 큐 모드로 전환');
    isOnline = false;
    
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  };
  
  // 이벤트 리스너 등록
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 초기 온라인 상태 확인
  if (isOnline) {
    handleOnline();
  }
  
  // 정리 함수 반환
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (syncInterval) {
      clearInterval(syncInterval);
    }
  };
}

