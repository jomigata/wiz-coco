'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function PsychologyTestsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('growth-potential');

  // AI CoCo 소분류 데이터 (제공받은 구조 기반)
  const subcategoryData = {
    'growth-potential': {
      title: 'AI 성장 잠재력 분석',
      description: '개인의 성장 가능성과 잠재력을 AI로 분석하여 최적의 발전 방향을 제시합니다.',
      icon: '🚀',
      color: 'from-blue-500 to-cyan-500',
      subcategories: [
        {
          id: 'self-analysis',
          title: 'AI 자아 심층 분석',
          description: '성격, 기질, 가치관, 정체성을 종합적으로 분석합니다.',
          items: [
            { name: '성격 프로파일링', desc: 'MBTI, 에니어그램 등 다각적 성격 분석', time: '20분', difficulty: '보통', icon: '🎭' },
            { name: '기질·행동 패턴 분석', desc: '타고난 기질과 행동 패턴 심층 분석', time: '25분', difficulty: '보통', icon: '⚡' },
            { name: '가치관·동기 코어 분석', desc: '개인의 핵심 가치관과 동기 구조 파악', time: '30분', difficulty: '어려움', icon: '💎' },
            { name: '자아 정체성 맵핑', desc: '자아 개념과 정체성 형성 과정 분석', time: '35분', difficulty: '어려움', icon: '🗺️' }
          ]
        },
        {
          id: 'capability-coaching',
          title: 'AI 역량 개발 코칭',
          description: '개인의 잠재 역량을 발굴하고 개발 방향을 제시합니다.',
          items: [
            { name: '인지·학습능력 최적화', desc: '학습 스타일과 인지 능력 향상 방안', time: '25분', difficulty: '보통', icon: '🧠' },
            { name: '잠재 재능 스캐닝', desc: '숨겨진 재능과 강점 영역 발굴', time: '30분', difficulty: '보통', icon: '💫' },
            { name: '커리어 네비게이션', desc: '최적의 진로 방향성 AI 분석', time: '35분', difficulty: '보통', icon: '🧭' },
            { name: '리더십·의사결정 시뮬레이션', desc: '리더십 스타일과 의사결정 패턴 분석', time: '40분', difficulty: '어려움', icon: '👑' }
          ]
        }
      ]
    },
    'relationship-solutions': {
      title: 'AI 관계 개선 솔루션',
      description: '인간관계의 갈등과 소통 문제를 AI로 분석하고 개선 방안을 제시합니다.',
      icon: '🤝',
      color: 'from-green-500 to-emerald-500',
      subcategories: [
        {
          id: 'relationship-diagnosis',
          title: 'AI 관계 갈등 진단',
          description: '다양한 관계에서 발생하는 갈등 패턴을 분석합니다.',
          items: [
            { name: '친구·동료 관계 다이나믹스', desc: '친구와 동료 관계의 역학 관계 분석', time: '20분', difficulty: '쉬움', icon: '👥' },
            { name: '가족 시스템 분석', desc: '가족 구성원 간의 상호작용 패턴 분석', time: '30분', difficulty: '보통', icon: '👨‍👩‍👧‍👦' },
            { name: '연인 애착·갈등 패턴 분석', desc: '연인 관계의 애착 스타일과 갈등 요인', time: '25분', difficulty: '보통', icon: '💕' },
            { name: '이성 관계·데이팅 전략', desc: '건강한 이성 관계 형성 전략 제시', time: '20분', difficulty: '쉬움', icon: '💘' }
          ]
        },
        {
          id: 'social-skills',
          title: 'AI 소셜 스킬 강화',
          description: '사회적 기술과 의사소통 능력 향상을 지원합니다.',
          items: [
            { name: '소통 능력 진단 및 코칭', desc: '의사소통 스타일 분석과 개선 방안', time: '25분', difficulty: '보통', icon: '💬' },
            { name: '조직·팀워크 시너지 분석', desc: '팀 내에서의 역할과 기여도 분석', time: '30분', difficulty: '보통', icon: '⚡' },
            { name: '소셜 네트워크 빌더', desc: '효과적인 인맥 구축 전략 제시', time: '20분', difficulty: '쉬움', icon: '🌐' }
          ]
        }
      ]
    },
    'psychological-care': {
      title: 'AI 심리·정서 케어',
      description: '심리적 어려움과 정서적 문제를 AI로 진단하고 치유 방안을 제시합니다.',
      icon: '💚',
      color: 'from-purple-500 to-pink-500',
      subcategories: [
        {
          id: 'emotion-stress',
          title: 'AI 감정·스트레스 관리',
          description: '감정 조절과 스트레스 관리 능력을 향상시킵니다.',
          items: [
            { name: '우울·무기력감 트래킹', desc: 'PHQ-9 기반 우울 증상 모니터링', time: '15분', difficulty: '쉬움', icon: '😔' },
            { name: '불안·공황 증상 완화 코칭', desc: 'GAD-7 기반 불안 관리 솔루션', time: '20분', difficulty: '보통', icon: '😰' },
            { name: '스트레스 회복탄력성 증진', desc: '스트레스 대처 능력 강화 프로그램', time: '25분', difficulty: '보통', icon: '🛡️' },
            { name: '분노·충동성 조절 솔루션', desc: '감정 조절 능력 향상 훈련', time: '30분', difficulty: '보통', icon: '🔥' }
          ]
        },
        {
          id: 'crisis-recovery',
          title: 'AI 심리 위기 극복',
          description: '심리적 위기 상황을 극복하고 회복력을 강화합니다.',
          items: [
            { name: '트라우마·외상 후 회복 지원', desc: 'PTSD 증상 관리와 회복 프로그램', time: '40분', difficulty: '어려움', icon: '🆘' },
            { name: '자존감 회복 및 강화 프로그램', desc: '건강한 자아상 형성 지원', time: '30분', difficulty: '보통', icon: '💪' },
            { name: '중독·의존성 패턴 분석', desc: '중독 행동 패턴 분석과 회복 전략', time: '35분', difficulty: '어려움', icon: '🔗' },
            { name: '성인 ADHD 성향 분석 및 관리', desc: 'ADHD 증상 평가와 관리 방안', time: '30분', difficulty: '보통', icon: '🎯' },
            { name: '차별·미세공격 상처 분석', desc: '차별 경험으로 인한 심리적 상처 치유', time: '25분', difficulty: '보통', icon: '🩹' }
          ]
        },
        {
          id: 'environment-adaptation',
          title: 'AI 환경 부적응 진단',
          description: '다양한 환경에서의 적응 문제를 진단하고 해결책을 제시합니다.',
          items: [
            { name: '학교·학업 스트레스 진단', desc: '학업 환경 적응도와 스트레스 분석', time: '20분', difficulty: '쉬움', icon: '📚' },
            { name: '은퇴·노년기 적응 분석', desc: '인생 전환기 적응 능력 평가', time: '25분', difficulty: '보통', icon: '🌅' },
            { name: '사회적 고립·소외감 분석', desc: '사회적 연결감과 소속감 평가', time: '20분', difficulty: '쉬움', icon: '🏝️' },
            { name: '성소수자 정체성 지원', desc: '성정체성 관련 심리적 지원', time: '30분', difficulty: '보통', icon: '🏳️‍🌈' }
          ]
        }
      ]
    },
    'digital-psychology': {
      title: 'AI 디지털 심리 분석',
      description: '디지털 시대의 새로운 심리적 문제들을 분석하고 해결책을 제시합니다.',
      icon: '💻',
      color: 'from-indigo-500 to-purple-500',
      subcategories: [
        {
          id: 'online-identity',
          title: 'AI 온라인 자아 분석',
          description: '디지털 공간에서의 자아 표현과 정체성을 분석합니다.',
          items: [
            { name: 'SNS 비교·자존감 분석', desc: '소셜미디어가 자존감에 미치는 영향', time: '20분', difficulty: '쉬움', icon: '📱' },
            { name: '사이버 폭력 트라우마 분석', desc: '온라인 괴롭힘 경험과 회복', time: '30분', difficulty: '보통', icon: '🛡️' },
            { name: '디지털 정체성 맵핑', desc: '온라인과 오프라인 자아의 일치성', time: '25분', difficulty: '보통', icon: '🎭' }
          ]
        },
        {
          id: 'digital-relationships',
          title: 'AI 디지털 관계 진단',
          description: '디지털 환경에서의 인간관계 패턴을 분석합니다.',
          items: [
            { name: '디지털 소진·고립감 진단', desc: '온라인 피로와 고립감 측정', time: '20분', difficulty: '쉬움', icon: '😴' },
            { name: '온라인 데이팅 패턴 분석', desc: '디지털 연애 행동 패턴 분석', time: '25분', difficulty: '보통', icon: '💕' },
            { name: '팬덤·파라소셜 관계 분석', desc: '일방적 관계의 심리적 영향', time: '20분', difficulty: '쉬움', icon: '⭐' }
          ]
        },
        {
          id: 'digital-life-coaching',
          title: 'AI 디지털 라이프 코칭',
          description: '건강한 디지털 생활 습관 형성을 지원합니다.',
          items: [
            { name: '디지털 과의존도 분석', desc: '스마트폰·인터넷 의존도 측정', time: '15분', difficulty: '쉬움', icon: '📱' },
            { name: '정보 분별력·리터러시 진단', desc: '디지털 정보 해석 능력 평가', time: '20분', difficulty: '보통', icon: '🔍' },
            { name: 'AI 시대 기술 불안도 분석', desc: '기술 변화에 대한 적응력 평가', time: '25분', difficulty: '보통', icon: '🤖' }
          ]
        }
      ]
    },
    'reality-solutions': {
      title: 'AI 현실 문제 해결',
      description: '일상생활의 실질적인 문제들을 AI로 분석하고 해결책을 제시합니다.',
      icon: '🔧',
      color: 'from-orange-500 to-red-500',
      subcategories: [
        {
          id: 'career-solutions',
          title: 'AI 직장·커리어 솔루션',
          description: '직장 생활과 커리어 발전의 어려움을 해결합니다.',
          items: [
            { name: '번아웃 예측 및 회복 플랜', desc: '직장 번아웃 위험도 측정과 예방', time: '25분', difficulty: '보통', icon: '🔥' },
            { name: '직장 내 관계·갈등 분석', desc: '직장 내 인간관계 문제 해결', time: '30분', difficulty: '보통', icon: '👔' },
            { name: '커리어 전환·성장 시뮬레이션', desc: '커리어 변화 시나리오 분석', time: '35분', difficulty: '어려움', icon: '🚀' },
            { name: '불안정 노동·프리랜서 코칭', desc: '비정규직·프리랜서 심리 지원', time: '25분', difficulty: '보통', icon: '💼' },
            { name: '창업 스트레스·리스크 분석', desc: '창업 과정의 심리적 부담 관리', time: '30분', difficulty: '어려움', icon: '🏢' },
            { name: '조직 내 세대·문화 갈등 진단', desc: '세대간·문화간 갈등 해결', time: '25분', difficulty: '보통', icon: '🌍' }
          ]
        },
        {
          id: 'economic-stress',
          title: 'AI 경제적 스트레스 분석',
          description: '경제적 문제로 인한 심리적 스트레스를 분석합니다.',
          items: [
            { name: '부채·재정 압박감 진단', desc: '경제적 부담이 정신건강에 미치는 영향', time: '20분', difficulty: '보통', icon: '💳' },
            { name: '소비·투자 심리 프로파일링', desc: '소비 패턴과 투자 성향 분석', time: '25분', difficulty: '보통', icon: '💰' },
            { name: '경제적 미래 불안도 측정', desc: '경제적 미래에 대한 불안 수준', time: '20분', difficulty: '쉬움', icon: '📈' },
            { name: '경제적 트라우마 분석', desc: '경제적 충격 경험과 회복', time: '30분', difficulty: '어려움', icon: '💸' },
            { name: '가족 자산 갈등 분석', desc: '가족 내 경제적 갈등 해결', time: '25분', difficulty: '보통', icon: '🏠' },
            { name: '돌봄 노동 부담감 진단', desc: '돌봄 역할로 인한 심리적 부담', time: '20분', difficulty: '보통', icon: '👶' }
          ]
        }
      ]
    }
  };

  const currentData = subcategoryData[selectedCategory as keyof typeof subcategoryData];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* 카테고리 선택 탭 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {Object.entries(subcategoryData).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === key
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="text-xl">{data.icon}</span>
                <span>{data.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 선택된 카테고리 내용 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          {/* 카테고리 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${currentData.color} flex items-center justify-center text-3xl`}>
                {currentData.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{currentData.title}</h1>
                <p className="text-gray-300 text-lg mt-2">{currentData.description}</p>
              </div>
            </div>
          </div>

          {/* 중분류 섹션들 */}
          <div className="space-y-8">
            {currentData.subcategories.map((subcategory) => (
              <div key={subcategory.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold text-white mb-2">{subcategory.title}</h2>
                  <p className="text-gray-300">{subcategory.description}</p>
                </div>

                {/* 소분류 아이템들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subcategory.items.map((item, index) => (
                    <Link
                      key={index}
                      href={`/tests/${subcategory.id}/${item.name.toLowerCase().replace(/[·\s]/g, '-')}`}
                      className="group bg-black/80 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 hover:bg-black/90 hover:border-gray-600/50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                            item.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {item.difficulty}
                          </span>
                          <span className="text-gray-400 text-sm">{item.time}</span>
                        </div>
                        <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                          <span className="text-sm font-medium">시작하기</span>
                          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}