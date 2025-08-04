import Navigation from '@/components/Navigation'
import HeroSection from '@/components/HeroSection'
import ServiceSection from '@/components/ServiceSection'
import EapSection from '@/components/EapSection'
import IntroSection from '@/components/IntroSection'
import SelfTestSection from '@/components/SelfTestSection'
import ProgramSection from '@/components/ProgramSection'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <HeroSection />
        <ProgramSection />
        <SelfTestSection />
        <ServiceSection />
        <IntroSection />
        <EapSection />
      </main>
      <Footer />
    </div>
  )
} 