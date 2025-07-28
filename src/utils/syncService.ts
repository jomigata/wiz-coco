/**
 * 오프라인 작업을 위한 데이터 동기화 서비스
 * 
 * 이 파일은 네트워크가 끊겨도 앱이 작동할 수 있도록 데이터 동기화 메커니즘을 제공합니다.
 * - 동기화 큐 관리
 * - 네트워크 상태 모니터링
 * - 백그라운드 동기화
 */

import { getItem, setItem, removeItem } from './localStorageManager';

// 동기화 큐 저장 키
const SYNC_QUEUE_KEY = 'sync-queue';

// 동기화 상태
export enum SyncStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 동기화 항목 구조
export interface SyncItem {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
}

// 동기화 이벤트 콜백
type SyncCallback = (status: SyncStatus, items: SyncItem[]) => void;
const syncCallbacks: SyncCallback[] = [];

// 동기화 큐 가져오기
function getSyncQueue(): SyncItem[] {
  return getItem<SyncItem[]>(SYNC_QUEUE_KEY) || [];
}

// 동기화 큐 저장
function saveSyncQueue(queue: SyncItem[]): void {
  setItem(SYNC_QUEUE_KEY, queue);
}

/**
 * 동기화 큐에 항목 추가
 * @param type 항목 유형 (예: 'test-result', 'user-preference')
 * @param data 동기화할 데이터
 * @returns 생성된 항목의 ID
 */
export function addToSyncQueue(type: string, data: any): string {
  const queue = getSyncQueue();
  
  const id = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newItem: SyncItem = {
    id,
    type,
    data,
    timestamp: Date.now(),
    status: SyncStatus.PENDING,
    retryCount: 0
  };
  
  queue.push(newItem);
  saveSyncQueue(queue);
  
  // 온라인 상태인 경우 바로 동기화 시도
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    processSyncQueue().catch(console.error);
  }
  
  return id;
}

/**
 * 특정 동기화 항목 가져오기
 * @param id 항목 ID
 * @returns 해당 항목 또는 undefined
 */
export function getSyncItem(id: string): SyncItem | undefined {
  const queue = getSyncQueue();
  return queue.find(item => item.id === id);
}

/**
 * 네트워크 복구 시 동기화 수행
 */
export async function processSyncQueue(): Promise<void> {
  const queue = getSyncQueue();
  if (queue.length === 0) return;
  
  // 이미 동기화 중인 경우 종료
  if (queue.some(item => item.status === SyncStatus.IN_PROGRESS)) {
    return;
  }
  
  // 콜백 호출
  notifySyncCallbacks(SyncStatus.IN_PROGRESS, queue);
  
  const updatedQueue = [...queue];
  const completedItemIds: string[] = [];
  
  // 각 항목에 대해 동기화 시도
  for (const itemIndex in updatedQueue) {
    const item = updatedQueue[itemIndex];
    
    // 이미 완료된 항목 건너뛰기
    if (item.status === SyncStatus.COMPLETED) {
      continue;
    }
    
    // 처리 중 상태로 변경
    updatedQueue[itemIndex] = {
      ...item,
      status: SyncStatus.IN_PROGRESS
    };
    saveSyncQueue(updatedQueue);
    
    try {
      // 항목 유형에 따라 적절한 API 호출
      switch (item.type) {
        case 'test-result':
          await syncTestResult(item.data);
          break;
        case 'user-preference':
          await syncUserPreference(item.data);
          break;
        // 다른 유형 처리...
        default:
          console.warn(`처리할 수 없는 동기화 유형: ${item.type}`);
      }
      
      // 성공적으로 동기화된 항목 표시
      updatedQueue[itemIndex] = {
        ...updatedQueue[itemIndex],
        status: SyncStatus.COMPLETED
      };
      completedItemIds.push(item.id);
    } catch (error) {
      console.error(`동기화 중 오류 (${item.type}):`, error);
      
      // 오류 처리 및 재시도 카운트 증가
      updatedQueue[itemIndex] = {
        ...updatedQueue[itemIndex],
        status: SyncStatus.FAILED,
        retryCount: item.retryCount + 1,
        lastError: error instanceof Error ? error.message : String(error)
      };
    }
    
    saveSyncQueue(updatedQueue);
  }
  
  // 완료된 항목 관련 임시 데이터 정리
  completedItemIds.forEach(id => {
    const item = updatedQueue.find(item => item.id === id);
    if (item?.type === 'test-result') {
      removeItem(`pending-test-result-${item.data.code}`);
    }
  });
  
  // 동기화 완료 알림
  notifySyncCallbacks(SyncStatus.COMPLETED, updatedQueue);
  
  // 완료된 항목 정리 (옵션)
  // removeCompletedItems();
}

/**
 * 완료된 동기화 항목 제거
 */
export function removeCompletedItems(): void {
  const queue = getSyncQueue();
  const updatedQueue = queue.filter(item => item.status !== SyncStatus.COMPLETED);
  saveSyncQueue(updatedQueue);
}

/**
 * 동기화 이벤트에 콜백 등록
 * @param callback 콜백 함수
 */
export function onSyncStatusChange(callback: SyncCallback): void {
  syncCallbacks.push(callback);
}

/**
 * 동기화 이벤트 콜백 제거
 * @param callback 제거할 콜백 함수
 */
export function offSyncStatusChange(callback: SyncCallback): void {
  const index = syncCallbacks.indexOf(callback);
  if (index !== -1) {
    syncCallbacks.splice(index, 1);
  }
}

/**
 * 동기화 상태 변경 시 모든 콜백에 알림
 * @param status 동기화 상태
 * @param items 동기화 항목 배열
 */
function notifySyncCallbacks(status: SyncStatus, items: SyncItem[]): void {
  syncCallbacks.forEach(callback => {
    try {
      callback(status, items);
    } catch (error) {
      console.error('동기화 콜백 실행 중 오류:', error);
    }
  });
}

/**
 * 테스트 결과 동기화
 * @param data 테스트 결과 데이터
 */
async function syncTestResult(data: any): Promise<void> {
  const response = await fetch('/api/user-tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include' // 쿠키 포함
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`테스트 결과 동기화 실패: ${response.status} ${errorData.error || response.statusText}`);
  }
}

/**
 * 사용자 설정 동기화
 * @param data 사용자 설정 데이터
 */
async function syncUserPreference(data: any): Promise<void> {
  const response = await fetch('/api/user-preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include' // 쿠키 포함
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`사용자 설정 동기화 실패: ${response.status} ${errorData.error || response.statusText}`);
  }
}

/**
 * 네트워크 상태 모니터링 설정
 */
export function setupSyncMonitor(): void {
  if (typeof window === 'undefined') return;
  
  // 온라인 상태가 될 때 동기화 실행
  window.addEventListener('online', () => {
    console.log('네트워크 연결됨, 동기화 시작...');
    processSyncQueue().catch(console.error);
  });
  
  // 오프라인 상태 알림
  window.addEventListener('offline', () => {
    console.log('네트워크 연결 끊김, 동기화 일시 중단');
    notifySyncCallbacks(SyncStatus.FAILED, getSyncQueue());
  });
  
  // 페이지 로드 시 기존 큐 처리
  if (navigator.onLine) {
    processSyncQueue().catch(console.error);
  }
} 