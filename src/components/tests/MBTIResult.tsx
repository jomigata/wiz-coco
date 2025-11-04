'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { mbtiDescriptions } from '@/data/mbtiDescriptions';
import { questions } from '@/data/mbtiQuestions';
import { useRouter } from 'next/navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';

interface Props {
  results: { [key: string]: { type: string; answer: number } };
  onRetake: () => void;
}

export default function MBTIResult({ results, onRetake }: Props) {
  const router = useRouter();
  // 검사 완료 시간
  const [testDateTime, setTestDateTime] = useState<Date>(new Date());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [testCode, setTestCode] = useState<string>('');

  // 컴포넌트 마운트 시 테스트 완료 시간 설정 및 로그인 상태 확인
  useEffect(() => {
    // 로그인 상태 확인
    const loginStatus = typeof window !== 'undefined' ? localStorage.getItem('isLoggedIn') === 'true' : false;
    setIsLoggedIn(loginStatus);

    if (typeof window !== 'undefined') {
      const savedTimeStr = localStorage.getItem('mbti_completion_time');
      if (savedTimeStr) {
        try {
          const savedTime = new Date(savedTimeStr);
          setTestDateTime(savedTime);
        } catch (e) {
          console.error('저장된 검사 완료 시간 파싱 오류:', e);
        }
      } else {
        // 저장된 시간이 없으면 현재 시간 저장
        const now = new Date();
        localStorage.setItem('mbti_completion_time', now.toISOString());
        setTestDateTime(now);
      }
      
      // 검사 코드 생성 또는 가져오기
      let savedTestCode = localStorage.getItem('mbti_test_code');
      if (!savedTestCode) {
        savedTestCode = generateTestCode('AMATEUR');
        localStorage.setItem('mbti_test_code', savedTestCode);
      }
      setTestCode(savedTestCode);
    }
  }, []);

  // 검사기록 페이지로 이동
  const handleGoToTestRecords = () => {
    router.push('/mypage?tab=records');
  };

  // MBTI 타입과 점수 계산
  const calculateTypeAndScores = () => {
    type ScoreType = {
      [key in 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P']: number;
    };

    const scores: ScoreType = {
      E: 0, I: 0, S: 0, N: 0,
      T: 0, F: 0, J: 0, P: 0
    };

    // 각 차원별 총점 계산
    Object.values(results).forEach(({ type, answer }) => {
      const [dimension, direction] = type.split('_');
      
      if (direction === 'P') {
        scores[dimension as keyof ScoreType] += answer;
      } else {
        scores[dimension as keyof ScoreType] += (8 - answer); // 7점 척도의 역산
      }
    });

    // 각 지표별 백분율 계산
    const calculatePercentage = (score1: number, score2: number) => {
      const total = score1 + score2;
      const percentage = (score1 / total) * 100;
      return Math.round(percentage);
    };

    const type = [
      scores.E > scores.I ? 'E' : 'I',
      scores.S > scores.N ? 'S' : 'N',
      scores.T > scores.F ? 'T' : 'F',
      scores.J > scores.P ? 'J' : 'P'
    ].join('');

    const strengths = {
      EI: calculatePercentage(scores.E, scores.I),
      SN: calculatePercentage(scores.S, scores.N),
      TF: calculatePercentage(scores.T, scores.F),
      JP: calculatePercentage(scores.J, scores.P)
    };

    return { type, strengths, scores };
  };

  const handlePrint = () => {
    window.print();
  };

  // 결과 저장 - 파일 또는 DB
  const handleSave = async () => {
    // 파일로 저장
    const data = {
      type: typeResult.type,
      answers: results,
      date: testDateTime.toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mbti-result-${testDateTime.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeResult = calculateTypeAndScores();
  const description = mbtiDescriptions[typeResult.type];

  // 성향 강도에 따른 요약 메시지 생성
  const getSummary = () => {
    const { strengths } = typeResult;
    const strongTraits = [];
    
    if (strengths.EI > 70) strongTraits.push(typeResult.type.includes('E') ? '매우 외향적' : '매우 내향적');
    if (strengths.SN > 70) strongTraits.push(typeResult.type.includes('S') ? '현실 중심적' : '직관 중심적');
    if (strengths.TF > 70) strongTraits.push(typeResult.type.includes('T') ? '논리 중심적' : '감정 중심적');
    if (strengths.JP > 70) strongTraits.push(typeResult.type.includes('J') ? '계획 중심적' : '적응 중심적');

    return strongTraits.length > 0
      ? `당신은 ${strongTraits.join(', ')}인 ${typeResult.type} 유형입니다.`
      : `당신은 비교적 균형 잡힌 ${typeResult.type} 유형입니다.`;
  };

  const renderPersonalityBar = (label1: string, label2: string, percentage: number, color: string) => {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="text-sm font-medium text-emerald-200">{label1}</span>
            <span className="ml-2 text-sm text-emerald-400">{percentage}%</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-emerald-400">{100 - percentage}%</span>
            <span className="text-sm font-medium text-emerald-200">{label2}</span>
          </div>
        </div>
        <div className="relative h-6 bg-emerald-800/50 rounded-lg overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full ${color} transition-all duration-1000 ease-out flex items-center justify-center`}
            style={{ width: `${percentage}%` }}
          >
            <span className="text-xs font-medium text-white">{percentage}%</span>
          </div>
          <div
            className="absolute top-0 right-0 h-full bg-emerald-700/50 flex items-center justify-center"
            style={{ width: `${100 - percentage}%` }}
          >
            <span className="text-xs font-medium text-emerald-200">{100 - percentage}%</span>
          </div>
        </div>
      </div>
    );
  };

  const calculateScores = () => {
    // 각 항목별 점수 계산
    const calculateItemScore = (type: string) => {
      const relevantAnswers = Object.values(results).filter(answer => answer.type.startsWith(type));
      if (relevantAnswers.length === 0) return 0;
      
      const totalScore = relevantAnswers.reduce((sum, answer) => sum + answer.answer, 0);
      return Math.round((totalScore / (relevantAnswers.length * 7)) * 100); // 7점 척도 기준으로 100점 만점 환산
    };

    return {
      interpersonal: calculateItemScore('E'),      // 대인관계 (외향성 관련 문항)
      selfEsteem: calculateItemScore('I'),         // 자존감 (내향성 관련 문항)
      familyRelation: calculateItemScore('S'),     // 가족관계 (감각형 관련 문항)
      mentalHealth: calculateItemScore('N'),       // 정신건강 (직관형 관련 문항)
      socialAdaptation: calculateItemScore('T'),   // 사회적응력 (사고형 관련 문항)
      academicWork: calculateItemScore('F')        // 학업/직무 (감정형 관련 문항)
    };
  };

  const renderLineGraph = () => {
    const scores = calculateScores();
    const categories = [
      { key: 'interpersonal', label: '대인관계' },
      { key: 'selfEsteem', label: '자존감' },
      { key: 'familyRelation', label: '가족관계' },
      { key: 'mentalHealth', label: '정신건강' },
      { key: 'socialAdaptation', label: '사회적응력' },
      { key: 'academicWork', label: '학업/직무' }
    ];

    const scoreValues = categories.map(cat => scores[cat.key as keyof typeof scores]);
    const spacing = 600 / (categories.length - 1);

    return (
      <div className="w-full p-6 bg-white rounded-xl shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">심리검사비교 프로파일 및 분석결과</h3>
        
        {/* 그래프 영역 */}
        <div className="relative h-[300px] mb-8">
          {/* Y축 눈금 */}
          <div className="absolute left-0 h-full flex flex-col justify-between text-sm text-gray-500">
            {[100, 80, 60, 40, 20, 0].map((value) => (
              <div key={value} className="relative h-0">
                <span className="absolute right-2 transform -translate-y-1/2">{value}</span>
                <div className="absolute left-8 w-[calc(100%+32px)] h-[1px] bg-gray-200" />
              </div>
            ))}
          </div>

          {/* 그래프 본체 */}
          <div className="ml-12 h-full flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* 영역 채우기 */}
              <path
                d={`
                  M ${scoreValues.map((score, i) => `${i * spacing},${300 - (score * 3)}`).join(' L ')}
                  L ${(categories.length - 1) * spacing},300
                  L 0,300 Z
                `}
                fill="url(#gradient)"
              />

              {/* 선 그래프 */}
              <polyline
                points={scoreValues.map((score, i) => `${i * spacing},${300 - (score * 3)}`).join(' ')}
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
              />

              {/* 데이터 포인트 */}
              {scoreValues.map((score, i) => (
                <g key={i}>
                  <circle
                    cx={i * spacing}
                    cy={300 - (score * 3)}
                    r="4"
                    fill="#4F46E5"
                  />
                  <text
                    x={i * spacing}
                    y={300 - (score * 3) - 10}
                    textAnchor="middle"
                    className="text-sm fill-gray-600 font-medium"
                  >
                    {score}%
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* X축 카테고리 */}
          <div className="ml-12 flex justify-between text-sm text-gray-600 mt-4">
            {categories.map(({ label }) => (
              <div key={label} className="text-center transform -rotate-45 origin-top-left" style={{ width: '100px' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* 분석 결과 테이블 */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">항목별 상세 분석</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(({ key, label }) => (
              <div key={key} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-lg font-bold text-blue-600">{scores[key as keyof typeof scores]}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${scores[key as keyof typeof scores]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 결과 카드 */}
      <div className="mb-12 relative rounded-2xl overflow-hidden">
        <div className="bg-emerald-800/50 backdrop-blur-sm p-8 border border-emerald-700/50 rounded-xl">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-2 bg-emerald-600/30 rounded-full text-emerald-200 text-sm font-medium mb-4">
              {new Date(testDateTime).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {testCode && (
              <div className="inline-block px-4 py-2 bg-blue-600/30 rounded-full text-blue-200 text-sm font-medium mb-4 ml-2">
                검사코드: {testCode}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold text-white mt-2 mb-2">{typeResult.type}</h1>
            <p className="text-2xl text-emerald-300 font-medium">{description.nickname || ''}</p>
          </div>

          <div className="space-y-6 mb-12">
            <div className="bg-emerald-900/50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-emerald-200 mb-4">성향 강도</h2>
              {renderPersonalityBar('외향 (E)', '내향 (I)', 
                typeResult.type.includes('E') ? typeResult.strengths.EI : 100 - typeResult.strengths.EI, 
                typeResult.type.includes('E') ? 'bg-emerald-500' : 'bg-teal-500')}
              {renderPersonalityBar('감각 (S)', '직관 (N)', 
                typeResult.type.includes('S') ? typeResult.strengths.SN : 100 - typeResult.strengths.SN, 
                typeResult.type.includes('S') ? 'bg-emerald-500' : 'bg-teal-500')}
              {renderPersonalityBar('사고 (T)', '감정 (F)', 
                typeResult.type.includes('T') ? typeResult.strengths.TF : 100 - typeResult.strengths.TF, 
                typeResult.type.includes('T') ? 'bg-emerald-500' : 'bg-teal-500')}
              {renderPersonalityBar('판단 (J)', '인식 (P)', 
                typeResult.type.includes('J') ? typeResult.strengths.JP : 100 - typeResult.strengths.JP, 
                typeResult.type.includes('J') ? 'bg-emerald-500' : 'bg-teal-500')}
            </div>

            <div className="bg-emerald-900/50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-emerald-200 mb-4">특성 요약</h2>
              <p className="text-emerald-200 text-lg mb-6">{getSummary()}</p>
              <h3 className="text-lg font-medium text-emerald-300 mb-3">주요 특징</h3>
              <ul className="list-disc list-inside text-emerald-200 space-y-2">
                {description.traits && description.traits.map((trait, i) => (
                  <li key={i}>{trait}</li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-emerald-900/50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-emerald-200 mb-4">강점</h2>
                <ul className="list-disc list-inside text-emerald-200 space-y-2">
                  {description.strengths && description.strengths.map((strength, i) => (
                    <li key={i}>{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-emerald-900/50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-emerald-200 mb-4">약점</h2>
                <ul className="list-disc list-inside text-emerald-200 space-y-2">
                  {description.weaknesses && description.weaknesses.map((weakness, i) => (
                    <li key={i}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-emerald-900/50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-emerald-200 mb-4">인간관계</h2>
              <p className="text-emerald-200 mb-6">{description.relationships}</p>

              <h3 className="text-lg font-medium text-emerald-300 mb-3">좋은 관계를 형성하는 유형</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {description.compatibleTypes && description.compatibleTypes.map((type) => (
                  <span key={type} className="px-3 py-1 bg-emerald-700 text-emerald-200 rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>

              <h3 className="text-lg font-medium text-emerald-300 mb-3">갈등 가능성이 있는 유형</h3>
              <div className="flex flex-wrap gap-2">
                {description.incompatibleTypes && description.incompatibleTypes.map((type) => (
                  <span key={type} className="px-3 py-1 bg-emerald-700/50 text-emerald-300 rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-emerald-900/50 p-6 rounded-xl">
              <h2 className="text-xl font-semibold text-emerald-200 mb-4">직업 적합성</h2>
              <p className="text-emerald-200 mb-6">{description.careerPaths?.description}</p>

              <h3 className="text-lg font-medium text-emerald-300 mb-3">추천 직업</h3>
              <div className="flex flex-wrap gap-2">
                {description.careerPaths?.recommendations && description.careerPaths.recommendations.map((career, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-700 text-emerald-200 rounded-full text-sm">
                    {career}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-emerald-400 text-sm">
        <p>본 검사는 MBTI에 기반한 심리검사로 절대적인 결과가 아닌 참고용으로만 활용해주세요.</p>
      </div>

      {/* 액션 버튼들 */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        {isLoggedIn && (
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                // 검사 완료 직후인지 확인
                const testJustCompleted = sessionStorage.getItem('testJustCompleted');
                if (testJustCompleted === 'true') {
                  sessionStorage.removeItem('testJustCompleted');
                  // 검사 완료 직후는 무조건 검사기록 목록으로 이동
                  router.push('/mypage?tab=records');
                  return;
                }
                
                // 검사기록 목록이나 삭제코드 목록에서 접근한 경우 이전 페이지로 이동
                router.back();
              }
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md"
          >
            뒤로 돌아가기
          </button>
        )}
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md"
        >
          결과 인쇄하기
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors shadow-md"
        >
          파일로 저장
        </button>
        <button
          onClick={onRetake}
          className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors shadow-md"
        >
          다시 검사하기
        </button>
      </div>
      
      {!isLoggedIn && (
        <div className="mt-8 p-6 bg-indigo-900/30 border border-indigo-500/30 rounded-lg text-center">
          <p className="text-indigo-200 mb-4">
            검사 결과를 영구적으로 저장하고 보다 많은 분석 기능을 사용하려면 회원가입하세요.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/login"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              로그인
            </Link>
            <Link 
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              회원가입
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 