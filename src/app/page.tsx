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