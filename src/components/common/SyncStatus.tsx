'use client';

import React, { useState, useEffect } from 'react';
import { getOfflineQueue } from '@/utils/offlineQueue';

interface SyncStatusProps {
  className?: string;
}

export default function SyncStatus({ className = '' }: SyncStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // 온라인/오프라인 상태 모니터링 및 자동 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // 온라인 복귀 시 동기화 시작
      syncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 큐 개수 확인 및 페이지 로드/새로고침 시 자동 동기화
    const initialQueueCount = updateQueueCount();
    if (navigator.onLine && initialQueueCount > 0) {
      // 약간의 지연 후 동기화 (컴포넌트 마운트 완료 후)
      setTimeout(() => {
        syncQueue();
      }, 1000);
    }

    // 주기적으로 큐 개수 업데이트 (5초마다)
    const interval = setInterval(() => {
      updateQueueCount();
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // 큐 개수 업데이트 및 반환
  const updateQueueCount = (): number => {
    try {
      const queue = getOfflineQueue();
      const count = queue.length;
      setQueueCount(count);
      return count;
    } catch (error) {
      console.error('큐 개수 확인 오류:', error);
      return 0;
    }
  };

  // 큐 동기화
  const syncQueue = async () => {
    if (!isOnline) return;
    
    // 현재 큐 개수 확인
    const currentQueueCount = updateQueueCount();
    if (currentQueueCount === 0) return;

    setIsSyncing(true);
    try {
      const { processOfflineQueue } = await import('@/utils/offlineQueue');
      await processOfflineQueue();
      setLastSyncTime(new Date());
      updateQueueCount();
    } catch (error) {
      console.error('동기화 오류:', error);
    } finally {
      setIsSyncing(false);
    }
  };


  // 상태에 따른 스타일
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-yellow-500';
    if (queueCount > 0) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📴';
    if (isSyncing) return '🔄';
    if (queueCount > 0) return '⏳';
    return '✅';
  };

  const getStatusText = () => {
    if (!isOnline) return '오프라인';
    if (isSyncing) return '동기화 중...';
    if (queueCount > 0) return `${queueCount}개 대기 중`;
    return '동기화 완료';
  };

  // 큐가 없고 온라인 상태면 표시하지 않음
  if (isOnline && queueCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 ${getStatusColor()}`}>
        <span className="text-sm">{getStatusIcon()}</span>
        <span className="text-xs font-medium">{getStatusText()}</span>
      </div>
      {lastSyncTime && (
        <span className="text-xs text-gray-400">
          {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

