'use client';

/**
 * Next.js static export(`output:'export'`) + 1년 캐시(js/css) 조합에서는
 * 브라우저 탭을 오래 열어두면 새로 배포된 코드가 반영되지 않고 예전 청크가 계속 실행된다.
 * (SPA 내부 이동은 새 HTML을 다시 받지 않기 때문)
 * 주기적으로 배포 버전 파일을 조회해 새 배포가 감지되면 새로고침을 안내한다.
 */

import { useEffect, useState } from 'react';
import { reloadWithAuthSession } from '@/utils/authSessionLifecycle';

const CHECK_INTERVAL_MS = 3 * 60 * 1000;
const BUILT_SHA = (process.env.NEXT_PUBLIC_BUILD_SHA || '').trim();

export default function BuildVersionWatcher() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    if (!BUILT_SHA) return undefined;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`/build-version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const latestSha = (data?.sha || '').trim();
        if (!cancelled && latestSha && latestSha !== BUILT_SHA) {
          setNewVersionAvailable(true);
        }
      } catch {
        // 네트워크 오류는 무시하고 다음 주기에 재시도
      }
    };

    void check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  if (!newVersionAvailable) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] flex items-center justify-center gap-3 border-t border-sky-500/30 bg-[#0b1730]/95 px-4 py-2.5 text-sm text-slate-100 shadow-lg backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <span>새 업데이트가 배포되었습니다. 최신 화면을 보려면 새로고침 해주세요.</span>
      <button
        type="button"
        onClick={() => reloadWithAuthSession()}
        className="shrink-0 rounded-md bg-sky-600 px-3 py-1 font-medium text-white transition hover:bg-sky-500"
      >
        새로고침
      </button>
    </div>
  );
}
