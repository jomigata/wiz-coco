'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { buildMypageNavSections } from '@/data/mypageMenu';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  settingsBadge?: number;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href.startsWith('/mypage?')) return false;
  if (href === '/mypage/profile') {
    return pathname === '/mypage/profile' || pathname === '/mypage';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MypagePremiumShell({ title, subtitle, children, settingsBadge = 0 }: Props) {
  const pathname = usePathname() || '';
  const { user } = useFirebaseAuth();
  const sections = buildMypageNavSections(user?.role, { settingsBadge });
  const displayName = user?.displayName || user?.email?.split('@')[0] || '회원';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#070b14] pt-16 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_15%_-5%,rgba(56,189,248,0.14),transparent),radial-gradient(ellipse_50%_40%_at_90%_10%,rgba(167,139,250,0.12),transparent)]" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:py-10">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-md">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/90 to-violet-600/90 text-lg font-semibold text-white shadow-lg shadow-violet-900/40">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-xs text-slate-400">{user?.email || ''}</p>
              </div>
            </div>
            <nav className="mt-4 space-y-5">
              {sections.map((section) => (
                <div key={section.id}>
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {section.title}
                  </p>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const active = isActivePath(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                              active
                                ? 'border-sky-400/40 bg-sky-500/15 text-white shadow-inner shadow-sky-900/20'
                                : 'border-transparent text-slate-300 hover:border-white/15 hover:bg-white/[0.06] hover:text-white'
                            }`}
                          >
                            <span className="text-base opacity-90">{item.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 font-medium">
                                {item.name}
                                {typeof item.badge === 'number' && item.badge > 0 ? (
                                  <span className="min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                                    {item.badge > 99 ? '99+' : item.badge}
                                  </span>
                                ) : null}
                              </span>
                              <span className="block truncate text-[11px] text-slate-500 group-hover:text-slate-400">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sky-400/80">My Page</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p> : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
