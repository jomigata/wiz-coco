'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname?.startsWith(path) ? 'bg-green-700' : '';
  };

  return (
    <header className="bg-green-600 text-white shadow-lg">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold hover:text-green-100">
            심리검사
          </Link>
          
          <div className="flex space-x-4">
            <Link
              href="/tests"
              className={`px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ${isActive('/tests')}`}
            >
              검사 목록
            </Link>
            <Link
              href="/tests/mbti"
              className={`px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ${isActive('/tests/mbti')}`}
            >
              MBTI 검사
            </Link>
            <Link
              href="/tests/depression"
              className={`px-4 py-2 rounded-lg hover:bg-green-700 transition-colors ${isActive('/tests/depression')}`}
            >
              우울증 검사
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
} 