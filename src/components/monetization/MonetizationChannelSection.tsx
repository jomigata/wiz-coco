import { monetizationChannelSummaries } from '@/data/monetizationCatalog';
import HomeSectionShell from '@/components/home/HomeSectionShell';
import { homeContentClasses } from '@/components/layout/appChromeTheme';

export default function MonetizationChannelSection() {
  return (
    <HomeSectionShell tone="channel" className="py-16 md:py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <h2 className={`${homeContentClasses.sectionTitle} text-center mb-3`}>
          이용 방법 — 3가지 채널
        </h2>
        <p className={`${homeContentClasses.sectionSubtitle} text-center mb-10 max-w-2xl mx-auto`}>
          협회(플랫폼)가 검사 품질·정산을 관리하고, 상담사·기관·개인 각각에 맞는 방식으로
          검사비 부담을 줄입니다.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {monetizationChannelSummaries.map((ch) => (
            <div
              key={ch.id}
              className={`${homeContentClasses.card} flex flex-col`}
            >
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
                {ch.subtitle}
              </span>
              <h3 className={`text-lg font-semibold ${homeContentClasses.cardTitle} mb-4`}>{ch.title}</h3>
              <ul className="space-y-2 flex-1">
                {ch.bullets.map((b) => (
                  <li key={b} className={`${homeContentClasses.cardBody} flex gap-2`}>
                    <span className="text-blue-500 shrink-0" aria-hidden>
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
