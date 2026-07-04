'use client';

import Link from 'next/link';
import { useAuthResolved } from '@/hooks/useAuthResolved';

/** 로그인 전: 내담자용 미니멀 푸터 · 로그인 후: 전체 링크 */
export default function SiteFooter() {
  const { isAuthenticated, authPending } = useAuthResolved();

  if (authPending) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <footer className="border-t border-white/[0.06] bg-[#070b14] py-10">
        <div className="container max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WizCoCo · Psychological Care</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy/" className="hover:text-slate-300 transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/terms/" className="hover:text-slate-300 transition-colors">
              이용약관
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-800 text-gray-300 pt-16 pb-8">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">뉴스레터 구독</h3>
            <p className="text-sm mb-4">심리 건강 정보와 프로그램 소식을 가장 먼저 받아보세요.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="이메일 주소"
                className="bg-gray-700 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary w-full text-sm"
              />
              <button
                type="button"
                className="bg-primary text-white px-4 py-2 rounded-r-md text-sm font-medium hover:bg-opacity-90"
              >
                구독
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">바로가기</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Link href="/portal/login/" className="hover:text-white transition-colors">
                  검사 시작
                </Link>
              </li>
              <li>
                <Link href="/partners/" className="hover:text-white transition-colors">
                  파트너 · 요금
                </Link>
              </li>
              <li>
                <Link href="/counselor-application/" className="hover:text-white transition-colors">
                  상담사 신청
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">WizCoCo</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Link href="/privacy/" className="hover:text-white transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms/" className="hover:text-white transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">전문가</h3>
            <ul className="text-sm space-y-2">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  전문가 로그인
                </Link>
              </li>
              <li>
                <Link href="/counselor/credits/" className="hover:text-white transition-colors">
                  크레딧 · 결제
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} WizCoCo. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
