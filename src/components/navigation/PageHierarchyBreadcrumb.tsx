'use client';

import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import type { HierarchyCrumb } from '@/lib/pageHierarchyNav';
import { counselorBreadcrumbLinkClass } from '@/lib/pageHierarchyNav';

type PageHierarchyBreadcrumbProps = {
  crumbs: HierarchyCrumb[];
  className?: string;
  /** 상담사 영역 — AuthLink로 세션 유지 */
  useAuthLinks?: boolean;
  depth?: number;
};

export default function PageHierarchyBreadcrumb({
  crumbs,
  className = '',
  useAuthLinks = false,
  depth = 0,
}: PageHierarchyBreadcrumbProps) {
  if (crumbs.length === 0) return null;

  const LinkComponent = useAuthLinks ? AuthLink : Link;
  const linkClass = counselorBreadcrumbLinkClass(depth);

  return (
    <nav aria-label="페이지 경로" className={`flex flex-wrap items-center gap-1.5 text-sm ${className}`}>
      <span className="text-slate-500/80" aria-hidden="true">
        ←
      </span>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const key = `${crumb.label}-${index}`;

        return (
          <span key={key} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <span className="text-slate-500/70" aria-hidden="true">
                -
              </span>
            ) : null}
            {crumb.href && !isLast ? (
              <LinkComponent
                href={crumb.href}
                className={`${linkClass} transition-colors hover:underline underline-offset-2`}
              >
                {crumb.label}
              </LinkComponent>
            ) : (
              <span className={isLast ? 'font-medium text-white' : linkClass}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
