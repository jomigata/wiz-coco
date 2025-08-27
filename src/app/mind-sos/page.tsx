"use client";

import { useState } from 'react';
import Link from 'next/link';

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
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  🧠 지금 내 스트레스 지수는?
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">스트레스 수준</span>
                    <span className="text-sm font-medium text-red-600">{stressLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(Number(e.target.value))}
                    className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>낮음</span>
                    <span>높음</span>
                  </div>
                </div>
                <button
                  onClick={handleStressCheck}
                  className="mt-3 w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  스트레스 진단하기
                </button>
              </div>

              {/* 번아웃 체크 */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  🚦 혹시 나도 번아웃?
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">번아웃 위험도</span>
                    <span className="text-sm font-medium text-orange-600">{burnoutScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={burnoutScore}
                    onChange={(e) => setBurnoutScore(Number(e.target.value))}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>안전</span>
                    <span>위험</span>
                  </div>
                </div>
                <button
                  onClick={handleBurnoutCheck}
                  className="mt-3 w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  번아웃 진단하기
                </button>
              </div>

              {/* 우울/불안 체크 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  💙 우울/불안 자가 체크
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">심리 상태</span>
                    <span className="text-sm font-medium text-blue-600">{depressionScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={depressionScore}
                    onChange={(e) => setDepressionScore(Number(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>양호</span>
                    <span>주의</span>
                  </div>
                </div>
                <button
                  onClick={handleDepressionCheck}
                  className="mt-3 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  우울/불안 진단하기
                </button>
              </div>
            </div>
          </div>

          {/* 1분 솔루션 (AI) */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ⚡ 1분 솔루션 (AI)
              </h2>
              <p className="text-gray-600">
                AI가 제안하는 즉시 적용 가능한 마음 관리 솔루션입니다
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  😤 화가 날 때 3단계 호흡법
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  분노를 조절하고 마음을 진정시키는 효과적인 호흡법
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>1단계: 4초 동안 코로 깊게 들이마시기</p>
                  <p>2단계: 4초 동안 숨을 참기</p>
                  <p>3단계: 6초 동안 입으로 천천히 내쉬기</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  😴 무기력할 때 빠른 에너지 충전법
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  에너지를 빠르게 회복시키는 간단한 방법들
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• 10분간 가벼운 스트레칭</p>
                  <p>• 차가운 물로 얼굴 씻기</p>
                  <p>• 5분간 깊은 호흡하기</p>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  🎤 발표 전 긴장 완화 팁
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  발표나 면접 전 긴장을 줄이는 실용적인 팁
                </p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• 10-10-10 호흡법 (10초 들이마시기-10초 참기-10초 내쉬기)</p>
                  <p>• 긍정적인 자기 암시</p>
                  <p>• 가벼운 워밍업 동작</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 긴급 연락처 */}
        <div className="mt-12 text-center">
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              🆘 긴급 상황 시 연락처
            </h3>
            <p className="text-red-700 mb-4">
              심각한 위기 상황이라면 즉시 전문가의 도움을 받으세요
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800">자살예방상담전화</p>
                <p className="text-red-600">1393</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800">정신건강상담전화</p>
                <p className="text-red-600">1577-0199</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800">긴급상황</p>
                <p className="text-red-600">119</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
