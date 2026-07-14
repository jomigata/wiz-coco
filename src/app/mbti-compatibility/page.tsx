'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { MBTICompatibility } from '@/app/api/mbti-compatibility/route';

export default function MBTICompatibilityPage() {
  const { user, loading } = useFirebaseAuth();
  const [mbti1, setMbti1] = useState('');
  const [mbti2, setMbti2] = useState('');
  const [relationshipType, setRelationshipType] = useState<'romantic' | 'friendship' | 'work' | 'family' | 'general'>('general');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MBTICompatibility | null>(null);
  const [error, setError] = useState('');

  // MBTI 유형 목록
  const mbtiTypes = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  // 관계 유형 목록
  const relationshipTypes = [
    { value: 'general', label: '일반 관계', icon: '👥' },
    { value: 'romantic', label: '연인 관계', icon: '💕' },
    { value: 'friendship', label: '친구 관계', icon: '👫' },
    { value: 'work', label: '직장 관계', icon: '💼' },
    { value: 'family', label: '가족 관계', icon: '👨‍👩‍👧‍👦' }
  ];

  // 궁합 분석 실행
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mbti1 || !mbti2) {
      setError('두 MBTI 유형을 모두 선택해주세요.');
      return;
    }

    if (mbti1 === mbti2) {
      setError('서로 다른 MBTI 유형을 선택해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const response = await fetch('/api/mbti-compatibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId1: user?.uid,
          userId2: 'temp-user-2', // 실제로는 다른 사용자 ID
          mbti1,
          mbti2,
          relationshipType
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.data);
      } else {
        setError(result.error || '궁합 분석에 실패했습니다.');
      }
    } catch (err) {
      console.error('궁합 분석 오류:', err);
      setError('궁합 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-300 text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]"><div className="pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">MBTI 궁합 분석</h1>
            <p className="text-slate-600 text-lg">
              AI 기반 최신 MBTI 궁합 분석으로 관계를 더 깊이 이해해보세요
            </p>
          </div>

          {/* 분석 폼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-8 mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">궁합 분석하기</h2>
            
            <form onSubmit={handleAnalyze} className="space-y-6">
              {/* MBTI 유형 선택 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    첫 번째 MBTI 유형
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {mbtiTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMbti1(type)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          mbti1 === type
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    두 번째 MBTI 유형
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {mbtiTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMbti2(type)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          mbti2 === type
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 관계 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  관계 유형
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {relationshipTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setRelationshipType(type.value as any)}
                      className={`p-4 rounded-lg text-center transition-all ${
                        relationshipType === type.value
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* 분석 버튼 */}
              <div className="flex justify-center">
                <motion.button
                  type="submit"
                  disabled={isAnalyzing || !mbti1 || !mbti2}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isAnalyzing ? (
                    <div className="flex items-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                      분석 중...
                    </div>
                  ) : (
                    '궁합 분석하기'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* 분석 결과 */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* 궁합 점수 */}
              <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg p-8 text-center">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">궁합 점수</h3>
                <div className="text-6xl font-bold text-white mb-2">{analysis.compatibilityScore}</div>
                <div className="text-xl text-white/80">/ 100</div>
                <div className="mt-4">
                  <div className="w-full bg-white/20 rounded-full h-4">
                    <div 
                      className="bg-white rounded-full h-4 transition-all duration-1000"
                      style={{ width: `${analysis.compatibilityScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* 상세 분석 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 장점 */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-xl font-semibold text-emerald-400 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    장점
                  </h4>
                  <ul className="space-y-2">
                    {analysis.analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-emerald-400 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 도전과제 */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    도전과제
                  </h4>
                  <ul className="space-y-2">
                    {analysis.analysis.challenges.map((challenge, index) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 추천사항 */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  추천사항
                </h4>
                <ul className="space-y-2">
                  {analysis.analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-gray-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 소통 및 갈등 해결 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-xl font-semibold text-purple-400 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    소통 방법
                  </h4>
                  <p className="text-gray-300">{analysis.analysis.communication}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    갈등 해결
                  </h4>
                  <p className="text-gray-300">{analysis.analysis.conflictResolution}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
