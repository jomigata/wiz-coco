'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { generateTestCode } from '@/utils/testCodeGenerator';

// MBTI 유형별 설명
const mbtiDescriptions: Record<string, { title: string; description: string }> = {
  'ISTJ': {
    title: '청렴결백한 논리주의자',
    description: '사실을 중시하는 믿음직한 현실주의자입니다. 체계적이고 책임감이 강하며, 규칙과 전통을 중시합니다.'
  },
  'ISFJ': {
    title: '용감한 수호자',
    description: '헌신적이고 따뜻한 수호자입니다. 세심하게 관찰하며 타인의 필요에 민감하게 반응합니다.'
  },
  'INFJ': {
    title: '선의의 옹호자',
    description: '조용하고 신비로운 통찰력을 가진 이상주의자입니다. 타인의 감정에 민감하며 깊은 연결을 추구합니다.'
  },
  'INTJ': {
    title: '용의주도한 전략가',
    description: '독창적인 생각과 강한 의지를 가진 전략가입니다. 분석적이고 논리적이며, 목표 달성을 위해 체계적으로 계획합니다.'
  },
  'ISTP': {
    title: '만능 재주꾼',
    description: '대담하고 실용적인 문제 해결사입니다. 현실적이고 적응력이 뛰어나며, 상황에 따라 효율적으로 행동합니다.'
  },
  'ISFP': {
    title: '호기심 많은 예술가',
    description: '따뜻하고 감성적인 창작자입니다. 자유로운 영혼을 가지고 있으며, 삶의 아름다움을 발견하고 표현합니다.'
  },
  'INFP': {
    title: '열정적인 중재자',
    description: '이상을 추구하는 감성적인 사람입니다. 창의적이고 공감 능력이 뛰어나며, 자신과 타인의 성장을 중요시합니다.'
  },
  'INTP': {
    title: '논리적인 사색가',
    description: '지적 호기심이 많은 혁신가입니다. 논리적이고 창의적인 사고를 하며, 복잡한 문제를 해결하는 것을 즐깁니다.'
  },
  'ESTP': {
    title: '모험을 즐기는 사업가',
    description: '활동적이고 실용적인 즉흥주의자입니다. 적응력이 뛰어나고 위험을 감수하며, 현재에 충실하게 살아갑니다.'
  },
  'ESFP': {
    title: '자유로운 영혼의 연예인',
    description: '열정적이고 활기찬 연예인 기질의 사람입니다. 사교적이고 즐거움을 추구하며, 삶을 즐기고 다른 사람들도 즐겁게 합니다.'
  },
  'ENFP': {
    title: '재기발랄한 활동가',
    description: '열정적이고 창의적인 자유로운 영혼입니다. 가능성을 발견하는 것을 좋아하며, 다양한 사람들과 새로운 경험을 추구합니다.'
  },
  'ENTP': {
    title: '논쟁을 즐기는 변론가',
    description: '영리하고 호기심 많은 사상가입니다. 도전적이고 창의적이며, 새로운 아이디어와 지적 자극을 즐깁니다.'
  },
  'ESTJ': {
    title: '엄격한 관리자',
    description: '실용적이고 체계적인 관리자입니다. 책임감 있고 질서정연하며, 효율적인 결과를 이끌어내기 위해 노력합니다.'
  },
  'ESFJ': {
    title: '사교적인 외교관',
    description: '친절하고 사교적인 보살핌 주는 사람입니다. 조화와 협력을 중요시하며, 타인의 필요에 민감하게 반응합니다.'
  },
  'ENFJ': {
    title: '정의로운 사회운동가',
    description: '카리스마 있고 영감을 주는 지도자입니다. 타인의 성장과 발전을 돕고 긍정적인 변화를 이끌어내는 데 열정적입니다.'
  },
  'ENTJ': {
    title: '대담한 통솔자',
    description: '대담하고 결단력 있는 지도자입니다. 효율적이고 전략적인 사고를 하며, 목표를 달성하기 위해 체계적으로 계획하고 실행합니다.'
  }
};

// 고유한 테스트 코드 생성 함수
const generateUniqueTestCode = () => {
  return generateTestCode('AMATEUR');
};

// 메인 컨텐츠 컴포넌트
function MbtiResultContent() {
  const searchParams = useSearchParams();
  const [mbtiType, setMbtiType] = useState<string>('');
  const [testCode, setTestCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  
  useEffect(() => {
    // URL 파라미터에서 테스트 코드와 MBTI 유형 가져오기
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    
    if (code) {
      setTestCode(code);
      fetchTestResult(code);
    } else {
      // 코드가 없으면 새로 생성
      const newCode = generateUniqueTestCode();
      setTestCode(newCode);
    }
    
    if (type) {
      setMbtiType(type.toUpperCase());
      setIsLoading(false);
    }
  }, [searchParams]);
  
  // 테스트 결과 가져오기
  const fetchTestResult = async (code: string) => {
    try {
      console.log('[MbtiResult] 테스트 코드로 결과 조회 시작:', code);
      
      // 1. 먼저 로컬 스토리지에서 찾기
      const localResult = getTestResultFromLocalStorage(code);
      if (localResult) {
        console.log('[MbtiResult] 로컬 스토리지에서 결과 발견:', localResult);
        setTestResult(localResult);
        
        // MBTI 타입 계산 및 설정
        const calculatedMbtiType = calculateMbtiType(localResult.answers);
        setMbtiType(calculatedMbtiType);
        setIsLoading(false);
        return;
      }

      // 2. 로컬에서 찾지 못한 경우 API 시도
      console.log('[MbtiResult] 로컬 스토리지에서 찾지 못함, API 요청 시도');
      const response = await fetch(`/api/save-test-result?code=${code}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          console.log('[MbtiResult] API에서 결과 조회 성공:', data.data);
          setTestResult(data.data);
          if (data.data.mbtiType) {
            setMbtiType(data.data.mbtiType.toUpperCase());
          }
        } else {
          console.warn('[MbtiResult] API 응답에 데이터가 없음');
          setError('테스트 결과를 찾을 수 없습니다. 테스트를 다시 시도해주세요.');
        }
      } else {
        console.warn('[MbtiResult] API 응답 오류:', response.status);
        const errorData = await response.json();
        setError(errorData.message || '테스트 결과를 불러올 수 없습니다.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('[MbtiResult] 테스트 결과 로드 오류:', error);
      setError('테스트 결과를 불러오는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 로컬 스토리지에서 테스트 결과 가져오기
  const getTestResultFromLocalStorage = (code: string) => {
    try {
      // 직접 코드로 저장된 결과 찾기
      const directResult = localStorage.getItem(`test-result-${code}`);
      if (directResult) {
        return JSON.parse(directResult);
      }

      // 사용자별 검사 기록에서 찾기
      const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').email : null;
      if (userEmail) {
        const userRecordsKey = `mbti-user-test-records-${userEmail}`;
        const userRecords = localStorage.getItem(userRecordsKey);
        if (userRecords) {
          const records = JSON.parse(userRecords);
          const foundRecord = records.find((record: any) => record.testCode === code);
          if (foundRecord && foundRecord.userData) {
            return foundRecord.userData;
          }
        }
      }

      // 최근 검사 결과에서 찾기 (코드가 일치하지 않더라도)
      if (typeof window !== 'undefined') {
        const recentCode = localStorage.getItem('mbti_test_code');
        if (recentCode === code) {
          const recentResult = localStorage.getItem(`test-result-${recentCode}`);
          if (recentResult) {
            return JSON.parse(recentResult);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('[MbtiResult] 로컬 스토리지 조회 오류:', error);
      return null;
    }
  };

  // MBTI 타입 계산 함수
  const calculateMbtiType = (answers: { [key: string]: { type: string; answer: number } }) => {
    const typeScores = {
      'E': 0, 'I': 0,
      'S': 0, 'N': 0,
      'T': 0, 'F': 0,
      'J': 0, 'P': 0
    };

    // 답변 분석
    Object.values(answers).forEach(answer => {
      const { type, answer: score } = answer;
      
      if (type === 'E-I') {
        if (score >= 5) {
          typeScores.E += score - 4;
        } else {
          typeScores.I += 4 - score;
        }
      } else if (type === 'S-N') {
        if (score >= 5) {
          typeScores.S += score - 4;
        } else {
          typeScores.N += 4 - score;
        }
      } else if (type === 'T-F') {
        if (score >= 5) {
          typeScores.T += score - 4;
        } else {
          typeScores.F += 4 - score;
        }
      } else if (type === 'J-P') {
        if (score >= 5) {
          typeScores.J += score - 4;
        } else {
          typeScores.P += 4 - score;
        }
      }
    });

    // 우세한 타입 결정
    const mbtiType = 
      (typeScores.E >= typeScores.I ? 'E' : 'I') +
      (typeScores.S >= typeScores.N ? 'S' : 'N') +
      (typeScores.T >= typeScores.F ? 'T' : 'F') +
      (typeScores.J >= typeScores.P ? 'J' : 'P');

    console.log('[MbtiResult] 계산된 MBTI 타입:', mbtiType, '점수:', typeScores);
    return mbtiType;
  };
  
  // 테스트 결과 공유 기능
  const shareResult = () => {
    const shareData = {
      title: `내 MBTI 결과는 ${mbtiType}입니다!`,
      text: `${mbtiDescriptions[mbtiType]?.title || mbtiType} - ${mbtiDescriptions[mbtiType]?.description || ''}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => {
          console.log('결과 공유 성공');
        })
        .catch(err => {
          console.error('공유 오류:', err);
          fallbackShare();
        });
    } else {
      fallbackShare();
    }
  };

  // 공유 API를 지원하지 않는 브라우저를 위한 폴백
  const fallbackShare = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert('결과 주소가 클립보드에 복사되었습니다!');
        })
        .catch(err => {
          console.error('클립보드 복사 오류:', err);
          // 클립보드 API도 실패한 경우 텍스트 선택 방식 사용
          const textArea = document.createElement('textarea');
          textArea.value = window.location.href;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            alert('결과 주소가 복사되었습니다!');
          } catch (err) {
            console.error('텍스트 복사 실패:', err);
            alert('주소 복사에 실패했습니다. 수동으로 복사해주세요.');
          }
          document.body.removeChild(textArea);
        });
    } else {
      // 모든 복사 방법이 실패한 경우
      alert(`결과 주소: ${window.location.href}`);
    }
  };
  
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
      
      <div className="container mx-auto max-w-4xl relative z-10 px-4 py-6">
        {isLoading ? (
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-blue-200">결과를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
            <div className="text-red-300 mb-4 text-4xl">⚠️</div>
            <p className="text-white text-lg mb-6">{error}</p>
            <Link href="/tests/mbti" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              테스트 다시 하기
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 헤더 섹션 */}
            <div className="mb-8 relative">
              <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
                MBTI 검사 결과
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
              <p className="text-blue-200 mt-4">
                테스트 코드: <span className="font-mono font-semibold">{testCode}</span>
              </p>
            </div>

            {/* MBTI 유형 결과 카드 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
              <div className="text-center">
                <div className="inline-block p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl border border-white/20 mb-6">
                  <h2 className="text-6xl font-bold text-white mb-2">{mbtiType}</h2>
                </div>
                <h3 className="text-2xl font-semibold text-blue-200 mb-4">
                  {mbtiDescriptions[mbtiType]?.title || '성격 유형'}
                </h3>
                <p className="text-white text-lg leading-relaxed max-w-2xl mx-auto">
                  {mbtiDescriptions[mbtiType]?.description || '성격 유형 설명이 준비되지 않았습니다.'}
                </p>
              </div>
            </div>

            {/* 추가 정보 섹션 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">검사 완료 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                <div>
                  <span className="text-blue-300 font-medium">검사 일시:</span>
                  <span className="ml-2">{new Date().toLocaleString('ko-KR')}</span>
                </div>
                <div>
                  <span className="text-blue-300 font-medium">검사 유형:</span>
                  <span className="ml-2">개인용 MBTI 검사</span>
                </div>
              </div>
            </div>
            
            {/* 버튼 그룹 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={shareResult}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg"
              >
                결과 공유하기
              </button>
              <Link 
                href="/tests/mbti"
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg text-center"
              >
                테스트 다시 하기
              </Link>
            </div>

            {/* 안내 메시지 */}
            <div className="mt-8 p-4 rounded-lg bg-white/5 text-center border border-white/10">
              <p className="text-blue-200 text-sm">
                이 결과는 MBTI 이론을 기반으로 한 일반적인 성향을 보여줍니다. 
                개인의 성격은 더 복잡하며 다양한 요소에 영향을 받을 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// 로딩 컴포넌트
function MbtiResultLoading() {
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
          <p className="text-xl text-blue-200">결과 페이지를 불러오는 중입니다...</p>
        </div>
      </div>
    </main>
  );
}

// 메인 페이지 컴포넌트
export default function MbtiResultPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Suspense fallback={<MbtiResultLoading />}>
        <MbtiResultContent />
      </Suspense>
    </div>
  );
} 