import HeroSection from '@/components/HeroSection';
import PublicTestPortalSections from '@/components/PublicTestPortalSections';
import MonetizationChannelSection from '@/components/monetization/MonetizationChannelSection';
import MonetizationPricingSection from '@/components/monetization/MonetizationPricingSection';
import MonetizationTrustSection from '@/components/monetization/MonetizationTrustSection';
import MonetizationPartnerSection from '@/components/monetization/MonetizationPartnerSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-16">
        <main className="flex-grow">
          <HeroSection />
          <MonetizationChannelSection />
          <PublicTestPortalSections />
          <MonetizationPricingSection />
          <MonetizationTrustSection />
          <MonetizationPartnerSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
