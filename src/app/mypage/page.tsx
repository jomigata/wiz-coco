"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUser, FaClipboard, FaBrain, FaClock } from 'react-icons/fa';
import { getItem, setItem, getAuthState, setAuthState } from '@/utils/localStorageManager';
import { setupSyncMonitor, onSyncStatusChange, SyncStatus } from '@/utils/syncService';
import dynamic from 'next/dynamic';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

// 삭제코드 페이지 컴포넌트 import
import { DeletedCodesContent } from '@/app/mypage/deleted-codes/components';
import ProfileEditor from './components/ProfileEditor';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface TestRecord {
  code: string;
  testType: string;
  timestamp?: string;
  createdAt?: string;
  mbtiType?: string;
  userData?: any;
  status: string;
}

interface Stats {
  totalTests: number;
  mbtiCount: number;
  egoCount: number;
  enneagramCount: number;
  averageScore: number;
  lastTestDate: string | null;
  favoriteType: string | null;
}

// 로딩 컴포넌트
const LoadingMyPage = () => (
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
      {/* 마이페이지 타이틀 */}
      <div className="mb-8 relative">
        <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
          마이페이지
        </h1>
        <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
      </div>
      
      <div className="flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
          <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-blue-200">정보를 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  </main>
);

// 클라이언트 컴포넌트 (useSearchParams 사용)
function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Firebase 인증 훅 사용
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  
  // URL에서 탭 파라미터 확인 - 기본값을 records로 설정
  const initialTab = searchParams.get('tab') || 'records';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle' as SyncStatus);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mbti' | 'ego' | 'enneagram'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    mbtiCount: 0,
    egoCount: 0,
    enneagramCount: 0,
    averageScore: 0,
    lastTestDate: null,
    favoriteType: null
  });

  // 로그인 상태 확인 (빠른 체크를 위해 최적화)
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        // Firebase 인증 상태 확인
        if (firebaseLoading) {
          return; // Firebase 로딩 중이면 대기
        }

        if (firebaseUser) {
          // Firebase 사용자 정보를 기존 User 인터페이스에 맞게 변환
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            role: firebaseUser.role || 'user',
            createdAt: new Date().toISOString(), // Firebase에서 생성 시간을 가져올 수 있다면 수정
            lastLoginAt: new Date().toISOString()
          };
          setUser(userData);
          setIsLoadingUser(false);
          return;
        }

        // Firebase 인증이 없으면 기존 로컬 인증 확인 (호환성 유지)
        const authState = getAuthState();
        if (authState && authState.isLoggedIn && authState.userBasicInfo) {
          setUser(authState.userBasicInfo);
          setIsLoadingUser(false);
          return;
        }

        // 서버 상태 확인 (로컬 상태가 없는 경우에만)
        const response = await fetch('/api/simple-login', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isLoggedIn && data.user) {
            setUser(data.user);
            setAuthState(true, data.user);
            setIsLoadingUser(false);
            return;
          }
        }

        // 3. 인증 실패 시 처리
        setUser(null);
        setIsLoadingUser(false);
      } catch (error) {
        console.error('사용자 정보 로딩 오류:', error);
        setUser(null);
        setIsLoadingUser(false);
      }
    };

    checkAuthAndLoadUser();
  }, [firebaseUser, firebaseLoading]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingUser(true);

        // URL 탭 파라미터 처리
        const tabParam = searchParams.get('tab');
        if (tabParam && ['profile', 'records', 'stats', 'deleted'].includes(tabParam)) {
          setActiveTab(tabParam);
        }

        // 검사 기록 가져오기
        const records = await fetchTestRecordsFromDB(user?.email || '');
        setTestRecords(records);
        setStats({
          totalTests: records.length,
          mbtiCount: records.filter((r: TestRecord) => r.testType === '개인용 MBTI 검사' || r.testType === 'MBTI 검사').length,
          egoCount: records.filter((r: TestRecord) => r.testType === '전문가용 검사').length,
          enneagramCount: records.filter((r: TestRecord) => r.testType === '개인용 검사').length,
          averageScore: 0, // 평균 점수 계산 필요
          lastTestDate: records.length > 0 ? records[0].timestamp || null : null,
          favoriteType: null // 즐겨찾는 유형 계산 필요
        });
      } catch (error) {
        console.error('데이터 로드 오류:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadData();
  }, [searchParams, user]);

  // 탭 변경 처리
  const changeTab = (tab: string) => {
    if (tab === 'profile' || tab === 'records' || tab === 'stats' || tab === 'deleted') {
      setActiveTab(tab);
    }
  };
  
  // 필터링된 테스트 기록
  const filteredTestRecords = React.useMemo(() => {
    if (!testRecords.length) return [];
    
    return testRecords
      .filter(record => {
        // 검색어 필터링
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            record.code.toLowerCase().includes(searchLower) ||
            record.testType.toLowerCase().includes(searchLower) ||
            record.userData?.name?.toLowerCase().includes(searchLower) ||
            false
          );
        }
        return true;
      })
      .filter(record => {
        // 테스트 유형 필터링
        if (filterType !== 'all') {
          return record.testType.toLowerCase().includes(filterType.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        // 정렬
        const timeA = new Date(a.timestamp || new Date()).getTime();
        const timeB = new Date(b.timestamp || new Date()).getTime();
        
        if (sortOrder === 'newest') {
          return timeB - timeA;
        } else if (sortOrder === 'oldest') {
          return timeA - timeB;
        } else {
          return timeB - timeA;
        }
      });
  }, [testRecords, searchQuery, filterType, sortOrder]);

  // 날짜 포맷팅 함수
  function formatDate(dateValue?: string | Date | null): string {
    if (!dateValue) {
      return '자료가 없음';
    }
    
    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      if (isNaN(date.getTime())) {
        return '자료가 없음';
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return '자료가 없음';
    }
  }

  // 레코드 상세보기
  const viewTestDetail = (code: string) => {
    const testRecord = testRecords.find(record => record.code === code);
    if (!testRecord) {
      const dummyRecord: TestRecord = {
        code: code,
        testType: 'mbti_pro',
        userData: {
          clientInfo: { 
            name: '테스트 사용자',
            groupCode: '6666',
            birthYear: 1990,
            gender: '여',
            privacyAgreed: true
          }
        },
        timestamp: new Date().toISOString(),
        status: '완료'
      };
      return navigateToTestResult(dummyRecord);
    } else {
      return navigateToTestResult(testRecord);
    }
  };

  // 테스트 결과 페이지로 이동하는 함수
  const navigateToTestResult = (testRecord: TestRecord) => {
    try {
      const testType = testRecord?.testType || 'mbti_pro';
      
      // 개인용 MBTI 테스트인 경우
      if (testType === '개인용 MBTI 검사' || testType === 'MBTI 검사' || testType === 'mbti' || testType === 'personal_mbti') {
        // 개인 MBTI 결과 페이지로 이동
        const mbtiType = testRecord?.userData?.mbtiType || testRecord?.mbtiType || 'INTJ';
        const resultPath = `/results/mbti?code=${encodeURIComponent(testRecord.code)}&type=${encodeURIComponent(mbtiType)}`;
        
        localStorage.setItem('last_viewed_test_code', testRecord.code);
        router.push(resultPath);
        return;
      }
      
      // 전문가 MBTI 테스트인 경우 (기존 로직 유지)
      const clientInfo = testRecord?.userData?.clientInfo || { 
        name: testRecord?.userData?.name || '테스트 사용자',
        groupCode: testRecord?.userData?.groupCode || '6666',
        birthYear: testRecord?.userData?.birthYear || 1972,
        gender: testRecord?.userData?.gender || '여',
        privacyAgreed: true
      };
      
      // 기본 답변 데이터 생성
      const answers = {} as Record<string, number>;
      for (let i = 1; i <= 20; i++) {
        const preference = i % 2 === 0 ? 1 : 5;
        answers[`q${i}`] = preference;
      }
      
      const dataObj = {
        answers: answers,
        clientInfo: clientInfo,
        timestamp: testRecord?.timestamp || new Date().toISOString(),
        testCode: testRecord.code
      };
      
      const dataStr = encodeURIComponent(JSON.stringify(dataObj));
      const resultPath = `/tests/mbti_pro/result?data=${dataStr}`;
      
      localStorage.setItem('last_viewed_test_code', testRecord.code);
      localStorage.setItem('show_graph_result', 'true');
      
      router.push(resultPath);
    } catch (error) {
      console.error('테스트 결과 페이지 이동 오류:', error);
      // 사용자에게 오류 알림
      alert('테스트 결과를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      // 오류 발생 시 기본적으로 전문가 MBTI 결과 페이지로 이동
      router.push(`/tests/mbti_pro/result`);
    }
  };

  // 알림 설정 토글
  const toggleNotification = (type: 'notifications' | 'marketing') => {
    try {
      const settings = localStorage.getItem('user_settings') 
        ? JSON.parse(localStorage.getItem('user_settings') || '{}')
        : {};
      
      if (type === 'notifications') {
        const newValue = !notificationsEnabled;
        setNotificationsEnabled(newValue);
        settings.notificationsEnabled = newValue;
      } else if (type === 'marketing') {
        const newValue = !emailNotificationsEnabled;
        setEmailNotificationsEnabled(newValue);
        settings.emailNotificationsEnabled = newValue;
      }
      
      localStorage.setItem('user_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
    }
  };

  // 설정 로드
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const userSettings = localStorage.getItem('user_settings');
        if (userSettings) {
          const settings = JSON.parse(userSettings);
          setNotificationsEnabled(settings.notificationsEnabled ?? true);
          setEmailNotificationsEnabled(settings.emailNotificationsEnabled ?? false);
        } else {
          setNotificationsEnabled(true);
          setEmailNotificationsEnabled(false);
          
          const defaultSettings = {
            notificationsEnabled: true,
            emailNotificationsEnabled: false
          };
          localStorage.setItem('user_settings', JSON.stringify(defaultSettings));
        }
      }
    } catch (error) {
      console.error('설정 로드 오류:', error);
    }
  }, []);

  // DB에서 테스트 기록 가져오기
  const fetchTestRecordsFromDB = async (email: string): Promise<TestRecord[]> => {
    try {
      if (!email) return [];
      
      console.log('[MyPage] DB에서 검사 기록 조회 시작:', email);
      
      const response = await fetch('/api/test-results', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[MyPage] 인증 실패 - 로컬 데이터로 대체');
          return fetchLocalTestRecords(email);
        }
        throw new Error(`API 오류: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        console.log(`[MyPage] DB에서 ${result.data.length}개의 검사 기록 조회 완료`);
        
        // API 응답을 TestRecord 형식으로 변환
        const dbRecords: TestRecord[] = result.data.map((record: any) => ({
          code: record.code,
          timestamp: record.timestamp,
          testType: record.testType,
          userData: record.userData || {},
          status: record.status || '완료'
        }));
        
        return dbRecords;
      } else {
        console.warn('[MyPage] DB 응답 형식 오류, 로컬 데이터로 대체');
        return fetchLocalTestRecords(email);
      }
    } catch (error) {
      console.error('[MyPage] DB 검사 기록 조회 오류:', error);
      console.log('[MyPage] 로컬 스토리지로 대체');
      return fetchLocalTestRecords(email);
    }
  };

  // 로컬 스토리지에서 테스트 기록 가져오기 (DB 실패시 백업용)
  const fetchLocalTestRecords = (email: string): TestRecord[] => {
    try {
      const allRecords: TestRecord[] = [];
      
      // 사용자별 키로 저장된 테스트 기록 가져오기
      const userSpecificKey = `mbti-user-test-records-${email}`;
      const mbtiRecordsStr = localStorage.getItem(userSpecificKey) || localStorage.getItem('mbti-user-test-records');
      
      if (mbtiRecordsStr) {
        try {
          const mbtiRecords = JSON.parse(mbtiRecordsStr);
          if (Array.isArray(mbtiRecords)) {
            mbtiRecords.forEach((record: any) => {
              const recordCode = record.testCode || record.code;
              if (recordCode) {
                allRecords.push({
                  code: recordCode,
                  timestamp: record.timestamp || record.createdAt || record.testDate || new Date().toISOString(),
                  testType: record.testType || '개인용 MBTI 검사',
                  userData: record.userData || {},
                  status: record.status || '완료'
                });
              }
            });
          }
        } catch (e) {
          console.error('MBTI 테스트 기록 파싱 오류:', e);
        }
      }
      
      console.log(`사용자 ${email}의 로컬 테스트 기록 ${allRecords.length}개를 로드했습니다.`);
      
      return allRecords.sort((a, b) => {
        const timeA = new Date(a.timestamp || new Date()).getTime();
        const timeB = new Date(b.timestamp || new Date()).getTime();
        return timeB - timeA;
      }).slice(0, 10);
    } catch (error) {
      console.error('로컬 테스트 기록 로드 오류:', error);
      return [];
    }
  };

  if (isLoadingUser) {
    return <LoadingMyPage />;
  }

  return (
    <main className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden min-h-screen pt-16 pb-12">
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
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 마이페이지 타이틀 */}
        <div className="mb-8 relative">
          <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
            마이페이지
          </h1>
          <div className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"></div>
        </div>
        
        {firebaseLoading || isLoadingUser ? (
          <div className="flex items-center justify-center">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
              <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-blue-200">정보를 불러오는 중입니다...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 text-center py-8">
            <p className="text-blue-200 mb-4">마이페이지에 접근하려면 로그인이 필요합니다</p>
            <Link 
              href="/login" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <>
            <div className="flex border-b border-white/20 mb-6">
              <button
                onClick={() => changeTab('profile')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'profile'
                    ? 'text-blue-200 border-b-2 border-blue-200'
                    : 'text-blue-300 hover:text-blue-200'
                }`}
              >
                기본 정보
              </button>
              <button
                onClick={() => changeTab('records')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'records'
                    ? 'text-blue-200 border-b-2 border-blue-200'
                    : 'text-blue-300 hover:text-blue-200'
                }`}
              >
                검사 기록
              </button>
              <button
                onClick={() => changeTab('stats')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'stats'
                    ? 'text-blue-200 border-b-2 border-blue-200'
                    : 'text-blue-300 hover:text-blue-200'
                }`}
              >
                통계 보기
              </button>
              <button
                onClick={() => changeTab('deleted')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'deleted'
                    ? 'text-blue-200 border-b-2 border-blue-200'
                    : 'text-blue-300 hover:text-blue-200'
                }`}
              >
                삭제코드
              </button>
            </div>

            {activeTab === 'profile' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 transition-all hover:bg-white/15 hover:shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-white/20 pb-3">
                  <h2 className="text-xl font-bold text-white">사용자 정보</h2>
                  <button
                    onClick={() => setIsProfileEditorOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-300 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    <span>프로필 편집</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10 transition-all hover:bg-white/10 hover:border-white/20">
                    <p className="text-blue-300 mb-2 font-medium">이메일</p>
                    <div className="flex justify-between items-center">
                      <p className="text-white text-lg">{user?.email}</p>
                      <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="text-blue-300 hover:text-blue-200 ml-2 flex items-center text-sm"
                        title="비밀번호 변경"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        비밀번호 변경
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-blue-300 mb-2 font-medium">가입일</p>
                    <p className="text-white text-lg">{formatDate(user?.createdAt)}</p>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <p className="text-blue-300 mb-2 font-medium">마지막 로그인</p>
                    <p className="text-white text-lg">{formatDate(user?.lastLoginAt)}</p>
                  </div>
                </div>

                {/* 알림 설정 */}
                <div className="mt-8 pt-6 border-t border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">알림 설정</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                      <div>
                        <p className="text-white font-medium">검사 알림</p>
                        <p className="text-sm text-blue-200">새로운 검사 및 업데이트 알림</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notificationsEnabled}
                          onChange={() => toggleNotification('notifications')}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-white/10">
                      <div>
                        <p className="text-white font-medium">마케팅 이메일</p>
                        <p className="text-sm text-blue-200">프로모션 및 마케팅 관련 이메일</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={emailNotificationsEnabled}
                          onChange={() => toggleNotification('marketing')}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">검사 기록</h2>
                  <div className="text-sm text-blue-200">
                    총 {testRecords.length}개의 검사 기록
                  </div>
                </div>

                {/* 검색 및 필터링 섹션 */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="w-full">
                      <label htmlFor="search" className="block text-blue-300 text-sm font-medium mb-2">
                        검색
                      </label>
                      <input
                        type="text"
                        id="search"
                        placeholder="코드, 유형, 이름으로 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="w-full">
                      <label htmlFor="filterType" className="block text-blue-300 text-sm font-medium mb-2">
                        유형 필터
                      </label>
                      <select
                        id="filterType"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as 'all' | 'mbti' | 'ego' | 'enneagram')}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all" className="bg-gray-800">전체 유형</option>
                        <option value="mbti" className="bg-gray-800">MBTI 검사</option>
                        <option value="ego" className="bg-gray-800">에고 검사</option>
                        <option value="enneagram" className="bg-gray-800">엔너그램 검사</option>
                      </select>
                    </div>
                    
                    <div className="w-full">
                      <label htmlFor="sortOrder" className="block text-blue-300 text-sm font-medium mb-2">
                        정렬
                      </label>
                      <select
                        id="sortOrder"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="newest" className="bg-gray-800">최신순</option>
                        <option value="oldest" className="bg-gray-800">오래된순</option>
                      </select>
                    </div>
                    
                    <div className="w-full">
                      <label className="block text-blue-300 text-sm font-medium mb-2">
                        필터 초기화
                      </label>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setFilterType('all');
                          setSortOrder('newest');
                        }}
                        className="w-full px-3 py-2 bg-red-600/40 hover:bg-red-600/60 text-white rounded-lg transition-colors border border-red-500/30"
                      >
                        초기화
                      </button>
                    </div>
                  </div>
                </div>

                {/* 검사 결과 목록 */}
                {testRecords.length > 0 ? (
                  <div className="space-y-3">
                    {/* 검사 기록 테이블 */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/20">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                              검사 코드
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                              검사 유형
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                              검사 일시
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                              상태
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-blue-300 uppercase tracking-wider">
                              액션
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {filteredTestRecords.slice(0, 20).map((record, index) => (
                            <tr key={record.code} className={index % 2 === 0 ? 'bg-white/5' : 'bg-white/0'}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                                <div className="flex items-center">
                                  <span className="font-mono bg-blue-900/40 px-2 py-1 rounded text-blue-200">
                                    {record.code}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-300">
                                <span className="px-2 py-1 bg-green-900/40 text-green-300 rounded-full text-xs">
                                  {record.testType}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-300">
                                {formatDate(record.timestamp)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  record.status === '완료' ? 'bg-green-900/40 text-green-300' : 'bg-yellow-900/40 text-yellow-300'
                                }`}>
                                  {record.status || '완료'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={() => viewTestDetail(record.code)}
                                  className="bg-blue-600/40 hover:bg-blue-600/60 text-white px-3 py-1 rounded transition-colors text-sm"
                                >
                                  상세보기
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 페이지네이션 또는 더 보기 */}
                    {filteredTestRecords.length > 20 && (
                      <div className="text-center mt-6">
                        <p className="text-blue-300 mb-4">
                          {filteredTestRecords.length}개 중 20개를 표시하고 있습니다
                        </p>
                        <Link
                          href="/mypage/test-records"
                          className="px-6 py-3 bg-blue-600/40 hover:bg-blue-600/60 text-white rounded-lg transition-colors inline-block"
                        >
                          전체 검사 기록 보기
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-blue-200 mb-4">아직 검사 기록이 없습니다</p>
                    <p className="text-blue-300 text-sm mb-6">검사를 완료하면 여기에서 결과를 확인할 수 있습니다</p>
                    <Link
                      href="/tests"
                      className="px-6 py-3 bg-blue-600/40 hover:bg-blue-600/60 text-white rounded-lg transition-colors inline-block"
                    >
                      검사 시작하기
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">검사 통계</h2>
                  <div className="text-sm text-blue-200">
                    분석 기간: 전체
                  </div>
                </div>

                {testRecords.length > 0 ? (
                  <div className="space-y-8">
                    {/* 주요 통계 카드 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-600/40 to-cyan-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-200">총 검사 횟수</p>
                            <p className="text-2xl font-bold text-white">{testRecords.length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-600/40 to-teal-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-500/20 rounded-lg">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-200">완료된 검사</p>
                            <p className="text-2xl font-bold text-white">{testRecords.filter(r => r.status === '완료').length}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <div className="flex items-center">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-200">첫 검사</p>
                            <p className="text-lg font-bold text-white">
                              {testRecords.length > 0 ? 
                                formatDate(testRecords[testRecords.length - 1].timestamp) : 
                                '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-orange-600/40 to-yellow-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                        <div className="flex items-center">
                          <div className="p-2 bg-orange-500/20 rounded-lg">
                            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-blue-200">최근 검사</p>
                            <p className="text-lg font-bold text-white">
                              {testRecords.length > 0 ? 
                                formatDate(testRecords[0].timestamp) : 
                                '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 검사 유형별 통계 차트 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 검사 유형 분포 */}
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">검사 유형별 분포</h3>
                        <div className="space-y-3">
                          {(() => {
                            const typeStats = testRecords.reduce((acc, record) => {
                              const type = record.testType || 'MBTI 검사';
                              acc[type] = (acc[type] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            return Object.entries(typeStats).map(([type, count]) => {
                              const percentage = (count / testRecords.length) * 100;
                              return (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="text-white text-sm">{type}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-white/10 rounded-full h-2">
                                      <div 
                                        className="bg-blue-500 h-2 rounded-full" 
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-blue-300 text-sm min-w-[3rem]">{count}회</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* 월별 검사 횟수 */}
                      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">월별 검사 활동</h3>
                        <div className="space-y-3">
                          {(() => {
                            const monthStats = testRecords.reduce((acc, record) => {
                              const date = new Date(record.timestamp || new Date());
                              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                              acc[monthKey] = (acc[monthKey] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            const sortedMonths = Object.entries(monthStats)
                              .sort(([a], [b]) => b.localeCompare(a))
                              .slice(0, 6);
                            
                            const maxCount = Math.max(...Object.values(monthStats));
                            
                            return sortedMonths.map(([month, count]) => {
                              const percentage = (count / maxCount) * 100;
                              return (
                                <div key={month} className="flex items-center justify-between">
                                  <span className="text-white text-sm">{month}</span>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-white/10 rounded-full h-2">
                                      <div 
                                        className="bg-green-500 h-2 rounded-full" 
                                        style={{ width: `${percentage}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-green-300 text-sm min-w-[3rem]">{count}회</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* 검사 패턴 분석 */}
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                      <h3 className="text-lg font-semibold text-blue-200 mb-4">검사 패턴 분석</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
                          <p className="text-blue-200 text-sm mb-1">평균 검사 간격</p>
                          <p className="text-white text-xl font-bold">
                            {testRecords.length > 1 ? 
                              `${Math.round((new Date(testRecords[0].timestamp || new Date()).getTime() - new Date(testRecords[testRecords.length - 1].timestamp || new Date()).getTime()) / (1000 * 60 * 60 * 24) / (testRecords.length - 1))}일` : 
                              '-'}
                          </p>
                        </div>
                        <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-800/50">
                          <p className="text-blue-200 text-sm mb-1">가장 활발한 요일</p>
                          <p className="text-white text-xl font-bold">
                            {(() => {
                              const dayStats = testRecords.reduce((acc, record) => {
                                const day = new Date(record.timestamp || new Date()).getDay();
                                const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                                const dayName = dayNames[day];
                                acc[dayName] = (acc[dayName] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              
                              const maxDay = Object.entries(dayStats).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
                              return maxDay[0] || '-';
                            })()}요일
                          </p>
                        </div>
                        <div className="bg-indigo-900/30 p-4 rounded-lg border border-indigo-800/50">
                          <p className="text-blue-200 text-sm mb-1">검사 완료율</p>
                          <p className="text-white text-xl font-bold">
                            {Math.round((testRecords.filter(r => r.status === '완료').length / testRecords.length) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 상세 분석 버튼 */}
                    <div className="text-center">
                      <button
                        onClick={() => router.push('/mypage/test-records')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                      >
                        상세 검사 기록 보기
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-blue-200 mb-4">아직 검사 기록이 없어 통계를 확인할 수 없습니다</p>
                    <p className="text-blue-300 text-sm mb-6">검사를 완료하시면 다양한 통계와 분석 결과를 확인하실 수 있습니다</p>
                    <Link
                      href="/tests"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                    >
                      첫 검사 시작하기
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deleted' && (
              <DeletedCodesContent isEmbedded={true} />
            )}
          </>
        )}

        {/* 프로필 편집 모달 */}
        {isProfileEditorOpen && (
          <ProfileEditor
            onClose={() => setIsProfileEditorOpen(false)}
            onUpdate={() => {
              // 사용자 정보 새로고침
              window.location.reload();
            }}
          />
        )}

        {/* 비밀번호 변경 모달 */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">비밀번호 변경</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-blue-300 mb-1">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-blue-300 mb-1">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="새 비밀번호 (6자 이상)"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-300 mb-1">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-blue-300 hover:text-blue-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    // 비밀번호 변경 로직 구현
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  변경하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// 메인 페이지 컴포넌트
export default function MyPage() {
  return (
    <Suspense fallback={<LoadingMyPage />}>
      <MyPageContent />
    </Suspense>
  );
} 