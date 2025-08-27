"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function AIMindScanPage() {
  const [diaryText, setDiaryText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleDiaryAnalysis = async () => {
    if (!diaryText.trim()) return;
    
    setIsAnalyzing(true);
    // AI 분석 시뮬레이션 (실제로는 AI API 호출)
    setTimeout(() => {
      setAnalysisResult('AI가 분석한 결과: 긍정적인 감정이 70%, 스트레스 지수는 중간 수준입니다. 수면의 질을 개선하면 더 나은 마음 상태를 유지할 수 있을 것 같습니다.');
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 AI 마음 스캔
          </h1>
          <p className="text-xl text-gray-600">
            최신 AI 기술로 당신의 마음을 깊이 있게 분석하고 잠재력을 발견해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 통합 심리 분석 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🔬 통합 심리 분석
              </h2>
              <p className="text-gray-600">
                AI가 다양한 데이터를 종합하여 당신의 마음 상태를 정확하게 진단합니다
              </p>
            </div>

            <div className="space-y-6">
              {/* 3분 완성 AI 종합 마음 진단 */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  ⚡ 3분 완성! AI 종합 마음 진단
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  간단한 질문에 답하면 AI가 당신의 마음 상태를 종합적으로 분석합니다
                </p>
                <Link
                  href="/ai-mind-scan/comprehensive-diagnosis"
                  className="block w-full bg-indigo-500 text-white py-3 px-4 rounded-lg hover:bg-indigo-600 transition-colors text-center"
                >
                  종합 진단 시작하기
                </Link>
              </div>

              {/* 텍스트로 보는 내 무의식 */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📝 텍스트로 보는 내 무의식 (일기 분석)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  일기나 메모를 입력하면 AI가 숨겨진 감정과 패턴을 분석합니다
                </p>
                <textarea
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  placeholder="오늘 하루를 기록해보세요... (최소 50자)"
                  className="w-full p-3 border border-purple-200 rounded-lg resize-none h-24 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  minLength={50}
                />
                <button
                  onClick={handleDiaryAnalysis}
                  disabled={!diaryText.trim() || isAnalyzing}
                  className={`mt-3 w-full py-2 px-4 rounded-lg transition-colors ${
                    !diaryText.trim() || isAnalyzing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {isAnalyzing ? '분석 중...' : 'AI 분석 시작'}
                </button>
                {analysisResult && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{analysisResult}</p>
                  </div>
                )}
              </div>

              {/* 음성 감정 분석 */}
              <div className="p-4 bg-gradient-to-r from-pink-50 to-red-50 rounded-xl border border-pink-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  🎤 말로 하는 마음 분석 (음성 감정 분석)
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  음성으로 말하면 AI가 감정 상태와 스트레스 수준을 분석합니다
                </p>
                <button className="w-full bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors">
                  🎙️ 음성 녹음 시작
                </button>
              </div>
            </div>
          </div>

          {/* 잠재력 리포트 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                💎 잠재력 리포트
              </h2>
              <p className="text-gray-600">
                AI가 발견한 당신만의 숨겨진 강점과 가능성을 확인해보세요
              </p>
            </div>

            <div className="space-y-4">
              <Link
                href="/ai-mind-scan/personality-strengths"
                className="block p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">AI가 찾아주는 내 성격 강점</h3>
                    <p className="text-sm text-gray-600 mt-1">MBTI, 성격 유형을 기반으로 한 강점 분석</p>
                  </div>
                  <span className="text-green-500">→</span>
                </div>
              </Link>

              <Link
                href="/ai-mind-scan/career-aptitude"
                className="block p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">숨겨진 직업 적성 예측</h3>
                    <p className="text-sm text-gray-600 mt-1">성격과 흥미를 바탕으로 한 직업 적성 분석</p>
                  </div>
                  <span className="text-blue-500">→</span>
                </div>
              </Link>

              <Link
                href="/ai-mind-scan/relationship-patterns"
                className="block p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">나의 관계 패턴 분석</h3>
                    <p className="text-sm text-gray-600 mt-1">인간관계에서 나타나는 패턴과 개선점 분석</p>
                  </div>
                  <span className="text-purple-500">→</span>
                </div>
              </Link>

              <Link
                href="/ai-mind-scan/emotional-intelligence"
                className="block p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:border-yellow-300 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">감정지능(EQ) 분석 리포트</h3>
                    <p className="text-sm text-gray-600 mt-1">자기인식, 자기관리, 사회적 기술 분석</p>
                  </div>
                  <span className="text-yellow-500">→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* AI 분석 특징 */}
        <div className="mt-12 text-center">
          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              🚀 AI 분석의 특징
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div className="bg-white p-3 rounded-lg border border-indigo-200">
                <p className="font-semibold text-indigo-800">정확성</p>
                <p className="text-indigo-600">95% 이상의 정확도로 감정 상태 분석</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-200">
                <p className="font-semibold text-indigo-800">빠른 속도</p>
                <p className="text-indigo-600">3분 내에 종합적인 분석 결과 제공</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-indigo-200">
                <p className="font-semibold text-indigo-800">개인화</p>
                <p className="text-indigo-600">개인별 맞춤형 솔루션 제안</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
