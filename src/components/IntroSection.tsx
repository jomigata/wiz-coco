interface IntroCardProps {
  title: string;
  description: string;
  color: string;
  icon: string;
}

function IntroCard({ title, description, color, icon }: IntroCardProps) {
  const iconBgColor = color.replace('bg-', '').split('-')[0]; 
  const iconColorClass = `text-${iconBgColor}-600`;
  const iconBgClass = `bg-${iconBgColor}-200`;

  // SVG 아이콘 매핑
  const iconSvgs: Record<string, React.ReactElement> = {
    '🏢': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${iconColorClass}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
      </svg>
    ),
    '🏫': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${iconColorClass}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
      </svg>
    ),
    '🧘': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${iconColorClass}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
      </svg>
    ),
    '📝': (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-10 h-10 ${iconColorClass}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    )
  };

  return (
    <div className={`bg-white rounded-lg overflow-hidden shadow-soft hover:shadow-medium transition-all border border-gray-100 flex flex-col`}>
      <div className={`h-32 flex items-center justify-center ${color}`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${iconBgClass}`}>
          {iconSvgs[icon] || <span className={`text-4xl ${iconColorClass}`}>{icon}</span>}
        </div>
      </div>
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-xl mb-3 text-gray-800">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
        <button className={`mt-4 text-${iconBgColor}-600 font-medium hover:underline`}>
          더 알아보기 →
        </button>
      </div>
    </div>
  )
}

export default function IntroSection() {
  const cards = [
    {
      title: "기업 EAP",
      description: "건강한 조직 문화를 위한 임직원 심리 지원 프로그램입니다.",
      color: "bg-blue-100",
      icon: "🏢"
    },
    {
      title: "청소년 상담",
      description: "학업 스트레스, 진로 고민 등 청소년 맞춤 상담을 제공합니다.",
      color: "bg-orange-100",
      icon: "🏫"
    },
    {
      title: "개인 상담",
      description: "우울, 불안, 관계 문제 등 개인의 어려움을 함께 해결합니다.",
      color: "bg-yellow-100",
      icon: "🧘"
    },
    {
      title: "심리 정보",
      description: "전문가가 작성한 유용한 심리 건강 정보를 제공합니다.",
      color: "bg-green-100",
      icon: "📝"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <h2 className="text-4xl font-bold text-center mb-4">심리케어 서비스</h2>
        <p className="text-center text-lg text-gray-600 mb-16">당신의 마음 건강 여정을 위한 다양한 솔루션</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((card, index) => (
            <IntroCard key={index} {...card} />
          ))}
        </div>
      </div>
    </section>
  )
} 