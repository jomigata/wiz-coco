'use client';

import HeroSection from '@/components/HeroSection';
import PublicTestPortalSections from '@/components/PublicTestPortalSections';
import ClientExamTrustSection from '@/components/home/ClientExamTrustSection';
import ProfessionalContentGate from '@/components/auth/ProfessionalContentGate';
import MonetizationChannelSection from '@/components/monetization/MonetizationChannelSection';
import MonetizationPricingSection from '@/components/monetization/MonetizationPricingSection';
import MonetizationTrustSection from '@/components/monetization/MonetizationTrustSection';
import MonetizationPartnerSection from '@/components/monetization/MonetizationPartnerSection';
import BusinessLegalBlock from '@/components/layout/BusinessLegalBlock';
import { HOME_PAGE_BG } from '@/components/home/homeSectionStyles';

export default function HomePageContent() {
  return (
    <div className="min-h-full" style={{ backgroundColor: HOME_PAGE_BG }}>
      <div className="pt-16">
        <main className="flex-grow">
          <HeroSection />
          <PublicTestPortalSections />
          <ClientExamTrustSection />

          <ProfessionalContentGate>
            <MonetizationChannelSection />
            <MonetizationPricingSection />
            <MonetizationTrustSection />
            <MonetizationPartnerSection />
          </ProfessionalContentGate>

          <section className="border-t border-slate-200 px-4 py-12">
            <div className="mx-auto max-w-3xl">
              <BusinessLegalBlock variant="full" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
