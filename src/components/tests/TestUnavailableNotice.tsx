'use client';

import Link from 'next/link';

/** 메뉴에서 숨긴 미구현 검사에 직접 들어왔을 때 */
export default function TestUnavailableNotice() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-white/15 bg-white/5 px-6 py-10 text-center">
      <h1 className="text-xl font-semibold text-white">이 검사는 아직 준비 중입니다</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        지금은 끝까지 진행할 수 있는 검사만 안내합니다. 빈 화면으로 내담자를 보내지 않기 위한
        안내입니다.
      </p>
      <Link
        href="/tests/"
        className="mt-6 inline-block rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-500"
      >
        이용 가능한 검사 보기
      </Link>
    </div>
  );
}
