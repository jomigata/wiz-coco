'use client';

import Link from 'next/link';
import AuthLink from '@/components/auth/AuthLink';
import type { HierarchyCrumb } from '@/lib/pageHierarchyNav';

type PageHierarchyBreadcrumbProps = {
  crumbs: HierarchyCrumb[];
  className?: string;
  useAuthLinks?: boolean;
};

export default function PageHierarchyBreadcrumb({
  crumbs,
  className = '',
  useAuthLinks = false,
}: PageHierarchyBreadcrumbProps) {
  if (crumbs.length === 0) return null;

  const LinkComponent = useAuthLinks ? AuthLink : Link;

  return (
    <nav aria-label="페이지 경로" className={`flex flex-wrap items-center gap-1 text-sm ${className}`}>
      <span className="text-sky-300/50" aria-hidden="true">
        ←
      </span>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const key = `${crumb.label}-${index}`;

        return (
          <span key={key} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <span className="text-slate-600" aria-hidden="true">
                -
              </span>
            ) : null}
            {crumb.href && !isLast ? (
              <LinkComponent
                href={crumb.href}
                className="text-sky-300/80 transition-colors hover:text-sky-200 hover:underline underline-offset-2"
              >
                {crumb.label}
              </LinkComponent>
            ) : (
              <span className={isLast ? 'text-slate-300' : 'text-sky-300/80'}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
