'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function CounselingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900">
      <Navigation />
      <div className="pt-24 px-4 pb-12">
        <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">상담 프로그램</h1>
          <p className="text-blue-200 mb-8 text-center">
            현재 이 페이지는 개발 중입니다. 곧 다양한 심리 상담 프로그램 정보가 업데이트될 예정입니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 상담 프로그램 카드 */}
            <div className="bg-white/10 p-6 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <h3 className="text-xl text-white font-semibold mb-3">개인 심리 상담</h3>
              <p className="text-blue-100 mb-4">
                1:1 맞춤형 심리 상담을 통해 자신을 더 깊이 이해하고 일상 생활의 문제를 해결할 수 있습니다.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-blue-300">50분 / 회</span>
                <span className="bg-blue-600/60 px-3 py-1 rounded text-white text-sm">준비중</span>
              </div>
            </div>
            
            <div className="bg-white/10 p-6 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <h3 className="text-xl text-white font-semibold mb-3">커플 및 가족 상담</h3>
              <p className="text-blue-100 mb-4">
                관계 개선을 위한 커플 및 가족 상담 프로그램으로, 서로에 대한 이해를 높이고 건강한 관계를 형성합니다.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-blue-300">80분 / 회</span>
                <span className="bg-blue-600/60 px-3 py-1 rounded text-white text-sm">준비중</span>
              </div>
            </div>
            
            <div className="bg-white/10 p-6 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <h3 className="text-xl text-white font-semibold mb-3">MBTI 기반 성격 상담</h3>
              <p className="text-blue-100 mb-4">
                MBTI 검사 결과를 바탕으로 자신의 성격 유형에 맞는 맞춤형 심리 상담을 제공합니다.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-blue-300">60분 / 회</span>
                <span className="bg-blue-600/60 px-3 py-1 rounded text-white text-sm">준비중</span>
              </div>
            </div>
            
            <div className="bg-white/10 p-6 rounded-lg border border-white/20 hover:bg-white/15 transition-colors">
              <h3 className="text-xl text-white font-semibold mb-3">그룹 테라피</h3>
              <p className="text-blue-100 mb-4">
                소그룹 테라피를 통해 비슷한 고민을 가진 사람들과 함께 치유의 경험을 나눕니다.
              </p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-blue-300">90분 / 회</span>
                <span className="bg-blue-600/60 px-3 py-1 rounded text-white text-sm">준비중</span>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-blue-200 mb-6">
              자세한 상담 일정과 예약은 준비 중입니다.
            </p>
            <Link 
              href="/mypage/counseling" 
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors inline-block"
            >
              상담 안내 받기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 