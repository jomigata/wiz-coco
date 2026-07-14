import { monetizationChannelSummaries } from '@/data/monetizationCatalog';
import HomeSectionShell from '@/components/home/HomeSectionShell';

export default function MonetizationChannelSection() {
  return (
    <HomeSectionShell tone="channel" className="py-16 md:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
          이용 방법 — 3가지 채널
        </h2>
        <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto text-sm md:text-base">
          협회(플랫폼)가 검사 품질·정산을 관리하고, 상담사·기관·개인 각각에 맞는 방식으로
          검사비 부담을 줄입니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monetizationChannelSummaries.map((ch) => (
            <div
              key={ch.id}
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-6 flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <span className="text-xs font-medium text-blue-300 uppercase tracking-wide mb-2">
                {ch.subtitle}
              </span>
              <h3 className="text-lg font-semibold text-white mb-4">{ch.title}</h3>
              <ul className="space-y-2 flex-1">
                {ch.bullets.map((b) => (
                  <li key={b} className="text-slate-400 text-sm flex gap-2">
                    <span className="text-blue-400 shrink-0" aria-hidden>
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </HomeSectionShell>
  );
}
