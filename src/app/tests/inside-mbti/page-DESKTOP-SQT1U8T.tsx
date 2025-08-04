"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

// 테스트 결과 인터페이스 정의
interface TestResult {
  code: string;
  result: string;
  testDate: string;
  nickname: string;
  userId: string;
  testType: string;
}

const relationshipTypes = [
  { id: 'couple', label: '연인 관계' },
  { id: 'friend', label: '친구 관계' },
  { id: 'family', label: '가족 관계' },
  { id: 'colleague', label: '직장 동료' },
  { id: 'team', label: '팀 관계' }
];

// 스타일 옵션을 객체로 정의
const customStyles = {
  select: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    appearance: 'none' as const,
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.7rem top 50%',
    backgroundSize: '0.65rem auto',
    paddingRight: '1.5rem'
  }
};

export default function InsideMbtiPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    person1: {
      name: '',
      mbti: '',
      testCode: ''
    },
    person2: {
      name: '',
      mbti: '',
      testCode: ''
    },
    relationshipType: ''
  });

  // 검사 결과 데이터 상태
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  // 데이터 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 직접 입력 모드 상태
  const [inputMode, setInputMode] = useState({
    person1: false,
    person2: false
  });

  // 컴포넌트 마운트 시 사용자의 검사 결과 데이터를 가져오기
  useEffect(() => {
    // 실제 환경에서는 아래 코드의 주석을 해제하여 API 요청 구현
    const fetchTestResults = async () => {
      try {
        setIsLoading(true);
        // API 엔드포인트를 실제 경로로 변경해야 함
        const response = await fetch('/api/my-test-records');
        
        if (response.ok) {
          const data = await response.json();
          // 전문가용 MBTI 검사 결과만 필터링
          const mbtiProTests = data.tests.filter((test: TestResult) => 
            test.testType === 'mbti_pro'
          );
          setTestResults(mbtiProTests);
        } else {
          console.error('테스트 기록을 가져오는데 실패했습니다.');
          // 오류 시 빈 배열 설정
          setTestResults([]);
        }
      } catch (error) {
        console.error('검사 결과 데이터 로딩 오류:', error);
        setTestResults([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // 개발 환경에서 테스트를 위해 빈 배열로 설정
    // 실제 환경에서는 fetchTestResults() 호출
    setTestResults([]);
    setIsLoading(false);
    
  }, []);

  // 날짜 내림차순, 고유번호/예명/별명 오름차순으로 정렬
  const sortedTestResults = [...testResults].sort((a, b) => {
    // 날짜 내림차순 (최신이 먼저)
    const dateComparison = new Date(b.testDate).getTime() - new Date(a.testDate).getTime();
    
    // 날짜가 같으면 고유번호/예명/별명 오름차순
    if (dateComparison === 0) {
      return a.nickname.localeCompare(b.nickname);
    }
    
    return dateComparison;
  });

  // 드롭다운 메뉴 옵션 스타일링
  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      // 드롭다운 스타일 설정을 위한 스타일 태그 생성
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        select option {
          background-color: rgba(30, 41, 59, 0.95) !important;
          color: white !important;
        }
      `;
      document.head.appendChild(styleTag);
      
      // 컴포넌트 언마운트 시 스타일 태그 제거
      return () => {
        document.head.removeChild(styleTag);
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 필수 입력 확인
    if (!form.person1.name || !getMbtiValue('person1') || !form.person2.name || !getMbtiValue('person2') || !form.relationshipType) {
      alert('모든 필드를 입력해주세요.');
      return;
    }
    
    // 분석 결과 페이지로 이동
    router.push(`/tests/inside-mbti/result?p1=${form.person1.name}&m1=${getMbtiValue('person1')}&p2=${form.person2.name}&m2=${getMbtiValue('person2')}&r=${form.relationshipType}`);
  };

  // 드롭다운 선택 또는 직접 입력된 MBTI 값 가져오기
  const getMbtiValue = (person: 'person1' | 'person2') => {
    if (inputMode[person]) {
      return form[person].mbti;
    } else {
      // 검사코드를 선택했을 때, 해당 코드의 MBTI 결과 가져오기
      if (form[person].testCode) {
        const selectedTest = testResults.find(test => test.code === form[person].testCode);
        return selectedTest?.result || '';
      }
      return '';
    }
  };

  const handleChange = (person: 'person1' | 'person2', field: 'name' | 'mbti' | 'testCode', value: string) => {
    setForm({
      ...form,
      [person]: {
        ...form[person],
        [field]: value
      }
    });

    // 검사코드를 선택했을 때 해당 결과의 이름을 자동으로 반영
    if (field === 'testCode') {
      const selectedTest = testResults.find(test => test.code === value);
      if (selectedTest) {
        setForm(prev => ({
          ...prev,
          [person]: {
            ...prev[person],
            name: selectedTest.nickname || `사용자-${selectedTest.code}`,
            testCode: value
          }
        }));
      }
    }
  };

  // 입력 모드 전환 (드롭다운 <-> 직접입력)
  const toggleInputMode = (person: 'person1' | 'person2') => {
    setInputMode(prev => ({
      ...prev,
      [person]: !prev[person]
    }));
    
    // 모드 전환 시 값 초기화
    setForm(prev => ({
      ...prev,
      [person]: {
        ...prev[person],
        mbti: '',
        testCode: ''
      }
    }));
  };

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
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                <h1 className="text-4xl font-bold text-white text-center mb-2">인사이드 MBTI</h1>
                <p className="text-blue-200 text-center mb-8">
                  두 사람의 MBTI 유형을 비교하여 관계 역학을 분석하고 상호작용 방법을 제안합니다
                </p>
                
                <div className="mb-8 p-4 rounded-lg bg-white/5">
                  <h2 className="text-xl font-semibold text-white mb-2">주의사항</h2>
                  <p className="text-blue-200 text-sm">
                    MBTI는 성격의 '선호 경향'을 보여주는 도구이며, 개인의 모든 것을 설명하거나 관계의 성공/실패를 예측하는 
                    절대적인 기준이 아닙니다. 같은 MBTI 유형이라도 개인의 경험, 가치관, 성숙도에 따라 실제 모습은 다를 수 있습니다.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 첫 번째 사람 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium text-white">첫 번째 사람</h3>
                      <div>
                        <label htmlFor="person1Name" className="block text-sm font-medium text-blue-200 mb-1">
                          이름
                        </label>
                        <input
                          type="text"
                          id="person1Name"
                          className="w-full bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="이름을 입력하세요"
                          value={form.person1.name}
                          onChange={(e) => handleChange('person1', 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label htmlFor="person1TestCode" className="block text-sm font-medium text-blue-200">
                            {inputMode.person1 ? 'MBTI 유형 직접입력' : '검사코드 선택'}
                          </label>
                          <button 
                            type="button"
                            className="text-xs text-blue-300 hover:text-blue-100 underline"
                            onClick={() => toggleInputMode('person1')}
                          >
                            {inputMode.person1 ? '검사코드로 선택하기' : '직접 입력하기'}
                          </button>
                        </div>
                        
                        {inputMode.person1 ? (
                          <input
                            type="text"
                            id="person1Mbti"
                            className="w-full bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="MBTI 유형을 입력하세요 (예: ENFP)"
                            value={form.person1.mbti}
                            onChange={(e) => handleChange('person1', 'mbti', e.target.value)}
                          />
                        ) : (
                          <select
                            id="person1TestCode"
                            className="w-full bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            style={customStyles.select}
                            value={form.person1.testCode}
                            onChange={(e) => handleChange('person1', 'testCode', e.target.value)}
                          >
                            <option value="">검사코드 선택</option>
                            {isLoading ? (
                              <option value="" disabled>불러오는 중...</option>
                            ) : sortedTestResults.length > 0 ? (
                              sortedTestResults.map(test => (
                                <option key={test.code} value={test.code}>
                                  {test.code} / {test.testType} / {test.nickname} / {test.testDate}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>검사 결과가 없습니다</option>
                            )}
                          </select>
                        )}
                      </div>
                    </div>

                    {/* 두 번째 사람 정보 */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-medium text-white">두 번째 사람</h3>
                      <div>
                        <label htmlFor="person2Name" className="block text-sm font-medium text-blue-200 mb-1">
                          이름
                        </label>
                        <input
                          type="text"
                          id="person2Name"
                          className="w-full bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="이름을 입력하세요"
                          value={form.person2.name}
                          onChange={(e) => handleChange('person2', 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label htmlFor="person2TestCode" className="block text-sm font-medium text-blue-200">
                            {inputMode.person2 ? 'MBTI 유형 직접입력' : '검사코드 선택'}
                          </label>
                          <button 
                            type="button"
                            className="text-xs text-blue-300 hover:text-blue-100 underline"
                            onClick={() => toggleInputMode('person2')}
                          >
                            {inputMode.person2 ? '검사코드로 선택하기' : '직접 입력하기'}
                          </button>
                        </div>
                        
                        {inputMode.person2 ? (
                          <input
                            type="text"
                            id="person2Mbti"
                            className="w-full bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="MBTI 유형을 입력하세요 (예: ENFP)"
                            value={form.person2.mbti}
                            onChange={(e) => handleChange('person2', 'mbti', e.target.value)}
                          />
                        ) : (
                          <select
                            id="person2TestCode"
                            className="w-full bg-white/5 border border-white/10 rounded-lg text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            style={customStyles.select}
                            value={form.person2.testCode}
                            onChange={(e) => handleChange('person2', 'testCode', e.target.value)}
                          >
                            <option value="">검사코드 선택</option>
                            {isLoading ? (
                              <option value="" disabled>불러오는 중...</option>
                            ) : sortedTestResults.length > 0 ? (
                              sortedTestResults.map(test => (
                                <option key={test.code} value={test.code}>
                                  {test.code} / {test.testType} / {test.nickname} / {test.testDate}
                                </option>
                              ))
                            ) : (
                              <option value="" disabled>검사 결과가 없습니다</option>
                            )}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 관계 유형 선택 */}
                  <div>
                    <h3 className="text-xl font-medium text-white mb-3">관계 유형</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {relationshipTypes.map(relType => (
                        <div key={relType.id} className="flex items-center">
                          <input
                            type="radio"
                            id={relType.id}
                            name="relationshipType"
                            className="sr-only"
                            value={relType.id}
                            checked={form.relationshipType === relType.id}
                            onChange={e => setForm({...form, relationshipType: e.target.value})}
                          />
                          <label
                            htmlFor={relType.id}
                            className={`
                              w-full text-center py-2 px-3 rounded-lg cursor-pointer transition
                              ${form.relationshipType === relType.id ? 
                                'bg-blue-600 text-white' : 
                                'bg-white/5 text-blue-200 hover:bg-white/10'}
                            `}
                          >
                            {relType.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                    >
                      관계 분석하기
                    </button>
                  </div>
                </form>

                {/* 페이지 확인 링크 */}
                <div className="mt-8 text-center">
                  <p className="text-blue-200 mb-2">페이지 링크:</p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a
                      href="http://localhost:3000/tests/inside-mbti"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-white/10 rounded-lg text-blue-200 hover:bg-white/20 transition-colors"
                    >
                      인사이드 MBTI 페이지
                    </a>
                    <a
                      href="http://localhost:3000/mypage/test-records"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-white/10 rounded-lg text-blue-200 hover:bg-white/20 transition-colors"
                    >
                      마이페이지 테스트 기록
                    </a>
                    <a
                      href="http://localhost:3000/tests"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-white/10 rounded-lg text-blue-200 hover:bg-white/20 transition-colors"
                    >
                      검사 목록 페이지
                    </a>
                    <a
                      href="http://localhost:3000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-white/10 rounded-lg text-blue-200 hover:bg-white/20 transition-colors"
                    >
                      메인 페이지
                    </a>
                    <a
                      href="http://localhost:3000/admin"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-white/10 rounded-lg text-blue-200 hover:bg-white/20 transition-colors"
                    >
                      관리자 페이지
                    </a>
                  </div>
                  <p className="mt-4 text-xs text-blue-200 opacity-70">
                    * 클릭하면 새 창에서 바로 해당 페이지가 열립니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
} 