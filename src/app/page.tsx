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
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="pt-16">
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
    </div>
  )
} 