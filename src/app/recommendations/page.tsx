'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

export default function RecommendationsPage() {
  const [userProfile, setUserProfile] = useState({
    mbti: 'INTJ',
    interests: ['심리학', '자기계발', '스트레스 관리'],
    goals: ['자기 이해 향상', '대인관계 개선'],
    completedTests: ['MBTI', '이고-오케이'],
    counselingHistory: ['스트레스 관리 상담']
  });

  const [recommendations, setRecommendations] = useState([
    {
      id: 1,
      type: 'test',
      title: '에니어그램 검사',
      description: '성격 유형을 9가지로 분류하여 더 깊이 있는 자기 이해를 제공합니다',
      category: '성격',
      priority: 'high',
      matchScore: 95,
      estimatedTime: '15분',
      icon: '🔮'
    },
    {
      id: 2,
      type: 'counseling',
      title: '인지행동치료 상담',
      description: '부정적인 사고 패턴을 인식하고 긍정적인 변화를 이끌어내는 상담입니다',
      category: '상담',
      priority: 'high',
      matchScore: 88,
      estimatedTime: '50분',
      icon: '💭'
    },
    {
      id: 3,
      type: 'learning',
      title: '감정 조절 워크숍',
      description: '감정을 건강하게 표현하고 관리하는 방법을 배우는 실습 프로그램입니다',
      category: '교육',
      priority: 'medium',
      matchScore: 82,
      estimatedTime: '2시간',
      icon: '🎭'
    },
    {
      id: 4,
      type: 'test',
      title: '스트레스 대처 능력 검사',
      description: '현재 스트레스 대처 방식을 평가하고 개선 방향을 제시합니다',
      category: '스트레스',
      priority: 'medium',
      matchScore: 79,
      estimatedTime: '20분',
      icon: '⚡'
    },
    {
      id: 5,
      type: 'counseling',
      title: '대인관계 상담',
      description: '건강한 인간관계를 형성하고 유지하는 방법을 배우는 상담입니다',
      category: '관계',
      priority: 'high',
      matchScore: 91,
      estimatedTime: '50분',
      icon: '🤝'
    },
    {
      id: 6,
      type: 'learning',
      title: '마음챙김 명상 프로그램',
      description: '현재 순간에 집중하여 마음의 평정을 기르는 명상 프로그램입니다',
      category: '명상',
      priority: 'low',
      matchScore: 75,
      estimatedTime: '30분',
      icon: '🧘'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const categories = ['all', '성격', '상담', '교육', '스트레스', '관계', '명상'];
  const priorities = ['all', 'high', 'medium', 'low'];

  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'test': return '🧠';
      case 'counseling': return '💬';
      case 'learning': return '📚';
      default: return '📋';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'test': return '심리검사';
      case 'counseling': return '상담';
      case 'learning': return '학습';
      default: return '기타';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="pt-16">
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
          <div className="container mx-auto px-4 py-8">
            {/* 헤더 */}
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                🎯 맞춤 추천
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                당신의 성격과 관심사를 바탕으로 최적화된 심리검사와 상담 프로그램을 추천해드립니다
              </p>
            </motion.div>

            {/* 사용자 프로필 */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-indigo-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 나의 프로필</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">MBTI</h3>
                  <p className="text-2xl font-bold text-blue-600">{userProfile.mbti}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">관심사</h3>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.interests.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">목표</h3>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.goals.map((goal, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">완료한 검사</h3>
                  <div className="flex flex-wrap gap-1">
                    {userProfile.completedTests.map((test, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 필터 */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-indigo-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 필터</h3>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? '전체' : category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority} value={priority}>
                        {priority === 'all' ? '전체' : priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>

            {/* 추천 목록 */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                🎯 추천 결과 ({filteredRecommendations.length}개)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl">{rec.icon}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.priority === 'high' ? '높음' : rec.priority === 'medium' ? '보통' : '낮음'}
                        </span>
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {getTypeName(rec.type)}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{rec.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{rec.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>⏱️ {rec.estimatedTime}</span>
                      <span>📊 {rec.category}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">매칭도</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full"
                            style={{ width: `${rec.matchScore}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600">{rec.matchScore}%</span>
                      </div>
                      <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all duration-300">
                        시작하기
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 매칭 정확도 정보 */}
            <motion.div 
              className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 mt-8 border border-indigo-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">🎯 매칭 정확도</h3>
                <p className="text-gray-600 mb-4">
                  AI가 당신의 프로필과 관심사를 분석하여 최적의 추천을 제공합니다
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">95%</div>
                    <div className="text-sm text-gray-600">매칭 정확도</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}