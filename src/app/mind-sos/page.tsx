"use client";

import { useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function MindSOSPage() {
  const [stressLevel, setStressLevel] = useState(0);
  const [burnoutScore, setBurnoutScore] = useState(0);
  const [depressionScore, setDepressionScore] = useState(0);

  const handleStressCheck = () => {
    // 스트레스 진단 로직
    console.log('스트레스 진단 결과:', stressLevel);
  };

  const handleBurnoutCheck = () => {
    // 번아웃 진단 로직
    console.log('번아웃 진단 결과:', burnoutScore);
  };

  const handleDepressionCheck = () => {
    // 우울/불안 진단 로직
    console.log('우울/불안 진단 결과:', depressionScore);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="pt-16">
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            {/* 헤더 */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🚨 마음 SOS
              </h1>
              <p className="text-xl text-gray-600">
                지금 당장 도움이 필요한 마음 상태라면, 빠른 진단과 즉시 적용 가능한 솔루션을 제공합니다
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 긴급 마음 진단 */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-100">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    ⚡ 긴급 마음 진단
                  </h2>
                  <p className="text-gray-600">
                    빠른 진단으로 현재 상태를 파악하고 적절한 도움을 받을 수 있습니다
                  </p>
                </div>

                <div className="space-y-6">
                  {/* 스트레스 지수 체크 */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">🔥 스트레스 지수 체크</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        현재 스트레스 수준 (0-10)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={stressLevel}
                        onChange={(e) => setStressLevel(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>매우 낮음</span>
                        <span className="font-semibold text-lg text-orange-600">{stressLevel}</span>
                        <span>매우 높음</span>
                      </div>
                    </div>
                    <button
                      onClick={handleStressCheck}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                    >
                      스트레스 진단하기
                    </button>
                  </div>

                  {/* 번아웃 체크 */}
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">💥 번아웃 체크</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        번아웃 수준 (0-10)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={burnoutScore}
                        onChange={(e) => setBurnoutScore(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>정상</span>
                        <span className="font-semibold text-lg text-red-600">{burnoutScore}</span>
                        <span>심각</span>
                      </div>
                    </div>
                    <button
                      onClick={handleBurnoutCheck}
                      className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                    >
                      번아웃 진단하기
                    </button>
                  </div>

                  {/* 우울/불안 체크 */}
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">😰 우울/불안 체크</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        우울/불안 수준 (0-10)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={depressionScore}
                        onChange={(e) => setDepressionScore(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>정상</span>
                        <span className="font-semibold text-lg text-purple-600">{depressionScore}</span>
                        <span>심각</span>
                      </div>
                    </div>
                    <button
                      onClick={handleDepressionCheck}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105"
                    >
                      우울/불안 진단하기
                    </button>
                  </div>
                </div>
              </div>

              {/* 즉시 도움 및 응급 연락처 */}
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🆘 즉시 도움
                  </h2>
                  <p className="text-gray-600">
                    긴급한 상황에서는 전문가의 도움을 받으세요
                  </p>
                </div>

                <div className="space-y-6">
                  {/* 응급 연락처 */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">📞 응급 연락처</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-800">생명의전화</p>
                        <p className="text-blue-600">1588-9191</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-blue-200">
                        <p className="font-semibold text-blue-800">청소년전화</p>
                        <p className="text-blue-600">1388</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-200">
                        <p className="font-semibold text-red-800">긴급상황</p>
                        <p className="text-red-600">119</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-red-200">
                        <p className="font-semibold text-red-800">긴급상황</p>
                        <p className="text-red-600">119</p>
                      </div>
                    </div>
                  </div>

                  {/* 즉시 적용 가능한 방법들 */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">💡 즉시 적용 가능한 방법</h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>깊게 숨을 들이마시고 천천히 내쉬기 (4-7-8 호흡법)</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>현재 주변의 5가지를 보기, 4가지를 만지기, 3가지를 듣기</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>가벼운 스트레칭이나 산책하기</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>신뢰할 수 있는 사람과 대화하기</span>
                      </li>
                    </ul>
                  </div>

                  {/* 전문가 상담 예약 */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">👨‍⚕️ 전문가 상담 예약</h3>
                    <p className="text-gray-600 mb-4">
                      지속적인 도움이 필요하다면 전문 상담사와의 상담을 예약하세요
                    </p>
                    <Link
                      href="/counseling"
                      className="inline-block w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold text-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
                    >
                      상담 예약하기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}