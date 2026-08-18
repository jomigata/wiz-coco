'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface TestCardProps {
  category: string;
  icon: string;
  description: string;
  index: number;
  isVisible: boolean;
  link: string; // 링크 속성 추가
}

function TestCard({ category, icon, description, index, isVisible, link }: TestCardProps) {
  // SVG 아이콘 매핑
  const iconSvgs = {
    "😔": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
    "😨": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" />
      </svg>
    ),
    "🤔": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
    ),
    "💔": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    "⛓️": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    ),
    "🍎": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
    ),
    "🎭": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    "🤯": (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    )
  };

  // 각 카드에 대한 그라데이션 색상 배열 - 은은한 색상
  const gradients = [
    'from-blue-100 to-indigo-200',
    'from-indigo-100 to-violet-200',
    'from-purple-100 to-pink-200',
    'from-pink-100 to-rose-200',
    'from-emerald-100 to-teal-200',
    'from-sky-100 to-blue-200',
    'from-amber-100 to-orange-200',
    'from-slate-100 to-gray-200'
  ];

  const gradient = gradients[index % gradients.length];
  const svgIcon = iconSvgs[icon as keyof typeof iconSvgs] || (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-gray-600">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
    </svg>
  );

  return (
    <a href={link} className="block">
      <div 
        className="flex flex-col items-center group cursor-pointer transition-all duration-700 transform"
        style={{ 
          transitionDelay: `${index * 100}ms`,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
        }}
      >
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full opacity-30 group-hover:opacity-50 blur-md transition-all duration-700 group-hover:scale-110`}></div>
          <div className="rounded-full bg-white w-24 h-24 flex items-center justify-center flex-col shadow-sm group-hover:shadow-md transition-all border border-gray-100 group-hover:border-gray-200 transform group-hover:scale-105 relative z-10">
            {svgIcon}
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors mb-1">{category}</div>
          <p className="text-xs text-gray-500 max-w-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">{description}</p>
        </div>
      </div>
    </a>
  )
}

export default function SelfTestSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const tests = [
    { 
      category: "우울증 검사", 
      icon: "😔",
      description: "우울한 감정과 무기력함이 지속되나요?",
      link: "/tests/psychological"
    },
    { 
      category: "불안장애 검사", 
      icon: "😨",
      description: "과도한 걱정과 불안감이 일상을 방해하나요?",
      link: "/tests/psychological"
    },
    { 
      category: "ADHD 검사", 
      icon: "🤔",
      description: "집중력과 충동 조절에 어려움이 있나요?",
      link: "/tests/psychological"
    },
    { 
      category: "트라우마 검사", 
      icon: "💔",
      description: "과거의 상처가 현재 삶에 영향을 주나요?",
      link: "/tests/psychological"
    },
    { 
      category: "중독 진단", 
      icon: "⛓️",
      description: "특정 행동이나 물질에 의존하고 있나요?",
      link: "/tests/psychological"
    },
    { 
      category: "식이장애 검사", 
      icon: "🍎",
      description: "식습관과 신체 이미지에 어려움이 있나요?",
      link: "/tests/psychological"
    },
    { 
      category: "성격유형 분석", 
      icon: "🎭",
      description: "나의 성격 특성과 강점을 알고 싶으신가요?",
      link: "/portal/"
    },
    { 
      category: "스트레스 지수", 
      icon: "🤯",
      description: "일상 스트레스의 수준을 측정해보세요",
      link: "/tests/psychological"
    }
  ];

  const testItems = [
    {
      title: '기본 MBTI 검사',
      description: '당신의 성격 유형을 알아보는 기본적인 MBTI 검사입니다.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>,
      href: '/portal/',
      color: 'bg-blue-500'
    },
    {
      title: '전문가용 MBTI 검사',
      description: '더 자세한 분석이 가능한 전문가 버전의 MBTI 검사입니다.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>,
      href: '/portal/',
      color: 'bg-purple-500'
    },
    {
      title: '연령별 MBTI 검사',
      description: '각 연령대별 특성을 고려한 맞춤형 MBTI 검사입니다.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
      href: '/tests/mbti-age',
      color: 'bg-orange-500'
    },
    {
      title: '우울증 자가진단',
      description: '우울증 정도를 측정하는 간단한 자가진단 테스트입니다.',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
      href: '/tests/psychological',
      color: 'bg-red-500'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-blue-50" ref={sectionRef}>
      <div className="container max-w-6xl mx-auto px-4">
        <div className={`mb-16 text-center transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium inline-block mb-4 border border-blue-100">심리 자가진단</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-800">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">5분만에 확인하는</span> 마음 건강
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            전문가가 설계한 심리 검사로 당신의 정서 상태를 객관적으로 확인하고, 
            필요한 관리 방법을 제안받으세요
          </p>
          
          <div className="flex justify-center gap-3 mb-12">
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-3 h-3 bg-blue-200 border border-blue-300 rounded-full inline-block mr-2"></span>
              과학적 검증된 척도
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-3 h-3 bg-indigo-200 border border-indigo-300 rounded-full inline-block mr-2"></span>
              익명 진행 가능
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <span className="w-3 h-3 bg-purple-200 border border-purple-300 rounded-full inline-block mr-2"></span>
              즉시 결과 확인
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-x-4 gap-y-14 max-w-4xl mx-auto">
          {tests.map((test, index) => (
            <TestCard 
              key={index} 
              {...test} 
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>
        
        <div className={`mt-16 text-center transition-all duration-1000 delay-500 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <a href="/tests" className="inline-block">
            <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              모든 검사 보기
            </button>
          </a>
        </div>
      </div>
    </section>
  )
} 