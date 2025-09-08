'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

export default function ProgressPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const progressData = {
    overall: {
      current: 75,
      previous: 60,
      trend: 'up'
    },
    categories: [
      {
        name: '자기 이해',
        current: 85,
        previous: 70,
        trend: 'up',
        icon: '🧠',
        color: 'blue'
      },
      {
        name: '스트레스 관리',
        current: 65,
        previous: 50,
        trend: 'up',
        icon: '😌',
        color: 'green'
      },
      {
        name: '대인관계',
        current: 55,
        previous: 60,
        trend: 'down',
        icon: '🤝',
        color: 'purple'
      },
      {
        name: '학습 성장',
        current: 80,
        previous: 75,
        trend: 'up',
        icon: '📚',
        color: 'orange'
      }
    ],
    activities: [
      {
        id: 1,
        name: 'MBTI 검사',
        type: 'test',
        date: '2024-01-15',
        score: 85,
        category: '자기 이해',
        status: 'completed'
      },
      {
        id: 2,
        name: '스트레스 관리 강의',
        type: 'learning',
        date: '2024-01-20',
        score: 90,
        category: '스트레스 관리',
        status: 'completed'
      },
      {
        id: 3,
        name: '대인관계 상담',
        type: 'counseling',
        date: '2024-01-25',
        score: 70,
        category: '대인관계',
        status: 'in-progress'
      },
      {
        id: 4,
        name: '명상 연습',
        type: 'practice',
        date: '2024-01-30',
        score: 75,
        category: '스트레스 관리',
        status: 'completed'
      }
    ],
    goals: [
      {
        id: 1,
        title: '자기 이해 향상',
        target: 90,
        current: 85,
        deadline: '2024-12-31',
        status: 'on-track'
      },
      {
        id: 2,
        title: '스트레스 관리 능력 향상',
        target: 80,
        current: 65,
        deadline: '2024-11-30',
        status: 'needs-attention'
      },
      {
        id: 3,
        title: '대인관계 개선',
        target: 75,
        current: 55,
        deadline: '2025-02-28',
        status: 'at-risk'
      }
    ]
  };

  const periods = [
    { id: 'week', name: '이번 주' },
    { id: 'month', name: '이번 달' },
    { id: 'quarter', name: '이번 분기' },
    { id: 'year', name: '올해' }
  ];

  const categories = [
    { id: 'all', name: '전체', icon: '📊' },
    { id: 'self-understanding', name: '자기 이해', icon: '🧠' },
    { id: 'stress-management', name: '스트레스 관리', icon: '😌' },
    { id: 'relationships', name: '대인관계', icon: '🤝' },
    { id: 'learning', name: '학습 성장', icon: '📚' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'green';
      case 'needs-attention': return 'yellow';
      case 'at-risk': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-track': return '정상 진행';
      case 'needs-attention': return '관심 필요';
      case 'at-risk': return '위험';
      default: return '알 수 없음';
    }
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗️' : '↘️';
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* 헤더 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📊 진행 상황
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            개인적인 성장과 발전을 체계적으로 추적하고 관리하세요.
            정기적인 점검을 통해 목표 달성을 위한 동기부여를 받을 수 있습니다.
          </p>
        </motion.div>

        {/* 기간 및 카테고리 필터 */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
              <div className="flex gap-2">
                {periods.map(period => (
                  <button
                    key={period.id}
                    onClick={() => setSelectedPeriod(period.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.name}
                  </button>
                ))}
              </div>
            </div>
            
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
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 전체 진행률 */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📈 전체 진행률
              </h2>
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-3xl font-bold text-blue-600">
                    {progressData.overall.current}%
                  </div>
                  <div className="text-sm text-gray-600">현재 진행률</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getTrendColor(progressData.overall.trend)}`}>
                    {getTrendIcon(progressData.overall.trend)} {progressData.overall.current - progressData.overall.previous}%
                  </div>
                  <div className="text-sm text-gray-600">이전 대비</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${progressData.overall.current}%` }}
                ></div>
              </div>
            </div>

            {/* 카테고리별 진행률 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {progressData.categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  className="bg-white rounded-xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl bg-${category.color}-100`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{category.name}</h3>
                        <div className={`text-sm font-medium ${getTrendColor(category.trend)}`}>
                          {getTrendIcon(category.trend)} {category.current - category.previous}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{category.current}%</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`bg-${category.color}-500 h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${category.current}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 최근 활동 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                📝 최근 활동
              </h2>
              
              <div className="space-y-4">
                {progressData.activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {activity.type === 'test' ? '🧠' : 
                         activity.type === 'learning' ? '📚' :
                         activity.type === 'counseling' ? '💬' : '🎯'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{activity.name}</div>
                        <div className="text-sm text-gray-600">{activity.category} • {activity.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{activity.score}점</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {activity.status === 'completed' ? '완료' : '진행 중'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 사이드바 */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* 목표 진행률 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🎯 목표 진행률
              </h3>
              
              <div className="space-y-4">
                {progressData.goals.map((goal, index) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{goal.title}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        goal.status === 'on-track' ? 'bg-green-100 text-green-800' :
                        goal.status === 'needs-attention' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getStatusText(goal.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{goal.current}% / {goal.target}%</span>
                      <span>기한: {goal.deadline}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          goal.status === 'on-track' ? 'bg-green-500' :
                          goal.status === 'needs-attention' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${(goal.current / goal.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 성취 배지 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                🏆 성취 배지
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl mb-2">🥇</div>
                  <div className="text-sm font-medium text-gray-900">첫 검사 완료</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="text-sm font-medium text-gray-900">학습 열정가</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">💪</div>
                  <div className="text-sm font-medium text-gray-900">꾸준함의 달인</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm font-medium text-gray-900">목표 달성자</div>
                </div>
              </div>
            </div>

            {/* 다음 단계 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-3">
                🚀 다음 단계
              </h3>
              <div className="space-y-2 text-sm">
                <div>• 에니어그램 검사 진행</div>
                <div>• 스트레스 관리 심화 과정</div>
                <div>• 대인관계 개선 상담 예약</div>
                <div>• 일일 성찰 일기 작성</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 월간 트렌드 */}
        <motion.div 
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📈 월간 트렌드
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">12월</div>
              <div className="text-3xl font-bold text-gray-900">60%</div>
              <div className="text-sm text-gray-600">시작점</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">1월</div>
              <div className="text-3xl font-bold text-gray-900">75%</div>
              <div className="text-sm text-green-600">+15%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">2월</div>
              <div className="text-3xl font-bold text-gray-900">예상</div>
              <div className="text-sm text-gray-600">목표: 85%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">3월</div>
              <div className="text-3xl font-bold text-gray-900">목표</div>
              <div className="text-sm text-gray-600">목표: 90%</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 