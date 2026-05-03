'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { getInProgressTests } from '@/utils/testResume';

// 삭제된 테스트 기록 타입 정의
interface DeletedTestRecord {
  code: string;
  timestamp: string;
  testType: string;
  mbtiType?: string;
  counselorCode?: string;
  userData?: {
    birthYear?: number;
    gender?: string;
    name?: string;
    testDate?: string;
    counselorCode?: string;
    clientInfo?: {
      counselorCode?: string;
      groupCode?: string;
      [key: string]: any;
    };
    groupCode?: string;
  };
  result?: any;
  answers?: any; // 답변 데이터 추가
  deletedAt: string;
}

// 삭제코드 컨텐츠 컴포넌트
export function DeletedCodesContent({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const router = useRouter();
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletedRecords, setDeletedRecords] = useState<DeletedTestRecord[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showSingleRestoreConfirm, setShowSingleRestoreConfirm] = useState<boolean>(false);
  const [singleRestoreRecord, setSingleRestoreRecord] = useState<DeletedTestRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [sortField, setSortField] = useState<'timestamp' | 'testType' | 'code' | 'deletedAt'>('deletedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [inProgressCount, setInProgressCount] = useState<number>(0);
  const [testRecordsCount, setTestRecordsCount] = useState<number>(0);
  const [deletedCodesCount, setDeletedCodesCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isEmbedded && typeof window !== 'undefined') {
      try {
        setInProgressCount(getInProgressTests().length);
        
        // 검사 기록 수 가져오기
        const allRecords: any[] = [];
        const globalRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
        if (Array.isArray(globalRecords)) {
          allRecords.push(...globalRecords);
        }
        if (firebaseUser?.email) {
          const uidKey = firebaseUser?.uid ? `mbti-user-test-records-${firebaseUser.uid}` : '';
          const emailKey = firebaseUser?.email ? `mbti-user-test-records-${firebaseUser.email}` : '';
          const userRecords =
            JSON.parse(localStorage.getItem(uidKey) || 'null') ||
            JSON.parse(localStorage.getItem(emailKey) || '[]');
          if (Array.isArray(userRecords)) {
            allRecords.push(...userRecords);
          }
        }
        const generalRecords = JSON.parse(localStorage.getItem('mbti-user-test-records') || '[]');
        if (Array.isArray(generalRecords)) {
          allRecords.push(...generalRecords);
        }
        // 중복 제거
        const uniqueRecords = Array.from(new Map(allRecords.map(r => [r.code, r])).values());
        setTestRecordsCount(uniqueRecords.filter(r => r.code && r.testType).length);
        
        // 삭제코드 수 가져오기
        const deletedRecords = JSON.parse(localStorage.getItem('deleted_test_records') || '[]');
        setDeletedCodesCount(Array.isArray(deletedRecords) ? deletedRecords.length : 0);
      } catch {}
    }
  }, [isEmbedded, firebaseUser]);

  // 유효/중복 정제 유틸
  const sanitizeDeletedRecords = (records: DeletedTestRecord[]): DeletedTestRecord[] => {
    const map = new Map<string, DeletedTestRecord>();
    records.forEach(r => {
      if (!r || !r.code || !r.testType) return;
      if (!map.has(r.code)) map.set(r.code, r);
    });
    return Array.from(map.values());
  };

  // Firebase 인증 상태 확인
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        if (firebaseLoading) {
          return;
        }

        if (firebaseUser) {
          setUser(firebaseUser);
          return;
        }

        setUser(null);
      } catch (error) {
        console.error('사용자 정보 로딩 오류:', error);
        setUser(null);
      }
    };

    checkAuthAndLoadUser();
  }, [firebaseUser, firebaseLoading]);

  // 삭제된 기록 가져오기 (인증된 사용자만)
  useEffect(() => {
    if (user) {
      fetchDeletedRecords();
    }
  }, [user]);

  // 선택된 레코드 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSelections = localStorage.getItem('selected-deleted-records');
        if (savedSelections) {
          const selections = JSON.parse(savedSelections);
          if (Array.isArray(selections)) {
            setSelectedRecords(selections);
          }
        }
      } catch (e) {
        console.error('선택된 레코드 로드 오류:', e);
      }
    }
  }, []);

  // 선택된 레코드가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected-deleted-records', JSON.stringify(selectedRecords));
    }
  }, [selectedRecords]);

  // 로컬 스토리지에서 삭제된 테스트 기록 가져오기
  const fetchDeletedRecords = () => {
    try {
      setIsLoading(true);
      
      if (typeof window !== 'undefined') {
        const deletedRecordsStr = localStorage.getItem('deleted_test_records');
        
        if (deletedRecordsStr) {
          const parsedRecords = JSON.parse(deletedRecordsStr);
          
          if (Array.isArray(parsedRecords) && parsedRecords.length > 0) {
            // 1) 유효 데이터만 유지 (코드/유형 필수)
            let cleaned = sanitizeDeletedRecords(parsedRecords);

            // 2) 보관기간 적용 (기본 180일)
            const retentionMs = 180 * 24 * 60 * 60 * 1000;
            const now = Date.now();
            cleaned = cleaned.filter(r => {
              const t = new Date(r.deletedAt || r.timestamp || 0).getTime();
              return !!r.code && !!r.testType && !!t && now - t <= retentionMs;
            });

            // 3) 정렬 (기본: 최신순)
            const sortedRecords = cleaned.sort((a, b) => {
              return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
            });
            
            setDeletedRecords(sortedRecords);
            // 저장본도 정제 결과로 업데이트
            localStorage.setItem('deleted_test_records', JSON.stringify(sortedRecords));
          } else {
            setDeletedRecords([]);
          }
        } else {
          // 더미 데이터 사용 금지: 실제 자료가 없으면 빈 목록
          setDeletedRecords([]);
        }
      }
    } catch (error) {
      console.error('삭제된 기록 로드 오류:', error);
      setDeletedRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링된 기록 얻기
  const filteredRecords = deletedRecords.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.code.toLowerCase().includes(searchLower) ||
      record.testType.toLowerCase().includes(searchLower) ||
      (record.userData?.name && record.userData.name.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    // 컬럼 헤더 클릭 정렬 우선
    let comparison = 0;
    
    if (sortField === 'timestamp') {
      comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    } else if (sortField === 'testType') {
      comparison = (a.testType || '').localeCompare(b.testType || '');
    } else if (sortField === 'code') {
      comparison = (a.code || '').localeCompare(b.code || '');
    } else if (sortField === 'deletedAt') {
      comparison = new Date(a.deletedAt).getTime() - new Date(b.deletedAt).getTime();
    }
    
    // 정렬 방향 적용
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // 컬럼 헤더 클릭 핸들러
  const handleSort = (field: 'timestamp' | 'testType' | 'code' | 'deletedAt') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // 선택 토글 함수
  const toggleSelection = (code: string) => {
    if (selectedRecords.includes(code)) {
      setSelectedRecords(prev => prev.filter(c => c !== code));
    } else {
      setSelectedRecords(prev => [...prev, code]);
    }
  };

  // 전체 선택 토글 함수
  const toggleAllSelection = () => {
    if (selectedRecords.length === filteredRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(filteredRecords.map(record => record.code));
    }
  };

  // 검사 결과 페이지 경로 생성 함수
  const getResultPageUrl = (record: DeletedTestRecord): string => {
    const testType = (record.testType || '').toLowerCase();
    const code = record.code || '';
    const mbtiType = record.mbtiType || '';
    
    // 전문가용 MBTI 검사 결과 페이지
    if (testType.includes('전문가용') || testType.includes('mbti pro') || testType.includes('mbti_pro') || 
        testType.includes('professional') || code.startsWith('MP') || record.counselorCode?.startsWith('MP')) {
      // 결과 데이터 확인
      try {
        const resultData = record.result || (typeof window !== 'undefined' 
          ? (() => {
              try {
                return JSON.parse(localStorage.getItem(`test-result-${code}`) || 'null');
              } catch {
                return null;
              }
            })()
          : null);
        
        if (resultData) {
          const dataStr = encodeURIComponent(JSON.stringify({
            code: code,
            mbtiType: mbtiType || resultData.mbtiType || 'INTJ',
            answers: resultData.answers || {},
            timestamp: record.timestamp,
            userData: record.userData || resultData.userData
          }));
          return `/tests/mbti_pro/result?data=${dataStr}`;
        }
        // 결과 데이터가 없으면 코드만 전달
        return `/tests/mbti_pro/result?code=${encodeURIComponent(code)}`;
      } catch (e) {
        console.error('전문가용 MBTI 결과 페이지 URL 생성 오류:', e);
        return `/tests/mbti_pro/result?code=${encodeURIComponent(code)}`;
      }
    }
    
    // 개인용 MBTI 검사 결과 페이지
    if (testType.includes('mbti')) {
      // mbtiType이 없으면 결과 데이터에서 가져오기 시도
      const finalMbtiType = mbtiType || record.result?.mbtiType || 'INTJ';
      return `/results/mbti?code=${encodeURIComponent(code)}&type=${encodeURIComponent(finalMbtiType)}`;
    }
    
    // 기본적으로 MBTI 결과 페이지로 이동
    return `/results/mbti?code=${encodeURIComponent(code)}&type=${encodeURIComponent(mbtiType || 'INTJ')}`;
  };

  // 검사 기록 클릭 핸들러
  const handleRecordClick = (record: DeletedTestRecord) => {
    if (!record.code) {
      console.warn('검사 코드가 없어 결과 페이지로 이동할 수 없습니다:', record);
      return;
    }
    
    // 삭제된 기록의 결과 데이터를 임시로 복원 (결과 페이지에서 읽을 수 있도록)
    if (typeof window !== 'undefined') {
      try {
        // result 데이터가 있는 경우
        if (record.result) {
          localStorage.setItem(`test-result-${record.code}`, JSON.stringify(record.result));
        }
        
        // test_records에도 임시로 추가 (결과 페이지가 여기서도 찾을 수 있도록)
        const testRecordsStr = localStorage.getItem('test_records') || '[]';
        const testRecords = JSON.parse(testRecordsStr);
        const tempRecord = {
          code: record.code,
          testType: record.testType,
          timestamp: record.timestamp,
          result: record.result,
          mbtiType: record.mbtiType || record.result?.mbtiType || 'INTJ',
          counselorCode: record.counselorCode,
          userData: record.userData
        };
        
        // 이미 존재하는지 확인
        const existingIndex = testRecords.findIndex((r: any) => r.code === record.code);
        if (existingIndex >= 0) {
          // 기존 레코드 업데이트 (result 포함)
          testRecords[existingIndex] = { ...testRecords[existingIndex], ...tempRecord };
        } else {
          // 새 레코드 추가
          testRecords.push(tempRecord);
        }
        localStorage.setItem('test_records', JSON.stringify(testRecords));
        
        // 개인용 MBTI 검사인 경우 mbti-user-test-records에도 저장
        const isPersonalMbti = (record.testType || '').toLowerCase().includes('개인용') || 
                               (record.testType || '').toLowerCase().includes('mbti') && 
                               !(record.testType || '').toLowerCase().includes('전문가용') &&
                               !(record.testType || '').toLowerCase().includes('mbti pro') &&
                               !record.code.startsWith('MP');
        
        if (isPersonalMbti) {
          try {
            const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records') || '[]';
            const mbtiRecords = JSON.parse(mbtiRecordsStr);
            
            const mbtiRecord = {
              testCode: record.code,
              testType: record.testType,
              timestamp: record.timestamp,
              userData: record.userData || record.result?.userData || {},
              result: record.result || {
                code: record.code,
                timestamp: record.timestamp,
                testType: record.testType,
                answers: record.result?.answers || (record as any).answers || {},
                mbtiType: record.mbtiType || record.result?.mbtiType || 'INTJ'
              },
              answers: record.result?.answers || (record as any).answers || {},
              mbtiType: record.mbtiType || record.result?.mbtiType || 'INTJ'
            };
            
            // 이미 존재하는지 확인
            const existingMbtiIndex = mbtiRecords.findIndex((r: any) => r.testCode === record.code);
            if (existingMbtiIndex >= 0) {
              mbtiRecords[existingMbtiIndex] = mbtiRecord;
            } else {
              mbtiRecords.push(mbtiRecord);
            }
            
            localStorage.setItem('mbti-user-test-records', JSON.stringify(mbtiRecords));
          } catch (error) {
            console.error('개인용 MBTI 기록 저장 오류:', error);
          }
        }
        
        // 전문가용 MBTI인 경우 추가 데이터 저장
        const isProfessional = (record.testType || '').toLowerCase().includes('전문가용') || 
                               (record.testType || '').toLowerCase().includes('mbti pro') ||
                               record.code.startsWith('MP');
        if (isProfessional && record.result) {
          // 전문가용 MBTI 결과 데이터 저장
          const proResultData = {
            code: record.code,
            mbtiType: record.mbtiType || record.result?.mbtiType || 'INTJ',
            answers: record.result.answers || {},
            timestamp: record.timestamp,
            userData: record.userData || record.result.userData
          };
          localStorage.setItem(`mbti_pro_result_data`, JSON.stringify(proResultData));
        }
      } catch (error) {
        console.error('결과 데이터 임시 저장 오류:', error);
      }
    }
    
    const resultUrl = getResultPageUrl(record);
    // 이전 페이지 정보 저장 (삭제코드 목록으로 돌아가기 위해)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnToDeletedCodes', 'true');
    }
    router.push(resultUrl);
  };

  // 개별 복구 핸들러
  const handleSingleRestoreClick = (e: React.MouseEvent, record: DeletedTestRecord) => {
    e.stopPropagation();
    setSingleRestoreRecord(record);
    setShowSingleRestoreConfirm(true);
  };

  // 개별 복구 확인 함수
  const handleSingleRestoreConfirm = async () => {
    if (!singleRestoreRecord) return;
    
    setIsProcessing(true);
    setShowSingleRestoreConfirm(false);
    
    try {
      if (typeof window !== 'undefined') {
        // 1. 기존 테스트 기록 가져오기
        const testRecordsStr = localStorage.getItem('test_records') || '[]';
        const testRecords = JSON.parse(testRecordsStr);
        
        // 2. 복원할 레코드 준비
        const { deletedAt, ...restoredRecord } = singleRestoreRecord;
        const cleanedRecord = {
          ...restoredRecord,
          status: '완료'
        };
        
        // 3. 중복 체크 후 추가
        const existingIndex = testRecords.findIndex((r: any) => r.code === cleanedRecord.code);
        if (existingIndex >= 0) {
          testRecords[existingIndex] = cleanedRecord;
        } else {
          testRecords.push(cleanedRecord);
        }
        
        // 4. 테스트 기록 업데이트
        const updatedTestRecords = testRecords.filter((r: any) => r && r.code && r.testType);
        localStorage.setItem('test_records', JSON.stringify(updatedTestRecords));
        
        // 5. 검사결과 데이터 복원 (test-result-{code})
        // 복구 시 완전한 데이터 구조로 복원
        const completeResultData = {
          testType: cleanedRecord.testType,
          code: cleanedRecord.code,
          timestamp: cleanedRecord.timestamp,
          answers: (cleanedRecord as any).answers || (cleanedRecord as any).result?.answers || {},
          mbtiType: cleanedRecord.mbtiType || cleanedRecord.result?.mbtiType || 'INTJ',
          status: '완료',
          userData: cleanedRecord.userData || {
            name: '게스트 사용자',
            email: 'guest@example.com',
            testType: cleanedRecord.testType
          }
        };
        
        localStorage.setItem(`test-result-${cleanedRecord.code}`, JSON.stringify(completeResultData));
        
        // 6. MBTI 테스트 기록도 함께 복원
        if (cleanedRecord.testType.toLowerCase().includes('mbti')) {
          const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records') || '[]';
          let mbtiRecords = [];
          
          try {
            mbtiRecords = JSON.parse(mbtiRecordsStr);
          } catch (e) {
            console.error('MBTI 테스트 기록 파싱 오류:', e);
            mbtiRecords = [];
          }
          
          const mbtiRecord = {
            testCode: cleanedRecord.code,
            testType: cleanedRecord.testType,
            timestamp: cleanedRecord.timestamp,
            userData: completeResultData.userData,
            result: completeResultData,
            answers: completeResultData.answers,
            mbtiType: completeResultData.mbtiType
          };
          
          const existingMbtiIndex = mbtiRecords.findIndex((r: any) => r.testCode === cleanedRecord.code);
          if (existingMbtiIndex >= 0) {
            mbtiRecords[existingMbtiIndex] = mbtiRecord;
          } else {
            mbtiRecords.push(mbtiRecord);
          }
          
          localStorage.setItem('mbti-user-test-records', JSON.stringify(mbtiRecords));
        }
        
        // 7. 삭제된 기록에서 복원된 레코드 제거
        const remainingDeletedRecords = deletedRecords.filter(record =>
          record.code !== singleRestoreRecord.code
        );
        
        // 8. 삭제된 기록 업데이트
        localStorage.setItem('deleted_test_records', JSON.stringify(sanitizeDeletedRecords(remainingDeletedRecords)));
        setDeletedRecords(remainingDeletedRecords);
        
        // 9. 카운트 즉시 업데이트
        setDeletedCodesCount(remainingDeletedRecords.length);
        setTestRecordsCount(updatedTestRecords.length);
        
        // 10. 부모 컴포넌트에 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('testRecordsUpdated'));
        window.dispatchEvent(new CustomEvent('deletedCodesUpdated'));
        
        console.log(`기록 복원 완료: ${cleanedRecord.code}`);
        
        setSingleRestoreRecord(null);
      }
    } catch (error) {
      console.error('기록 복원 오류:', error);
      alert('기록 복원 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 선택된 기록 복원 함수
  const restoreSelectedRecords = () => {
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 1. 삭제된 기록에서 복원할 레코드 찾기
        const recordsToRestore = deletedRecords.filter(record => 
          selectedRecords.includes(record.code)
        );
        
        // 2. 기존 테스트 기록 가져오기
        const testRecordsStr = localStorage.getItem('test_records') || '[]';
        const testRecords = JSON.parse(testRecordsStr);
        
        // 3. 복원할 레코드 추가
        const restoredRecords = recordsToRestore.map(record => {
          const { deletedAt, ...restoredRecord } = record;
          return {
            ...restoredRecord,
            status: '완료'
          };
        });
        
        // 4. 검사결과 데이터 복원 (test-result-{code})
        restoredRecords.forEach(record => {
          if (record.result && record.code) {
            localStorage.setItem(`test-result-${record.code}`, JSON.stringify(record.result));
          }
        });
        
        // 5. 테스트 기록 업데이트 (중복 체크)
        const updatedTestRecords = [...testRecords];
        restoredRecords.forEach(restoredRecord => {
          const existingIndex = updatedTestRecords.findIndex((r: any) => r.code === restoredRecord.code);
          if (existingIndex >= 0) {
            updatedTestRecords[existingIndex] = restoredRecord;
          } else {
            updatedTestRecords.push(restoredRecord);
          }
        });
        
        const finalTestRecords = updatedTestRecords.filter((r: any) => r && r.code && r.testType);
        localStorage.setItem('test_records', JSON.stringify(finalTestRecords));
        
        // 6. MBTI 테스트 기록도 함께 복원 (mbti-user-test-records에 추가)
        const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records') || '[]';
        let mbtiRecords = [];
        
        try {
          mbtiRecords = JSON.parse(mbtiRecordsStr);
        } catch (e) {
          console.error('MBTI 테스트 기록 파싱 오류:', e);
          mbtiRecords = [];
        }
        
        // MBTI 관련 레코드만 필터링하여 추가 (중복 체크)
        const mbtiRestoredRecords = restoredRecords
          .filter(record => record.testType.toLowerCase().includes('mbti'))
          .map(record => ({
            testCode: record.code,
            testType: record.testType,
            timestamp: record.timestamp,
            userData: record.userData,
            result: record.result
          }));
        
        if (mbtiRestoredRecords.length > 0) {
          mbtiRestoredRecords.forEach(mbtiRecord => {
            const existingIndex = mbtiRecords.findIndex((r: any) => r.testCode === mbtiRecord.testCode);
            if (existingIndex >= 0) {
              mbtiRecords[existingIndex] = mbtiRecord;
            } else {
              mbtiRecords.push(mbtiRecord);
            }
          });
          localStorage.setItem('mbti-user-test-records', JSON.stringify(mbtiRecords));
          console.log(`${mbtiRestoredRecords.length}개의 MBTI 테스트 기록 복원 완료`);
        }
        
        // 7. 삭제된 기록에서 복원된 레코드 제거
        const remainingDeletedRecords = deletedRecords.filter(record =>
          !selectedRecords.includes(record.code)
        );
        
        // 8. 삭제된 기록 업데이트
        localStorage.setItem('deleted_test_records', JSON.stringify(sanitizeDeletedRecords(remainingDeletedRecords)));
        setDeletedRecords(remainingDeletedRecords);
        
        // 9. 선택 초기화
        setSelectedRecords([]);
        
        // 10. 카운트 즉시 업데이트
        setDeletedCodesCount(remainingDeletedRecords.length);
        setTestRecordsCount(finalTestRecords.length);
        
        // 11. 부모 컴포넌트에 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('testRecordsUpdated'));
        window.dispatchEvent(new CustomEvent('deletedCodesUpdated'));
        
        console.log(`${restoredRecords.length}개의 기록 복원 완료`);
      }
    } catch (error) {
      console.error('기록 복원 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowRestoreConfirm(false);
      setShowSingleRestoreConfirm(false);
      setSingleRestoreRecord(null);
    }
  };

  // 선택된 기록 영구 삭제 함수
  const permanentlyDeleteSelectedRecords = () => {
    if (selectedRecords.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 1. 영구 삭제할 레코드 정보 수집
        const recordsToMove = deletedRecords.filter(record => 
          selectedRecords.includes(record.code)
        );
        
        // 2. 관리자용 영구 삭제 저장소에 추가
        const adminDeletedStr = localStorage.getItem('admin_deleted_records') || '[]';
        let adminDeletedRecords = [];
        
        try {
          adminDeletedRecords = JSON.parse(adminDeletedStr);
        } catch (e) {
          console.error('관리자 삭제 기록 파싱 오류:', e);
          adminDeletedRecords = [];
        }
        
        // 각 레코드에 영구 삭제 시간 기록
        const recordsWithPermanentDelete = recordsToMove.map(record => ({
          ...record,
          permanentlyDeletedAt: new Date().toISOString(),
          hiddenFromUser: true
        }));
        
        // 관리자용 삭제 기록 업데이트
        const updatedAdminRecords = [...adminDeletedRecords, ...recordsWithPermanentDelete];
        localStorage.setItem('admin_deleted_records', JSON.stringify(updatedAdminRecords));
        
        // 3. 삭제된 기록에서 선택된 레코드 제외
        const remainingDeletedRecords = deletedRecords.filter(record =>
          !selectedRecords.includes(record.code)
        );
        
        // 4. 삭제된 기록 업데이트
        localStorage.setItem('deleted_test_records', JSON.stringify(remainingDeletedRecords));
        setDeletedRecords(remainingDeletedRecords);
        
        // 5. 선택 초기화
        setSelectedRecords([]);
        
        // 6. 삭제코드 숫자 업데이트
        const updatedDeletedRecords = JSON.parse(localStorage.getItem('deleted_test_records') || '[]');
        setDeletedCodesCount(updatedDeletedRecords.length);
        
        // 7. 페이지 새로고침으로 목록 업데이트
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error('영구 삭제 오류:', error);
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  // 로딩 상태 체크
  if (firebaseLoading || isLoading) {
    if (isEmbedded) {
      return (
        <div className="flex w-full items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            <p className="text-sm text-slate-400">불러오는 중…</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#0b1120]">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div className="flex min-h-0 flex-1 flex-col pt-16">
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
            <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center justify-center px-3 py-8 sm:px-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] px-8 py-10 text-center backdrop-blur-sm">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
                <p className="text-sm text-slate-400">불러오는 중…</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 인증 체크
  if (!user) {
    if (isEmbedded) {
      return (
        <div className="w-full rounded-lg border border-white/10 bg-white/[0.06] p-6 text-center text-slate-300">
          <p className="mb-4 text-sm">로그인이 필요합니다.</p>
          <Link href="/login" className="text-sky-400 hover:text-sky-300 underline">
            로그인하기
          </Link>
        </div>
      );
    }
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#0b1120]">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        <div className="flex min-h-0 flex-1 flex-col pt-16">
          <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950 text-white">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
            <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col px-3 py-6 sm:px-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-sm">
                <p className="mb-4 text-slate-300">삭제된 코드에 접근하려면 로그인이 필요합니다</p>
                <Link
                  href="/login"
                  className="inline-flex rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 transition-colors"
                >
                  로그인하기
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabLinkBase =
    'px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors text-slate-400 hover:text-slate-200';
  const tabLinkActive =
    'px-3 py-1.5 text-sm font-medium rounded-t-md transition-colors text-white bg-white/10 border border-b-0 border-white/15';

  const listPanel = (
          <motion.div
            className="flex min-h-0 flex-1 flex-col bg-white/[0.06] backdrop-blur-sm rounded-lg border border-white/10 p-3 sm:p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <h2 className="text-xl font-semibold text-slate-100 sm:shrink-0">
                삭제코드{' '}
                <span className="font-normal text-slate-500">({filteredRecords.length})</span>
              </h2>
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검사 코드 · 유형 · 이름 검색"
                  className="w-full rounded-md border border-white/10 bg-white/[0.06] py-2 pl-9 pr-3 text-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
                />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="shrink-0 rounded-md border border-white/10 bg-slate-900/80 px-2 py-2 text-lg text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
              >
                <option value="newest" className="bg-slate-900 text-white">최근 삭제순</option>
                <option value="oldest" className="bg-slate-900 text-white">오래된 삭제순</option>
                <option value="codeAsc" className="bg-slate-900 text-white">코드 오름차순</option>
                <option value="codeDesc" className="bg-slate-900 text-white">코드 내림차순</option>
              </select>
            </div>
            <p className="mb-3 text-base text-slate-400">
              삭제한 검사 기록을 확인하고 복원하거나 영구 삭제할 수 있습니다.
            </p>

          <motion.div
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            {selectedRecords.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-slate-300">선택된 항목: {selectedRecords.length}개</p>
                  <button
                    onClick={() => setShowRestoreConfirm(true)}
                    className="px-4 py-2 bg-green-600/60 hover:bg-green-600/80 text-white rounded-lg transition-colors flex items-center"
                    disabled={isProcessing}
                  >
                    <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    복원하기
                  </button>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600/60 hover:bg-red-600/80 text-white rounded-lg transition-colors flex items-center"
                  disabled={isProcessing}
                >
                  <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  영구 삭제
                </button>
              </div>
            )}
            
            {filteredRecords.length > 0 ? (
              <>
                <div className="max-h-[min(70vh,720px)] overflow-auto rounded-md border border-white/10">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-slate-400 tracking-wider">
                          <input
                            type="checkbox"
                            id="select-all-header"
                            checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                            onChange={toggleAllSelection}
                            className="w-4 h-4 text-sky-500 border-white/30 rounded focus:ring-sky-500/60"
                          />
                        </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-center text-sm font-medium text-slate-400 tracking-wider cursor-pointer hover:text-slate-100 select-none"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          검사 일시
                          <span className={`text-xs ${sortField === 'timestamp' ? 'text-red-500' : 'text-slate-400'}`}>
                            <span className={sortField === 'timestamp' && sortDirection === 'asc' ? 'text-red-500' : 'text-slate-500'}>▲</span>
                            <span className={sortField === 'timestamp' && sortDirection === 'desc' ? 'text-red-500' : 'text-slate-500'}>▼</span>
                          </span>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-center text-sm font-medium text-slate-400 tracking-wider cursor-pointer hover:text-slate-100 select-none"
                        onClick={() => handleSort('testType')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          검사 유형
                          <span className={`text-xs ${sortField === 'testType' ? 'text-red-500' : 'text-slate-400'}`}>
                            <span className={sortField === 'testType' && sortDirection === 'asc' ? 'text-red-500' : 'text-slate-500'}>▲</span>
                            <span className={sortField === 'testType' && sortDirection === 'desc' ? 'text-red-500' : 'text-slate-500'}>▼</span>
                          </span>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-center text-sm font-medium text-slate-400 tracking-wider cursor-pointer hover:text-slate-100 select-none"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          검사코드
                          <span className={`text-xs ${sortField === 'code' ? 'text-red-500' : 'text-slate-400'}`}>
                            <span className={sortField === 'code' && sortDirection === 'asc' ? 'text-red-500' : 'text-slate-500'}>▲</span>
                            <span className={sortField === 'code' && sortDirection === 'desc' ? 'text-red-500' : 'text-slate-500'}>▼</span>
                          </span>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-sm font-medium text-slate-400 tracking-wider cursor-pointer hover:text-slate-100 select-none"
                        onClick={() => handleSort('code')}
                      >
                        <div className="flex items-center gap-1">
                          검사결과 코드
                          <span className={`text-xs ${sortField === 'code' ? 'text-red-500' : 'text-slate-400'}`}>
                            <span className={sortField === 'code' && sortDirection === 'asc' ? 'text-red-500' : 'text-slate-500'}>▲</span>
                            <span className={sortField === 'code' && sortDirection === 'desc' ? 'text-red-500' : 'text-slate-500'}>▼</span>
                          </span>
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-center text-sm font-medium text-slate-400 tracking-wider cursor-pointer hover:text-slate-100 select-none"
                        onClick={() => handleSort('deletedAt')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          삭제 일시
                          <span className={`text-xs ${sortField === 'deletedAt' ? 'text-red-500' : 'text-slate-400'}`}>
                            <span className={sortField === 'deletedAt' && sortDirection === 'asc' ? 'text-red-500' : 'text-slate-500'}>▲</span>
                            <span className={sortField === 'deletedAt' && sortDirection === 'desc' ? 'text-red-500' : 'text-slate-500'}>▼</span>
                          </span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-slate-400 tracking-wider">
                        복구
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {(() => {
                      // 페이지네이션 계산
                      const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
                      
                      return paginatedRecords.map((record) => {
                        return (
                        <tr key={record.code} className="group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.code)}
                            onChange={() => toggleSelection(record.code)}
                            className="w-4 h-4 text-sky-500 border-white/30 rounded focus:ring-sky-500/60"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td 
                          onClick={() => handleRecordClick(record)}
                          className="px-6 py-4 whitespace-nowrap text-sm text-white text-center hover:bg-white/10 hover:text-sky-50 cursor-pointer transition-colors duration-150"
                          title="클릭하여 검사 결과 보기"
                        >
                          {formatDate(record.timestamp)}
                        </td>
                        <td 
                          onClick={() => handleRecordClick(record)}
                          className="px-6 py-4 whitespace-nowrap text-sm text-white text-center hover:bg-white/10 hover:text-sky-50 cursor-pointer transition-colors duration-150"
                          title="클릭하여 검사 결과 보기"
                        >
                          {record.testType}
                        </td>
                        <td 
                          onClick={() => handleRecordClick(record)}
                          className="px-6 py-4 whitespace-nowrap text-sm text-white text-center hover:bg-white/10 hover:text-sky-50 cursor-pointer transition-colors duration-150"
                          title="클릭하여 검사 결과 보기"
                        >
                          {(() => {
                            // 타입 안전한 검사코드 추출
                            const userData = record.userData as any;
                            return record.counselorCode || 
                                   userData?.counselorCode || 
                                   userData?.clientInfo?.counselorCode ||
                                   userData?.clientInfo?.groupCode ||
                                   userData?.groupCode ||
                                   record.code || 
                                   '-';
                          })()}
                        </td>
                        <td 
                          onClick={() => handleRecordClick(record)}
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-300 hover:bg-white/10 hover:text-yellow-200 cursor-pointer transition-colors duration-150"
                          title="클릭하여 검사 결과 보기"
                        >
                          {record.code}
                        </td>
                        <td 
                          onClick={() => handleRecordClick(record)}
                          className="px-6 py-4 whitespace-nowrap text-sm text-white text-center hover:bg-white/10 hover:text-sky-50 cursor-pointer transition-colors duration-150"
                          title="클릭하여 검사 결과 보기"
                        >
                          {formatDate(record.deletedAt)}
                        </td>
                        <td 
                          className="px-6 py-4 whitespace-nowrap text-sm text-center hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                          onClick={(e) => handleSingleRestoreClick(e, record)}
                        >
                          <button
                            onClick={(e) => handleSingleRestoreClick(e, record)}
                            className="px-3 py-1 text-xs font-medium bg-green-600/70 text-white rounded hover:bg-green-600/90 hover:text-green-100 transition-colors"
                            disabled={isProcessing}
                          >
                            복구
                          </button>
                        </td>
                      </tr>
                        );
                      });
                    })()}
                    </tbody>
                  </table>
                </div>
                
                {/* 페이지네이션 */}
                {filteredRecords.length > itemsPerPage && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-slate-300">
                    총 {filteredRecords.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRecords.length)}개 표시
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-white/10 text-slate-200 rounded hover:bg-white/[0.14] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      이전
                    </button>
                    {Array.from({ length: Math.min(5, Math.ceil(filteredRecords.length / itemsPerPage)) }, (_, i) => {
                      let pageNum: number;
                      const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 text-sm rounded transition-colors ${
                            currentPage === pageNum
                              ? 'bg-sky-600 text-white'
                              : 'bg-white/10 text-slate-200 hover:bg-white/[0.14]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredRecords.length / itemsPerPage), currentPage + 1))}
                      disabled={currentPage >= Math.ceil(filteredRecords.length / itemsPerPage)}
                      className="px-3 py-1 text-sm bg-white/10 text-slate-200 rounded hover:bg-white/[0.14] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      다음
                    </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-slate-500/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-white">삭제된 코드가 없습니다</h3>
                <p className="mt-1 text-slate-300">아직 삭제된 검사 기록이 없거나 검색 조건에 맞는 항목이 없습니다.</p>
              </div>
            )}
          </motion.div>
          </motion.div>
  );

  const modalSection = (
    <>
      {/* 복원 확인 모달 */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <motion.div 
            className="bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-white/15"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">복원 확인</h3>
            <p className="text-slate-300 mb-6">
              선택한 {selectedRecords.length}개의 검사 기록을 복원하시겠습니까? 복원된 기록은 검사 기록 목록에서 다시 확인할 수 있습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 bg-white/10 text-white rounded hover:bg-white/15 transition-colors"
                disabled={isProcessing}
              >
                취소
              </button>
              <button
                onClick={restoreSelectedRecords}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : "복원하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 개별 복구 확인 모달 */}
      {showSingleRestoreConfirm && singleRestoreRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowSingleRestoreConfirm(false)}>
          <motion.div 
            className="rounded-xl border border-white/15 bg-slate-900/95 p-6 shadow-lg backdrop-blur-sm max-w-md w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-4">복원 확인</h3>
            <p className="text-slate-300 mb-4">
              다음 검사 기록을 복원하시겠습니까?
            </p>
            <div className="bg-white/5 rounded-lg p-4 space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">검사 유형:</span>
                <span className="text-slate-100">{singleRestoreRecord.testType || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">검사결과 코드:</span>
                <span className="text-slate-100">{singleRestoreRecord.code || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">검사 일시:</span>
                <span className="text-slate-100">{singleRestoreRecord.timestamp ? formatDate(singleRestoreRecord.timestamp) : 'N/A'}</span>
              </div>
            </div>
            <p className="text-slate-400 text-sm mb-6">
              복원된 기록은 검사 기록 목록에서 다시 확인할 수 있습니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSingleRestoreConfirm(false);
                  setSingleRestoreRecord(null);
                }}
                className="px-4 py-2 bg-gray-700/60 text-gray-200 rounded hover:bg-gray-700 transition-colors"
                disabled={isProcessing}
              >
                취소
              </button>
              <button
                onClick={handleSingleRestoreConfirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : "복원하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 영구 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <motion.div 
            className="bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 max-w-md w-full border border-white/15"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold text-white mb-4">영구 삭제 확인</h3>
            <p className="text-slate-300 mb-2">
              선택한 {selectedRecords.length}개의 검사 기록을 영구적으로 삭제하시겠습니까?
            </p>
            <p className="text-red-300 mb-6 font-medium">
              이 작업은 취소할 수 없으며, 모든 데이터가 완전히 삭제됩니다.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white/10 text-white rounded hover:bg-white/15 transition-colors"
                disabled={isProcessing}
              >
                취소
              </button>
              <button
                onClick={permanentlyDeleteSelectedRecords}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </>
                ) : "영구 삭제"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );

  if (isEmbedded) {
    return (
      <>
        <div className="w-full min-w-0 text-white">{listPanel}</div>
        {modalSection}
      </>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0b1120] text-white">
      <div className="fixed left-0 right-0 top-0 z-50">
        <Navigation />
      </div>
      <div className="flex min-h-0 flex-1 flex-col pt-16">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-[#0f172a] to-slate-950">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
          <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col px-3 py-3 sm:px-4">
            <motion.div
              className="mb-2 shrink-0"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                마이페이지
              </h1>
            </motion.div>
            <motion.div
              className="mb-2 flex shrink-0 flex-wrap gap-x-1 gap-y-0 border-b border-white/10"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <Link href="/mypage?tab=profile" className={tabLinkBase}>
                기본 정보
              </Link>
              <Link href="/mypage?tab=records" className={tabLinkBase}>
                검사 기록 ({testRecordsCount})
              </Link>
              <Link href="/mypage?tab=in-progress" className={tabLinkBase}>
                진행중인 검사 ({inProgressCount})
              </Link>
              <Link href="/mypage?tab=stats" className={tabLinkBase}>
                통계 보기
              </Link>
              <Link href="/mypage/deleted-codes" className={tabLinkActive}>
                삭제코드 ({deletedCodesCount})
              </Link>
            </motion.div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">{listPanel}</div>
          </div>
        </main>
      </div>
      {modalSection}
    </div>
  );
} 