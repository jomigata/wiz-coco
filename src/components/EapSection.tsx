export default function EapSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-blue-500 filter blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-indigo-500 filter blur-3xl"></div>
      </div>
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center mb-16">
          <div className="inline-flex items-center justify-center p-1 px-3 mb-8 border border-blue-400/30 rounded-full bg-blue-900/20 backdrop-blur-sm">
            <span className="text-sm font-medium text-blue-300">기업 임직원 지원 프로그램</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-white">기업 EAP 프로그램</h2>
          <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-6"></div>
          <p className="text-blue-200 text-lg max-w-2xl text-center">전문 심리 상담사와 함께하는 임직원 심리 케어 서비스로 건강한 조직 문화를 구축하세요</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-8">
          {/* 카드 1: 네이버 제휴 */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-10 flex flex-col md:flex-row items-center flex-1 w-full shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-700/50 backdrop-filter backdrop-blur-sm group relative overflow-hidden">
            {/* 카드 내부 장식 */}
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors duration-500"></div>
            
            <div className="mr-8 text-green-400 bg-green-900/30 p-5 rounded-2xl mb-6 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <div className="flex-grow">
              <div className="flex items-center mb-3">
                <h3 className="font-bold text-2xl text-white group-hover:text-green-300 transition-colors duration-300">네이버 임직원 단독 제휴</h3>
                <span className="ml-4 px-3 py-1 bg-green-900/50 text-green-400 text-xs font-semibold rounded-full border border-green-700/50">독점 파트너십</span>
              </div>
              <p className="text-gray-300 mb-6 text-lg">네이버 임직원을 위한 맞춤형 심리 케어 프로그램과 특별 혜택을 제공합니다.</p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center px-3 py-2 bg-gray-800/70 rounded-lg border border-gray-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-gray-300">무제한 상담 세션</span>
                </div>
                <div className="flex items-center px-3 py-2 bg-gray-800/70 rounded-lg border border-gray-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-gray-300">전담 심리 전문가</span>
                </div>
                <div className="flex items-center px-3 py-2 bg-gray-800/70 rounded-lg border border-gray-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-gray-300">실시간 케어 지원</span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium shadow-lg shadow-green-900/30 flex items-center group">
                자세히 보기
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 카드 2: 기업 맞춤 EAP */}
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-10 flex flex-col md:flex-row items-center flex-1 w-full shadow-xl hover:shadow-2xl transition-all duration-500 border border-indigo-700/50 backdrop-filter backdrop-blur-sm group relative overflow-hidden">
            {/* 카드 내부 장식 */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-500"></div>
            
            <div className="mr-8 text-blue-300 bg-blue-900/30 p-5 rounded-2xl mb-6 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
              </svg>
            </div>
            <div className="flex-grow">
              <div className="flex items-center mb-3">
                <h3 className="font-bold text-2xl text-white group-hover:text-blue-300 transition-colors duration-300">기업 맞춤형 EAP</h3>
                <span className="ml-4 px-3 py-1 bg-blue-900/50 text-blue-400 text-xs font-semibold rounded-full border border-blue-700/50">프리미엄 서비스</span>
              </div>
              <p className="text-gray-300 mb-6 text-lg">건강한 조직 문화와 임직원 웰빙을 위한 맞춤형 심리 케어 솔루션을 제공합니다.</p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center px-3 py-2 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-gray-300">맞춤형 프로그램</span>
                </div>
                <div className="flex items-center px-3 py-2 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-gray-300">그룹 워크샵</span>
                </div>
                <div className="flex items-center px-3 py-2 bg-indigo-900/50 rounded-lg border border-indigo-700/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span className="text-sm text-gray-300">성과 분석 리포트</span>
                </div>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg shadow-blue-900/30 flex items-center group">
                문의하기
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 