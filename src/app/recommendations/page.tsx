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
      description: 'INTJ 성격 유형에 적합한 심화 성격 검사',
      reason: 'MBTI와 보완적인 관점에서 성격을 분석할 수 있습니다.',
      priority: 'high',
      estimatedTime: '45분',
      category: 'personality',
      tags: ['성격분석', '심화검사', 'INTJ추천']
    },
    {
      id: 2,
      type: 'counseling',
      title: '대인관계 개선 상담',
      description: 'INTJ 성격 유형의 대인관계 패턴 분석 및 개선',
      reason: '설정된 목표와 일치하며, 전문가의 개별 지도를 받을 수 있습니다.',
      priority: 'high',
      estimatedTime: '60분',
      category: 'relationship',
      tags: ['대인관계', '1:1상담', '목표달성']
    },
    {
      id: 3,
      type: 'learning',
      title: '스트레스 관리 고급 과정',
      description: '직장인을 위한 실전 스트레스 관리 기법',
      reason: '이전 상담 경험을 바탕으로 한 심화 학습이 가능합니다.',
      priority: 'medium',
      estimatedTime: '90분',
      category: 'stress',
      tags: ['스트레스관리', '실전기법', '심화과정']
    },
    {
      id: 4,
      type: 'test',
      title: '직업 적성 검사',
      description: 'INTJ 성격 유형에 최적화된 직업 적성 분석',
      reason: '성격 유형과 관심사를 종합하여 진로를 탐색할 수 있습니다.',
      priority: 'medium',
      estimatedTime: '30분',
      category: 'career',
      tags: ['진로탐색', '직업적성', 'INTJ특화']
    },
    {
      id: 5,
      type: 'learning',
      title: '명상과 마음챙김 기초',
      description: '과학적으로 검증된 명상 기법 학습',
      reason: '스트레스 관리와 자기 이해에 도움이 되는 보완적 활동입니다.',
      priority: 'low',
      estimatedTime: '60분',
      category: 'mindfulness',
      tags: ['명상', '마음챙김', '기초과정']
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  const categories = [
    { id: 'all', name: '전체', icon: '🎯' },
    { id: 'personality', name: '성격분석', icon: '🧠' },
    { id: 'relationship', name: '대인관계', icon: '🤝' },
    { id: 'stress', name: '스트레스', icon: '😌' },
    { id: 'career', name: '진로', icon: '💼' },
    { id: 'mindfulness', name: '마음챙김', icon: '🧘‍♀️' }
  ];

  const priorities = [
    { id: 'all', name: '전체', color: 'gray' },
    { id: 'high', name: '높음', color: 'red' },
    { id: 'medium', name: '보통', color: 'yellow' },
    { id: 'low', name: '낮음', color: 'green' }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            💡 맞춤형 추천
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            당신의 성격 유형, 관심사, 목표를 분석하여 최적화된 심리케어 서비스를 추천해드립니다.
            개인화된 경험으로 더 효과적인 성장을 도와드립니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 사용자 프로필 */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                👤 내 프로필
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">MBTI 유형</label>
                  <div className="text-lg font-bold text-blue-600">{userProfile.mbti}</div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">관심 분야</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userProfile.interests.map((interest, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">목표</label>
                  <div className="space-y-1 mt-1">
                    {userProfile.goals.map((goal, index) => (
                      <div key={index} className="text-sm text-gray-700">• {goal}</div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">완료한 검사</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userProfile.completedTests.map((test, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {test}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 추천 알고리즘 설명 */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">🤖 추천 알고리즘</h3>
              <div className="text-sm space-y-2">
                <div>• MBTI 성격 유형 분석</div>
                <div>• 관심사 및 목표 매칭</div>
                <div>• 이전 활동 패턴 분석</div>
                <div>• 전문가 의견 반영</div>
              </div>
            </div>
          </motion.div>

          {/* 추천 목록 */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* 필터 */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">우선순위</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.id} value={priority.id}>
                        {priority.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 추천 목록 */}
            <div className="space-y-4">
              {filteredRecommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  className="bg-white rounded-xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getTypeIcon(recommendation.type)}</span>
                          <span className="text-sm text-gray-500">{getTypeName(recommendation.type)}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
                          recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {recommendation.priority === 'high' ? '높음' :
                           recommendation.priority === 'medium' ? '보통' : '낮음'} 우선순위
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {recommendation.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-3">
                        {recommendation.description}
                      </p>
                      
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <div className="text-sm font-medium text-blue-900 mb-1">
                          💡 추천 이유
                        </div>
                        <div className="text-sm text-blue-700">
                          {recommendation.reason}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>⏱️ {recommendation.estimatedTime}</span>
                        <span>📊 {recommendation.category}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {recommendation.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col gap-2">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        시작하기
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        자세히 보기
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        나중에
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 추천 통계 */}
            <motion.div 
              className="mt-8 bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📊 추천 통계
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {recommendations.length}
                  </div>
                  <div className="text-sm text-gray-600">총 추천</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {recommendations.filter(r => r.priority === 'high').length}
                  </div>
                  <div className="text-sm text-gray-600">높은 우선순위</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {new Set(recommendations.map(r => r.category)).size}
                  </div>
                  <div className="text-sm text-gray-600">카테고리</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    95%
                  </div>
                  <div className="text-sm text-gray-600">매칭 정확도</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 