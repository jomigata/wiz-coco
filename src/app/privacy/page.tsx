import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-emerald-950 flex flex-col">
      <Navigation />
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl rounded-xl border border-emerald-800/40 bg-emerald-900/25 p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-emerald-100">개인정보처리방침</h1>
            <p className="mt-1 text-sm text-emerald-500/90">
              위즈코코(이하 “회사”)는 개인정보보호법 등 관련 법령을 준수합니다.
            </p>
          </div>

          <div className="space-y-5 text-sm text-emerald-200/90 leading-7">
            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">1. 수집하는 개인정보 항목</h2>
              <ul className="list-disc pl-5 space-y-1 text-emerald-200/85">
                <li>필수: 이메일, 이름(닉네임), 로그인 제공자 식별자(카카오/네이버 등)</li>
                <li>선택: 프로필 이미지, 상담사 인증코드(입력한 경우)</li>
                <li>서비스 이용 과정에서 자동 생성: 접속 로그, 기기/브라우저 정보, 쿠키, 이용 기록</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">2. 개인정보 수집 및 이용 목적</h2>
              <ul className="list-disc pl-5 space-y-1 text-emerald-200/85">
                <li>회원 식별 및 로그인, 계정 관리</li>
                <li>심리검사·결과 제공 및 서비스 기능 제공</li>
                <li>고객 문의 대응 및 공지사항 전달</li>
                <li>부정 이용 방지 및 보안 강화</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">3. 보유 및 이용 기간</h2>
              <p className="text-emerald-200/85">
                원칙적으로 개인정보는 수집·이용 목적 달성 시 지체 없이 파기합니다. 다만 관계 법령에 따라
                보관이 필요한 경우 해당 기간 동안 보관할 수 있습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">4. 제3자 제공 및 처리위탁</h2>
              <p className="text-emerald-200/85">
                회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 소셜 로그인을 위해
                카카오/네이버 등 외부 인증 제공자를 이용할 수 있으며, 서비스 제공을 위해 클라우드 인프라를
                사용할 수 있습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">5. 이용자 권리</h2>
              <p className="text-emerald-200/85">
                이용자는 개인정보 열람·정정·삭제·처리정지 등을 요청할 수 있습니다. 요청은 아래 문의처로
                접수해 주세요.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">6. 문의처</h2>
              <p className="text-emerald-200/85">
                이메일: <span className="text-emerald-100">support@wizcoco.com</span> (예시)
              </p>
              <p className="text-xs text-emerald-500/90">
                실제 운영 이메일/연락처로 교체해 주세요.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-emerald-100 font-medium">7. 시행일</h2>
              <p className="text-emerald-200/85">본 방침은 2026-04-15부터 적용됩니다.</p>
            </section>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-800/40 flex items-center justify-between">
            <Link
              href="/terms/"
              className="text-sm text-emerald-400 hover:text-emerald-300 underline-offset-2 hover:underline"
            >
              이용약관
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
