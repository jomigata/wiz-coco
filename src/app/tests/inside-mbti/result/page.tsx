"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { MbtiType, RelationshipAnalysis, mbtiData, relationshipTypeData, analyzeMbtiCombination } from '../data';

// 클라이언트 컴포넌트에서 useSearchParams 사용
function InsideMbtiResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [result, setResult] = useState<{
    person1: { name: string; mbti: string };
    person2: { name: string; mbti: string };
    relationshipType: string;
    resultCode?: string;
    analysis?: RelationshipAnalysis;
  } | null>(null);
  
  useEffect(() => {
    // URL 쿼리 파라미터에서 데이터 가져오기
    const p1 = searchParams.get('p1');
    const m1 = searchParams.get('m1');
    const p2 = searchParams.get('p2');
    const m2 = searchParams.get('m2');
    const r = searchParams.get('r');
    const code = searchParams.get('code');
    
    if (p1 && m1 && p2 && m2 && r) {
      const analysis = analyzeMbtiCombination(m1, m2, r);
      
      setResult({
        person1: { name: p1, mbti: m1 },
        person2: { name: p2, mbti: m2 },
        relationshipType: r,
        resultCode: code || undefined,
        analysis
      });
    }
  }, [searchParams]);

  if (!result) {
    return (
      <>
        <Navigation />
        <main className="relative bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-hidden min-h-screen pt-16 pb-12">
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-center items-center h-64">
              <p className="text-white text-xl">데이터를 불러오는 중입니다...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
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
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

        <section className="relative z-10 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
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
                        title: `${result.person1.name}님과 ${result.person2.name}님의 관계 분석 결과`,
                        text: `${result.person1.mbti}와 ${result.person2.mbti}의 ${relationshipTypeData[result.relationshipType]} 호환성: ${result.analysis?.compatibility}%`,
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
                    href="/tests/inside-mbti"
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
                  관계 분석 결과
                </h1>
                <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
                <p className="text-blue-200 mt-4">
                  {result.person1.name}님({result.person1.mbti})과 {result.person2.name}님({result.person2.mbti})의 {relationshipTypeData[result.relationshipType]} 분석 결과
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                
                {/* 검사 코드 표시 */}
                {result.resultCode && (
                  <div className="text-center mb-8">
                    <div className="inline-block bg-white/5 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                      <span className="text-blue-200 text-sm">검사 코드: </span>
                      <span className="text-white font-mono font-semibold">{result.resultCode}</span>
                    </div>
                  </div>
                )}
                
                {/* 호환성 점수 */}
                <div className="mb-10">
                  <h2 className="text-xl font-semibold text-white mb-4 text-center">호환성 점수</h2>
                  <div className="flex justify-center">
                    <div className="w-72 h-72 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-64 w-64 rounded-full bg-white/5 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-6xl font-bold text-white">{result.analysis?.compatibility}%</span>
                            <p className="text-blue-200 mt-2">
                              {result.analysis?.compatibility && result.analysis?.compatibility >= 85 ? '매우 뛰어난 궁합' : 
                               result.analysis?.compatibility && result.analysis?.compatibility >= 70 ? '좋은 궁합' :
                               result.analysis?.compatibility && result.analysis?.compatibility >= 55 ? '보통 궁합' : '노력이 필요한 궁합'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* MBTI 유형 비교 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3">{result.person1.name}님의 MBTI</h3>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-white">{result.person1.mbti}</span>
                      <span className="text-blue-200 ml-2">{mbtiData[result.person1.mbti]?.type}</span>
                    </div>
                    <p className="text-blue-200 mb-4">{mbtiData[result.person1.mbti]?.description}</p>
                    <div className="mb-3">
                      <h4 className="text-white font-medium mb-1">강점</h4>
                      <ul className="list-disc pl-5 text-blue-200 text-sm">
                        {mbtiData[result.person1.mbti]?.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">의사소통 스타일</h4>
                      <p className="text-blue-200 text-sm">{mbtiData[result.person1.mbti]?.communication}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-medium text-white mb-3">{result.person2.name}님의 MBTI</h3>
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-white">{result.person2.mbti}</span>
                      <span className="text-blue-200 ml-2">{mbtiData[result.person2.mbti]?.type}</span>
                    </div>
                    <p className="text-blue-200 mb-4">{mbtiData[result.person2.mbti]?.description}</p>
                    <div className="mb-3">
                      <h4 className="text-white font-medium mb-1">강점</h4>
                      <ul className="list-disc pl-5 text-blue-200 text-sm">
                        {mbtiData[result.person2.mbti]?.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">의사소통 스타일</h4>
                      <p className="text-blue-200 text-sm">{mbtiData[result.person2.mbti]?.communication}</p>
                    </div>
                  </div>
                </div>
                
                {/* 관계 분석 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-10">
                  <h3 className="text-xl font-medium text-white mb-4">관계 역학 분석</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-white mb-2">관계의 강점</h4>
                    <ul className="list-disc pl-5 text-blue-200">
                      {result.analysis?.strengths.map((strength, index) => (
                        <li key={index} className="mb-2">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-white mb-2">잠재적 도전 요소</h4>
                    <ul className="list-disc pl-5 text-blue-200">
                      {result.analysis?.challenges.map((challenge, index) => (
                        <li key={index} className="mb-2">{challenge}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* 관계 개선 팁 */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
                  <h3 className="text-xl font-medium text-white mb-4">관계 개선을 위한 팁</h3>
                  
                  <ul className="space-y-3">
                    {result.analysis?.tips.map((tip, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-400 mr-2">✦</span>
                        <span className="text-blue-200">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-center mt-10">
                  <Link href="/tests/inside-mbti" className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                    새 분석 시작하기
                  </Link>
                </div>
                
                <div className="mt-8 p-4 rounded-lg bg-white/5 text-center">
                  <p className="text-blue-200 text-sm">
                    이 분석은 MBTI 이론을 기반으로 한 일반적인 경향성을 보여줍니다. 
                    실제 관계는 더 복잡하며 개인의 성숙도, 경험, 상황 등 다양한 요소에 영향을 받습니다.
                  </p>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// 메인 페이지 컴포넌트
export default function InsideMbtiResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-300 mx-auto"></div>
          <p className="mt-4 text-blue-300 text-lg">결과를 불러오는 중입니다...</p>
        </div>
      </div>
    }>
      <InsideMbtiResultContent />
    </Suspense>
  );
} 