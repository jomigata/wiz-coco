'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import { buildMypageNavSections } from '@/data/mypageMenu';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

type Props = {
  children: React.ReactNode;
  settingsBadge?: number;
};

function navActive(pathname: string, href: string): boolean {
  const p = pathname.replace(/\/+$/, '') || '/';
  const h = href.replace(/\/+$/, '') || '/';
  if (p === '/mypage') return h === '/mypage/account/info';
  return p === h || p.startsWith(`${h}/`);
}

export default function MypageManageShell({ children, settingsBadge = 0 }: Props) {
  const pathname = usePathname() || '';
  const { user } = useFirebaseAuth();
  const sections = useMemo(
    () => buildMypageNavSections(user?.role, { settingsBadge }),
    [user?.role, settingsBadge],
  );
  const displayName = user?.displayName || user?.email?.split('@')[0] || '회원';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:h-[calc(100dvh-4.5rem)] lg:flex-row lg:items-stretch lg:gap-3 lg:overflow-hidden">
      <aside
        className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 max-h-[38vh] shrink-0 lg:h-full lg:max-h-[calc(100dvh-4.5rem)] lg:w-[15.5rem] lg:shrink-0 xl:w-[17rem] ${counselorHubClasses.subsection} !p-0`}
        aria-label="마이페이지 메뉴"
      >
        <div className="shrink-0 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-3 py-2">
          <p className="text-sm font-bold text-white">마이페이지</p>
          <p className="truncate text-[11px] leading-tight text-sky-200/60">{displayName}</p>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1.5">
          {sections.map((section) => (
            <div key={section.id} className="mb-2">
              {section.id !== 'account' ? (
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {section.title}
                </p>
              ) : (
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = navActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <AuthLink
                        href={item.href}
                        className={`block truncate rounded-md px-2 py-1.5 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${
                          active
                            ? 'bg-sky-600/30 font-semibold text-sky-100'
                            : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                        title={item.description}
                      >
                        <span className="mr-1" aria-hidden>
                          {item.icon}
                        </span>
                        {item.name}
                        {typeof item.badge === 'number' && item.badge > 0 ? (
                          <span className="ml-1.5 inline-flex min-w-[16px] justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                      </AuthLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:max-h-[calc(100dvh-4.5rem)]">
        {children}
      </div>
    </div>
  );
}
