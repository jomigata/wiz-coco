'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function TestsContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // URL 파라미터에서 카테고리 가져오기
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  // AI CoCo v7.0 전체 카테고리 데이터
  const allTestCategories = [
    // 개인 심리 및 성장
    {
      id: 'personality-temperament',
      title: '1a. 성격 및 기질 탐색',
      description: '개인의 성격 특성과 타고난 기질을 파악하여 자기 이해를 돕습니다.',
      icon: '🎭',
      color: 'from-blue-500 to-cyan-500',
      category: 'personal-growth',
      categoryName: '1. 개인 심리 및 성장',
      difficulty: '보통',
      time: '20-25분',
      testCount: 2,
      href: '/tests/personality-temperament',
      worryExamples: ['저는 어떤 사람인가요?', '제 성격의 장단점이 궁금해요', '왜 저는 늘 이런 식으로 행동할까요?']
    },
    {
      id: 'identity-values',
      title: '1b. 자아정체감 및 가치관',
      description: '자아 정체성과 개인의 가치관 체계를 탐색하여 일관된 자아상을 형성합니다.',
      icon: '🌟',
      color: 'from-purple-500 to-pink-500',
      category: 'personal-growth',
      categoryName: '1. 개인 심리 및 성장',
      difficulty: '어려움',
      time: '25-30분',
      testCount: 2,
      href: '/tests/identity-values',
      worryExamples: ['저는 누구인지 혼란스러워요', '무엇을 위해 사는지 모르겠어요', '진정한 제 모습이 뭘까요?']
    },
    {
      id: 'potential-development',
      title: '1c. 잠재력 및 역량 개발',
      description: '개인의 숨겨진 잠재력을 발굴하고 역량을 체계적으로 개발합니다.',
      icon: '🚀',
      color: 'from-orange-500 to-red-500',
      category: 'personal-growth',
      categoryName: '1. 개인 심리 및 성장',
      difficulty: '보통',
      time: '25-35분',
      testCount: 3,
      href: '/tests/potential-development',
      worryExamples: ['제가 잘하는 게 뭔지 모르겠어요', '제 잠재력을 발휘하고 싶어요', '리더 역할을 잘하고 싶어요']
    },
    {
      id: 'life-meaning',
      title: '1d. 삶의 의미 및 실존적 문제',
      description: '삶의 근본적인 의미를 탐색하고 실존적 고민을 해결합니다.',
      icon: '🌌',
      color: 'from-indigo-500 to-purple-500',
      category: 'personal-growth',
      categoryName: '1. 개인 심리 및 성장',
      difficulty: '어려움',
      time: '30-40분',
      testCount: 4,
      href: '/tests/life-meaning',
      worryExamples: ['사는 게 무슨 의미가 있는지 모르겠어요', '죽음이 너무 두려워요', '내면의 평화를 얻고 싶어요']
    },
    // 대인관계 및 사회적응
    {
      id: 'family-relations',
      title: '2a. 가족 관계',
      description: '원가족 문제부터 현재 가족 관계까지 다양한 가족 갈등을 해결합니다.',
      icon: '👨‍👩‍👧‍👦',
      color: 'from-pink-500 to-rose-500',
      category: 'relationships-social',
      categoryName: '2. 대인관계 및 사회적응',
      difficulty: '보통',
      time: '30분',
      testCount: 1,
      href: '/tests/family-relations',
      worryExamples: ['부모님과 대화가 안 통해요', '형제자매와 자주 다퉈요', '가족과의 관계가 너무 힘들어요']
    },
    {
      id: 'romantic-relations',
      title: '2b. 연인 및 부부 관계',
      description: '연애 관계의 갈등부터 결혼 생활의 어려움까지 친밀한 관계의 문제를 다룹니다.',
      icon: '💕',
      color: 'from-red-500 to-pink-500',
      category: 'relationships-social',
      categoryName: '2. 대인관계 및 사회적응',
      difficulty: '보통',
      time: '20-25분',
      testCount: 2,
      href: '/tests/romantic-relations',
      worryExamples: ['연인과 계속 싸워요', '사랑받고 있는지 모르겠어요', '이성을 어떻게 만나야 할지 모르겠어요']
    },
    {
      id: 'friend-colleague',
      title: '2c. 친구 및 동료 관계',
      description: '친구, 직장 동료와의 관계에서 발생하는 갈등과 소통 문제를 해결합니다.',
      icon: '👥',
      color: 'from-green-500 to-teal-500',
      category: 'relationships-social',
      categoryName: '2. 대인관계 및 사회적응',
      difficulty: '보통',
      time: '25분',
      testCount: 1,
      href: '/tests/friend-colleague',
      worryExamples: ['친구들과 자주 싸워요', '새로운 친구 사귀기가 어려워요', '직장 동료와 관계가 불편해요']
    },
    {
      id: 'social-communication',
      title: '2d. 사회적 기술 및 소통',
      description: '효과적인 의사소통과 사회적 기술 향상으로 원만한 인간관계를 형성합니다.',
      icon: '💬',
      color: 'from-cyan-500 to-blue-500',
      category: 'relationships-social',
      categoryName: '2. 대인관계 및 사회적응',
      difficulty: '쉬움',
      time: '20-30분',
      testCount: 2,
      href: '/tests/social-communication',
      worryExamples: ['낯선 사람들과 대화하기 힘들어요', '제 의견을 잘 표현 못 해요', '직장 내 갈등이 너무 힘들어요']
    },
    // 정서 문제 및 정신 건강
    {
      id: 'depression-mood',
      title: '3a. 우울 및 기분 문제',
      description: '우울감, 무기력감, 분노 조절 등 기분과 관련된 문제를 다룹니다.',
      icon: '💙',
      color: 'from-indigo-500 to-purple-500',
      category: 'emotional-mental',
      categoryName: '3. 정서 문제 및 정신 건강',
      difficulty: '쉬움',
      time: '20-25분',
      testCount: 2,
      href: '/tests/depression-mood',
      worryExamples: ['만사가 귀찮고 의욕이 없어요', '계속 우울하고 슬퍼요', '쉽게 화를 내고 후회해요']
    },
    {
      id: 'anxiety-stress',
      title: '3b. 불안 및 스트레스',
      description: '불안 장애, 공황 증상, 스트레스 관리 등 불안과 관련된 문제를 해결합니다.',
      icon: '😰',
      color: 'from-yellow-500 to-orange-500',
      category: 'emotional-mental',
      categoryName: '3. 정서 문제 및 정신 건강',
      difficulty: '보통',
      time: '20-25분',
      testCount: 2,
      href: '/tests/anxiety-stress',
      worryExamples: ['늘 불안하고 초조해요', '스트레스를 너무 많이 받아요', '갑자기 공황 발작이 와요']
    },
    {
      id: 'trauma-crisis',
      title: '3c. 외상 및 위기 개입',
      description: 'PTSD, 트라우마, 위기 상황에 대한 전문적인 개입과 치유를 제공합니다.',
      icon: '🆘',
      color: 'from-red-500 to-orange-500',
      category: 'emotional-mental',
      categoryName: '3. 정서 문제 및 정신 건강',
      difficulty: '어려움',
      time: '40분',
      testCount: 1,
      href: '/tests/trauma-crisis',
      worryExamples: ['끔찍한 기억이 계속 떠올라요', '사고 후 잠을 잘 수가 없어요', '특정 장소나 상황을 피하게 돼요']
    },
    {
      id: 'addiction-impulse',
      title: '3d. 중독 및 충동 조절 문제',
      description: '물질 및 행위 중독, 성인 ADHD 등 충동 조절의 어려움을 해결합니다.',
      icon: '🔗',
      color: 'from-purple-500 to-indigo-500',
      category: 'emotional-mental',
      categoryName: '3. 정서 문제 및 정신 건강',
      difficulty: '어려움',
      time: '30분',
      testCount: 2,
      href: '/tests/addiction-impulse',
      worryExamples: ['술(담배)을 끊고 싶은데 안 돼요', '인터넷/게임에 너무 중독됐어요', '집중을 잘 못하고 산만해요']
    },
    {
      id: 'self-esteem',
      title: '자존감 및 자기 문제',
      description: '낮은 자존감, 자기 비난, 완벽주의 등 자기 자신과 관련된 문제를 다룹니다.',
      icon: '💪',
      color: 'from-green-500 to-emerald-500',
      category: 'emotional-mental',
      categoryName: '3. 정서 문제 및 정신 건강',
      difficulty: '보통',
      time: '30분',
      testCount: 1,
      href: '/tests/self-esteem',
      worryExamples: ['제가 너무 한심하게 느껴져요', '남들과 비교해서 열등감이 심해요', '제 자신을 사랑할 수가 없어요']
    },
    // 현실 문제 및 생활 관리
    {
      id: 'career-work',
      title: '4a. 진로 및 직업 문제',
      description: '진로 선택부터 직장 생활의 어려움까지 직업과 관련된 모든 문제를 다룹니다.',
      icon: '💼',
      color: 'from-emerald-500 to-teal-500',
      category: 'reality-life',
      categoryName: '4. 현실 문제 및 생활 관리',
      difficulty: '보통',
      time: '25-30분',
      testCount: 3,
      href: '/tests/career-work',
      worryExamples: ['어떤 직업을 선택해야 할지 모르겠어요', '업무량이 너무 많아 소진 상태예요', '사업 실패에 대한 두려움으로 잠을 못 자요']
    },
    {
      id: 'economic-finance',
      title: '4b. 경제 및 재정 문제',
      description: '재정 스트레스, 부채 문제, 소비 패턴 등 경제적 어려움을 해결합니다.',
      icon: '💰',
      color: 'from-yellow-500 to-green-500',
      category: 'reality-life',
      categoryName: '4. 현실 문제 및 생활 관리',
      difficulty: '보통',
      time: '20-25분',
      testCount: 3,
      href: '/tests/economic-finance',
      worryExamples: ['학자금 대출 상환 압박감 때문에 미래가 안 보여요', '스트레스를 받으면 충동구매를 해요', '월급이 너무 적어서 미래가 불안해요']
    },
    {
      id: 'health-body',
      title: '4c. 건강 및 신체 문제',
      description: '신체 이미지, 건강 불안, 만성 질환 등 건강과 관련된 심리적 문제를 다룹니다.',
      icon: '🏥',
      color: 'from-red-500 to-pink-500',
      category: 'reality-life',
      categoryName: '4. 현실 문제 및 생활 관리',
      difficulty: '보통',
      time: '20-30분',
      testCount: 4,
      href: '/tests/health-body',
      worryExamples: ['제 외모에 대한 극심한 불만이 있어요', '폭식/거식 경향이 있어요', '만성 질환으로 인해 우울해요']
    },
    {
      id: 'legal-admin',
      title: '4e. 법률 및 행정 문제',
      description: '법적 분쟁, 행정 절차 등으로 인한 스트레스와 심리적 부담을 관리합니다.',
      icon: '⚖️',
      color: 'from-gray-500 to-slate-500',
      category: 'reality-life',
      categoryName: '4. 현실 문제 및 생활 관리',
      difficulty: '어려움',
      time: '30분',
      testCount: 1,
      href: '/tests/legal-admin',
      worryExamples: ['법적 분쟁으로 인한 스트레스가 심해요', '행정 절차가 너무 복잡해서 막막해요', '소송 과정에서 심리적 부담이 커요']
    },
    {
      id: 'daily-management',
      title: '4d. 일상생활 및 자기 관리',
      description: '시간 관리, 생활 습관, 자기 관리 등 일상생활의 어려움을 해결합니다.',
      icon: '📅',
      color: 'from-blue-500 to-indigo-500',
      category: 'reality-life',
      categoryName: '4. 현실 문제 및 생활 관리',
      difficulty: '쉬움',
      time: '15-25분',
      testCount: 1,
      href: '/tests/daily-management',
      worryExamples: ['시간 관리가 너무 어려워요', '생활 패턴이 엉망이에요', '자기 관리를 못하겠어요']
    },
    // 문화 및 환경 적응
    {
      id: 'multicultural',
      title: '5a. 다문화 적응',
      description: '다문화 가정, 이민자, 유학생 등의 문화 적응 문제를 전문적으로 지원합니다.',
      icon: '🌍',
      color: 'from-teal-500 to-cyan-500',
      category: 'culture-environment',
      categoryName: '5. 문화 및 환경 적응',
      difficulty: '보통',
      time: '25-30분',
      testCount: 4,
      href: '/tests/multicultural',
      worryExamples: ['한국어가 서툴러 오해를 자주 받아요', '단지 외국인이라는 이유만으로 무시당하는 기분이에요', '한국에서도, 부모님 나라에서도 저는 이방인 같아요']
    },
    {
      id: 'digital-adaptation',
      title: '5b. 디지털 환경 적응',
      description: '디지털 시대의 새로운 심리적 문제들을 분석하고 해결책을 제시합니다.',
      icon: '📱',
      color: 'from-purple-500 to-blue-500',
      category: 'culture-environment',
      categoryName: '5. 문화 및 환경 적응',
      difficulty: '쉬움',
      time: '15-30분',
      testCount: 3,
      href: '/tests/digital-adaptation',
      worryExamples: ['다른 사람의 SNS를 보면 제 삶이 초라하게 느껴져요', '악플 때문에 우울증이 생겼어요', '스마트폰이 없으면 불안해요']
    },
    {
      id: 'lifecycle-adaptation',
      title: '5c. 생애주기별 적응',
      description: '아동기부터 노년기까지 각 생애주기별 발달과업과 위기를 지원합니다.',
      icon: '👶',
      color: 'from-pink-500 to-purple-500',
      category: 'culture-environment',
      categoryName: '5. 문화 및 환경 적응',
      difficulty: '보통',
      time: '25-30분',
      testCount: 4,
      href: '/tests/lifecycle-adaptation',
      worryExamples: ['아이가 학교에서 따돌림을 당하는 것 같아요', '첫 직장생활에 적응하기 너무 힘들어요', '은퇴 후 역할 상실감으로 무기력해요']
    },
    {
      id: 'social-environment',
      title: '5d. 사회 환경 적응',
      description: '학교 부적응, 사회적 소수자, 환경 불안 등 특별한 사회적 맥락의 문제를 다룹니다.',
      icon: '🏫',
      color: 'from-green-500 to-blue-500',
      category: 'culture-environment',
      categoryName: '5. 문화 및 환경 적응',
      difficulty: '어려움',
      time: '20-30분',
      testCount: 3,
      href: '/tests/social-environment',
      worryExamples: ['학교폭력 피해로 등교를 거부하고 있어요', '성 정체성 때문에 고민이에요', '기후 위기 뉴스를 보면 미래에 대한 희망이 사라져요']
    }
  ];

  // 카테고리별 필터링
  const categoryFilters = [
    { id: 'all', name: '전체보기', icon: '🔍' },
    { id: 'personal-growth', name: '1. 개인 심리 및 성장', icon: '🌱' },
    { id: 'relationships-social', name: '2. 대인관계 및 사회적응', icon: '🤝' },
    { id: 'emotional-mental', name: '3. 정서 문제 및 정신 건강', icon: '💚' },
    { id: 'reality-life', name: '4. 현실 문제 및 생활 관리', icon: '🔧' },
    { id: 'culture-environment', name: '5. 문화 및 환경 적응', icon: '🌍' }
  ];

  const filteredTests = selectedCategory === 'all' 
    ? allTestCategories 
    : allTestCategories.filter(test => test.category === selectedCategory);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
        <div className="max-w-7xl mx-auto">
          {/* 페이지 헤더 */}
          <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-3xl">
              🧠
            </div>
                <div>
              <h1 className="text-3xl font-bold text-white">AI CoCo 심리검사 대시보드</h1>
              <p className="text-gray-300 text-lg mt-2">AI 기반 심리분석 솔루션으로 내담자를 지원하세요</p>
            </div>
          </div>

          {/* 카테고리 필터 탭 */}
            <div className="flex flex-wrap gap-3">
            {categoryFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedCategory(filter.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  selectedCategory === filter.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span className="text-lg">{filter.icon}</span>
                <span className="text-sm">{filter.name}</span>
                </button>
              ))}
            </div>
          </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <span className="text-cyan-400 text-lg">📊</span>
                    </div>
                    <div>
                <p className="text-gray-400 text-sm">전체 검사</p>
                <p className="text-white text-xl font-bold">{allTestCategories.length}개</p>
              </div>
                    </div>
                  </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-lg">⚡</span>
              </div>
                    <div>
                <p className="text-gray-400 text-sm">쉬운 검사</p>
                <p className="text-white text-xl font-bold">{allTestCategories.filter(t => t.difficulty === '쉬움').length}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 text-lg">⭐</span>
                    </div>
                    <div>
                <p className="text-gray-400 text-sm">보통 검사</p>
                <p className="text-white text-xl font-bold">{allTestCategories.filter(t => t.difficulty === '보통').length}개</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <span className="text-red-400 text-lg">🔥</span>
                    </div>
                    <div>
                <p className="text-gray-400 text-sm">어려운 검사</p>
                <p className="text-white text-xl font-bold">{allTestCategories.filter(t => t.difficulty === '어려움').length}개</p>
              </div>
                    </div>
                  </div>
                </div>

        {/* 검사 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTests.map((test) => (
            <Link key={test.id} href={test.href} className="block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full cursor-pointer">
                {/* 카드 헤더 */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${test.color} rounded-lg flex items-center justify-center text-lg flex-shrink-0`}>
                    {test.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white leading-tight">{test.title}</h3>
                    <p className="text-xs text-gray-400">{test.categoryName}</p>
                  </div>
                </div>

                {/* 카드 내용 */}
                <div className="flex-1 flex flex-col">
                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">{test.description}</p>
                  
                  {/* 고민 예시 - 축약된 형태 */}
                  <div className="bg-black/20 rounded-lg p-3 mb-4 flex-1">
                    <h4 className="text-xs font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                      <span>💭</span> 주요 고민
                    </h4>
                    <div className="space-y-1">
                      {test.worryExamples.slice(0, 2).map((worry, idx) => (
                        <div key={idx} className="text-xs text-gray-300 truncate">
                          • "{worry}"
                        </div>
                      ))}
                      {test.worryExamples.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{test.worryExamples.length - 2}개 더...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 카드 메타 정보 */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.difficulty === '쉬움' ? 'bg-green-500/20 text-green-400' :
                        test.difficulty === '보통' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {test.difficulty}
                      </span>
                      <span className="text-gray-400 text-xs">{test.time}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {test.testCount}개 검사
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 하단 안내 */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">🧠 AI CoCo 심리검사 안내</h3>
            <p className="text-gray-300 text-sm">
              전문 상담사가 설계한 과학적 심리검사로 내담자의 마음을 깊이 있게 이해하고 맞춤형 상담을 제공하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PsychologyTestsPage() {
  return (
    <Suspense fallback={
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-3xl mx-auto mb-4">
                🧠
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">로딩 중...</h2>
              <p className="text-gray-300">심리검사 목록을 불러오고 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <TestsContent />
    </Suspense>
  );
}