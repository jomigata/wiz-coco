'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [mbtiType, setMbtiType] = useState<string>('');
  const [testCode, setTestCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isFromCompletion, setIsFromCompletion] = useState<boolean>(false);
  const [isFromDeletedCodes, setIsFromDeletedCodes] = useState<boolean>(false);
  
  // 데이터 로딩 완료 플래그 추가 (중복 호출 방지)
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // 테스트 결과 가져오기 (useCallback으로 메모이제이션)
  const fetchTestResult = useCallback(async (code: string) => {
    // 이미 데이터가 로드되었으면 다시 로드하지 않음
    if (isDataLoaded) return;
    
    try {
      console.log('[MbtiResult] 테스트 코드로 결과 조회 시작:', code);
      
      // 1. 먼저 로컬 스토리지에서 찾기
      const localResult = getTestResultFromLocalStorage(code);
      if (localResult) {
        console.log('[MbtiResult] 로컬 스토리지에서 결과 발견:', localResult);
        
        // getTestResultFromLocalStorage에서 이미 test_records를 우선 확인하므로
        // 여기서는 바로 사용
        setTestResult(localResult);
        
        // MBTI 타입 계산 및 설정
        const calculatedMbtiType = calculateMbtiType(localResult.answers);
        setMbtiType(calculatedMbtiType);
        setIsLoading(false);
        setIsDataLoaded(true);
        return;
      }

      // 2. 삭제된 기록에서 찾기
      console.log('[MbtiResult] 삭제된 기록에서 검색 시도');
      const deletedResult = getDeletedTestResult(code);
      if (deletedResult) {
        console.log('[MbtiResult] 삭제된 기록에서 결과 발견:', deletedResult);
        
        // 삭제된 기록의 데이터 구조 정리
        let resultData: any = null;
        
        try {
          // result 필드가 있으면 그것을 사용, 없으면 레코드 자체를 사용
          if (deletedResult.result && typeof deletedResult.result === 'object') {
            resultData = {
              ...deletedResult.result,
              code: deletedResult.code,
              timestamp: deletedResult.timestamp,
              testType: deletedResult.testType,
              // answers가 없으면 빈 객체로 설정
              answers: deletedResult.result.answers || deletedResult.answers || {},
              mbtiType: deletedResult.result.mbtiType || deletedResult.mbtiType
            };
          } else {
            // result가 없으면 레코드 자체를 결과로 사용
            resultData = {
              ...deletedResult,
              // answers가 없으면 빈 객체로 설정
              answers: deletedResult.answers || deletedResult.result?.answers || {},
              mbtiType: deletedResult.mbtiType || deletedResult.result?.mbtiType,
              userData: deletedResult.userData || deletedResult.result?.userData
            };
          }
          
          // answers가 null이나 undefined인 경우 빈 객체로 설정
          if (!resultData.answers || typeof resultData.answers !== 'object') {
            resultData.answers = {};
          }
          
          setTestResult(resultData);
          
          // MBTI 타입 계산 및 설정
          let calculatedMbtiType = 'INTJ'; // 기본값
          
          // 답변 데이터가 있고 유효한 객체인 경우에만 계산
          if (resultData.answers && 
              typeof resultData.answers === 'object' && 
              Object.keys(resultData.answers).length > 0) {
            try {
              calculatedMbtiType = calculateMbtiType(resultData.answers);
            } catch (calcError) {
              console.error('[MbtiResult] MBTI 타입 계산 오류:', calcError);
              // 계산 실패 시 저장된 mbtiType 사용
              calculatedMbtiType = resultData.mbtiType || 
                                    deletedResult.mbtiType || 
                                    deletedResult.result?.mbtiType || 
                                    'INTJ';
            }
          } else if (resultData.mbtiType) {
            calculatedMbtiType = resultData.mbtiType;
          } else if (deletedResult.mbtiType) {
            calculatedMbtiType = deletedResult.mbtiType;
          } else if (deletedResult.result?.mbtiType) {
            calculatedMbtiType = deletedResult.result.mbtiType;
          }
          
          setMbtiType(calculatedMbtiType);
          setIsLoading(false);
          setIsDataLoaded(true);
          // 삭제된 기록이어도 결과를 표시하므로 에러 메시지 제거
          // setError('이 검사 결과는 삭제된 상태입니다. 복구하시려면 마이페이지 > 삭제코드에서 복구하실 수 있습니다.');
          return;
        } catch (error) {
          console.error('[MbtiResult] 삭제된 기록 처리 오류:', error);
          setError('삭제된 검사 결과를 불러오는 중 오류가 발생했습니다.');
          setIsLoading(false);
          return;
        }
      }

      // 3. 로컬에서 찾지 못한 경우 API 시도
      console.log('[MbtiResult] 로컬 스토리지에서 찾지 못함, API 요청 시도');
      const response = await fetch(`/api/save-test-result?code=${code}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          console.log('[MbtiResult] API에서 결과 조회 성공:', data.data);
          
          // API 응답에 timestamp나 testType이 없으면 test_records에서 보완
          let resultData = data.data;
          if (!resultData.timestamp || !resultData.testType) {
            try {
              const testRecordsStr = localStorage.getItem('test_records');
              if (testRecordsStr) {
                const records = JSON.parse(testRecordsStr);
                const foundRecord = records.find((record: any) => record.code === code);
                if (foundRecord) {
                  resultData = {
                    ...resultData,
                    timestamp: resultData.timestamp || foundRecord.timestamp,
                    testType: resultData.testType || foundRecord.testType,
                    userData: resultData.userData || foundRecord.userData
                  };
                }
              }
            } catch (e) {
              console.warn('[MbtiResult] test_records에서 보완 데이터 가져오기 실패:', e);
            }
          }
          
          setTestResult(resultData);
          if (resultData.mbtiType) {
            setMbtiType(resultData.mbtiType.toUpperCase());
          }
          setIsDataLoaded(true);
        } else {
          console.warn('[MbtiResult] API 응답에 데이터가 없음');
          setError('테스트 결과를 찾을 수 없습니다. 테스트를 다시 시도해주세요.');
          setIsDataLoaded(true);
        }
      } else {
        console.warn('[MbtiResult] API 응답 오류:', response.status);
        const errorData = await response.json();
        setError(errorData.message || '테스트 결과를 불러올 수 없습니다.');
        setIsDataLoaded(true);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('[MbtiResult] 테스트 결과 로드 오류:', error);
      setError('테스트 결과를 불러오는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [isDataLoaded]);
  
  useEffect(() => {
    // 이미 데이터가 로드되었으면 다시 로드하지 않음
    if (isDataLoaded) return;
    
    // URL 파라미터에서 테스트 코드와 MBTI 유형 가져오기
    const code = searchParams.get('code');
    const type = searchParams.get('type');
    const from = searchParams.get('from');
    
    // 검사 완료 직후인지 확인 (URL 파라미터 또는 sessionStorage)
    if (from === 'completion' || (typeof window !== 'undefined' && sessionStorage.getItem('testJustCompleted') === 'true')) {
      setIsFromCompletion(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('testJustCompleted', 'true');
      }
    }
    
    // 삭제코드 페이지에서 접근한 경우 확인
    if (typeof window !== 'undefined' && sessionStorage.getItem('returnToDeletedCodes') === 'true') {
      setIsFromDeletedCodes(true);
    }
    
    if (code) {
      // URL에서 받은 코드를 그대로 사용 (검사기록 목록의 코드와 일치)
      setTestCode(code);
      fetchTestResult(code);
    } else {
      // 코드가 없으면 로컬 스토리지에서 최근 결과 찾기
      try {
        const testRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
        if (testRecords.length > 0) {
          // 가장 최근 기록의 코드 사용
          const latestRecord = testRecords[testRecords.length - 1];
          if (latestRecord.code) {
            setTestCode(latestRecord.code);
            fetchTestResult(latestRecord.code);
          } else {
            // 코드가 없으면 새로 생성
            const newCode = generateUniqueTestCode();
            setTestCode(newCode);
          }
        } else {
          // 기록이 없으면 새로 생성
          const newCode = generateUniqueTestCode();
          setTestCode(newCode);
        }
      } catch (e) {
        // 오류 발생 시 새로 생성
        const newCode = generateUniqueTestCode();
        setTestCode(newCode);
      }
    }
    
    if (type) {
      setMbtiType(type.toUpperCase());
    }
  }, [searchParams, isDataLoaded, fetchTestResult]);
  
  // 로컬 스토리지에서 테스트 결과 가져오기
  const getTestResultFromLocalStorage = (code: string) => {
    try {
      // 1. test_records에서 먼저 찾기 (검사기록에서 클릭한 경우 가장 정확한 데이터)
      const testRecordsStr = localStorage.getItem('test_records');
      if (testRecordsStr) {
        try {
          const records = JSON.parse(testRecordsStr);
          const foundRecord = records.find((record: any) => record.code === code);
          if (foundRecord) {
            // test_records의 레코드가 가장 정확한 정보를 가지고 있음
            if (foundRecord.result) {
              // result에 timestamp와 testType이 없으면 레코드에서 가져오기
              return {
                ...foundRecord.result,
                timestamp: foundRecord.result.timestamp || foundRecord.timestamp,
                testType: foundRecord.result.testType || foundRecord.testType,
                userData: foundRecord.result.userData || foundRecord.userData,
                code: foundRecord.code
              };
            }
            // result가 없으면 레코드 자체를 반환 (일부 결과는 레코드에 직접 포함될 수 있음)
            if (foundRecord.answers || foundRecord.mbtiType) {
              // timestamp와 testType이 항상 포함되도록 보장
              return {
                ...foundRecord,
                timestamp: foundRecord.timestamp,
                testType: foundRecord.testType,
                userData: foundRecord.userData,
                code: foundRecord.code
              };
            }
          }
        } catch (e) {
          console.warn('[MbtiResult] test_records 파싱 실패:', e);
        }
      }
      
      // 2. 직접 코드로 저장된 결과 찾기
      const directResult = localStorage.getItem(`test-result-${code}`);
      if (directResult) {
        const parsed = JSON.parse(directResult);
        if (parsed && (parsed.answers || parsed.mbtiType)) {
          // timestamp와 testType이 없으면 test_records에서 보완
          if (!parsed.timestamp || !parsed.testType) {
            if (testRecordsStr) {
              try {
                const records = JSON.parse(testRecordsStr);
                const foundRecord = records.find((record: any) => record.code === code);
                if (foundRecord) {
                  return {
                    ...parsed,
                    timestamp: parsed.timestamp || foundRecord.timestamp,
                    testType: parsed.testType || foundRecord.testType,
                    userData: parsed.userData || foundRecord.userData,
                    code: foundRecord.code || code
                  };
                }
              } catch (e) {
                console.warn('[MbtiResult] test_records에서 보완 데이터 가져오기 실패:', e);
              }
            }
          }
          return {
            ...parsed,
            code: code
          };
        }
      }

      // 3. 사용자별 검사 기록에서 찾기
      const userEmail = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').email : null;
      if (userEmail) {
        const userRecordsKey = `mbti-user-test-records-${userEmail}`;
        const userRecords = localStorage.getItem(userRecordsKey);
        if (userRecords) {
          const records = JSON.parse(userRecords);
          const foundRecord = records.find((record: any) => record.testCode === code || record.code === code);
          if (foundRecord) {
            if (foundRecord.result) {
              return {
                ...foundRecord.result,
                timestamp: foundRecord.result.timestamp || foundRecord.timestamp,
                testType: foundRecord.result.testType || foundRecord.testType,
                userData: foundRecord.result.userData || foundRecord.userData
              };
            }
            if (foundRecord.userData) {
              return {
                ...foundRecord.userData,
                timestamp: foundRecord.userData.timestamp || foundRecord.timestamp,
                testType: foundRecord.userData.testType || foundRecord.testType
              };
            }
          }
        }
      }

      // 4. 일반 mbti-user-test-records에서 찾기
      const generalRecords = localStorage.getItem('mbti-user-test-records');
      if (generalRecords) {
        const records = JSON.parse(generalRecords);
        const foundRecord = records.find((record: any) => record.testCode === code || record.code === code);
        if (foundRecord) {
          if (foundRecord.result) {
            return {
              ...foundRecord.result,
              timestamp: foundRecord.result.timestamp || foundRecord.timestamp,
              testType: foundRecord.result.testType || foundRecord.testType,
              userData: foundRecord.result.userData || foundRecord.userData
            };
          }
          if (foundRecord.userData) {
            return {
              ...foundRecord.userData,
              timestamp: foundRecord.userData.timestamp || foundRecord.timestamp,
              testType: foundRecord.userData.testType || foundRecord.testType
            };
          }
        }
      }

      // 5. 최근 검사 결과에서 찾기 (코드가 일치하지 않더라도)
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

  // 삭제된 테스트 결과 가져오기
  const getDeletedTestResult = (code: string) => {
    try {
      const deletedRecords = localStorage.getItem('deleted_test_records');
      if (deletedRecords) {
        const records = JSON.parse(deletedRecords);
        const foundRecord = records.find((record: any) => record.code === code);
        if (foundRecord) {
          return foundRecord;
        }
      }
      return null;
    } catch (error) {
      console.error('[MbtiResult] 삭제된 기록 조회 오류:', error);
      return null;
    }
  };

  // MBTI 타입 계산 함수
  const calculateMbtiType = (answers: { [key: string]: { type: string; answer: number } } | null | undefined) => {
    // null이나 undefined 체크
    if (!answers || typeof answers !== 'object') {
      console.warn('[MbtiResult] calculateMbtiType: answers가 유효하지 않음', answers);
      return 'INTJ'; // 기본값 반환
    }

    const typeScores = {
      'E': 0, 'I': 0,
      'S': 0, 'N': 0,
      'T': 0, 'F': 0,
      'J': 0, 'P': 0
    };

    try {
      // 답변 분석
      const answerValues = Object.values(answers);
      if (!answerValues || answerValues.length === 0) {
        console.warn('[MbtiResult] calculateMbtiType: 답변이 없음');
        return 'INTJ'; // 기본값 반환
      }

      answerValues.forEach(answer => {
        // answer가 유효한지 체크
        if (!answer || typeof answer !== 'object') {
          return; // 유효하지 않은 답변은 건너뛰기
        }

        const { type, answer: score } = answer;
        
        // type과 score가 유효한지 체크
        if (!type || typeof score !== 'number' || isNaN(score)) {
          return; // 유효하지 않은 데이터는 건너뛰기
        }
        
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
    } catch (error) {
      console.error('[MbtiResult] calculateMbtiType 오류:', error);
      return 'INTJ'; // 기본값 반환
    }

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
      
      <div className="container mx-auto max-w-4xl relative z-10">
        {isLoading ? (
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
            <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-blue-200">결과를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="text-center bg-indigo-950 rounded-xl p-8 shadow-lg border border-indigo-700">
            <div className="text-red-300 mb-4 text-4xl">⚠️</div>
            <p className="text-white text-lg mb-6">{error}</p>
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
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              뒤로 돌아가기
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 버튼 그룹 - 최상단 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4 mt-[30px]">
              {/* 뒤로 돌아가기 / 검사기록으로 가기 버튼 - 좌측 */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    // 삭제코드 페이지에서 접근한 경우
                    if (isFromDeletedCodes || sessionStorage.getItem('returnToDeletedCodes') === 'true') {
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
                    
                    // 검사 완료 직후인지 확인 (상태 또는 sessionStorage)
                    if (isFromCompletion || sessionStorage.getItem('testJustCompleted') === 'true') {
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
                  {(isFromDeletedCodes || (typeof window !== 'undefined' && sessionStorage.getItem('returnToDeletedCodes') === 'true')) ||
                   (typeof window !== 'undefined' && sessionStorage.getItem('returnToTestRecords') === 'true')
                    ? '뒤로 돌아가기' 
                    : (isFromCompletion || (typeof window !== 'undefined' && sessionStorage.getItem('testJustCompleted') === 'true'))
                      ? '검사기록으로 가기'
                      : '뒤로 돌아가기'}
                </span>
              </button>
              
              {/* 결과 공유하기 및 테스트 다시 하기 버튼 - 우측 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={shareResult}
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
                개인용 MBTI 검사 결과
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
              {/* 검사코드와 검사결과 코드 표시 */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                {(() => {
                  const counselorCode = testResult?.counselorCode || 
                                       testResult?.userData?.counselorCode || 
                                       testResult?.userData?.clientInfo?.counselorCode ||
                                       testResult?.userData?.clientInfo?.groupCode ||
                                       testResult?.userData?.groupCode ||
                                       null;
                  
                  return (
                    <>
                      {counselorCode && (
                        <p className="text-blue-200">
                          검사코드: <span className="font-mono font-semibold">{counselorCode}</span>
                        </p>
                      )}
                      {testCode && (
                        <p className="text-blue-200">
                          검사결과 코드: <span className="font-mono font-semibold">{testCode}</span>
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
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
              {useMemo(() => {
                // timestamp 우선순위: testResult.timestamp > testResult.userData.timestamp > test_records에서 찾기
                let displayTimestamp: string = '';
                let displayTestType: string = '';
                
                if (testResult) {
                  // timestamp 찾기
                  if (testResult.timestamp) {
                    displayTimestamp = new Date(testResult.timestamp).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    });
                  } else if (testResult.userData?.timestamp) {
                    displayTimestamp = new Date(testResult.userData.timestamp).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true
                    });
                  } else {
                    // test_records에서 찾기
                    try {
                      const testRecordsStr = localStorage.getItem('test_records');
                      if (testRecordsStr) {
                        const records = JSON.parse(testRecordsStr);
                        const foundRecord = records.find((record: any) => record.code === testCode);
                        if (foundRecord?.timestamp) {
                          displayTimestamp = new Date(foundRecord.timestamp).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          });
                        }
                      }
                    } catch (e) {
                      console.warn('[MbtiResult] test_records에서 timestamp 찾기 실패:', e);
                    }
                  }
                  
                  // testType 찾기
                  displayTestType = testResult.testType || testResult.userData?.testType || '';
                  
                  // testType이 없으면 test_records에서 찾기
                  if (!displayTestType) {
                    try {
                      const testRecordsStr = localStorage.getItem('test_records');
                      if (testRecordsStr) {
                        const records = JSON.parse(testRecordsStr);
                        const foundRecord = records.find((record: any) => record.code === testCode);
                        if (foundRecord?.testType) {
                          displayTestType = foundRecord.testType;
                        }
                      }
                    } catch (e) {
                      console.warn('[MbtiResult] test_records에서 testType 찾기 실패:', e);
                    }
                  }
                }
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
                    <div>
                      <span className="text-blue-300 font-medium">검사 일시:</span>
                      <span className="ml-2">
                        {displayTimestamp || new Date().toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-300 font-medium">검사 유형:</span>
                      <span className="ml-2">
                        {displayTestType || '개인용 MBTI 검사'}
                      </span>
                    </div>
                  </div>
                );
              }, [testResult, testCode])}
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