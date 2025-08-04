'use client';

import React from 'react';
import Navigation from '@/components/Navigation';

export default function ReviewsPage() {
  // 임시 후기 데이터
  const reviews = [
    {
      id: 1,
      name: '김00',
      rating: 5,
      mbtiType: 'ENFJ',
      content: 'MBTI 검사 결과가 정확해서 놀랐습니다. 상담 프로그램도 많은 도움이 되었어요.',
      date: '2024년 5월 3일'
    },
    {
      id: 2,
      name: '이00',
      rating: 4,
      mbtiType: 'ISTP',
      content: '제 성격 유형에 맞는 상담을 받았는데, 일상에서 겪는 스트레스를 효과적으로 관리하는 방법을 배울 수 있었습니다.',
      date: '2024년 4월 28일'
    },
    {
      id: 3,
      name: '박00',
      rating: 5,
      mbtiType: 'INFP',
      content: '전문가 선생님들이 친절하고 세심하게 상담해주셔서 매우 만족스러웠습니다. 자신을 더 이해하는 계기가 되었어요.',
      date: '2024년 4월 15일'
    }
  ];

  // 별점 렌더링 함수
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-300' : 'text-gray-400'}`}>★</span>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <Navigation />
      <div className="pt-24 px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">고객 후기</h1>
          <p className="text-purple-200 mb-8 text-center">
            심리케어 서비스를 이용한 고객님들의 소중한 후기입니다.
          </p>
          
          {/* 후기 목록 */}
          <div className="space-y-6">
            {reviews.map(review => (
              <div key={review.id} className="bg-white/10 p-6 rounded-lg border border-white/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg text-white font-semibold">{review.name}</h3>
                    <p className="text-purple-300 text-sm">{review.mbtiType} 유형</p>
                  </div>
                  <div className="flex">{renderStars(review.rating)}</div>
                </div>
                <p className="text-blue-100 mb-3">
                  {review.content}
                </p>
                <p className="text-sm text-purple-300 text-right">{review.date}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-purple-200 mb-4">
              현재 페이지는 개발 중이며, 실제 후기는 서비스 오픈 후 제공될 예정입니다.
            </p>
            <button
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              후기 작성하기 (준비중)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 