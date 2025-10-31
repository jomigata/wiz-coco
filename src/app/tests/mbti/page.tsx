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
      // 완료 여부 확인 (100% 진행률인 경우 제외)
      const answeredCount = Object.keys(savedProgress.answers || {}).length;
      const totalQuestions = 48; // MBTI 질문 수
      
      // 모든 문항이 완료되었으면 이어하기 표시하지 않음
      if (answeredCount >= totalQuestions) {
        // 완료된 검사는 진행 상태 삭제
        clearTestProgress(testId);
        return;
      }
      
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
  // 저장된 답변을 정규화 (문자열 키를 숫자로 변환)
  const normalizeAnswers = (rawAnswers: any): { [key: string]: { type: string; answer: number } } => {
    if (!rawAnswers) return {};
    const normalized: { [key: string]: { type: string; answer: number } } = {};
    
    Object.keys(rawAnswers).forEach((key) => {
      const value = rawAnswers[key];
      if (typeof value === 'object' && value.type && value.answer !== undefined) {
        normalized[key] = value;
      } else if (typeof value === 'number') {
        // 숫자만 있는 경우 기본 타입 설정 (나중에 질문에서 가져올 수 있음)
        normalized[key] = { type: '', answer: value };
      }
    });
    
    return normalized;
  };

  const normalizedSavedAnswers = normalizeAnswers(savedAnswers);
  const savedCurrentQuestion = savedAnswers && Object.keys(normalizedSavedAnswers).length > 0
    ? Math.max(...Object.keys(normalizedSavedAnswers).map(k => parseInt(k) || 0))
    : undefined;

  // MBTITest 컴포넌트의 상태를 추적하기 위한 state
  const [trackedAnswers, setTrackedAnswers] = useState<any>(normalizedSavedAnswers);
  const [trackedCurrentQuestion, setTrackedCurrentQuestion] = useState<number>(savedCurrentQuestion || 0);

  // 답변 변경 핸들러 (MBTITest에서 직접 호출)
  const handleAnswerChange = (newAnswers: any, newCurrentQuestion: number) => {
    setTrackedAnswers(newAnswers);
    setTrackedCurrentQuestion(newCurrentQuestion);
  };

  // 답변 변경 시 자동 저장
  useEffect(() => {
    if (Object.keys(trackedAnswers).length > 0) {
      saveTestProgress({
        testId,
        testName: '개인용 MBTI 검사',
        answers: trackedAnswers,
        currentQuestion: trackedCurrentQuestion,
        timestamp: Date.now(),
        testType: 'MBTI',
        totalQuestions: 48
      });
    }
  }, [trackedAnswers, trackedCurrentQuestion, testId]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(trackedAnswers).length > 0) {
        saveTestProgress({
          testId,
          testName: '개인용 MBTI 검사',
          answers: trackedAnswers,
          currentQuestion: trackedCurrentQuestion,
          timestamp: Date.now(),
          testType: 'MBTI',
          totalQuestions: 48
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackedAnswers, trackedCurrentQuestion, testId]);

  const handleComplete = (results: any) => {
    clearTestProgress(testId);
    onComplete(results);
  };

  // MBTITest에 저장된 답변과 현재 질문 번호 전달
  return (
    <MBTITest 
      onComplete={handleComplete}
      savedAnswers={normalizedSavedAnswers}
      savedCurrentQuestion={savedCurrentQuestion}
      onAnswerChange={handleAnswerChange}
    />
  );
} 