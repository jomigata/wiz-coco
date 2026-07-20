'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentProps } from 'react';
import { navigateToClientPortalLogin } from '@/lib/portalLoginNavigation';

type ClientPortalLoginLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href?: string;
};

/** 검사시작(/portal/login) — 이동 전·후 다른 탭 세션 정리 */
export default function ClientPortalLoginLink({
  href = '/portal/login/',
  onClick,
  ...props
}: ClientPortalLoginLinkProps) {
  const router = useRouter();
  return (
    <Link
      {...props}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateToClientPortalLogin(router, href);
        onClick?.(e);
      }}
    />
  );
}
