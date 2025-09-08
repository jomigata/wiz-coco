"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function PeriodicTestsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  const testTypes = {
    monthly: [
      {
        name: '월간 스트레스 지수',
        description: '한 달간의 스트레스 변화 추이 분석',
        icon: '📊',
        href: '/ai-mind-assistant/monthly-stress-test',
        color: 'from-blue-500 to-blue-600'
      },
      {
        name: '월간 감정 상태 점검',
        description: '월별 감정 변화 및 패턴 분석',
        icon: '😊',
        href: '/ai-mind-assistant/monthly-emotion-test',
        color: 'from-green-500 to-green-600'
      },
      {
        name: '월간 수면 품질 체크',
        description: '한 달간의 수면 패턴 및 품질 평가',
        icon: '😴',
        href: '/ai-mind-assistant/monthly-sleep-test',
        color: 'from-purple-500 to-purple-600'
      }
    ],
    quarterly: [
      {
        name: '분기별 종합 심리 검진',
        description: '3개월간의 종합적인 심리 상태 평가',
        icon: '🧠',
        href: '/ai-mind-assistant/quarterly-psych-test',
        color: 'from-red-500 to-red-600'
      },
      {
        name: '분기별 자존감 변화',
        description: '3개월간의 자존감 변화 추이 분석',
        icon: '💪',
        href: '/ai-mind-assistant/quarterly-self-esteem-test',
        color: 'from-yellow-500 to-yellow-600'
      },
      {
        name: '분기별 번아웃 위험도',
        description: '3개월간의 번아웃 위험도 변화 체크',
        icon: '🔥',
        href: '/ai-mind-assistant/quarterly-burnout-test',
        color: 'from-orange-500 to-orange-600'
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      <Navigation />
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-4xl font-bold mb-4">월별검사 및 분기별 검사</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            정기적인 심리 상태 점검으로 건강한 마음 관리
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* 기간 선택 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">검사 기간 선택</h2>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                selectedPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              📅 월간 검사
            </button>
            <button
              onClick={() => setSelectedPeriod('quarterly')}
              className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                selectedPeriod === 'quarterly'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              📊 분기별 검사
            </button>
          </div>
        </div>

        {/* 검사 유형 설명 */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {selectedPeriod === 'monthly' ? '월간 검사' : '분기별 검사'}란?
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {selectedPeriod === 'monthly' 
                ? '매월 정기적으로 진행하는 심리 상태 점검으로, 지속적인 마음 건강 모니터링을 통해 변화 패턴을 파악하고 조기 개입이 필요한 부분을 식별합니다.'
                : '3개월마다 진행하는 종합적인 심리 검진으로, 장기적인 변화 추이를 분석하고 심층적인 마음 건강 상태를 평가합니다.'
              }
            </p>
          </div>
        </div>

        {/* 검사 항목들 */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {selectedPeriod === 'monthly' ? '월간' : '분기별'} 검사 항목
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testTypes[selectedPeriod as keyof typeof testTypes].map((test) => (
              <Link
                key={test.name}
                href={test.href}
                className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 hover:border-blue-200"
              >
                <div className={`text-4xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {test.icon}
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                  {test.name}
                </h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {test.description}
                </p>
                <div className="mt-4 flex items-center text-blue-500 group-hover:text-blue-600 transition-colors duration-300">
                  <span className="text-sm font-medium">검사 시작하기</span>
                  <svg 
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 검사 일정 안내 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📅 검사 일정 안내</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-blue-600 mb-3">월간 검사</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 매월 1일 ~ 7일 사이 진행</li>
                <li>• 소요 시간: 약 10-15분</li>
                <li>• 결과 확인: 즉시</li>
                <li>• 추천 대상: 모든 사용자</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h4 className="font-bold text-purple-600 mb-3">분기별 검사</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 3, 6, 9, 12월 진행</li>
                <li>• 소요 시간: 약 20-30분</li>
                <li>• 결과 확인: 24시간 내</li>
                <li>• 추천 대상: 월간 검사 3회 이상 완료자</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 뒤로가기 버튼 */}
        <div className="text-center mt-12">
          <Link
            href="/ai-mind-assistant"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            AI 마음 비서로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
