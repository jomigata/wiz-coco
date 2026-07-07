'use client';

import HeroSection from '@/components/HeroSection';
import PublicTestPortalSections from '@/components/PublicTestPortalSections';
import ClientExamTrustSection from '@/components/home/ClientExamTrustSection';
import ProfessionalContentGate from '@/components/auth/ProfessionalContentGate';
import MonetizationChannelSection from '@/components/monetization/MonetizationChannelSection';
import MonetizationPricingSection from '@/components/monetization/MonetizationPricingSection';
import MonetizationTrustSection from '@/components/monetization/MonetizationTrustSection';
import MonetizationPartnerSection from '@/components/monetization/MonetizationPartnerSection';
import { APP_PAGE_BG } from '@/components/layout/appChromeTheme';

export default function HomePageContent() {
  return (
    <div className="min-h-full" style={{ backgroundColor: APP_PAGE_BG }}>
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
        </main>
      </div>
    </div>
  );
}
