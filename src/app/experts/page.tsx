'use client';

import React from 'react';
import Navigation from '@/components/Navigation';

export default function ExpertsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900">
      <Navigation />
      <div className="pt-24 px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">전문가 소개</h1>
          <p className="text-blue-200 mb-8 text-center">
            현재 이 페이지는 개발 중입니다. 곧 심리케어 전문가들의 정보가 업데이트될 예정입니다.
          </p>
          
          <div className="flex flex-col gap-8">
            {/* 임시 전문가 카드 예시 */}
            <div className="bg-white/10 p-6 rounded-lg border border-white/20">
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-blue-400/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-3xl text-blue-300">👨‍⚕️</span>
                </div>
                <h3 className="text-xl text-white font-semibold">홍길동 박사</h3>
                <p className="text-blue-300">임상심리 전문가</p>
              </div>
              <p className="text-blue-100">
                10년 이상의 임상경험을 가지고 있는 심리 전문가입니다. MBTI, 애니어그램 등 다양한 심리검사 전문가로 활동하고 있습니다.
              </p>
            </div>
            
            <div className="bg-white/10 p-6 rounded-lg border border-white/20">
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-purple-400/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-3xl text-purple-300">👩‍⚕️</span>
                </div>
                <h3 className="text-xl text-white font-semibold">김미영 교수</h3>
                <p className="text-purple-300">심리상담 전문가</p>
              </div>
              <p className="text-blue-100">
                상담심리학 박사로서 다양한 심리 상담 프로그램을 개발하고 진행해왔습니다. 성격유형 분석과 관계 개선 상담을 전문으로 합니다.
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-blue-200">
              더 자세한 전문가 정보는 곧 업데이트될 예정입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 