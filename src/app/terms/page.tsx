import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-xl border border-emerald-800/40 bg-emerald-900/25 p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-emerald-100">이용약관</h1>
            <p className="mt-1 text-sm text-emerald-500/90">
              본 약관은 위즈코코(이하 “회사”)가 제공하는 서비스 이용에 관한 기본 사항을 규정합니다.
            </p>
          </div>

          <div className="space-y-5 text-sm text-emerald-200/90 leading-7">
            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">1. 목적</h2>
              <p className="text-emerald-200/85">
                본 약관은 회사가 제공하는 심리검사 및 관련 서비스의 이용 조건과 절차, 회사와 이용자의
                권리·의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">2. 계정 및 인증</h2>
              <p className="text-emerald-200/85">
                이용자는 카카오/네이버 등 소셜 로그인 또는 이메일 계정을 통해 서비스를 이용할 수 있습니다.
                이용자는 본인의 정보로 가입해야 하며, 타인의 정보를 도용해서는 안 됩니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">3. 서비스 제공 및 변경</h2>
              <p className="text-emerald-200/85">
                회사는 서비스의 전부 또는 일부를 운영상·기술상 필요에 따라 변경할 수 있으며, 중요한 변경은
                공지할 수 있습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">4. 금지행위</h2>
              <ul className="list-disc pl-5 space-y-1 text-emerald-200/85">
                <li>서비스의 안정적 운영을 방해하는 행위</li>
                <li>타인의 권리 침해, 불법 정보 게시</li>
                <li>계정 공유/양도 등 보안에 위협이 되는 행위</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">5. 책임의 제한</h2>
              <p className="text-emerald-200/85">
                회사는 법령상 허용되는 범위 내에서 서비스 제공과 관련한 책임을 제한할 수 있습니다. 심리검사
                결과는 참고용이며, 의학적 진단을 대체하지 않습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">6. 문의</h2>
              <p className="text-emerald-200/85">
                이메일: <span className="text-emerald-100">support@wizcoco.com</span>
              </p>
              <p className="text-xs text-emerald-500/90">
                실제 운영 이메일/연락처로 교체해 주세요.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">7. 시행일</h2>
              <p className="text-emerald-200/85">본 약관은 2026-01-01부터 적용됩니다.</p>
            </section>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-800/40 flex items-center justify-between">
            <Link
              href="/privacy/"
              className="text-sm text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/"
              className="text-sm text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
