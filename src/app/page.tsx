import HeroSection from '@/components/HeroSection';
import PublicTestPortalSections from '@/components/PublicTestPortalSections';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="pt-16">
        <main className="flex-grow">
          <HeroSection />
          <PublicTestPortalSections />
        </main>
        <Footer />
      </div>
    </div>
  );
}
