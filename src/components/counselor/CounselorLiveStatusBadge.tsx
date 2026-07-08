'use client';

type Props = {
  isLive: boolean;
  liveError?: string;
  lastUpdatedAt?: Date | null;
  className?: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function CounselorLiveStatusBadge({
  isLive,
  liveError,
  lastUpdatedAt,
  className = '',
}: Props) {
  if (liveError) {
    return (
      <span className={`text-xs text-amber-300 ${className}`}>
        실시간 일시 중단 · API 기준 표시
      </span>
    );
  }
  if (isLive) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-emerald-300 ${className}`}>
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        실시간 연결됨
        {lastUpdatedAt ? (
          <span className="text-slate-500">· {formatTime(lastUpdatedAt)}</span>
        ) : null}
      </span>
    );
  }
  return <span className={`text-xs text-slate-500 ${className}`}>실시간 연결 중…</span>;
}
