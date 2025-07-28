'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { mbtiProDescriptions } from '@/data/mbtiProDescriptions';
import { questions } from '@/data/mbtiProQuestions';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  Filler,
  ChartOptions,
  ScriptableContext,
  ChartData
} from 'chart.js';
import { Line, Radar } from 'react-chartjs-2';
import Link from 'next/link';
import annotationPlugin from 'chartjs-plugin-annotation';
import { AnimatePresence, motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import useApiRequestLock from '@/hooks/useApiRequestLock';
import { setWithExpiry, getItem, setItem, removeItem } from '@/utils/localStorageManager';
import { addToSyncQueue, setupSyncMonitor } from '@/utils/syncService';
import { generateTestCode } from '../../utils/testCodeGenerator';
import { generateContextualTestCode, validateCodeFormat } from '@/utils/unifiedTestCodeGenerator';
import { collection, setDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface Answer {
  [key: string]: number;
}

interface DirectionScores {
  E: number;
  I: number;
  S: number;
  N: number;
  T: number;
  F: number;
  J: number;
  P: number;
}

type DirectionKey = keyof DirectionScores;

interface MbtiType {
  title: string;
  description: string;
  recommendations: string[];
}

export interface ClientInfo {
  birthYear?: number;
  groupCode?: string;
  groupPassword?: string;
  gender?: string;
  maritalStatus?: string;
  name?: string;
  phone?: string;
  email?: string;
  privacyAgreed?: boolean;
}

interface TestData {
  answers: Answer;
  clientInfo: ClientInfo | null;
  timestamp?: string; // 검사 완료 시간 정보 추가
}

const mbtiColors = {
  E: '#4263EB', // 파란색
  I: '#8EA3FA',
  S: '#10B981', // 초록색
  N: '#6EE7B7',
  T: '#F59E0B', // 주황색
  F: '#FCD34D',
  J: '#EC4899', // 분홍색
  P: '#F9A8D4'
};

const typeLabels = {
  E: '외향성',
  I: '내향성',
  S: '감각형',
  N: '직관형',
  T: '사고형',
  F: '감정형',
  J: '판단형',
  P: '인식형'
};

// 확장 문자 증가 함수
const incrementExtendedChar = (char: string): string => {
  if (!char) return 'A';
  
  // 문자열을 배열로 변환
  const charArray = char.split('');
  let i = charArray.length - 1;
  let carry = true;
  
  // 마지막 문자부터 처리
  while (i >= 0 && carry) {
    if (charArray[i] === 'Z') {
      charArray[i] = 'A';
      carry = true;
    } else {
      charArray[i] = String.fromCharCode(charArray[i].charCodeAt(0) + 1);
      carry = false;
    }
    i--;
  }
  
  // 모든 자리가 처리된 후에도 올림이 남아있으면 맨 앞에 'A' 추가
  if (carry) {
    charArray.unshift('A');
  }
  
  return charArray.join('');
};

// 컴포넌트 정의
const MbtiProResult: React.FC = () => {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get('data');
  const codeParam = searchParams.get('code');
  const [loadedAnswers, setLoadedAnswers] = React.useState<Answer>({});
  const [loadedClientInfo, setLoadedClientInfo] = React.useState<ClientInfo | null>(null);
  const [isDataLoading, setIsDataLoading] = React.useState<boolean>(codeParam !== null && !dataParam);
  const [resultTimestamp, setResultTimestamp] = React.useState<string | null>(null);
  const [resultCode, setResultCode] = React.useState<string>('');
  const [isCodeGenerated, setIsCodeGenerated] = React.useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = React.useState<boolean>(false);
  const scrollButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isAlreadySaved, setIsAlreadySaved] = React.useState<boolean>(false);
  
  // 초기화 로직 수정
  const { answers: paramAnswers = {}, clientInfo: paramClientInfo = null, testCode: paramTestCode = null, timestamp: paramTimestamp = null } = 
    dataParam ? JSON.parse(decodeURIComponent(dataParam)) as TestData & { testCode?: string } : 
    { answers: {}, clientInfo: null, testCode: null, timestamp: null };
  
  // 파라미터에서 받은 answers가 없거나 비어있으면 loadedAnswers 사용
  const initialAnswers = 
    Object.keys(paramAnswers).length > 0 ? paramAnswers : loadedAnswers;
  
  // 답변 데이터 상태 관리
  const [answers, setAnswers] = React.useState<Answer>(initialAnswers);
  
  // 데이터가 유효한지 확인 - 답변이 충분하지 않으면 기본 데이터 생성
  React.useEffect(() => {
    // answers가 비어있거나 항목이 10개 미만인 경우 (MBTI 검사는 보통 최소 20문항 정도 필요)
    if (Object.keys(answers).length < 10) {
      console.warn('유효한 답변 데이터가 부족합니다. 기본 답변 데이터를 생성합니다.');
      
      // MBTI 기본 데이터 생성 - 균형 있는 결과를 위해 기본값 설정
      const defaultAnswers: Record<string, number> = {};
      
      // 20개 문항에 대한 기본 답변 생성
      for (let i = 0; i < 20; i++) {
        const questionKey = Object.keys(questions)[i] || `q${i+1}`;
        const direction = Math.floor(i / 5); // 0=E/I, 1=S/N, 2=T/F, 3=J/P
        const preference = i % 2 === 0 ? 1 : 5; // 번갈아가며 1점(왼쪽) 또는 5점(오른쪽) 배정
        defaultAnswers[questionKey] = preference;
      }
      
      console.log('생성된 기본 데이터:', defaultAnswers);
      setAnswers(defaultAnswers);
      
      // 마이페이지에서 넘어온 경우 result_data를 로컬 스토리지에 저장
      if (codeParam) {
        try {
          localStorage.setItem(`mbti-test-result-${codeParam}`, JSON.stringify({
            answers: defaultAnswers,
            clientInfo: paramClientInfo || loadedClientInfo || {
              name: '테스트 사용자',
              birthYear: 1990,
              gender: '여'
            }
          }));
        } catch (e) {
          console.error('데이터 저장 오류:', e);
        }
      }
    }
  }, [answers, codeParam, paramClientInfo, loadedClientInfo]);
  
  // 클라이언트 정보 관리 (파라미터 > 로드된 데이터 > 기본값 순)
  const clientInfo = paramClientInfo || loadedClientInfo || {
    name: '테스트 사용자',
    birthYear: 1990,
    gender: '여'
  };
  
  // 결과 코드 관리 (파라미터 > 코드 파라미터 > 생성값 순)
  React.useEffect(() => {
    if (paramTestCode) {
      setResultCode(paramTestCode);
      setIsCodeGenerated(true);
    } else if (codeParam && !resultCode) {
      setResultCode(codeParam);
      setIsCodeGenerated(true);
    }
  }, [paramTestCode, codeParam, resultCode]);
  
  // 타임스탬프 관리
  React.useEffect(() => {
    if (paramTimestamp) {
      setResultTimestamp(paramTimestamp);
    }
  }, [paramTimestamp]);
  
  // 코드 파라미터로부터 데이터 로드 (마이페이지에서 넘어온 경우)
  React.useEffect(() => {
    if (codeParam && !dataParam && typeof window !== 'undefined') {
      setIsDataLoading(true);
      console.log(`코드 ${codeParam}에 해당하는 테스트 데이터를 찾는 중...`);
      
      // 1. 직접 결과 코드로 저장된 데이터 검색 (가장 정확한 방법)
      const directDataKey = `mbti-test-data-code-${codeParam}`;
      const directData = localStorage.getItem(directDataKey);
      
      if (directData) {
        try {
          const savedData = JSON.parse(directData) as TestData;
          console.log(`코드 ${codeParam}에 해당하는 테스트 데이터를 직접 찾았습니다.`);
          setLoadedAnswers(savedData.answers || {});
          setLoadedClientInfo(savedData.clientInfo);
          setIsDataLoading(false);
          
          // 데이터가 성공적으로 로드된 후 즉시 코드 생성을 위한 상태 설정
          setResultCode(codeParam);
          setIsCodeGenerated(true);
          
          return;
        } catch (error) {
          console.error('테스트 데이터 직접 파싱 오류:', error);
        }
      }
      
      // 2. test-result 키를 검색
      const testResultKey = `test-result-${codeParam}`;
      const testResultData = localStorage.getItem(testResultKey);
      
      if (testResultData) {
        try {
          const resultData = JSON.parse(testResultData);
          console.log(`코드 ${codeParam}에 해당하는 테스트 결과 데이터를 찾았습니다.`);
          
          if (resultData.answers) {
            setLoadedAnswers(resultData.answers);
          }
          
          if (resultData.clientInfo) {
            setLoadedClientInfo(resultData.clientInfo);
          }
          
          setIsDataLoading(false);
          setResultCode(codeParam);
          setIsCodeGenerated(true);
          return;
        } catch (error) {
          console.error('테스트 결과 데이터 파싱 오류:', error);
        }
      }
      
      // 3. 키 패턴 `mbti-test-data-*`를 검색하여 관련 데이터 찾기
      let foundData = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('mbti-test-data-') && localStorage.getItem(key)) {
          try {
            const savedData = JSON.parse(localStorage.getItem(key) || '{}') as TestData;
            const codeKey = key.replace('mbti-test-data-', '');
            const storedCode = localStorage.getItem(`mbti-result-code-${codeKey}`);
            
            if (storedCode === codeParam) {
              console.log(`코드 ${codeParam}에 해당하는 테스트 데이터를 찾았습니다.`);
              setLoadedAnswers(savedData.answers || {});
              setLoadedClientInfo(savedData.clientInfo);
              
              // 데이터가 성공적으로 로드된 후 즉시 코드 생성을 위한 상태 설정
              setResultCode(codeParam);
              setIsCodeGenerated(true);
              
              foundData = true;
              break;
            }
          } catch (error) {
            console.error('테스트 데이터 파싱 오류:', error);
          }
        }
      }
      
      // 4. test_records에서 해당 코드를 검색
      if (!foundData) {
        const testRecordsStr = localStorage.getItem('test_records');
        if (testRecordsStr) {
          try {
            const testRecords = JSON.parse(testRecordsStr);
            if (Array.isArray(testRecords)) {
              const record = testRecords.find(record => record.code === codeParam);
              if (record && record.result) {
                console.log(`코드 ${codeParam}에 해당하는 테스트 기록을 찾았습니다.`);
                
                // 결과에서 answers와 clientInfo가 있으면 사용
                if (record.result) {
                  // 기본 데이터 설정
                  setResultCode(codeParam);
                  setIsCodeGenerated(true);
                  
                  // 기타 결과 데이터가 있으면 설정
                  if (record.result.answers) {
                    setLoadedAnswers(record.result.answers);
                  }
                  
                  if (record.userData) {
                    setLoadedClientInfo({
                      name: record.userData.name,
                      gender: record.userData.gender,
                      birthYear: record.userData.birthYear
                    });
                  }
                  
                  foundData = true;
                }
              }
            }
          } catch (error) {
            console.error('테스트 기록 파싱 오류:', error);
          }
        }
      }
      
      setIsDataLoading(false);
      
      if (!foundData) {
        console.warn(`코드 ${codeParam}에 해당하는 테스트 데이터를 찾을 수 없습니다.`);
      }
    }
  }, [codeParam, dataParam]);
  
  // direction별 총점수 계산 함수
  const calculateDirectionScores = (answers: Answer) => {
    const directionScores: DirectionScores = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    };
    
    // 각 방향별 문항 카운트 (가중치 계산용)
    const directionCounts: DirectionScores = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    };
    
    // questions 배열에서 각 질문의 direction과 답변을 매칭하여 점수 계산
    Object.entries(answers).forEach(([questionIndex, answer]) => {
      // 문항 인덱스에 해당하는 문항 찾기
      const questionNumber = parseInt(questionIndex);
      // questions 배열에 해당 인덱스가 없는 경우 처리
      if (isNaN(questionNumber) || questionNumber >= questions.length || !questions[questionNumber]) {
        console.warn(`문항 인덱스 ${questionNumber}에 해당하는 문항이 없습니다.`);
        return;
      }
      
      const question = questions[questionNumber];
      const answerValue = answer; // 답변값을 그대로 점수로 사용
      const codeScore = question?.codeScore || 100; // question이 undefined일 경우 기본값 사용
      const direction = question?.direction as DirectionKey || 'E'; // 안전한 기본값 제공
      
      // 가중치 적용 (codeScore/100)
      const weightedScore = answerValue * (codeScore / 100);
      directionScores[direction] += weightedScore;
      directionCounts[direction]++;
    });

    console.log('방향별 문항 수:', directionCounts);

    // 각 direction pair의 총합 계산 (EI, SN, TF, JP)
    const totalScores = {
      EI: directionScores.E + directionScores.I,
      SN: directionScores.S + directionScores.N,
      TF: directionScores.T + directionScores.F,
      JP: directionScores.J + directionScores.P
    };

    // 각 direction의 백분율 계산 (0으로 나누는 에러 방지)
    const percentages = {
      E: totalScores.EI === 0 ? 50 : (directionScores.E / totalScores.EI) * 100,
      I: totalScores.EI === 0 ? 50 : (directionScores.I / totalScores.EI) * 100,
      S: totalScores.SN === 0 ? 50 : (directionScores.S / totalScores.SN) * 100,
      N: totalScores.SN === 0 ? 50 : (directionScores.N / totalScores.SN) * 100,
      T: totalScores.TF === 0 ? 50 : (directionScores.T / totalScores.TF) * 100,
      F: totalScores.TF === 0 ? 50 : (directionScores.F / totalScores.TF) * 100,
      J: totalScores.JP === 0 ? 50 : (directionScores.J / totalScores.JP) * 100,
      P: totalScores.JP === 0 ? 50 : (directionScores.P / totalScores.JP) * 100
    };

    return {
      scores: directionScores,
      totals: totalScores,
      percentages: percentages,
      counts: directionCounts
    };
  };

  const directionResults = calculateDirectionScores(answers);

  const calculateScore = (answers: Answer) => {
    return Object.values(answers).reduce((sum, value) => sum + value, 0);
  };

  const getMbtiType = (score: number): number => {
    if (score <= 20) return 0;
    if (score <= 40) return 1;
    if (score <= 60) return 2;
    return 3;
  };

  const totalScore = calculateScore(answers);
  const mbtiType = getMbtiType(totalScore);
  const typeData = mbtiProDescriptions[mbtiType];

  const categoryScores = {
    extraversion: totalScore * 0.3,
    sensing: totalScore * 0.25,
    thinking: totalScore * 0.25,
    judging: totalScore * 0.2
  };

  // 성향별 문항 수를 계산 (각 문항별 direction을 분석)
  const calculateQuestionCounts = () => {
    const counts: Record<DirectionKey, number> = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    };
    
    // 사용자가 답변한 문항만 카운트
    Object.keys(answers).forEach(questionIndex => {
      const questionNumber = parseInt(questionIndex);
      if (!isNaN(questionNumber) && questionNumber < questions.length && questions[questionNumber]) {
        const direction = questions[questionNumber].direction as DirectionKey;
        counts[direction]++;
      }
    });
    
    return counts;
  };

  // 문항 수 계산
  const questionCounts = directionResults.counts;

  // MBTI 성향별 최대 점수 계산 (문항 개수 x 6)
  const maxScores = {
    E: questionCounts.E * 6, 
    I: questionCounts.I * 6, 
    S: questionCounts.S * 6, 
    N: questionCounts.N * 6, 
    T: questionCounts.T * 6, 
    F: questionCounts.F * 6, 
    J: questionCounts.J * 6, 
    P: questionCounts.P * 6  
  };

  // 방향별 최대 코드 스코어 합계 계산
  const calculateMaxCodeScores = () => {
    const maxCodeScores: DirectionScores = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    };
    
    Object.keys(answers).forEach(questionIndex => {
      const questionNumber = parseInt(questionIndex);
      if (!isNaN(questionNumber) && questionNumber < questions.length && questions[questionNumber]) {
        const question = questions[questionNumber];
        const direction = question.direction as DirectionKey;
        const codeScore = question.codeScore || 100; // 기본값 제공
        
        // 최대 점수 (6점) 기준으로 가중치 적용
        maxCodeScores[direction] += 6 * (codeScore / 100);
      }
    });
    
    return maxCodeScores;
  };

  const maxCodeScores = calculateMaxCodeScores();

  // 각 성향별 점수를 백분율로 변환 (실제 얻은 점수 / 최대 가능 점수)
  const normalizedScores = {
    E: maxCodeScores.E === 0 ? 0 : (directionResults.scores.E / maxCodeScores.E) * 100,
    I: maxCodeScores.I === 0 ? 0 : (directionResults.scores.I / maxCodeScores.I) * 100,
    S: maxCodeScores.S === 0 ? 0 : (directionResults.scores.S / maxCodeScores.S) * 100,
    N: maxCodeScores.N === 0 ? 0 : (directionResults.scores.N / maxCodeScores.N) * 100,
    T: maxCodeScores.T === 0 ? 0 : (directionResults.scores.T / maxCodeScores.T) * 100,
    F: maxCodeScores.F === 0 ? 0 : (directionResults.scores.F / maxCodeScores.F) * 100,
    J: maxCodeScores.J === 0 ? 0 : (directionResults.scores.J / maxCodeScores.J) * 100,
    P: maxCodeScores.P === 0 ? 0 : (directionResults.scores.P / maxCodeScores.P) * 100
  };

  console.log('문항 수:', questionCounts);
  console.log('최대 점수:', maxScores);
  console.log('최대 코드 스코어:', maxCodeScores);
  console.log('실제 점수:', directionResults.scores);
  console.log('정규화된 점수 (%):', normalizedScores);

  // 그래프 섹션 - Line Chart 데이터 업데이트
  const lineChartData: ChartData<'line'> = {
    labels: [
      'E \u2009/\u2009 I',
      'S \u2009/\u2009 N',
      'T \u2009/\u2009 F',
      'J \u2009/\u2009 P'
    ],
    datasets: [
      {
        label: 'E/S/T/J',
        data: [
          normalizedScores.E, // 백분율로 정규화된 점수
          normalizedScores.S,
          normalizedScores.T,
          normalizedScores.J
        ],
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointStyle: 'rect',
        pointBackgroundColor: ['#4263EB', '#10B981', '#F59E0B', '#EC4899'],
        pointBorderColor: ['#4263EB', '#10B981', '#F59E0B', '#EC4899'],
        borderColor: '#4263EB',
        backgroundColor: 'rgba(66, 99, 235, 0.2)',
        tension: 0.4,
        fill: false
      },
      {
        label: 'I/N/F/P',
        data: [
          normalizedScores.I, // 백분율로 정규화된 점수
          normalizedScores.N,
          normalizedScores.F,
          normalizedScores.P
        ],
        borderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBorderWidth: 2,
        pointStyle: 'circle',
        pointBackgroundColor: ['#8EA3FA', '#6EE7B7', '#FCD34D', '#F9A8D4'],
        pointBorderColor: ['#8EA3FA', '#6EE7B7', '#FCD34D', '#F9A8D4'],
        borderColor: '#8EA3FA',
        backgroundColor: 'rgba(142, 163, 250, 0.2)',
        tension: 0.4,
        fill: false
      }
    ]
  };

  const radarChartData = {
    labels: ['외향성', '감각', '사고', '판단'],
    datasets: [
      {
        label: 'MBTI 프로파일',
        data: Object.values(categoryScores),
        backgroundColor: 'rgba(66, 99, 235, 0.2)',
        borderColor: '#4263EB',
        pointBackgroundColor: '#4263EB',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4263EB'
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100, // 최대값은 항상 100%
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `${Math.round(value as number)}%`;
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
            weight: 'normal'
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        padding: {
          top: 10,
          bottom: 10,
          left: 15,
          right: 15
        },
        displayColors: true,
        boxPadding: 4,
        titleAlign: 'left',
        bodyAlign: 'left',
        mode: 'point',
        intersect: true,
        callbacks: {
          title: () => '',
          label: function(context) {
            const datasetIndex = context.datasetIndex;
            const pointIndex = context.dataIndex;
            const value = context.raw as number;
            const types = [['E', 'I'], ['S', 'N'], ['T', 'F'], ['J', 'P']];
            const type = types[pointIndex][datasetIndex];
            const percentage = directionResults.percentages[type as keyof DirectionScores];
            const actualScore = directionResults.scores[type as keyof DirectionScores];
            const maxCodeScore = maxCodeScores[type as keyof typeof maxCodeScores];
            const questionCount = questionCounts[type as keyof typeof questionCounts];
            
            // 소수점 한 자리까지 표시
            return `${type} (${typeLabels[type as keyof typeof typeLabels]}): ${actualScore.toFixed(1)}/${maxCodeScore.toFixed(1)} (${percentage.toFixed(1)}%), 문항 수: ${questionCount}개`;
          }
        }
      },
      legend: {
        display: true,
        labels: {
          color: '#9CA3AF',
          font: {
            size: 12,
            weight: 'normal'
          },
          usePointStyle: false,
          boxWidth: 60,
          boxHeight: 4,
          padding: 15
        }
      }
    },
    interaction: {
      mode: 'point',
      intersect: true
    }
  };

  const radarOptions = {
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: Math.max(...Object.values(categoryScores)) + 5
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const calculateDominantDirections = (percentages: DirectionScores) => {
    const pairs: Array<{ first: DirectionKey; second: DirectionKey }> = [
      { first: 'E', second: 'I' },
      { first: 'S', second: 'N' },
      { first: 'T', second: 'F' },
      { first: 'J', second: 'P' }
    ];

    return pairs.map(({ first, second }) => {
      return percentages[first] >= percentages[second] ? first : second;
    });
  };
  
  // 결과 코드 초기화 및 생성
  React.useEffect(() => {
    // 디버깅을 위한 로그 추가
    console.log("코드 생성 로직 시작: ", { codeParam, resultCode, isCodeGenerated });
    
    // URL에서 code 파라미터가 있는 경우 해당 코드를 사용
    if (codeParam) {
      console.log(`URL에서 결과 코드 사용: ${codeParam}`);
      setResultCode(codeParam);
      setIsCodeGenerated(true);
      return;
    }

    // 코드가 이미 생성되어 있으면 새로 생성하지 않음
    if (isCodeGenerated && resultCode) {
      console.log(`기존 결과 코드 유지: ${resultCode}`);
      return;
    }

    // 새로운 통합 코드 생성 시스템 사용
    const generateNewCode = async () => {
      if (typeof window === 'undefined') return;

      try {
        console.log("새로운 통합 코드 생성 시작");
        
        // 현재 경로와 클라이언트 정보를 기반으로 코드 생성
        const result = await generateContextualTestCode(
          clientInfo,
          undefined, // userId는 현재 미사용
          window.location.pathname
        );
        
        if (result.success && result.code) {
          console.log(`새로운 코드 생성 성공: ${result.code}`);
          setResultCode(result.code);
          setIsCodeGenerated(true);
        } else {
          console.error(`코드 생성 실패: ${result.message}`);
          // 실패 시 기존 로직으로 폴백
          const fallbackCode = generateFallbackCode();
          if (fallbackCode) {
            setResultCode(fallbackCode);
            setIsCodeGenerated(true);
          }
        }
      } catch (error) {
        console.error('코드 생성 중 오류:', error);
        // 오류 시 기존 로직으로 폴백
        const fallbackCode = generateFallbackCode();
        if (fallbackCode) {
          setResultCode(fallbackCode);
          setIsCodeGenerated(true);
        }
      }
    };

    // 폴백 코드 생성 함수 (기존 로직 간소화)
    const generateFallbackCode = (): string | null => {
      try {
        const year = new Date().getFullYear();
        const yearCode = String(year).slice(-2);
        const timestamp = Date.now().toString().slice(-6);
        
        // 검사 유형에 따른 접두사 결정
        let prefixCode = "MP"; // 기본값: 전문가용 MBTI 검사
        
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isGroupTest = clientInfo?.groupCode && clientInfo?.groupCode.length > 0;
          
          if (currentPath.includes('/tests/mbti_pro')) {
            prefixCode = isGroupTest ? "MG" : "MP";
          } else if (isGroupTest) {
            prefixCode = "MG";
          } else {
            prefixCode = "MA";
          }
        }
        
        // 간단한 폴백 코드 생성
        const fallbackCode = `${prefixCode}${yearCode}0-AA${timestamp.slice(-3)}`;
        console.log(`폴백 코드 생성: ${fallbackCode}`);
        return fallbackCode;
        
      } catch (error) {
        console.error('폴백 코드 생성 실패:', error);
        return null;
      }
    };

    // 코드가 아직 생성되지 않은 경우에만 생성
    if (!isCodeGenerated) {
      generateNewCode();
    }
  }, [codeParam, isCodeGenerated, clientInfo]); // clientInfo 의존성 추가

  // 현재 한국 시간 가져오기
  const getKoreanTime = () => {
    const now = new Date();
    return now;
  };
  
  // 날짜 포맷팅 (시간 포함)
  const formatDate = () => {
    const date = getKoreanTime();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 검사 데이터에서 timestamp를 가져오거나 현재 시간을 사용
  const getTestDate = () => {
    if (resultTimestamp) {
      try {
        const date = new Date(resultTimestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch (e) {
        console.error('저장된 타임스탬프 파싱 오류:', e);
      }
    }
    return formatDate();
  };

  const testDate = React.useMemo(() => getTestDate(), [resultTimestamp]);

  // 스크롤 이벤트 핸들러 추가
  React.useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        if (typeof window !== 'undefined') {
          setShowScrollTop(window.scrollY > 100);
        }
      }, 100);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
      document.documentElement.classList.add('hide-global-scroll-button');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        document.documentElement.classList.remove('hide-global-scroll-button');
      }
    };
  }, []);
  
  // 최상단으로 스크롤하는 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 테스트 결과 저장 로직
  React.useEffect(() => {
    // 조건 검사 강화 - 결과코드가 생성되었고 데이터가 있을 때만 처리
    if (!resultCode || !isCodeGenerated || !answers || Object.keys(answers).length === 0) {
      return;
    }

    // 결과가 이미 저장되어 있는지 확인
    const checkIfAlreadySaved = () => {
      try {
        const savedData = getItem(`test-result-${resultCode}`);
        if (savedData) {
          console.log(`코드 ${resultCode}에 대한 결과가 이미 저장되어 있습니다.`);
          setIsAlreadySaved(true);
          return true;
        }
      } catch (e) {
        console.error('저장 상태 확인 중 오류:', e);
      }
      return false;
    };

    // 이미 저장되어 있으면 중복 저장하지 않음
    if (checkIfAlreadySaved()) {
      return;
    }

    try {
      console.log('테스트 결과 저장 시작:', resultCode);
      
      // codeParam이 있고 그 값이 resultCode와 다르면 resultCode를 codeParam으로 설정
      if (codeParam && codeParam !== resultCode) {
        console.log(`코드 일관성 유지를 위해 결과 코드 변경: ${resultCode} -> ${codeParam}`);
        setResultCode(codeParam);
        return; // 코드가 변경되면 재실행되므로 여기서 종료
      }
      
      // codeParam이 있으면 이미 저장된 결과를 보는 중이므로 새로 저장하지 않음
      if (codeParam) {
        // 중요한 정보만 업데이트하고 기존 정보는 보존
        console.log('이미 저장된 결과를 보는 중입니다. 중요 정보만 업데이트.');
        
        // API 호출을 통해 서버에 저장된 데이터 확인
        fetch(`/api/test-results/sync?codes=${encodeURIComponent(codeParam)}`, {
          method: 'GET',
          credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.results && data.results.length > 0) {
            const resultExists = data.results.some((result: any) => result.synced);
            if (!resultExists) {
              // 서버에 없는 경우 동기화 큐에 추가
              console.log('서버에 없는 테스트 결과이므로 동기화 큐에 추가합니다.');
              addToSyncTestResult(codeParam);
            } else {
              console.log('테스트 결과가 이미 서버에 동기화되어 있습니다.');
            }
          }
        })
        .catch(error => {
          console.error('테스트 결과 동기화 상태 확인 오류:', error);
        });
        
        return;
      }
      
      // 1. 테스트 데이터 생성
      const mbtiType = calculateDominantDirections(directionResults.percentages).join('');
      
      // 2. 테스트 결과 객체 생성
      const testResult = {
        code: resultCode,
        testType: 'MBTI',
        testDate: new Date().toISOString(),
        mbtiType,
        clientInfo,
        answers,
        timestamp: new Date().toISOString()
      };

      // 3. API를 통해 서버에 저장 시도
      saveTestResultToServer(testResult);
      
      // 저장 완료 상태로 설정
      setIsAlreadySaved(true);
      console.log('테스트 결과 저장 완료:', resultCode);
    } catch (error) {
      console.error('테스트 데이터 저장 중 오류 발생:', error);
    }
  }, [codeParam, resultCode, isCodeGenerated]); // answers와 directionResults 의존성 제거

  // API를 통해 테스트 결과 저장
  const saveTestResultToServer = async (testResult: any) => {
    try {
      // 1. 로컬에 먼저 저장 (즉시 UI 반응성 제공)
      setItem(`test-result-${testResult.code}`, testResult);
      
      // 2. API 호출로 DB에 저장
      if (!db) {
        throw new Error('Firestore가 초기화되지 않았습니다.');
      }
      await setDoc(doc(db, 'test_results', testResult.code), {
        ...testResult,
        savedAt: new Date(),
      });
      console.log('테스트 결과가 Firestore에 성공적으로 저장되었습니다.');
      // 테스트 기록 목록 업데이트 (로컬 캐시)
      updateLocalTestRecords(testResult);
      return true;
    } catch (error) {
      console.error('테스트 결과 Firestore 저장 오류:', error);
      // 오류 발생 시 동기화 큐에 추가
      addToSyncTestResult(testResult.code);
      return false;
    }
  };
  
  // 동기화 큐에 테스트 결과 추가
  const addToSyncTestResult = (code: string) => {
    try {
      // 로컬에서 테스트 결과 불러오기
      const testResult = getItem(`test-result-${code}`);
      if (testResult) {
        // 동기화 큐에 추가
        addToSyncQueue('test-result', testResult);
        console.log(`테스트 결과 ${code}가 동기화 큐에 추가되었습니다.`);
      } else {
        console.warn(`테스트 결과 ${code}를 로컬에서 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error('동기화 큐 추가 오류:', error);
    }
  };
  
  // 로컬 테스트 기록 업데이트
  const updateLocalTestRecords = (testResult: any) => {
    try {
      // 테스트 기록 객체 생성
      const newRecord = {
        code: testResult.code,
        timestamp: testResult.timestamp || new Date().toISOString(),
        testType: testResult.testType || 'MBTI 전문가용 검사',
        userData: {
          name: clientInfo?.name || '사용자',
          gender: clientInfo?.gender || '-',
          birthYear: clientInfo?.birthYear || null,
          testDate: testResult.testDate || new Date().toISOString(),
          groupCode: clientInfo?.groupCode || '-'
        },
        result: {
          mbtiType: testResult.mbtiType,
          scores: directionResults.scores,
          percentages: directionResults.percentages
        },
        status: '완료'
      };
      
      // 현재 로그인한 사용자 이메일 가져오기
      const currentUserData = localStorage.getItem('user');
      let currentUserEmail = null;
      
      if (currentUserData) {
        try {
          const userData = JSON.parse(currentUserData);
          currentUserEmail = userData.email;
        } catch (e) {
          console.error('사용자 데이터 파싱 오류:', e);
        }
      }
      
      // 사용자별 키로 저장
      const userSpecificKey = currentUserEmail ? `mbti-user-test-records-${currentUserEmail}` : 'mbti-user-test-records';
      
      // 기존 테스트 기록 불러오기 (사용자별)
      const existingRecords = getItem<any[]>(userSpecificKey) || [];
      
      // 중복 검사
      if (!existingRecords.some(record => record.code === testResult.code)) {
        existingRecords.unshift(newRecord); // 최신 기록을 앞에 추가
        
        // 최대 50개까지만 저장
        if (existingRecords.length > 50) {
          existingRecords.splice(50);
        }
        
        setItem(userSpecificKey, existingRecords);
        console.log(`전문가용 MBTI 검사 기록 저장 완료 (사용자: ${currentUserEmail || '익명'}). 현재 기록 수:`, existingRecords.length);
      } else {
        // 기존 기록 업데이트
        const updatedRecords = existingRecords.map(record => 
          record.code === testResult.code ? { ...record, ...newRecord } : record
        );
        setItem(userSpecificKey, updatedRecords);
        console.log(`기존 전문가용 MBTI 검사 기록 업데이트 완료 (사용자: ${currentUserEmail || '익명'})`);
      }
      
      // 기존 전역 키도 유지 (하위 호환성)
      const globalRecords = getItem<any[]>('test_records') || [];
      if (!globalRecords.some(record => record.code === testResult.code)) {
        globalRecords.unshift(newRecord);
        setItem('test_records', globalRecords);
      }
      
    } catch (error) {
      console.error('로컬 테스트 기록 업데이트 오류:', error);
    }
  };

  // 네트워크 상태 모니터링 설정
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // 동기화 모니터 설정
      setupSyncMonitor();
    }
  }, []);

  // 로딩 중일 때 표시할 UI
  if (isDataLoading) {
    return (
      <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
        <Navigation />
        <div className="h-20"></div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-blue-200">결과를 불러오는 중입니다...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      {/* 네비게이션 컴포넌트 추가 */}
      <Navigation />
      
      {/* Navigation 컴포넌트 높이만큼 여백 추가 */}
      <div className="h-20"></div>
      
      {/* 최상단으로 스크롤하는 버튼 - 스타일 수정 및 중복 버튼 문제 해결 */}
      <AnimatePresence mode="wait" initial={false}>
        {showScrollTop && (
          <motion.button
            ref={scrollButtonRef}
            key="scroll-top-button"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-[1000] flex flex-col items-center"
            aria-label="맨 위로 스크롤"
            style={{ pointerEvents: 'auto' }}
          >
            {/* 위로 이동 아이콘 원형 버튼 */}
            <div className="w-12 h-12 rounded-full bg-blue-600 shadow-lg flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </div>
            {/* "맨 위로 이동" 텍스트 버튼 */}
            <div className="mt-1 px-3 py-1 bg-blue-600 rounded-full shadow-md">
              <span className="text-xs font-medium text-white">맨 위로 이동</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="mb-8 relative">
          <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
            검사 결과
          </h1>
          <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
          
          <Link href="/mypage?tab=records" className="text-blue-300 hover:text-blue-200 transition-colors mt-4 inline-block">
            ← 검사기록 페이지로 돌아가기
          </Link>
        </div>

        {/* 검사자 결과정보 섹션 */}
        {clientInfo && (
          <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">검사결과 정보</h2>
              <div className="bg-blue-900/60 py-2 px-4 rounded-lg shadow-md border border-blue-700/50">
                <h3 className="text-sm font-medium text-blue-300">검사 결과 코드</h3>
                <p className="text-xl font-mono font-bold text-white">{resultCode}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientInfo.name && clientInfo.name !== "-" && (
                <div className="bg-white/10 p-4 rounded-lg border border-white/15">
                  <h3 className="text-sm font-medium text-blue-300">고유번호/예명/별명</h3>
                  <p className="text-xl font-semibold text-white">{clientInfo.name}</p>
                </div>
              )}
              
              <div className="bg-white/10 p-4 rounded-lg border border-white/15">
                <h3 className="text-sm font-medium text-blue-300">출생연도/성별</h3>
                <p className="text-xl font-semibold text-white">
                  {clientInfo.birthYear ? `${clientInfo.birthYear}년 (${new Date().getFullYear() - clientInfo.birthYear}세)` : '-'} / {clientInfo.gender || '-'}
                </p>
              </div>
              
              <div className="bg-white/10 p-4 rounded-lg border border-white/15">
                <h3 className="text-sm font-medium text-blue-300">검사일자</h3>
                <p className="text-xl font-semibold text-white">{testDate}</p>
              </div>
              
              {clientInfo.groupCode && (
                <div className="bg-white/10 p-4 rounded-lg border border-white/15">
                  <h3 className="text-sm font-medium text-blue-300">상담 코드</h3>
                  <p className="text-xl font-semibold text-white">{clientInfo.groupCode}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MBTI 유형 결과 섹션 */}
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg border border-white/20">
          <h2 className="text-2xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">
            나의 MBTI 유형 : {
              calculateDominantDirections(directionResults.percentages)
                .map((type, index) => (
                  <React.Fragment key={`mbti-type-${index}`}>
                    <span style={{ color: mbtiColors[type as keyof typeof mbtiColors] }}>
                      {type}
                    </span>
                    {index < 3 && <span className="mx-1"></span>}
                  </React.Fragment>
                ))
            }
          </h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { main: 'E', opposite: 'I', mainColor: '#4263EB', oppositeColor: '#8EA3FA' },
              { main: 'S', opposite: 'N', mainColor: '#10B981', oppositeColor: '#6EE7B7' },
              { main: 'T', opposite: 'F', mainColor: '#F59E0B', oppositeColor: '#FCD34D' },
              { main: 'J', opposite: 'P', mainColor: '#EC4899', oppositeColor: '#F9A8D4' }
            ].map((pair, index) => {
              const mainPercentage = directionResults.percentages[pair.main as keyof DirectionScores];
              const oppositePercentage = directionResults.percentages[pair.opposite as keyof DirectionScores];
              const isDominant = mainPercentage >= oppositePercentage;

              return (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between mb-2">
                    <div className="flex flex-col items-start h-12">
                      <span className={`${mainPercentage > oppositePercentage ? 'text-lg font-bold' : 'text-sm'} h-6 flex items-center`}
                        style={{ 
                          color: mainPercentage > oppositePercentage ? pair.mainColor : '#9CA3AF'
                        }}>
                        {pair.main}
                      </span>
                      <span className={`${mainPercentage > oppositePercentage ? 'text-base font-bold' : 'text-xs'} h-4 flex items-center mt-1`}
                        style={{ 
                          color: mainPercentage > oppositePercentage ? pair.mainColor : '#9CA3AF'
                        }}>
                        {mainPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-col items-end h-12">
                      <span className={`${oppositePercentage > mainPercentage ? 'text-lg font-bold' : 'text-sm'} h-6 flex items-center`}
                        style={{ 
                          color: oppositePercentage > mainPercentage ? pair.oppositeColor : '#9CA3AF'
                        }}>
                        {pair.opposite}
                      </span>
                      <span className={`${oppositePercentage > mainPercentage ? 'text-base font-bold' : 'text-xs'} h-4 flex items-center mt-1`}
                        style={{ 
                          color: oppositePercentage > mainPercentage ? pair.oppositeColor : '#9CA3AF'
                        }}>
                        {oppositePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        <div className="h-full" style={{ 
                          backgroundColor: pair.mainColor,
                          width: `${mainPercentage}%`
                        }}></div>
                        <div className="h-full" style={{ 
                          backgroundColor: pair.oppositeColor,
                          width: `${oppositePercentage}%`
                        }}></div>
                      </div>
                      <div className="absolute h-2 w-0.5 bg-white opacity-70" style={{ 
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: 0
                      }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 그래프 섹션 */}
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg border border-white/20">
          <h2 className="text-2xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">MBTI 성향 비교</h2>
          <div className="h-[300px] w-full">
            <Line data={lineChartData} options={{
              ...chartOptions,
              maintainAspectRatio: false,
              responsive: true
            }} />
          </div>
          {/* x축 레이블 커스텀 */}
          <div className="flex px-0 mt-2" style={{ marginLeft: '0', marginRight: '0', width: '100%' }}>
            <div className="flex-1 text-left">
              <span style={{ color: '#4263EB' }}>외향({normalizedScores.E.toFixed(1)}%)</span>
              <span className="mx-1">/</span>
              <span style={{ color: '#8EA3FA' }}>내향({normalizedScores.I.toFixed(1)}%)</span>
            </div>
            <div className="flex-1 text-center" style={{ transform: 'translateX(-25px)' }}>
              <span style={{ color: '#10B981' }}>감각({normalizedScores.S.toFixed(1)}%)</span>
              <span className="mx-1">/</span>
              <span style={{ color: '#6EE7B7' }}>직관({normalizedScores.N.toFixed(1)}%)</span>
            </div>
            <div className="flex-1 text-center" style={{ transform: 'translateX(30px)' }}>
              <span style={{ color: '#F59E0B' }}>사고({normalizedScores.T.toFixed(1)}%)</span>
              <span className="mx-1">/</span>
              <span style={{ color: '#FCD34D' }}>감정({normalizedScores.F.toFixed(1)}%)</span>
            </div>
            <div className="flex-1 text-right">
              <span style={{ color: '#EC4899' }}>판단({normalizedScores.J.toFixed(1)}%)</span>
              <span className="mx-1">/</span>
              <span style={{ color: '#F9A8D4' }}>인식({normalizedScores.P.toFixed(1)}%)</span>
            </div>
          </div>

          {/* 성향 비교 분석 */}
          <div className="mt-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span style={{ color: '#4263EB' }}>외향(E)</span>
                  <span className="mx-2">vs</span>
                  <span style={{ color: '#8EA3FA' }}>내향(I)</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  외향형은 외부 세계와의 상호작용을 통해 에너지를 얻으며, 내향형은 내면의 세계에서 에너지를 얻습니다.
                  당신은 {directionResults.percentages.E > directionResults.percentages.I ? '외향적' : '내향적'} 성향이 
                  {Math.abs(directionResults.percentages.E - directionResults.percentages.I).toFixed(1)}% 더 강합니다.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span style={{ color: '#10B981' }}>감각(S)</span>
                  <span className="mx-2">vs</span>
                  <span style={{ color: '#6EE7B7' }}>직관(N)</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  감각형은 구체적이고 실제적인 정보를 선호하며, 직관형은 가능성과 패턴을 중시합니다.
                  당신은 {directionResults.percentages.S > directionResults.percentages.N ? '감각적' : '직관적'} 성향이 
                  {Math.abs(directionResults.percentages.S - directionResults.percentages.N).toFixed(1)}% 더 강합니다.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span style={{ color: '#F59E0B' }}>사고(T)</span>
                  <span className="mx-2">vs</span>
                  <span style={{ color: '#FCD34D' }}>감정(F)</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  사고형은 논리와 객관성을 중시하며, 감정형은 가치와 조화를 중시합니다.
                  당신은 {directionResults.percentages.T > directionResults.percentages.F ? '사고적' : '감정적'} 성향이 
                  {Math.abs(directionResults.percentages.T - directionResults.percentages.F).toFixed(1)}% 더 강합니다.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <span style={{ color: '#EC4899' }}>판단(J)</span>
                  <span className="mx-2">vs</span>
                  <span style={{ color: '#F9A8D4' }}>인식(P)</span>
                </h3>
                <p className="text-gray-300 text-sm">
                  판단형은 계획적이고 체계적인 생활을 선호하며, 인식형은 유연하고 자유로운 생활을 선호합니다.
                  당신은 {directionResults.percentages.J > directionResults.percentages.P ? '판단적' : '인식적'} 성향이 
                  {Math.abs(directionResults.percentages.J - directionResults.percentages.P).toFixed(1)}% 더 강합니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 방향성 점수 */}
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg border border-white/20">
          <h2 className="text-2xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">방향성 점수</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-center">외향 / 내향</h3>
              <div className="flex justify-between mb-2">
                <span className="text-blue-400">E: {directionResults.percentages.E.toFixed(1)}%</span>
                <span className="text-blue-300">I: {directionResults.percentages.I.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-blue-200/70 flex justify-between">
                <span>점수: {directionResults.scores.E.toFixed(1)}/{maxCodeScores.E.toFixed(1)}</span>
                <span>점수: {directionResults.scores.I.toFixed(1)}/{maxCodeScores.I.toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-center">감각 / 직관</h3>
              <div className="flex justify-between mb-2">
                <span className="text-green-400">S: {directionResults.percentages.S.toFixed(1)}%</span>
                <span className="text-green-300">N: {directionResults.percentages.N.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-blue-200/70 flex justify-between">
                <span>점수: {directionResults.scores.S.toFixed(1)}/{maxCodeScores.S.toFixed(1)}</span>
                <span>점수: {directionResults.scores.N.toFixed(1)}/{maxCodeScores.N.toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-center">사고 / 감정</h3>
              <div className="flex justify-between mb-2">
                <span className="text-amber-400">T: {directionResults.percentages.T.toFixed(1)}%</span>
                <span className="text-amber-300">F: {directionResults.percentages.F.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-blue-200/70 flex justify-between">
                <span>점수: {directionResults.scores.T.toFixed(1)}/{maxCodeScores.T.toFixed(1)}</span>
                <span>점수: {directionResults.scores.F.toFixed(1)}/{maxCodeScores.F.toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-center">판단 / 인식</h3>
              <div className="flex justify-between mb-2">
                <span className="text-pink-400">J: {directionResults.percentages.J.toFixed(1)}%</span>
                <span className="text-pink-300">P: {directionResults.percentages.P.toFixed(1)}%</span>
              </div>
              <div className="text-sm text-blue-200/70 flex justify-between">
                <span>점수: {directionResults.scores.J.toFixed(1)}/{maxCodeScores.J.toFixed(1)}</span>
                <span>점수: {directionResults.scores.P.toFixed(1)}/{maxCodeScores.P.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 질문별 선택 결과 */}
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 mb-6 shadow-lg border border-white/20">
          <h2 className="text-2xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-200">질문별 선택 결과</h2>
          <div className="space-y-3">
            {Object.entries(answers).map(([questionIndex, answer]) => {
              const questionNumber = parseInt(questionIndex);
              
              // questions 배열에 해당 인덱스가 없는 경우 처리
              if (isNaN(questionNumber) || questionNumber >= questions.length || !questions[questionNumber]) {
                return null;
              }
              
              const question = questions[questionNumber];
              const directionColor = {
                E: '#4263EB', I: '#8EA3FA',
                S: '#10B981', N: '#6EE7B7',
                T: '#F59E0B', F: '#FCD34D',
                J: '#EC4899', P: '#F9A8D4'
              };
              const direction = question.direction as DirectionKey;
              const answerLabels = ['매우 그렇다', '그렇다', '약간 그렇다', '약간 아니다', '아니다', '매우 아니다', '모르겠다'];
              // 가중치 계산
              const weightedScore = answer * (question.codeScore / 100);
              
              return (
                <div key={questionIndex} className="bg-white/5 p-4 rounded-lg flex items-center justify-between border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-1">
                      <span className="text-sm text-blue-300">문항 {parseInt(questionIndex) + 1}</span>
                      <span className="text-sm font-semibold" style={{ color: directionColor[direction] }}>
                        {direction} ({question.codeScore}%)
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{question.text}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <span className="text-white whitespace-nowrap">{answerLabels[6 - answer]}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-blue-300/70 text-xs whitespace-nowrap">선택: {answer}점</span>
                      <span className="text-blue-300 text-xs whitespace-nowrap">환산: {weightedScore.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 결과 관련 버튼 섹션 */}
        <div className="bg-white/15 backdrop-blur-md rounded-xl p-6 mt-6 shadow-lg border border-white/20">
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => {
                window.print();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-md"
            >
              PDF저장 / 인쇄하기
            </button>
            <Link 
              href="/mypage?tab=records"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-md flex items-center"
            >
              검사기록 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default MbtiProResult;