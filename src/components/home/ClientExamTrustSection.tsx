import Link from 'next/link';

const clientTrustPoints = [
  {
    title: '회원가입 없이 시작',
    body: '안내 받은 검사 코드와 4자리 PIN만으로 검사실에 입장합니다.',
  },
  {
    title: '전문 검사 환경',
    body: '협회 승인 검사지와 표준화된 진행 절차로 신뢰할 수 있는 검사 경험을 제공합니다.',
  },
  {
    title: '개인정보 최소 수집',
    body: '실명·연락처는 선택 사항이며, 검사 목적에 필요한 정보만 안전하게 처리합니다.',
  },
  {
    title: '담당 전문가 연계',
    body: '결과는 배정된 상담사·기관 담당자를 통해 안내받을 수 있습니다.',
  },
];

export default function ClientExamTrustSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-950 to-gray-900 border-t border-white/[0.06]">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-sky-300/80 mb-3">
            Secure Assessment
          </span>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">
            안심하고 검사에 집중하세요
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            내담자를 위한 검사 전용 환경입니다. 불필요한 가입·결제 안내 없이 배정된 검사만
            진행할 수 있습니다.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {clientTrustPoints.map((p) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 md:p-7 hover:border-sky-500/20 hover:bg-sky-950/10 transition-colors duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-300" aria-hidden />
              </div>
              <h3 className="font-medium text-white mb-2">{p.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-10 text-xs text-slate-500">
          <Link href="/privacy/" className="text-sky-400/90 hover:text-sky-300 underline-offset-2 hover:underline">
            개인정보처리방침
          </Link>
          {' · '}
          SSL · Firebase 보안 운영
        </p>
      </div>
    </section>
  );
}
