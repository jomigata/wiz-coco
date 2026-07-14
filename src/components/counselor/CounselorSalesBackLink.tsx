import Link from 'next/link';
import { COUNSELOR_SALES_HUB_HREF } from '@/data/counselorMenu';

export default function CounselorSalesBackLink() {
  return (
    <Link
      href={COUNSELOR_SALES_HUB_HREF}
      className="text-sm text-violet-300 hover:underline mb-8 inline-block"
    >
      ← 영업 · 파트너
    </Link>
  );
}
