'use client';

import Link from 'next/link';
import { formatMyCodeWhileTyping } from '@/lib/accessCodeFormat';

type SharedMyCodeGuidanceProps = {
  finalizeMessage?: string;
  hasPortalSession?: boolean;
  myCode?: string;
};

export default function SharedMyCodeGuidance({
  finalizeMessage,
  hasPortalSession = false,
  myCode,
}: SharedMyCodeGuidanceProps) {
  const displayMyCode = myCode ? formatMyCodeWhileTyping(myCode) : '';

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/30 p-5 space-y-4">
      <h2 className="text-lg font-semibold text-white">나의코드 발급 안내</h2>

      {finalizeMessage ? (
        <p className="text-emerald-200 text-sm">{finalizeMessage}</p>
      ) : (
        <p className="text-slate-200 text-sm">
          검사를 완료하셨습니다. 등록하신 이메일·문자로 <strong className="text-white">나의코드</strong>와{' '}
          <strong className="text-white">비밀번호(4자리)</strong>를 보내드렸습니다.
        </p>
      )}

      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-300">
        <li>
          <strong className="text-slate-100">나의코드</strong>는 연도 2자리 + 숫자 형태입니다. (예: 26234)
        </li>
        <li>
          <Link href="/portal/login/" className="text-blue-400 hover:text-blue-300 underline">
            내 검사실 들어가기
          </Link>
          에서 나의코드와 비밀번호로 로그인하면 검사 결과를 확인할 수 있습니다.
        </li>
        <li>발송 메일·문자가 보이지 않으면 스팸함을 확인하거나 담당 상담사에게 문의해 주세요.</li>
      </ul>

      {hasPortalSession ? (
        <div className="rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
          {displayMyCode ? (
            <p className="mb-2">
              현재 로그인한 나의코드:{' '}
              <span className="font-mono text-cyan-300 tracking-wider">{displayMyCode}</span>
            </p>
          ) : null}
          <p>
            이미 내 검사실에 접속 중입니다.{' '}
            <Link href="/portal/" className="text-blue-400 hover:text-blue-300 underline">
              내 검사실
            </Link>
            에서 검사 결과와 연결된 검사를 확인하세요.
          </p>
        </div>
      ) : (
        <Link
          href="/portal/login/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 text-sm"
        >
          내 검사실 들어가기
        </Link>
      )}
    </div>
  );
}
