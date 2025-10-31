'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import MBTITest from '@/components/tests/MBTITest';
import { useRouter, usePathname } from 'next/navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';
import { saveTestProgress, loadTestProgress, clearTestProgress, generateTestId } from '@/utils/testResume';
import { motion } from 'framer-motion';

export default function MbtiTestPage() {
  const router = useRouter();
  const pathname = usePathname();
  const testId = generateTestId(pathname || '/tests/mbti');
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasResumeData, setHasResumeData] = useState(false);
  const [testComponentKey, setTestComponentKey] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<any>(null);
  
  // 저장된 진행 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedProgress = loadTestProgress(testId);
    if (savedProgress && savedProgress.answers && Object.keys(savedProgress.answers).length > 0) {
      setHasResumeData(true);
      setShowResumeDialog(true);
      setSavedAnswers(savedProgress.answers);
    }
  }, [testId]);

  // 이어하기
  const handleResumeTest = () => {
    setShowResumeDialog(false);
    // MBTITest 컴포넌트에 저장된 답변 전달
    setTestComponentKey(prev => prev + 1);
  };

  // 새로 시작
  const handleStartNew = () => {
    clearTestProgress(testId);
    setSavedAnswers(null);
    setShowResumeDialog(false);
    setHasResumeData(false);
    setTestComponentKey(prev => prev + 1);
  };

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
      
      // 검사 완료 시 진행 상태 삭제
      clearTestProgress(testId);
      
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

  // 이어하기 다이얼로그
  if (showResumeDialog && hasResumeData) {
    const savedProgress = loadTestProgress(testId);
    const answeredCount = Object.keys(savedProgress?.answers || {}).length;
    const totalQuestions = 48; // MBTI 질문 수
    
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-900/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full border border-emerald-700"
        >
          <h2 className="text-2xl font-bold text-white mb-4 text-center">이어하기</h2>
          <p className="text-emerald-200 mb-6 text-center">
            진행 중이던 검사를 발견했습니다. 이어서 계속하시겠습니까?
          </p>
          <div className="bg-emerald-800/50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-emerald-200 text-sm">진행률</span>
              <span className="text-emerald-300 font-semibold">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full bg-emerald-900 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.round((answeredCount / totalQuestions) * 100)}%` }}
              />
            </div>
            <p className="text-emerald-300/80 text-xs mt-2 text-center">
              {answeredCount}개 문항 완료 / 전체 {totalQuestions}개
            </p>
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={handleStartNew}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-gray-700/60 text-gray-200 font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              새로 시작
            </motion.button>
            <motion.button
              onClick={handleResumeTest}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              이어서 계속
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 바로 심리검사 표시 (로그인 체크 없음)
  return (
    <>
      <Navigation />
      
      <div className="bg-emerald-950 min-h-screen">
        <MBTITestWrapper 
          key={testComponentKey}
          onComplete={handleTestComplete}
          testId={testId}
          savedAnswers={savedAnswers}
        />
      </div>
    </>
  );
}

// MBTITest 래퍼 컴포넌트 (진행 상태 자동 저장)
function MBTITestWrapper({ onComplete, testId, savedAnswers }: { 
  onComplete: (results: any) => void;
  testId: string;
  savedAnswers?: any;
}) {
  const [answers, setAnswers] = useState<any>(savedAnswers || {});
  const [currentQuestion, setCurrentQuestion] = useState(savedAnswers ? Object.keys(savedAnswers).length : 0);
  const [internalAnswers, setInternalAnswers] = useState<any>(savedAnswers || {});

  // 답변 저장 감지 및 진행 상태 저장
  useEffect(() => {
    if (Object.keys(internalAnswers).length > 0) {
      saveTestProgress({
        testId,
        testName: '개인용 MBTI 검사',
        answers: internalAnswers,
        currentQuestion,
        timestamp: Date.now(),
        testType: 'MBTI',
        totalQuestions: 48
      });
    }
  }, [internalAnswers, currentQuestion, testId]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(internalAnswers).length > 0) {
        saveTestProgress({
          testId,
          testName: '개인용 MBTI 검사',
          answers: internalAnswers,
          currentQuestion,
          timestamp: Date.now(),
          testType: 'MBTI',
          totalQuestions: 48
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [internalAnswers, currentQuestion, testId]);

  const handleComplete = (results: any) => {
    clearTestProgress(testId);
    onComplete(results);
  };

  // MBTITest는 내부 상태를 관리하므로, 래퍼로 감싸서 진행 상태 저장만 처리
  return <MBTITest onComplete={handleComplete} />;
} 