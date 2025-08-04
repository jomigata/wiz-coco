'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import MBTITest from '@/components/tests/MBTITest';
import { useRouter } from 'next/navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';

export default function MbtiTestPage() {
  const router = useRouter();
  
  // 로그인 체크 제거 - 모든 사용자가 검사 가능하도록 수정

  const handleTestComplete = async (results: any) => {
    try {
      console.log('[MbtiTestPage] 검사 완료 처리 시작');
      
      // 테스트 코드 생성
      const testCode = generateTestCode('AMATEUR');
      
      // 현재 시간
      const timestamp = new Date().toISOString();
      
      // 결과 데이터 구성
      const testData = {
        testType: '개인용 MBTI 검사',
        code: testCode,
        timestamp: timestamp,
        answers: results,
        mbtiType: results.mbtiType || 'INTJ', // 기본값 설정
        userData: {
          name: '게스트 사용자',
          email: 'guest@example.com',
          testType: '개인용 MBTI 검사'
        }
      };
      
      // 로컬 스토리지에 결과 저장
      if (typeof window !== 'undefined') {
        // 기존 테스트 기록 가져오기
        const existingRecords = localStorage.getItem('test_records');
        let records = existingRecords ? JSON.parse(existingRecords) : [];
        
        // 새 기록 추가
        records.push(testData);
        
        // 최대 50개까지만 유지
        if (records.length > 50) {
          records = records.slice(-50);
        }
        
        // 저장
        localStorage.setItem('test_records', JSON.stringify(records));
        localStorage.setItem(`test-result-${testCode}`, JSON.stringify(testData));
        
        console.log('[MbtiTestPage] 로컬 스토리지에 결과 저장 완료:', testCode);
      }
      
      // 결과 페이지로 이동
      const resultPath = `/results/mbti?code=${encodeURIComponent(testCode)}&type=${encodeURIComponent(results.mbtiType || 'INTJ')}`;
      router.push(resultPath);
      
    } catch (error) {
      console.error('[MbtiTestPage] 검사 완료 처리 중 오류:', error);
      
      // 사용자에게 친화적인 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      alert(`검사 결과 처리 중 문제가 발생했습니다: ${errorMessage}\n\n마이페이지에서 검사 기록을 확인해주세요.`);
      
      // 에러 발생 시 마이페이지로 이동
      router.push('/mypage?tab=records');
    }
  };

  // 바로 심리검사 표시 (로그인 체크 없음)
  return (
    <>
      <Navigation />
      
      <div className="bg-emerald-950 min-h-screen">
        <MBTITest onComplete={handleTestComplete} />
      </div>
    </>
  );
} 