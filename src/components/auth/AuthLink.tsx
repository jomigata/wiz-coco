'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { markInternalNavigation } from '@/utils/authSessionLifecycle';

type AuthLinkProps = ComponentProps<typeof Link>;

/** 내부 링크 클릭 시 로그인 세션이 beforeunload 오탐으로 삭제되지 않게 합니다. */
export default function AuthLink({ onClick, ...props }: AuthLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        markInternalNavigation();
        onClick?.(e);
      }}
    />
  );
}
