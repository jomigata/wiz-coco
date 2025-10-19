'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AIAnalysisResult {
  personalityProfile: {
    mbti: string;
    bigFive: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
    strengths: string[];
    growthAreas: string[];
  };
  learningStyle: {
    dominantStyle: string;
    preferences: string[];
    recommendations: string[];
  };
  socialPatterns: {
    communicationStyle: string;
    relationshipPatterns: string[];
    socialNeeds: string[];
  };
  stressManagement: {
    copingStrategies: string[];
    stressLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  careerInsights: {
    interests: string[];
    values: string[];
    suggestedPaths: string[];
  };
  campusLifeRecommendations: {
    academic: string[];
    social: string[];
    personal: string[];
    career: string[];
  };
}

export default function AIAnalysisPage() {
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  // 시뮬레이션된 AI 분석 결과
  const mockAnalysisResult: AIAnalysisResult = {
    personalityProfile: {
      mbti: 'ENFP',
      bigFive: {
        openness: 85,
        conscientiousness: 70,
        extraversion: 80,
        agreeableness: 75,
        neuroticism: 45
      },
      strengths: [
        '창의적 사고와 혁신적 아이디어',
        '사람들과의 원활한 소통',
        '적응력과 유연성',
        '열정적이고 동기부여 능력'
      ],
      growthAreas: [
        '세부사항 관리 능력',
        '장기적 계획 수립',
        '스트레스 관리'
      ]
    },
    learningStyle: {
      dominantStyle: '협력적 학습',
      preferences: [
        '그룹 토론과 협업',
        '실습 중심 학습',
        '시각적 자료 활용',
        '즉각적인 피드백'
      ],
      recommendations: [
        '스터디 그룹을 만들어 정기적인 학습 세션 진행',
        '프로젝트 기반 수업에 적극 참여',
        '동료들과의 지식 공유 및 피드백 교환',
        '실습실과 현장 체험을 적극 활용'
      ]
    },
    socialPatterns: {
      communicationStyle: '열정적이고 표현력이 풍부한 소통',
      relationshipPatterns: [
        '다양한 사람들과의 네트워킹 선호',
        '깊이 있는 대화보다는 폭넓은 교류',
        '팀워크와 협력을 중시',
        '갈등 상황에서 중재자 역할'
      ],
      socialNeeds: [
        '정기적인 사회적 상호작용',
        '창의적 활동을 통한 자아표현',
        '의미 있는 관계 형성',
        '집단 내에서의 인정과 지지'
      ]
    },
    stressManagement: {
      copingStrategies: [
        '친구들과의 대화를 통한 스트레스 해소',
        '창의적 활동(음악, 미술 등)',
        '운동과 신체 활동',
        '새로운 경험과 도전'
      ],
      stressLevel: 'medium',
      recommendations: [
        '정기적인 운동 루틴을 만들어 신체적 스트레스 해소',
        '명상이나 마음챙김 연습을 통한 정신적 안정',
        '과도한 완벽주의를 피하고 현실적 목표 설정',
        '스트레스 상황에서의 감정 조절 기법 학습'
      ]
    },
    careerInsights: {
      interests: [
        '창의적 분야 (디자인, 예술, 미디어)',
        '사람과의 상호작용이 많은 직업',
        '혁신과 변화를 추구하는 환경',
        '사회적 가치를 실현할 수 있는 일'
      ],
      values: [
        '자아실현과 개인적 성장',
        '창의적 표현의 자유',
        '사람들과의 의미 있는 관계',
        '사회적 기여와 영향력'
      ],
      suggestedPaths: [
        '창의적 분야 (디자인, 예술, 미디어)',
        '교육 및 상담 분야',
        '마케팅 및 커뮤니케이션',
        '사회적 기업 및 비영리 단체'
      ]
    },
    campusLifeRecommendations: {
      academic: [
        '창의적 프로젝트가 많은 수업 선택',
        '토론과 발표가 활발한 강의 참여',
        '다양한 전공 수강을 통한 폭넓은 지식 습득',
        '연구 프로젝트나 인턴십 참여'
      ],
      social: [
        '창의적 동아리나 예술 동아리 가입',
        '다양한 배경의 학생들과의 교류',
        '봉사활동이나 사회적 프로젝트 참여',
        '국제 학생들과의 문화 교류'
      ],
      personal: [
        '정기적인 운동과 건강 관리',
        '새로운 취미나 기술 습득',
        '개인적 성찰과 목표 설정 시간',
        '스트레스 관리 기법 학습'
      ],
      career: [
        '창의적 포트폴리오 개발',
        '네트워킹 이벤트 적극 참여',
        '다양한 인턴십 경험 쌓기',
        '멘토링 프로그램 참여'
      ]
    }
  };

  const runAIAnalysis = async () => {
    setIsLoading(true);
    
    // 실제로는 API 호출을 통해 AI 분석을 수행
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setAnalysisResult(mockAnalysisResult);
    setIsLoading(false);
  };

  const getBigFiveColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBigFiveLabel = (score: number) => {
    if (score >= 80) return '높음';
    if (score >= 60) return '보통';
    return '낮음';
  };

  const tabs = [
    { id: 'overview', name: '종합 개요', icon: '📊' },
    { id: 'personality', name: '성격 분석', icon: '🎭' },
    { id: 'learning', name: '학습 스타일', icon: '📚' },
    { id: 'social', name: '사회적 패턴', icon: '👥' },
    { id: 'stress', name: '스트레스 관리', icon: '💪' },
    { id: 'career', name: '진로 인사이트', icon: '🎯' },
    { id: 'recommendations', name: '캠퍼스 라이프', icon: '🏫' }
  ];

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-4xl mx-auto mb-4 animate-pulse">
            🤖
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">AI 분석 중...</h2>
          <p className="text-gray-300">당신의 데이터를 종합 분석하여 맞춤형 리포트를 생성하고 있습니다.</p>
          <div className="mt-6 w-64 bg-white/20 rounded-full h-2 mx-auto">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-4xl mx-auto mb-4">
              🤖
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">AI 종합 분석</h1>
            <p className="text-gray-300 text-lg">당신의 모든 검사 결과를 AI가 종합 분석하여 맞춤형 리포트를 생성합니다</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">분석 내용</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">성격 프로파일링</h3>
                    <p className="text-gray-300 text-sm">MBTI, 성격 5요인 분석</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📚</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">학습 스타일 분석</h3>
                    <p className="text-gray-300 text-sm">최적의 학습 방법 제안</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">사회적 패턴</h3>
                    <p className="text-gray-300 text-sm">대인관계 및 소통 스타일</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💪</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">스트레스 관리</h3>
                    <p className="text-gray-300 text-sm">스트레스 대처 및 관리 방안</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">진로 인사이트</h3>
                    <p className="text-gray-300 text-sm">적성과 흥미 기반 진로 제안</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏫</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">캠퍼스 라이프</h3>
                    <p className="text-gray-300 text-sm">맞춤형 대학 생활 가이드</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={runAIAnalysis}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 text-lg"
            >
              AI 분석 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-4xl mx-auto mb-4">
            🤖
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">AI 종합 분석 리포트</h1>
          <p className="text-gray-300 text-lg">당신만을 위한 맞춤형 캠퍼스 라이프 가이드</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-sm">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {selectedTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">종합 개요</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">성격 프로파일</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">MBTI 유형</span>
                      <span className="text-white font-semibold">{analysisResult.personalityProfile.mbti}</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-300 text-sm">주요 강점</span>
                      <div className="space-y-1">
                        {analysisResult.personalityProfile.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="text-gray-200 text-sm">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">학습 스타일</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">주요 학습 방식</span>
                      <span className="text-white font-semibold">{analysisResult.learningStyle.dominantStyle}</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-gray-300 text-sm">학습 선호도</span>
                      <div className="space-y-1">
                        {analysisResult.learningStyle.preferences.map((pref, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <span className="text-gray-200 text-sm">{pref}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'personality' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">성격 분석</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">MBTI & 성격 5요인</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">MBTI 유형</span>
                      <span className="text-white font-bold text-lg">{analysisResult.personalityProfile.mbti}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">개방성</span>
                        <span className={`font-semibold ${getBigFiveColor(analysisResult.personalityProfile.bigFive.openness)}`}>
                          {analysisResult.personalityProfile.bigFive.openness} ({getBigFiveLabel(analysisResult.personalityProfile.bigFive.openness)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">성실성</span>
                        <span className={`font-semibold ${getBigFiveColor(analysisResult.personalityProfile.bigFive.conscientiousness)}`}>
                          {analysisResult.personalityProfile.bigFive.conscientiousness} ({getBigFiveLabel(analysisResult.personalityProfile.bigFive.conscientiousness)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">외향성</span>
                        <span className={`font-semibold ${getBigFiveColor(analysisResult.personalityProfile.bigFive.extraversion)}`}>
                          {analysisResult.personalityProfile.bigFive.extraversion} ({getBigFiveLabel(analysisResult.personalityProfile.bigFive.extraversion)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">친화성</span>
                        <span className={`font-semibold ${getBigFiveColor(analysisResult.personalityProfile.bigFive.agreeableness)}`}>
                          {analysisResult.personalityProfile.bigFive.agreeableness} ({getBigFiveLabel(analysisResult.personalityProfile.bigFive.agreeableness)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">신경성</span>
                        <span className={`font-semibold ${getBigFiveColor(analysisResult.personalityProfile.bigFive.neuroticism)}`}>
                          {analysisResult.personalityProfile.bigFive.neuroticism} ({getBigFiveLabel(analysisResult.personalityProfile.bigFive.neuroticism)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">성장 영역</h3>
                  <div className="space-y-3">
                    {analysisResult.personalityProfile.growthAreas.map((area, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-blue-400">🔧</span>
                        <span className="text-gray-200">{area}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'learning' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">학습 스타일 분석</h2>
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">학습 추천사항</h3>
                  <div className="space-y-3">
                    {analysisResult.learningStyle.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-yellow-400 mt-1">💡</span>
                        <span className="text-gray-200">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'social' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">사회적 패턴</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">소통 스타일</h3>
                  <p className="text-gray-200 mb-4">{analysisResult.socialPatterns.communicationStyle}</p>
                  <div className="space-y-2">
                    <span className="text-gray-300 text-sm">관계 패턴</span>
                    <div className="space-y-1">
                      {analysisResult.socialPatterns.relationshipPatterns.map((pattern, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                          <span className="text-gray-200 text-sm">{pattern}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">사회적 욕구</h3>
                  <div className="space-y-2">
                    {analysisResult.socialPatterns.socialNeeds.map((need, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                        <span className="text-gray-200">{need}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'stress' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">스트레스 관리</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">현재 스트레스 수준</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      analysisResult.stressManagement.stressLevel === 'low' ? 'bg-green-500/20 text-green-400' :
                      analysisResult.stressManagement.stressLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {analysisResult.stressManagement.stressLevel === 'low' ? '낮음' :
                       analysisResult.stressManagement.stressLevel === 'medium' ? '보통' : '높음'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-gray-300 text-sm">현재 대처 전략</span>
                    <div className="space-y-1">
                      {analysisResult.stressManagement.copingStrategies.map((strategy, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-gray-200 text-sm">{strategy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">개선 추천사항</h3>
                  <div className="space-y-3">
                    {analysisResult.stressManagement.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-blue-400 mt-1">💡</span>
                        <span className="text-gray-200">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'career' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">진로 인사이트</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">관심 분야</h3>
                  <div className="space-y-2">
                    {analysisResult.careerInsights.interests.map((interest, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <span className="text-gray-200 text-sm">{interest}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">가치관</h3>
                  <div className="space-y-2">
                    {analysisResult.careerInsights.values.map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        <span className="text-gray-200 text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">추천 진로</h3>
                  <div className="space-y-2">
                    {analysisResult.careerInsights.suggestedPaths.map((path, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-gray-200 text-sm">{path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'recommendations' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">캠퍼스 라이프 추천</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    학업
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.campusLifeRecommendations.academic.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-gray-200 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    사회적 활동
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.campusLifeRecommendations.social.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span className="text-gray-200 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">💪</span>
                    개인적 성장
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.campusLifeRecommendations.personal.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span className="text-gray-200 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    진로 준비
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.campusLifeRecommendations.career.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span className="text-gray-200 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link 
            href="/tests"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
          >
            다른 검사도 해보기
          </Link>
        </div>
      </div>
    </div>
  );
}
