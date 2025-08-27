"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function MindCheckupPage() {
  const [dailyMood, setDailyMood] = useState(3);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [energyLevel, setEnergyLevel] = useState(3);

  const handleDailyCheckin = () => {
    // 데일리 체크인 데이터 저장 로직
    console.log('데일리 체크인 저장:', { dailyMood, sleepQuality, energyLevel });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔍 마음 체크업 (In-body)
          </h1>
          <p className="text-xl text-gray-600">
            나의 마음 상태를 정기적으로 체크하고 건강한 마음을 유지해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 데일리 체크인 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📅 데일리 체크인
              </h2>
              <p className="text-gray-600">
                매일의 마음 상태를 기록하고 변화를 추적해보세요
              </p>
            </div>

            <div className="space-y-6">
              {/* 오늘의 마음 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  오늘의 마음 상태 (5점 척도)
                </label>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">매우 나쁨</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setDailyMood(score)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          dailyMood === score
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">매우 좋음</span>
                </div>
              </div>

              {/* 수면의 질 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  수면의 질
                </label>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">매우 나쁨</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setSleepQuality(score)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          sleepQuality === score
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-300'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">매우 좋음</span>
                </div>
              </div>

              {/* 에너지 레벨 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  에너지 레벨
                </label>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">매우 낮음</span>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => setEnergyLevel(score)}
                        className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                          energyLevel === score
                            ? 'bg-yellow-500 border-yellow-500 text-white'
                            : 'border-gray-300 hover:border-yellow-300'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">매우 높음</span>
                </div>
              </div>

              <button
                onClick={handleDailyCheckin}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
              >
                오늘의 체크인 저장하기
              </button>
            </div>
          </div>

          {/* 정기 마음 검진 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🏥 정기 마음 검진
              </h2>
              <p className="text-gray-600">
                체계적인 마음 건강 검진으로 예방과 조기 발견을 도와드립니다
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/mind-checkup/monthly-stress"
                className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">월간 스트레스 종합 검사</h3>
                    <p className="text-sm text-gray-600 mt-1">한 달간의 스트레스 수준을 종합적으로 진단</p>
                  </div>
                  <span className="text-purple-500">→</span>
                </div>
              </Link>

              <Link
                href="/mind-checkup/quarterly-relationship"
                className="block p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">분기별 관계 만족도 검사</h3>
                    <p className="text-sm text-gray-600 mt-1">인간관계와 소통 패턴을 분석</p>
                  </div>
                  <span className="text-blue-500">→</span>
                </div>
              </Link>

              <Link
                href="/mind-checkup/annual-comprehensive"
                className="block p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">연간 종합 마음 건강검진</h3>
                    <p className="text-sm text-gray-600 mt-1">전체적인 마음 건강 상태를 종합 진단</p>
                  </div>
                  <span className="text-green-500">→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 체크업의 중요성
            </h3>
            <p className="text-blue-700">
              정기적인 마음 체크업은 스트레스 조기 발견과 예방에 도움이 됩니다. 
              전문가와의 상담이 필요하다면 언제든 연락해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
