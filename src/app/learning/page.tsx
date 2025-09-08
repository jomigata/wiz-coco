'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

export default function LearningPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: '전체', icon: '📚' },
    { id: 'mbti', name: 'MBTI', icon: '🧠' },
    { id: 'psychology', name: '심리학', icon: '💭' },
    { id: 'counseling', name: '상담', icon: '💬' },
    { id: 'self-help', name: '자기계발', icon: '🌟' }
  ];

  const learningMaterials = [
    {
      id: 1,
      title: 'MBTI 성격 유형 완전 가이드',
      description: '16가지 성격 유형의 특징과 이해 방법',
      category: 'mbti',
      level: '초급',
      duration: '30분',
      image: '/images/mbti-guide.jpg',
      tags: ['MBTI', '성격유형', '초급']
    },
    {
      id: 2,
      title: '심리학 기초 개념',
      description: '심리학의 기본 개념과 이론들',
      category: 'psychology',
      level: '초급',
      duration: '45분',
      image: '/images/psychology-basics.jpg',
      tags: ['심리학', '기초', '이론']
    },
    {
      id: 3,
      title: '효과적인 상담 기법',
      description: '상담사가 알아야 할 기본 상담 기법',
      category: 'counseling',
      level: '중급',
      duration: '60분',
      image: '/images/counseling-techniques.jpg',
      tags: ['상담', '기법', '중급']
    },
    {
      id: 4,
      title: '자기 이해와 성장',
      description: '자신을 이해하고 성장하는 방법',
      category: 'self-help',
      level: '초급',
      duration: '40분',
      image: '/images/self-growth.jpg',
      tags: ['자기계발', '성장', '초급']
    },
    {
      id: 5,
      title: 'MBTI 심화 분석',
      description: 'MBTI의 깊이 있는 분석과 활용',
      category: 'mbti',
      level: '고급',
      duration: '90분',
      image: '/images/mbti-advanced.jpg',
      tags: ['MBTI', '심화', '고급']
    },
    {
      id: 6,
      title: '인지 행동 치료 기법',
      description: 'CBT 기법의 이해와 적용',
      category: 'psychology',
      level: '중급',
      duration: '75분',
      image: '/images/cbt-techniques.jpg',
      tags: ['CBT', '치료', '중급']
    }
  ];

  const filteredMaterials = selectedCategory === 'all' 
    ? learningMaterials 
    : learningMaterials.filter(material => material.category === selectedCategory);

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
            📚 학습 자료
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            심리학과 상담에 관한 다양한 학습 자료를 통해 지식을 쌓고 성장하세요.
            전문가들이 엄선한 고품질 콘텐츠로 여러분의 심리적 성장을 돕습니다.
          </p>
        </motion.div>

        {/* 카테고리 필터 */}
        <motion.div 
          className="flex flex-wrap justify-center gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </motion.div>

        {/* 학습 자료 그리드 */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filteredMaterials.map((material, index) => (
            <motion.div
              key={material.id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              whileHover={{ y: -5 }}
            >
              {/* 이미지 플레이스홀더 */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-6xl text-white opacity-80">
                  {material.category === 'mbti' ? '🧠' : 
                   material.category === 'psychology' ? '💭' :
                   material.category === 'counseling' ? '💬' : '🌟'}
                </span>
              </div>

              {/* 콘텐츠 */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    material.level === '초급' ? 'bg-green-100 text-green-800' :
                    material.level === '중급' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {material.level}
                  </span>
                  <span className="text-sm text-gray-500">
                    ⏱️ {material.duration}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {material.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {material.description}
                </p>

                {/* 태그 */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {material.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 버튼 */}
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300">
                  학습 시작하기
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 학습 진행률 섹션 */}
        <motion.div 
          className="mt-16 bg-white rounded-xl shadow-lg p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 나의 학습 진행률
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">3</div>
              <div className="text-gray-600">완료한 강의</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">2</div>
              <div className="text-gray-600">진행 중인 강의</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">75%</div>
              <div className="text-gray-600">전체 진행률</div>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>전체 진행률</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </motion.div>

        {/* 추천 학습 경로 */}
        <motion.div 
          className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-4">
            🎯 추천 학습 경로
          </h2>
          <p className="text-blue-100 mb-6">
            당신의 현재 수준과 관심사에 맞는 맞춤형 학습 경로를 추천해드립니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-bold mb-2">초급자 경로</h3>
              <p className="text-sm text-blue-100">
                심리학 기초 → MBTI 기초 → 자기 이해와 성장
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h3 className="font-bold mb-2">중급자 경로</h3>
              <p className="text-sm text-blue-100">
                효과적인 상담 기법 → 인지 행동 치료 → MBTI 심화
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 