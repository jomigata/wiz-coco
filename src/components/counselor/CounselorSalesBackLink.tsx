'use client';

import Link from 'next/link';
import { COUNSELOR_SALES_HUB_HREF } from '@/data/counselorMenu';
import { getAppRoleSync } from '@/utils/roleUtils';

export default function CounselorSalesBackLink() {
  const role = getAppRoleSync();
  if (role === 'counselor' || role === 'admin') {
    return null;
  }

  return (
    <Link
      href={COUNSELOR_SALES_HUB_HREF}
      className="mb-8 inline-block text-sm text-violet-300 hover:underline"
    >
      ← 영업 · 파트너
    </Link>
  );
}
