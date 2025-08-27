"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function SolutionNotePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 가상의 진단 결과 데이터
  const diagnosisResults = [
    {
      id: 1,
      type: '스트레스 진단',
      date: '2025-08-27',
      score: '7/10',
      status: '주의',
      color: 'orange'
    },
    {
      id: 2,
      type: 'MBTI 성격 유형',
      date: '2025-08-25',
      score: 'ENFP',
      status: '완료',
      color: 'green'
    },
    {
      id: 3,
      type: '우울/불안 체크',
      date: '2025-08-20',
      score: '3/10',
      status: '양호',
      color: 'blue'
    }
  ];

  // 가상의 AI 솔루션 데이터
  const aiSolutions = [
    {
      id: 1,
      type: '스트레스 관리',
      date: '2025-08-27',
      solution: '깊은 호흡법과 명상 연습을 권장합니다',
      effectiveness: '높음'
    },
    {
      id: 2,
      type: '수면 개선',
      date: '2025-08-25',
      solution: '취침 전 디지털 기기 사용을 줄이고 규칙적인 수면 패턴을 만드세요',
      effectiveness: '중간'
    }
  ];

  // 가상의 전문가 코멘트 데이터
  const expertComments = [
    {
      id: 1,
      expert: '김상담 전문가',
      date: '2025-08-26',
      comment: '스트레스 관리에 있어 규칙적인 운동이 도움이 될 것 같습니다. 주 3회 30분 이상의 유산소 운동을 권장합니다.',
      category: '스트레스 관리'
    },
    {
      id: 2,
      expert: '이심리 전문가',
      date: '2025-08-24',
      comment: 'ENFP 성격 유형의 강점을 잘 활용하고 계시네요. 창의성과 공감 능력을 더욱 발전시킬 수 있는 활동을 찾아보세요.',
      category: '성격 개발'
    }
  ];

  const getStatusColor = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📝 나의 솔루션 노트
          </h1>
          <p className="text-xl text-gray-600">
            진단 결과와 AI 솔루션, 전문가 조언을 체계적으로 관리하고 실천해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 진단 및 처방 기록 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-emerald-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📊 진단 및 처방 기록
              </h2>
              <p className="text-gray-600">
                지금까지 받은 진단 결과와 처방을 한눈에 확인할 수 있습니다
              </p>
            </div>

            <div className="space-y-6">
              {/* 유형별 진단 결과 */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  🔍 유형별 진단 결과
                </h3>
                <div className="space-y-3">
                  {diagnosisResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-200">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{result.type}</p>
                        <p className="text-sm text-gray-500">{result.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{result.score}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusColor(result.color)}`}>
                          {result.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/solution-note/diagnosis-history"
                  className="block mt-4 text-center text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  전체 진단 기록 보기 →
                </Link>
              </div>

              {/* AI 솔루션 처방 기록 */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  🤖 AI 솔루션 처방 기록
                </h3>
                <div className="space-y-3">
                  {aiSolutions.map((solution) => (
                    <div key={solution.id} className="p-3 bg-white rounded-lg border border-teal-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{solution.type}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          solution.effectiveness === '높음' ? 'bg-green-100 text-green-800' :
                          solution.effectiveness === '중간' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          효과: {solution.effectiveness}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{solution.solution}</p>
                      <p className="text-xs text-gray-500">{solution.date}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/solution-note/ai-solutions"
                  className="block mt-4 text-center text-teal-600 hover:text-teal-700 font-medium"
                >
                  전체 AI 솔루션 보기 →
                </Link>
              </div>

              {/* 전문가 코멘트 모아보기 */}
              <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  👨‍⚕️ 전문가 코멘트 모아보기
                </h3>
                <div className="space-y-3">
                  {expertComments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-white rounded-lg border border-cyan-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{comment.expert}</span>
                        <span className="text-xs text-gray-500">{comment.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{comment.comment}</p>
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {comment.category}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/solution-note/expert-comments"
                  className="block mt-4 text-center text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  전체 전문가 코멘트 보기 →
                </Link>
              </div>
            </div>
          </div>

          {/* 실천 챌린지 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-teal-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                🎯 실천 챌린지
              </h2>
              <p className="text-gray-600">
                작은 실천부터 시작하여 마음 건강을 향상시켜보세요
              </p>
            </div>

            <div className="space-y-6">
              {/* 오늘의 칭찬 30일 챌린지 */}
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    🌟 '오늘의 칭찬' 30일 챌린지
                  </h3>
                  <p className="text-gray-600 mb-4">
                    매일 자신을 칭찬하며 자존감을 높이는 챌린지입니다
                  </p>
                  <div className="flex justify-center items-center space-x-2 mb-4">
                    <span className="text-2xl font-bold text-yellow-600">15</span>
                    <span className="text-gray-500">/ 30일</span>
                  </div>
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">오늘의 칭찬:</p>
                  <textarea
                    placeholder="오늘 자신을 칭찬해보세요..."
                    className="w-full p-3 border border-yellow-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
                    칭찬 기록하기
                  </button>
                </div>
              </div>

              {/* 감사일기 100일 챌린지 */}
              <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    🙏 '감사일기' 100일 챌린지
                  </h3>
                  <p className="text-gray-600 mb-4">
                    매일 감사한 일을 기록하며 긍정적인 마음을 기르는 챌린지입니다
                  </p>
                  <div className="flex justify-center items-center space-x-2 mb-4">
                    <span className="text-2xl font-bold text-green-600">42</span>
                    <span className="text-gray-500">/ 100일</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">오늘 감사한 일:</p>
                  <textarea
                    placeholder="오늘 감사했던 일을 기록해보세요..."
                    className="w-full p-3 border border-green-300 rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                    감사 기록하기
                  </button>
                </div>
              </div>

              {/* 새로운 챌린지 제안 */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  💡 새로운 챌린지 제안
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  AI가 당신의 상황에 맞는 새로운 챌린지를 제안합니다
                </p>
                <button className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors">
                  맞춤형 챌린지 받기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 진행 상황 요약 */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📈 나의 진행 상황 요약
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="font-semibold text-emerald-800">총 진단 횟수</p>
                <p className="text-2xl font-bold text-emerald-600">12</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-800">AI 솔루션</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="font-semibold text-purple-800">전문가 조언</p>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="font-semibold text-yellow-800">챌린지 진행률</p>
                <p className="text-2xl font-bold text-yellow-600">65%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
