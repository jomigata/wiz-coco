'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchPortalAppNotifications,
  markPortalAppNotificationsRead,
  type PortalAppNotificationItem,
} from '@/lib/clientPortalApi';
import { readClientPortalSession } from '@/lib/clientPortalSession';

type Props = {
  onUnreadChange?: (count: number) => void;
  onOpenTests?: () => void;
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function PortalAppNotificationsPanel({ onUnreadChange, onOpenTests }: Props) {
  const [items, setItems] = useState<PortalAppNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await fetchPortalAppNotifications(session.portalToken);
      setItems(data.items || []);
      onUnreadChange?.(data.unreadCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알림을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpen = async (item: PortalAppNotificationItem) => {
    const session = readClientPortalSession();
    if (session?.portalToken && !item.read) {
      try {
        const result = await markPortalAppNotificationsRead(session.portalToken, {
          notificationIds: [item.id],
        });
        onUnreadChange?.(result.unreadCount ?? 0);
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, read: true } : row)),
        );
      } catch {
        // ignore
      }
    }
    onOpenTests?.();
  };

  const handleMarkAllRead = async () => {
    const session = readClientPortalSession();
    if (!session?.portalToken) return;
    try {
      const result = await markPortalAppNotificationsRead(session.portalToken, { markAll: true });
      onUnreadChange?.(result.unreadCount ?? 0);
      setItems((prev) => prev.map((row) => ({ ...row, read: true })));
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했습니다.');
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400">알림을 불러오는 중…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-slate-400">상담사 안내·추천 검사·숙제가 여기에 표시됩니다.</p>
        {items.some((i) => !i.read) ? (
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="shrink-0 text-xs text-cyan-400 hover:text-cyan-300"
          >
            모두 읽음
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {items.length === 0 ? (
        <p className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-6 text-center text-sm text-slate-500">
          새 알림이 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void handleOpen(item)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                  item.read
                    ? 'border-slate-700/80 bg-slate-900/40'
                    : 'border-cyan-500/40 bg-cyan-950/20 hover:bg-cyan-950/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{item.title || '안내'}</p>
                  {!item.read ? (
                    <span className="shrink-0 rounded-full bg-cyan-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      NEW
                    </span>
                  ) : null}
                </div>
                {item.body ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.body}</p>
                ) : null}
                {formatWhen(item.createdAt) ? (
                  <p className="mt-2 text-xs text-slate-500">{formatWhen(item.createdAt)}</p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
