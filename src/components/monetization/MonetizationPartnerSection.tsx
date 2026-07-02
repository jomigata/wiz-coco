import Link from 'next/link';

export default function MonetizationPartnerSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-indigo-950 to-gray-900 border-t border-white/5">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          파트너 · 기관 도입 문의
        </h2>
        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
          전문상담사·센터, 학교·기업 HR 담당자를 위한 파일럿 및 B2B 제안을 받습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/counselor-application/"
            className="inline-flex justify-center items-center px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors"
          >
            상담사 · 센터 신청
          </Link>
          <Link
            href="/partners/"
            className="inline-flex justify-center items-center px-6 py-3 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
          >
            기관 · B2B 안내
          </Link>
        </div>
      </div>
    </section>
  );
}
