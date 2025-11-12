'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import MBTIResult from '@/components/tests/MBTIResult';
import MbtiProResult from '@/components/tests/MbtiProResult';

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

// 로딩 컴포넌트
const LoadingResults = () => (
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

// 클라이언트 컴포넌트
function MbtiGraphResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>({});
  
  // URL 파라미터 가져오기
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // mbti, enneagram, ego-ok 등
  
  // 테스트 다시 하기 핸들러
  const handleRetake = () => {
    window.location.href = '/tests/mbti';
  };
  
  // 로컬 스토리지에서 테스트 결과 불러오기 
  useEffect(() => {
    const loadTestData = async () => {
      try {
        setIsLoading(true);
        
        // 코드 파라미터 유효성 검사
        if (!code) {
          setErrorMessage('테스트 코드가 없습니다. 마이페이지에서 테스트 결과를 선택해주세요.');
          setIsLoading(false);
          return;
        }
        
        // 로컬 스토리지에서 바로 결과 표시 여부 확인
        const showGraphResult = localStorage.getItem('show_graph_result');
        if (showGraphResult === 'true') {
          // 사용 후 제거
          localStorage.removeItem('show_graph_result');
        }
        
        // 테스트 유형 확인
        const testType = type || 'mbti';
        
        // 전문가용 MBTI 결과인 경우 해당 결과 페이지로 리디렉션
        if (testType.toLowerCase() === 'pro' || testType.toLowerCase() === 'mbti_pro' || testType.toLowerCase() === 'mbti-pro') {
          // 로컬 스토리지에서 데이터 가져오기
          try {
            const dataStr = localStorage.getItem(`test-result-${code}`);
            if (dataStr) {
              const testData = JSON.parse(dataStr);
              
              // 결과 데이터가 있으면 전문가용 결과 페이지로 리디렉션
              if (testData) {
                const redirectUrl = `/tests/mbti_pro/result?code=${code}`;
                setShouldRedirect(redirectUrl);
                return;
              }
            }
          } catch (e) {
            console.error('데이터 파싱 오류:', e);
          }
        }
        
        // 로컬 스토리지에서 테스트 결과 가져오기
        try {
          // 1. test_records에서 검색
          const testRecordsStr = localStorage.getItem('test_records');
          if (testRecordsStr) {
            const records = JSON.parse(testRecordsStr);
            const record = records.find((r: any) => r.code === code);
            
            if (record && record.result) {
              console.log('테스트 기록에서 결과를 찾았습니다:', record);
              setTestResults(record.result.answers || {});
              setIsLoading(false);
              return;
            }
          }
          
          // 2. test-result-[code] 키로 검색
          const resultStr = localStorage.getItem(`test-result-${code}`);
          if (resultStr) {
            const result = JSON.parse(resultStr);
            if (result && result.answers) {
              console.log('로컬 스토리지에서 결과를 찾았습니다:', result);
              setTestResults(result.answers);
              setIsLoading(false);
              return;
            }
          }
          
          // 3. 결과를 찾지 못한 경우
          setErrorMessage('해당 코드의 테스트 결과를 찾을 수 없습니다.');
        } catch (e) {
          console.error('로컬 스토리지 검색 오류:', e);
          setErrorMessage('결과 데이터를 파싱하는 중 오류가 발생했습니다.');
        }
        
        setIsLoading(false);
      } catch (e) {
        console.error('결과 로딩 오류:', e);
        setErrorMessage('결과를 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    loadTestData();
  }, [code, type]);
  
  // 리디렉션 처리
  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = shouldRedirect;
    }
  }, [shouldRedirect]);
  
  // 로딩 중 표시
  if (isLoading) {
    return <LoadingResults />;
  }
  
  // 에러 메시지 표시
  if (errorMessage) {
    return (
      <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
        <Navigation />
        <div className="h-20"></div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
            <h1 className="text-2xl font-bold text-white mb-4">결과 불러오기 오류</h1>
            <p className="text-blue-200 mb-6">{errorMessage}</p>
            <Link href="/mypage/test-records" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
              테스트 기록으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }
  
  // 결과 컴포넌트 표시 - 로컬 스토리지에서 가져온 데이터 사용
  return (
    <div className="min-h-screen">
      <Navigation />
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
          <div className="space-y-8">
            {/* 버튼 그룹 - 최상단 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            {/* 뒤로 돌아가기 / 검사기록으로 가기 버튼 - 좌측 */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  // 삭제코드 페이지에서 접근한 경우
                  if (sessionStorage.getItem('returnToDeletedCodes') === 'true') {
                    sessionStorage.removeItem('returnToDeletedCodes');
                    router.back();
                    return;
                  }
                  
                  // 검사기록 페이지에서 접근한 경우
                  if (sessionStorage.getItem('returnToTestRecords') === 'true') {
                    sessionStorage.removeItem('returnToTestRecords');
                    router.back();
                    return;
                  }
                  
                  // 검사 완료 직후인지 확인
                  if (sessionStorage.getItem('testJustCompleted') === 'true') {
                    sessionStorage.removeItem('testJustCompleted');
                    // 검사 완료 직후는 무조건 검사기록 목록으로 이동
                    router.push('/mypage?tab=records');
                    return;
                  }
                  
                  // 그 외의 경우 이전 페이지로 이동
                  router.back();
                }
              }}
              className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">
                {(typeof window !== 'undefined' && sessionStorage.getItem('returnToDeletedCodes') === 'true') ||
                 (typeof window !== 'undefined' && sessionStorage.getItem('returnToTestRecords') === 'true')
                  ? '뒤로 돌아가기' 
                  : (typeof window !== 'undefined' && sessionStorage.getItem('testJustCompleted') === 'true')
                    ? '검사기록으로 가기'
                    : '뒤로 돌아가기'}
              </span>
            </button>
            
            {/* 결과 공유하기 및 테스트 다시 하기 버튼 - 우측 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const shareData = {
                    title: `내 MBTI 테스트 결과`,
                    text: `테스트 코드: ${code}`,
                    url: typeof window !== 'undefined' ? window.location.href : ''
                  };

                  if (typeof window !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
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
                  
                  function fallbackShare() {
                    if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(window.location.href)
                        .then(() => {
                          alert('결과 주소가 클립보드에 복사되었습니다!');
                        })
                        .catch(() => {
                          alert(`결과 주소: ${window.location.href}`);
                        });
                    } else if (typeof window !== 'undefined') {
                      alert(`결과 주소: ${window.location.href}`);
                    }
                  }
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg text-sm sm:text-base"
              >
                결과 공유하기
              </button>
              <Link 
                href="/tests/mbti"
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg text-center text-sm sm:text-base"
              >
                테스트 다시 하기
              </Link>
            </div>
          </div>

          {/* 헤더 섹션 */}
          <div className="mb-8 relative">
            <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
              MBTI 테스트 결과
            </h1>
            <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
            {/* 검사코드와 검사결과 코드 표시 */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {code && (
                <p className="text-blue-200">
                  검사결과 코드: <span className="font-mono font-semibold">{code}</span>
              </p>
            )}
            </div>
          </div>
        
        <MBTIResult 
          results={testResults}
          onRetake={handleRetake}
        />
        
          {/* 버튼 그룹 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link 
              href="/tests/mbti"
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg text-center"
            >
              테스트 다시 하기
            </Link>
            <Link 
              href="/mypage?tab=records"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg text-center"
            >
              테스트 기록 보기
            </Link>
          </div>
        </div>
          </div>
      </main>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function MbtiGraphPage() {
  return (
    <Suspense fallback={<LoadingResults />}>
      <MbtiGraphResults />
    </Suspense>
  );
} 