"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUser, FaClipboard, FaBrain, FaClock, FaKey, FaHeart, FaComment } from 'react-icons/fa';
import { getItem, setItem, getAuthState, setAuthState } from '@/utils/localStorageManager';
import { setupSyncMonitor, onSyncStatusChange, SyncStatus } from '@/utils/syncService';
import dynamic from 'next/dynamic';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useCounselorConnection } from '@/hooks/useCounselorConnection';
import { auth, db } from '@/lib/firebase'; // Firebase 인증 토큰 가져오기 위해 추가
import { doc, getDoc } from 'firebase/firestore';

// 삭제코드 페이지 컴포넌트 import
import { DeletedCodesContent } from '@/app/mypage/deleted-codes/components';
import ProfileEditor from './components/ProfileEditor';
import { getInProgressTests, clearTestProgress } from '@/utils/testResume';



// 아이콘 컴포넌트들
const UserIcon = FaUser;
const KeyIcon = FaKey;
const HeartIcon = FaHeart;
const ChatBubbleLeftRightIcon = FaComment;

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt: string;
  lastLoginAt?: string;
  // 프로필 편집에서 설정할 수 있는 추가 정보들
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  occupation?: string;
  interests?: string[];
  bio?: string;
}

interface TestRecord {
  code: string;
  testType: string;
  timestamp?: string;
  createdAt?: string;
  mbtiType?: string;
  userData?: any;
  status: string;
  counselorCode?: string;
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
  const [user, setUser] = useState<User | null>(null);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SyncStatus.PENDING);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [showOfflineData, setShowOfflineData] = useState(false);
  const [offlineData, setOfflineData] = useState<any[]>([]);
  const [showClientInfo, setShowClientInfo] = useState(false);
  const [showLocalStorageCleaner, setShowLocalStorageCleaner] = useState(false);

  // Firebase 인증 훅 사용
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  
  // 상담사 연결 상태 훅 사용
  const { connection: counselorConnection, loading: counselorLoading, refetch: refetchCounselor } = useCounselorConnection();
  
  // URL에서 탭 파라미터 확인
  const initialTab = searchParams.get('tab') || 'profile';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  // URL 파라미터 변경 시 activeTab 업데이트
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'profile';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mbti-personal' | 'mbti-professional' | 'ai-profiling' | 'integrated' | 'ego' | 'enneagram'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [inProgressTests, setInProgressTests] = useState<any[]>([]);
  const [inProgressFilter, setInProgressFilter] = useState<'all' | 'mbti_pro' | 'mbti' | 'ai-profiling' | 'integrated-assessment'>('all');
  const [inProgressSort, setInProgressSort] = useState<'recent' | 'progress' | 'name'>('recent');
  const [deletedCodesCount, setDeletedCodesCount] = useState(0);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeModalTest, setResumeModalTest] = useState<any>(null);
  const [showDeleteProgressModal, setShowDeleteProgressModal] = useState(false);
  const [deleteProgressTest, setDeleteProgressTest] = useState<any>(null);

  // 삭제된 코드 수 가져오기
  const updateDeletedCodesCount = () => {
    if (typeof window !== 'undefined') {
      try {
        const deletedRecords = JSON.parse(localStorage.getItem('deleted_test_records') || '[]');
        setDeletedCodesCount(Array.isArray(deletedRecords) ? deletedRecords.length : 0);
      } catch (error) {
        setDeletedCodesCount(0);
      }
    }
  };

  useEffect(() => {
    updateDeletedCodesCount();
  }, [activeTab]);

  // 삭제코드 업데이트 이벤트 리스너
  useEffect(() => {
    const handleDeletedCodesUpdate = () => {
      updateDeletedCodesCount();
    };

    window.addEventListener('deletedCodesUpdated', handleDeletedCodesUpdate);
    return () => {
      window.removeEventListener('deletedCodesUpdated', handleDeletedCodesUpdate);
    };
  }, []);

  // 검사기록 업데이트 이벤트 리스너
  useEffect(() => {
    const handleTestRecordsUpdate = () => {
      // 검사기록 재로드
      const updatedRecords = loadLocalTestRecords();
      setTestRecords(updatedRecords);
    };

    window.addEventListener('testRecordsUpdated', handleTestRecordsUpdate);
    
    return () => {
      window.removeEventListener('testRecordsUpdated', handleTestRecordsUpdate);
    };
  }, []);

  // 검사기록 탭으로 돌아올 때 목록 업데이트
  useEffect(() => {
    if (activeTab === 'records' && typeof window !== 'undefined') {
      const returnToTestRecords = sessionStorage.getItem('returnToTestRecords');
      if (returnToTestRecords === 'true') {
        // 약간의 지연 후 이벤트 발생 (탭이 완전히 렌더링된 후)
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('testRecordsUpdated'));
          sessionStorage.removeItem('returnToTestRecords');
        }, 100);
      }
    }
  }, [activeTab]);
  const [stats, setStats] = useState<Stats>({
    totalTests: 0,
    mbtiCount: 0,
    egoCount: 0,
    enneagramCount: 0,
    averageScore: 0,
    lastTestDate: null,
    favoriteType: null
  });
  // 통계 기간 필터: week | month | year
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [recordsLoading, setRecordsLoading] = useState<boolean>(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuthAndLoadUser = async () => {
      try {
        if (firebaseLoading) {
          return;
        }

        if (firebaseUser) {
          const userData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || undefined,
            role: firebaseUser.role || 'user',
            createdAt: firebaseUser.metadata?.creationTime || '',
            lastLoginAt: firebaseUser.metadata?.lastSignInTime || ''
          };

          try {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userDetailData = userDoc.data();
              Object.assign(userData, {
                phoneNumber: userDetailData.phoneNumber || '',
                birthDate: userDetailData.birthDate || '',
                gender: userDetailData.gender || '',
                occupation: userDetailData.occupation || '',
                interests: userDetailData.interests || [],
                bio: userDetailData.bio || '',
                createdAt: userDetailData.createdAt || firebaseUser.metadata?.creationTime || '',
                lastLoginAt: userDetailData.lastLoginAt || firebaseUser.metadata?.lastSignInTime || ''
              });
            }
          } catch (firestoreError) {
            console.warn('Firestore에서 사용자 상세 정보를 가져오는 중 오류:', firestoreError);
          }

          setUser(userData);
          setIsLoading(false);
          return;
        }

        const localUser = localStorage.getItem('user_settings');
        if (localUser) {
          try {
            const parsedUser = JSON.parse(localUser);
            setUser(parsedUser);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('로컬 사용자 정보 파싱 오류:', error);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('사용자 인증 확인 오류:', error);
        setIsLoading(false);
      }
    };

    checkAuthAndLoadUser();
  }, [firebaseUser, firebaseLoading]);

  // 진행 중인 검사 목록 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inProgress = getInProgressTests();
      setInProgressTests(inProgress);
      
      // 주기적으로 목록 갱신 (5초마다)
      const interval = setInterval(() => {
        const updated = getInProgressTests();
        setInProgressTests(updated);
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);

  // 진행 중인 검사 삭제
  const handleClearProgress = (test: any) => {
    setDeleteProgressTest(test);
    setShowDeleteProgressModal(true);
  };

  const handleConfirmDeleteProgress = () => {
    if (deleteProgressTest) {
      clearTestProgress(deleteProgressTest.testId);
      setInProgressTests(getInProgressTests());
      setShowDeleteProgressModal(false);
      setDeleteProgressTest(null);
    }
  };

  const handleStartFromBeginning = () => {
    if (deleteProgressTest) {
      // 진행 상태 삭제
      clearTestProgress(deleteProgressTest.testId);
      setInProgressTests(getInProgressTests());
      
      // 검사 페이지로 이동 (새로 시작)
      const testPath = getTestPath(deleteProgressTest.testId, deleteProgressTest.testType);
      router.push(testPath);
      
      setShowDeleteProgressModal(false);
      setDeleteProgressTest(null);
    }
  };

  // 검사 경로 매핑
  const getTestPath = (testId: string, testType?: string): string => {
    if (testId.includes('mbti_pro')) return '/tests/mbti_pro';
    if (testId.includes('mbti')) return '/tests/mbti';
    if (testId.includes('ai-profiling') || testType === 'AI_PROFILING') return '/tests/ai-profiling';
    if (testId.includes('integrated-assessment')) return '/tests/integrated-assessment';
    return '/tests';
  };

  // 탭 변경 함수
  const changeTab = (tabName: string) => {
    setActiveTab(tabName);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabName);
    router.push(`/mypage?${params.toString()}`);
  };

  // 레코드 정규화: status, testType, timestamp, score
  const normalizeTestRecord = (record: any): TestRecord => {
    // status 표준화
    const rawStatus = (record.status || '').toString().toLowerCase();
    const status = rawStatus.includes('완료') || rawStatus === 'completed' || rawStatus === 'complete' ? 'completed' : 'in_progress';

    // testType 표준화 (대표 문자열로 통일)
    const rawType = (record.testType || '').toString().toLowerCase();
    let testType = '기타';
    if (rawType.includes('mbti pro') || rawType.includes('mbti_pro') || rawType.includes('전문가')) testType = 'MBTI Pro';
    else if (rawType.includes('mbti')) testType = 'MBTI';
    else if (rawType.includes('ai') && rawType.includes('profil')) testType = 'AI 프로파일링';
    else if (rawType.includes('integrated') || rawType.includes('통합')) testType = '통합 평가';
    else if (rawType.includes('에고')) testType = '에고그램';
    else if (rawType.includes('에니어') || rawType.includes('ennea')) testType = '에니어그램';

    // timestamp 보정
    const timestamp = record.timestamp || record.createdAt || new Date().toISOString();

    return {
      code: record.code || record.id || '',
      testType,
      timestamp,
      createdAt: record.createdAt,
      mbtiType: record.mbtiType,
      userData: record.userData,
      status
    } as TestRecord;
  };

  // 검사 유형 명칭 표준화 함수
  const normalizeTestTypeName = (testType: string): string => {
    if (!testType) return 'Unknown';
    
    const type = testType.toLowerCase();
    if (type.includes('mbti')) {
      if (type.includes('전문가') || type.includes('pro')) {
        return '전문가용 MBTI 검사';
      } else {
        return '개인용 MBTI 검사';
      }
    }
    if (type.includes('ai') && type.includes('프로파일링')) {
      return 'AI 프로파일링 검사';
    }
    if (type.includes('통합')) {
      return '통합 평가 검사';
    }
    if (type.includes('에고')) {
      return '에고 검사';
    }
    if (type.includes('에니어')) {
      return '에니어그램 검사';
    }
    
    // 기본값으로 원본 반환 (첫 글자 대문자)
    return testType.charAt(0).toUpperCase() + testType.slice(1);
  };

  // 로컬 테스트 기록 로드 (모든 검사 포함 + 표준화)
  const loadLocalTestRecords = (): TestRecord[] => {
    try {
      setRecordsLoading(true);
      setRecordsError(null);
      
      const allRecords: TestRecord[] = [];
      
      // 1. 기본 test_records에서 로드 (개인용 MBTI, AI 프로파일링 등)
      const basicRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
      if (Array.isArray(basicRecords)) {
        basicRecords.forEach(record => {
          const normalizedRecord = normalizeTestRecord(record);
          normalizedRecord.testType = normalizeTestTypeName(normalizedRecord.testType);
          
          // 상담코드 추출 (clientInfo 또는 userData에서)
          const clientInfo = record.userData?.clientInfo || record.clientInfo;
          if (clientInfo && clientInfo.counselorCode) {
            normalizedRecord.counselorCode = clientInfo.counselorCode;
          }
          
          allRecords.push(normalizedRecord);
        });
      }
      
      // 2. 사용자별 MBTI 기록에서 로드 (전문가용 MBTI)
      if (user?.email) {
        const userSpecificKey = `mbti-user-test-records-${user.email}`;
        const userRecords = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
        console.log(`[MyPage] 사용자별 기록 키: ${userSpecificKey}`);
        console.log(`[MyPage] 사용자별 기록 수: ${Array.isArray(userRecords) ? userRecords.length : 0}`);
        
        if (Array.isArray(userRecords)) {
          userRecords.forEach(record => {
            console.log(`[MyPage] 사용자별 기록:`, record);
            const normalizedRecord = normalizeTestRecord(record);
            normalizedRecord.testType = normalizeTestTypeName(normalizedRecord.testType);
            
            // 상담코드 추출
            const clientInfo = record.userData?.clientInfo || record.clientInfo;
            if (clientInfo && clientInfo.counselorCode) {
              normalizedRecord.counselorCode = clientInfo.counselorCode;
            }
            
            allRecords.push(normalizedRecord);
          });
        }
      }
      
      // 3. 일반 사용자별 키도 확인 (로그인하지 않은 경우)
      const generalUserRecords = JSON.parse(localStorage.getItem('mbti-user-test-records') || '[]');
      console.log(`[MyPage] 일반 사용자 기록 수: ${Array.isArray(generalUserRecords) ? generalUserRecords.length : 0}`);
      
      if (Array.isArray(generalUserRecords)) {
        generalUserRecords.forEach(record => {
          console.log(`[MyPage] 일반 사용자 기록:`, record);
          const normalizedRecord = normalizeTestRecord(record);
          normalizedRecord.testType = normalizeTestTypeName(normalizedRecord.testType);
          
          // 상담코드 추출
          const clientInfo = record.userData?.clientInfo || record.clientInfo;
          if (clientInfo && clientInfo.counselorCode) {
            normalizedRecord.counselorCode = clientInfo.counselorCode;
          }
          
          allRecords.push(normalizedRecord);
        });
      }
      
      // 중복 제거 (같은 code를 가진 기록)
      const uniqueRecords = allRecords.filter((record, index, self) => 
        index === self.findIndex(r => r.code === record.code)
      );
      
      // 기본 데이터가 있는 것만 필터링
      const validRecords = uniqueRecords.filter(r => r.code && r.testType);

      console.log(`[MyPage] 사용자 ${user?.email}의 모든 검사 기록 ${validRecords.length}개를 로드했습니다.`);
      console.log(`[MyPage] 최종 기록 목록:`, validRecords);

      const sorted = validRecords.sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp || new Date()).getTime();
        const timeB = new Date(b.timestamp || new Date()).getTime();
        return timeB - timeA;
      });
      return sorted;
    } catch (error) {
      console.error('로컬 테스트 기록 로드 오류:', error);
      setRecordsError('검사 기록을 불러오지 못했습니다.');
      return [];
    } finally {
      setRecordsLoading(false);
    }
  };

  // 검사 기록 로드
  useEffect(() => {
    if (user) {
      const records = loadLocalTestRecords();
      setTestRecords(records);
    }
  }, [user]);

  // 통계 업데이트 (testRecords 변경 시)
  useEffect(() => {
    if (testRecords.length >= 0) {
      const newStats = calculateStats(testRecords);
      setStats(newStats);
    }
  }, [testRecords]);

  // 통계 계산 함수
  const calculateStats = (records: TestRecord[]): Stats => {
    // 기간 필터 적용
    const now = new Date();
    const start = new Date(now);
    if (statsPeriod === 'week') start.setDate(now.getDate() - 7);
    if (statsPeriod === 'month') start.setMonth(now.getMonth() - 1);
    if (statsPeriod === 'year') start.setFullYear(now.getFullYear() - 1);

    const periodRecords = records.filter(r => new Date(r.timestamp || 0) >= start);

    const totalTests = periodRecords.length;
    const mbtiCount = periodRecords.filter(r => (r.testType || '').includes('MBTI')).length;
    const egoCount = periodRecords.filter(r => (r.testType || '').includes('에고그램')).length;
    const enneagramCount = periodRecords.filter(r => (r.testType || '').includes('에니어그램')).length;

    // 평균 점수 (score가 있는 레코드만 집계)
    const scores: number[] = periodRecords
      .map(r => (r as any).userData?.score)
      .filter((s: any) => typeof s === 'number');
    const averageScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    const lastTest = periodRecords.length > 0 ? periodRecords[0].timestamp : null;

    return {
      totalTests,
      mbtiCount,
      egoCount,
      enneagramCount,
      averageScore,
      lastTestDate: lastTest || null,
      favoriteType:
        mbtiCount >= egoCount && mbtiCount >= enneagramCount
          ? 'MBTI'
          : egoCount >= enneagramCount
          ? '에고그램'
          : '에니어그램'
    };
  };

  if (isLoading) {
    return <LoadingMyPage />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 상단 네비게이션 */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navigation />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="pt-16">
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 마이페이지 타이틀 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -left-4 -top-8 w-20 h-20 bg-blue-500 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 inline-block drop-shadow-lg">
            마이페이지
          </h1>
          <motion.div 
            className="h-1.5 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2 shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
        </motion.div>
        
        {/* 상담사 연결 상태 표시 */}
        {!firebaseLoading && !isLoading && (
          <CounselorConnectionStatus 
            connection={counselorConnection}
            loading={counselorLoading}
            onRefetch={refetchCounselor}
          />
        )}
        
        {firebaseLoading || isLoading ? (
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
            <motion.div 
              className="flex border-b border-white/20 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
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
                검사 기록 ({testRecords.length})
              </button>
              <button
                onClick={() => changeTab('in-progress')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'in-progress'
                    ? 'text-blue-200 border-b-2 border-blue-200'
                    : 'text-blue-300 hover:text-blue-200'
                }`}
              >
                진행중인 검사 ({inProgressTests.length})
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
              <Link
                href="/mypage/deleted-codes"
                className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
              >
                삭제코드 ({deletedCodesCount})
              </Link>
            </motion.div>

            {activeTab === 'profile' && (
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* 기본 정보 섹션 제목 */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-blue-100">기본 정보</h2>
                  <p className="mt-2 text-blue-200 max-w-2xl">
                    계정 정보와 개인 정보를 확인하고 관리할 수 있습니다.
                  </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 계정 정보 그룹 */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-blue-100 mb-4 flex items-center">
                      <KeyIcon className="w-5 h-5 mr-2 text-purple-400" />
                      계정 정보
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-200">이메일</span>
                        <span className="text-blue-100">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">가입일</span>
                        <span className="text-blue-100">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '정보 없음'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">마지막 로그인</span>
                        <span className="text-blue-100">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : '정보 없음'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 개인 정보 그룹 */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 relative">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-blue-100 flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-purple-400" />
                        개인 정보
                      </h3>
                      <button
                        onClick={() => setShowProfileEditor(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-sm"
                      >
                        개인정보 수정
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-200">이름</span>
                        <span className="text-blue-100">{user.name || '정보 없음'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">전화번호</span>
                        <span className="text-blue-100">{user.phoneNumber || '정보 없음'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">생년월일</span>
                        <span className="text-blue-100">{user.birthDate || '정보 없음'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">성별</span>
                        <span className="text-blue-100">
                          {user.gender === 'male' ? '남성' : 
                           user.gender === 'female' ? '여성' : 
                           user.gender === 'other' ? '기타' : 
                           '정보 없음'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">직업</span>
                        <span className="text-blue-100">{user.occupation || '정보 없음'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <TestRecordsTabContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                testRecords={testRecords}
              />
            )}

            {activeTab === 'in-progress' && (
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* 진행중인 검사 섹션 제목 */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-blue-100">진행중인 검사 ({inProgressTests.length})</h2>
                  <p className="mt-2 text-blue-200 max-w-2xl">
                    아직 완료하지 않은 검사들을 확인하고 이어서 진행할 수 있습니다.
                  </p>
                </motion.div>

                {inProgressTests.length === 0 ? (
                  <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                    <FaClock className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                    <p className="text-blue-300 text-lg mb-2">진행중인 검사가 없습니다</p>
                    <p className="text-blue-400/70 text-sm">새로운 검사를 시작해보세요!</p>
                  </div>
                ) : (
                  <>
                    {/* 필터링 및 정렬 컨트롤 */}
                    <div className="mb-4 flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <select
                          value={inProgressFilter}
                          onChange={(e) => setInProgressFilter(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all" className="bg-blue-900 text-white">전체 검사</option>
                          <option value="mbti_pro" className="bg-blue-900 text-white">MBTI Pro</option>
                          <option value="mbti" className="bg-blue-900 text-white">MBTI</option>
                          <option value="ai-profiling" className="bg-blue-900 text-white">AI 프로파일링</option>
                          <option value="integrated-assessment" className="bg-blue-900 text-white">통합 평가</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={inProgressSort}
                          onChange={(e) => setInProgressSort(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="recent" className="bg-blue-900 text-white">최근 업데이트순</option>
                          <option value="progress" className="bg-blue-900 text-white">진행률순</option>
                          <option value="name" className="bg-blue-900 text-white">이름순</option>
                        </select>
                      </div>
                    </div>

                    {/* 테이블 형태로 변경 */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-white/20">
                        <thead className="bg-white/5">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-blue-300 tracking-wider">
                              검사 유형
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                              진행률
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                              완료 현황
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                              마지막 업데이트
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                              작업
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {(() => {
                            // 필터링
                            let filtered = inProgressTests;
                            if (inProgressFilter !== 'all') {
                              filtered = filtered.filter(test => {
                                if (inProgressFilter === 'mbti_pro') return test.testId.includes('mbti_pro');
                                if (inProgressFilter === 'mbti') return test.testId.includes('mbti') && !test.testId.includes('mbti_pro');
                                if (inProgressFilter === 'ai-profiling') return test.testId.includes('ai-profiling');
                                if (inProgressFilter === 'integrated-assessment') return test.testId.includes('integrated-assessment');
                                return true;
                              });
                            }

                            // 정렬
                            const sorted = [...filtered].sort((a, b) => {
                              if (inProgressSort === 'recent') {
                                return b.timestamp - a.timestamp;
                              } else if (inProgressSort === 'progress') {
                                const progressA = typeof window !== 'undefined' 
                                  ? (() => {
                                      const saved = JSON.parse(localStorage.getItem(`test_progress_${a.testId}`) || '{}');
                                      const answeredCount = Object.keys(saved.answers || {}).length;
                                      const totalQuestions = saved.totalQuestions || 0;
                                      return totalQuestions > 0 ? answeredCount / totalQuestions : 0;
                                    })()
                                  : 0;
                                const progressB = typeof window !== 'undefined' 
                                  ? (() => {
                                      const saved = JSON.parse(localStorage.getItem(`test_progress_${b.testId}`) || '{}');
                                      const answeredCount = Object.keys(saved.answers || {}).length;
                                      const totalQuestions = saved.totalQuestions || 0;
                                      return totalQuestions > 0 ? answeredCount / totalQuestions : 0;
                                    })()
                                  : 0;
                                return progressB - progressA;
                              } else if (inProgressSort === 'name') {
                                return a.testName.localeCompare(b.testName, 'ko');
                              }
                              return 0;
                            });

                            // 간단 페이지네이션 (더보기)
                            const [pageSize] = [10];
                            const paged = sorted.slice(0, pageSize);

                            return paged.map((test) => {
                              const savedProgress = typeof window !== 'undefined' 
                                ? JSON.parse(localStorage.getItem(`test_progress_${test.testId}`) || '{}')
                                : {};
                              const answeredCount = Object.keys(savedProgress.answers || {}).length;
                              // totalQuestions가 없으면 검사 유형별 기본값 사용
                              let totalQuestions = savedProgress.totalQuestions || 0;
                              if (totalQuestions === 0) {
                                const testType = (test.testType || '').toUpperCase();
                                if (testType.includes('MBTI') && !testType.includes('PRO')) {
                                  totalQuestions = 20; // 개인용 MBTI 검사 (실제 문항수)
                                } else if (testType.includes('MBTI_PRO') || testType.includes('MBTI PRO')) {
                                  totalQuestions = 24; // MBTI Pro 검사
                                } else if (testType.includes('AI_PROFILING') || testType.includes('AI-PROFILING')) {
                                  totalQuestions = savedProgress.totalQuestions || 0; // AI 프로파일링은 동적
                                } else if (testType.includes('INTEGRATED')) {
                                  totalQuestions = savedProgress.totalQuestions || 0; // 통합 평가는 동적
                                }
                              }
                              const progressPercent = totalQuestions > 0 
                                ? Math.round((answeredCount / totalQuestions) * 100)
                                : 0;
                              const lastUpdate = new Date(test.timestamp);
                              
                              return (
                                <tr key={test.testId} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-blue-100 font-medium">{test.testName}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center">
                                      <div className="w-full max-w-xs">
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-xs text-blue-300">{progressPercent}%</span>
                                        </div>
                                        <div className="w-full bg-blue-900/50 rounded-full h-2">
                                          <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-blue-200 text-sm">
                                      {answeredCount}개 완료 / 전체 {totalQuestions}개
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="text-blue-300 text-sm">
                                      {lastUpdate.toLocaleString('ko-KR')}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setResumeModalTest(test);
                                          setShowResumeModal(true);
                                        }}
                                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                      >
                                        이어하기
                                      </button>
                                      <button
                                        onClick={() => handleClearProgress(test)}
                                        className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-500 text-white text-sm rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
                                        title="진행 상태 삭제"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* 이어하기 확인 모달 */}
            {showResumeModal && resumeModalTest && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowResumeModal(false)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-indigo-950 rounded-xl p-6 shadow-lg border border-indigo-700 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold text-blue-200 mb-4 text-center">이어하기</h3>
                  <p className="text-blue-200 mb-4 text-center">
                    진행 중이던 검사를 이어서 계속하시겠습니까?
                  </p>
                  {(() => {
                    const savedProgress = typeof window !== 'undefined' 
                      ? JSON.parse(localStorage.getItem(`test_progress_${resumeModalTest.testId}`) || '{}')
                      : {};
                    const answeredCount = Object.keys(savedProgress.answers || {}).length;
                    let totalQuestions = savedProgress.totalQuestions || 0;
                    if (totalQuestions === 0) {
                      const testType = (resumeModalTest.testType || '').toUpperCase();
                      if (testType.includes('MBTI') && !testType.includes('PRO')) {
                        totalQuestions = 20;
                      } else if (testType.includes('MBTI_PRO') || testType.includes('MBTI PRO')) {
                        totalQuestions = 24;
                      }
                    }
                    const progressPercent = totalQuestions > 0 
                      ? Math.round((answeredCount / totalQuestions) * 100)
                      : 0;
                    return (
                      <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-300 text-sm">진행률</span>
                          <span className="text-blue-200 font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-blue-300/80 text-xs text-center">
                          {answeredCount}개 완료 / 전체 {totalQuestions}개
                        </p>
                      </div>
                    );
                  })()}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowResumeModal(false);
                        setResumeModalTest(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-600/60 text-gray-200 rounded-lg hover:bg-gray-600/80 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        const testPath = getTestPath(resumeModalTest.testId, resumeModalTest.testType);
                        router.push(`${testPath}?resume=${resumeModalTest.testId}`);
                        setShowResumeModal(false);
                        setResumeModalTest(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors"
                    >
                      이어서 계속
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* 삭제 확인 모달 */}
            {showDeleteProgressModal && deleteProgressTest && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteProgressModal(false)}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-indigo-950 rounded-xl p-6 shadow-lg border border-indigo-700 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold text-red-300 mb-4 text-center">진행 상태 삭제</h3>
                  <p className="text-blue-200 mb-4 text-center">
                    진행 중인 검사의 진행 상태를 삭제하시겠습니까?
                  </p>
                  {(() => {
                    const savedProgress = typeof window !== 'undefined' 
                      ? JSON.parse(localStorage.getItem(`test_progress_${deleteProgressTest.testId}`) || '{}')
                      : {};
                    const answeredCount = Object.keys(savedProgress.answers || {}).length;
                    let totalQuestions = savedProgress.totalQuestions || 0;
                    if (totalQuestions === 0) {
                      const testType = (deleteProgressTest.testType || '').toUpperCase();
                      if (testType.includes('MBTI') && !testType.includes('PRO')) {
                        totalQuestions = 20;
                      } else if (testType.includes('MBTI_PRO') || testType.includes('MBTI PRO')) {
                        totalQuestions = 24;
                      }
                    }
                    const progressPercent = totalQuestions > 0 
                      ? Math.round((answeredCount / totalQuestions) * 100)
                      : 0;
                    return (
                      <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-blue-300 text-sm">현재 진행률</span>
                          <span className="text-blue-200 font-semibold">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-blue-900/50 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-blue-300/80 text-xs text-center">
                          {answeredCount}개 완료 / 전체 {totalQuestions}개
                        </p>
                      </div>
                    );
                  })()}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleStartFromBeginning}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    >
                      처음부터 새로시작
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDeleteProgressModal(false);
                          setDeleteProgressTest(null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600/60 text-gray-200 rounded-lg hover:bg-gray-600/80 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleConfirmDeleteProgress}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {/* 통계 보기 섹션 제목 */}
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-blue-100">통계 보기</h2>
                  <p className="mt-2 text-blue-200 max-w-2xl">
                    심리 검사 결과와 진행 상황에 대한 통계 정보를 확인할 수 있습니다.
                  </p>
                  <div className="mt-3 flex gap-3">
                    <select
                      value={statsPeriod}
                      onChange={(e) => setStatsPeriod(e.target.value as any)}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="week" className="bg-blue-900 text-white">최근 1주</option>
                      <option value="month" className="bg-blue-900 text-white">최근 1개월</option>
                      <option value="year" className="bg-blue-900 text-white">최근 1년</option>
                    </select>
                  </div>
                </motion.div>
                

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <motion.div
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-500/20">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-300">총 검사 수</p>
                        <p className="text-2xl font-bold text-blue-100">{stats.totalTests}</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-500/20">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-300">MBTI 검사</p>
                        <p className="text-2xl font-bold text-purple-100">{stats.mbtiCount}</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-500/20">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-300">에고그램</p>
                        <p className="text-2xl font-bold text-green-100">{stats.egoCount}</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-indigo-500/20">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-indigo-300">마지막 검사일</p>
                        <p className="text-lg font-bold text-indigo-100">
                          {stats.lastTestDate ? new Date(stats.lastTestDate).toLocaleDateString('ko-KR') : '없음'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
                
                {/* 추이 그래프 (간단 바 차트) */}
                <div className="mb-6 bg-white/5 rounded-lg p-4 border border-white/10">
                  {(() => {
                    const now = new Date();
                    const bucketCount = statsPeriod === 'week' ? 7 : statsPeriod === 'month' ? 30 : 12;
                    const labels: string[] = [];
                    const counts: number[] = Array(bucketCount).fill(0);
                    for (let i = bucketCount - 1; i >= 0; i--) {
                      const d = new Date(now);
                      if (statsPeriod === 'year') d.setMonth(d.getMonth() - i);
                      else d.setDate(d.getDate() - i);
                      labels.push(
                        statsPeriod === 'year'
                          ? `${d.getMonth() + 1}월`
                          : `${d.getMonth() + 1}/${d.getDate()}`
                      );
                    }
                    testRecords.forEach(r => {
                      const t = new Date(r.timestamp || 0);
                      for (let i = 0; i < labels.length; i++) {
                        const d = new Date(now);
                        const prev = new Date(now);
                        if (statsPeriod === 'year') {
                          d.setMonth(d.getMonth() - (labels.length - 1 - i));
                          prev.setMonth(d.getMonth() - 1);
                        } else {
                          d.setDate(d.getDate() - (labels.length - 1 - i));
                          prev.setDate(d.getDate() - 1);
                        }
                        if (t <= d && t > prev) counts[i] += 1;
                      }
                    });
                    const max = Math.max(1, ...counts);
                    return (
                      <div>
                        <div className="flex items-end gap-1 h-24">
                          {counts.map((c, i) => (
                            <div key={i} className="flex-1 bg-blue-900/50 rounded-sm">
                              <div
                                className="bg-gradient-to-t from-blue-500 to-purple-500 w-full rounded-sm"
                                style={{ height: `${(c / max) * 100}%` }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 grid grid-cols-8 gap-1 text-[10px] text-blue-300/70">
                          {labels.map((l, i) => (i % Math.ceil(labels.length / 8) === 0 ? <span key={i}>{l}</span> : <span key={i}></span>))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 상세 통계 테이블 */}
                {testRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/5">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-sm font-medium text-blue-300 tracking-wider">
                            검사 유형
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                            진행 횟수
                          </th>
                          <th scope="col" className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider">
                            마지막 검사일
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {(() => {
                          // 검사 유형별 그룹화
                          const grouped = testRecords.reduce((acc: any, record) => {
                            const type = record.testType || '기타';
                            if (!acc[type]) {
                              acc[type] = [];
                            }
                            acc[type].push(record);
                            return acc;
                          }, {});

                          return Object.entries(grouped).map(([type, records]: [string, any]) => {
                            const recordsArray = records as TestRecord[];
                            const lastRecord = recordsArray.sort((a, b) => 
                              new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
                            )[0];

                            return (
                              <tr key={type} className="hover:bg-white/10 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">
                                  {type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100">
                                  {recordsArray.length}회
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100">
                                  {lastRecord.timestamp 
                                    ? new Date(lastRecord.timestamp).toLocaleDateString('ko-KR')
                                    : 'N/A'}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                    <FaBrain className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
                    <p className="text-blue-300 text-lg mb-2">통계 데이터가 없습니다</p>
                    <p className="text-blue-400/70 text-sm">검사를 완료하면 통계 정보가 표시됩니다</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'deleted' && (
              <DeletedCodesContent isEmbedded={true} />
            )}
          </>
        )}

        {/* 프로필 편집 모달 */}
        {showProfileEditor && (
          <ProfileEditor
            onClose={() => setShowProfileEditor(false)}
            onUpdate={() => {
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
      </div>
    </div>
  );
}

// 검사 유형별 결과 페이지 경로 생성 함수
const getResultPageUrl = (record: TestRecord): string => {
  const testType = (record.testType || '').toLowerCase();
  const code = record.code || '';
  const mbtiType = record.mbtiType || '';
  
  // 전문가용 MBTI 검사 결과 페이지
  if (testType.includes('전문가용') || testType.includes('mbti pro') || testType.includes('mbti_pro') || 
      testType.includes('professional') || code.startsWith('MP') || record.counselorCode?.startsWith('MP')) {
    // 결과 데이터 확인
    try {
      const resultData = typeof window !== 'undefined' 
        ? localStorage.getItem(`test-result-${code}`) 
        : null;
      if (resultData) {
        const data = JSON.parse(resultData);
        const dataStr = encodeURIComponent(JSON.stringify({
          code: code,
          mbtiType: mbtiType || data.mbtiType || 'INTJ',
          answers: data.answers || {},
          timestamp: record.timestamp,
          userData: record.userData || data.userData
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
    return `/results/mbti?code=${encodeURIComponent(code)}&type=${encodeURIComponent(mbtiType)}`;
  }
  
  // AI 프로파일링 검사 결과 페이지
  if (testType.includes('ai') && testType.includes('프로파일링')) {
    return `/tests/ai-profiling/result?code=${encodeURIComponent(code)}`;
  }
  
  // 통합 평가 검사 결과 페이지
  if (testType.includes('통합')) {
    return `/tests/integrated-assessment/result?code=${encodeURIComponent(code)}`;
  }
  
  // 기본적으로 MBTI 결과 페이지로 이동 (임시)
  return `/results/mbti?code=${encodeURIComponent(code)}&type=${encodeURIComponent(mbtiType)}`;
};

// 정렬 타입 정의
type SortField = 'code' | 'testType' | 'timestamp' | 'mbtiType' | 'counselorCode';
type SortDirection = 'asc' | 'desc';

// 검사 기록 탭 컴포넌트
function TestRecordsTabContent({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  sortOrder,
  setSortOrder,
  testRecords
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: 'all' | 'mbti-personal' | 'mbti-professional' | 'ai-profiling' | 'integrated' | 'ego' | 'enneagram';
  setFilterType: (type: 'all' | 'mbti-personal' | 'mbti-professional' | 'ai-profiling' | 'integrated' | 'ego' | 'enneagram') => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (order: 'newest' | 'oldest') => void;
  testRecords: TestRecord[];
}) {
  const router = useRouter();
  
  // 컬럼 정렬 상태
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // 삭제 모달 상태
  const [deleteModalRecord, setDeleteModalRecord] = useState<TestRecord | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  // 컬럼 헤더 클릭 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 같은 필드 클릭 시 방향 변경
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드 클릭 시 해당 필드로 변경하고 기본 방향 설정
      setSortField(field);
      setSortDirection(field === 'timestamp' ? 'desc' : 'asc');
    }
  };

  // 정렬 아이콘 컴포넌트 (시각적 개선)
  const SortIcon = ({ field }: { field: SortField }) => {
    return (
      <span className={`text-xs ${sortField === field ? 'text-red-500' : 'text-blue-300'}`}>
        <span className={sortField === field && sortDirection === 'asc' ? 'text-red-500' : 'text-blue-300/50'}>▲</span>
        <span className={sortField === field && sortDirection === 'desc' ? 'text-red-500' : 'text-blue-300/50'}>▼</span>
      </span>
    );
  };

  // 검색, 필터링 및 정렬된 기록
  const filteredRecords = testRecords.filter(record => {
    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        record.code?.toLowerCase().includes(query) ||
        record.counselorCode?.toLowerCase().includes(query) ||
        record.testType?.toLowerCase().includes(query) ||
        record.mbtiType?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    
    // 타입 필터
    if (filterType !== 'all') {
      const testType = record.testType?.toLowerCase() || '';
      if (filterType === 'mbti-personal' && !testType.includes('개인용')) return false;
      if (filterType === 'mbti-professional') {
        // 전문가용 MBTI 검사: '전문가용', 'mbti pro', 'mbti_pro', 'professional' 등을 포함하는지 확인
        const isProfessional = testType.includes('전문가용') || 
                               testType.includes('mbti pro') || 
                               testType.includes('mbti_pro') || 
                               testType.includes('professional') ||
                               (testType.includes('mbti') && (record.code?.startsWith('MP') || record.counselorCode?.startsWith('MP')));
        if (!isProfessional) return false;
      }
      if (filterType === 'ai-profiling' && !testType.includes('ai') && !testType.includes('프로파일링')) return false;
      if (filterType === 'integrated' && !testType.includes('통합')) return false;
      if (filterType === 'ego' && !testType.includes('에고')) return false;
      if (filterType === 'enneagram' && !testType.includes('에니어')) return false;
    }
    
    return true;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortField) {
      case 'code':
        aValue = a.code || '';
        bValue = b.code || '';
        break;
      case 'testType':
        aValue = a.testType || '';
        bValue = b.testType || '';
        break;
      case 'timestamp':
        aValue = new Date(a.timestamp || 0).getTime();
        bValue = new Date(b.timestamp || 0).getTime();
        break;
      case 'mbtiType':
        aValue = a.mbtiType || '';
        bValue = b.mbtiType || '';
        break;
      case 'counselorCode':
          aValue = a.counselorCode || '';
          bValue = b.counselorCode || '';
          break;
      default:
        aValue = a.timestamp || '';
        bValue = b.timestamp || '';
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // 페이지네이션 적용
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // 페이지 변경 시 첫 페이지로 리셋
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, sortField, sortDirection]);

  // 검사 기록 클릭 핸들러
  const handleRecordClick = (record: TestRecord) => {
    if (!record.code) {
      console.warn('검사 코드가 없어 결과 페이지로 이동할 수 없습니다:', record);
      return;
    }
    
    // 검사기록 목록에서 왔음을 표시 (돌아올 때 새로고침 없이 표시하기 위해)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnToTestRecords', 'true');
    }
    
    const resultUrl = getResultPageUrl(record);
    console.log('검사 결과 페이지로 이동:', resultUrl);
    router.push(resultUrl);
  };

  // 체크박스 선택/해제
  const toggleSelection = (code: string) => {
    setSelectedRecords(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (selectedRecords.length === paginatedRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(paginatedRecords.map(r => r.code).filter(Boolean) as string[]);
    }
  };

  // 일괄 삭제 확인
  const handleBulkDeleteClick = () => {
    if (selectedRecords.length === 0) {
      alert('삭제할 기록을 선택해주세요.');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  // 일괄 삭제 실행
  const handleBulkDeleteConfirm = () => {
    if (selectedRecords.length === 0) return;

    try {
      if (typeof window !== 'undefined') {
        // 삭제할 레코드 정보 수집
        const recordsToDelete = selectedRecords.map(code => {
          const record = testRecords.find(r => r.code === code);
          return record ? {
            ...record,
            deletedAt: new Date().toISOString()
          } : null;
        }).filter(Boolean) as any[];

        // 기존 삭제된 레코드 가져오기
        const deletedRecordsStr = localStorage.getItem('deleted_test_records') || '[]';
        const deletedRecords = JSON.parse(deletedRecordsStr);
        const updatedDeletedRecords = [...deletedRecords, ...recordsToDelete];
        
        // 최대 100개까지만 저장
        if (updatedDeletedRecords.length > 100) {
          updatedDeletedRecords.splice(100);
        }
        
        localStorage.setItem('deleted_test_records', JSON.stringify(updatedDeletedRecords));

        // test_records에서 삭제
        const allRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
        const filteredRecords = allRecords.filter((r: TestRecord) => !selectedRecords.includes(r.code));
        localStorage.setItem('test_records', JSON.stringify(filteredRecords));

        // 사용자별 기록에서도 삭제
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const userSpecificKey = `mbti-user-test-records-${user.email}`;
            const userRecords = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
            const filteredUserRecords = userRecords.filter((r: TestRecord) => !selectedRecords.includes(r.code));
            localStorage.setItem(userSpecificKey, JSON.stringify(filteredUserRecords));
          } catch (e) {
            console.error('사용자별 기록 삭제 오류:', e);
          }
        }

        // 일반 사용자별 키에서도 삭제
        const generalRecords = JSON.parse(localStorage.getItem('mbti-user-test-records') || '[]');
        const filteredGeneralRecords = generalRecords.filter((r: TestRecord) => !selectedRecords.includes(r.code));
        localStorage.setItem('mbti-user-test-records', JSON.stringify(filteredGeneralRecords));

        // test-result-{code} 키도 삭제
        selectedRecords.forEach(code => {
          localStorage.removeItem(`test-result-${code}`);
        });

        // 부모 컴포넌트에 업데이트 이벤트 발생
        window.dispatchEvent(new CustomEvent('testRecordsUpdated'));
        window.dispatchEvent(new CustomEvent('deletedCodesUpdated'));
      }

      setSelectedRecords([]);
      setShowBulkDeleteModal(false);
      // 페이지 새로고침 없이 이벤트만 발생 (부모 컴포넌트가 처리)
    } catch (error) {
      console.error('검사 기록 일괄 삭제 중 오류:', error);
      alert('검사 기록 일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  // 삭제 버튼 클릭 핸들러 (이벤트 전파 방지)
  const handleDeleteClick = (e: React.MouseEvent, record: TestRecord) => {
    e.stopPropagation(); // 테이블 행 클릭 이벤트 방지
    setDeleteModalRecord(record);
    setShowDeleteModal(true);
  };

  // 삭제 확인 핸들러
  const handleDeleteConfirm = () => {
    if (!deleteModalRecord || !deleteModalRecord.code) {
      setShowDeleteModal(false);
      return;
    }

    try {
      // 삭제된 기록을 deleted_test_records에 추가
      if (typeof window !== 'undefined') {
        const deletedRecords = JSON.parse(localStorage.getItem('deleted_test_records') || '[]');
        const deletedRecord = {
          ...deleteModalRecord,
          deletedAt: new Date().toISOString(),
          status: '삭제됨'
        };
        deletedRecords.unshift(deletedRecord);
        
        // 최대 100개까지만 저장
        if (deletedRecords.length > 100) {
          deletedRecords.splice(100);
        }
        
        localStorage.setItem('deleted_test_records', JSON.stringify(deletedRecords));
      }

      // test_records에서 삭제
      const allRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
      const filteredRecords = allRecords.filter((r: TestRecord) => r.code !== deleteModalRecord.code);
      localStorage.setItem('test_records', JSON.stringify(filteredRecords));

      // 사용자별 기록에서도 삭제
      if (typeof window !== 'undefined') {
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            const userSpecificKey = `mbti-user-test-records-${user.email}`;
            const userRecords = JSON.parse(localStorage.getItem(userSpecificKey) || '[]');
            const filteredUserRecords = userRecords.filter((r: TestRecord) => r.code !== deleteModalRecord.code);
            localStorage.setItem(userSpecificKey, JSON.stringify(filteredUserRecords));
          } catch (e) {
            console.error('사용자별 기록 삭제 오류:', e);
          }
        }

        // 일반 사용자별 키에서도 삭제
        const generalRecords = JSON.parse(localStorage.getItem('mbti-user-test-records') || '[]');
        const filteredGeneralRecords = generalRecords.filter((r: TestRecord) => r.code !== deleteModalRecord.code);
        localStorage.setItem('mbti-user-test-records', JSON.stringify(filteredGeneralRecords));

        // test-result-{code} 키도 삭제
        localStorage.removeItem(`test-result-${deleteModalRecord.code}`);
        
        // 전문가용 MBTI 결과 데이터도 삭제
        const testType = (deleteModalRecord.testType || '').toLowerCase();
        const isProfessional = testType.includes('전문가용') || 
                               testType.includes('mbti pro') ||
                               deleteModalRecord.code.startsWith('MP');
        if (isProfessional) {
          localStorage.removeItem(`mbti_pro_result_data`);
        }
      }

      // 부모 컴포넌트에 업데이트 이벤트 발생
      window.dispatchEvent(new CustomEvent('testRecordsUpdated'));
      window.dispatchEvent(new CustomEvent('deletedCodesUpdated'));
      
      // 모달 닫기
      setShowDeleteModal(false);
      setDeleteModalRecord(null);
    } catch (error) {
      console.error('검사 기록 삭제 중 오류:', error);
      alert('검사 기록 삭제 중 오류가 발생했습니다.');
      setShowDeleteModal(false);
      setDeleteModalRecord(null);
    }
  };

  return (
    <motion.div
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      {/* 검사 기록 섹션 제목 */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-blue-100">검사 기록 ({filteredRecords.length})</h2>
        <p className="mt-2 text-blue-200 max-w-2xl">
          완료한 심리 검사들의 결과와 기록을 확인할 수 있습니다.
        </p>
      </motion.div>
      
      {/* 검색 및 필터링 컨트롤 */}
      <motion.div 
        className="mb-6 space-y-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* 첫 번째 행: 텍스트 검색 */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검사 코드 또는 이름으로 검색"
              className="w-full pl-10 pr-4 py-2 border-none bg-white/5 text-white placeholder-blue-300/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-2 flex-shrink-0">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 border-none bg-blue-800/80 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all" className="bg-blue-800 text-white">전체</option>
              <option value="mbti-personal" className="bg-blue-800 text-white">개인용 MBTI</option>
              <option value="mbti-professional" className="bg-blue-800 text-white">전문가용 MBTI</option>
              <option value="ai-profiling" className="bg-blue-800 text-white">AI 프로파일링</option>
              <option value="integrated" className="bg-blue-800 text-white">통합 평가</option>
              <option value="ego" className="bg-blue-800 text-white">에고그램</option>
              <option value="enneagram" className="bg-blue-800 text-white">에니어그램</option>
            </select>
          </div>
        </div>
      </motion.div>
      
      {/* 검사 기록 테이블 */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
          <FaClipboard className="w-16 h-16 text-blue-400/50 mx-auto mb-4" />
          <p className="text-blue-300 text-lg mb-2">
            {testRecords.length === 0 ? '완료한 검사가 없습니다' : '검색 결과가 없습니다'}
          </p>
          <p className="text-blue-400/70 text-sm">
            {testRecords.length === 0 ? '새로운 검사를 시작해보세요!' : '다른 검색어를 시도해보세요'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBulkDeleteClick}
                  disabled={selectedRecords.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedRecords.length > 0
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-pink-400/50 text-pink-100 hover:bg-pink-400/60'
                  }`}
                >
                  선택 삭제 ({selectedRecords.length})
                </button>
              </div>
            </div>
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === paginatedRecords.length && paginatedRecords.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 text-pink-400 border-2 border-pink-300/80 rounded focus:ring-pink-400 cursor-pointer"
                      />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 transition-colors select-none"
                    onClick={() => handleSort('timestamp')}
                  >
                    <div className="flex items-center justify-center">
                      검사 일시
                      <SortIcon field="timestamp" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 transition-colors select-none"
                    onClick={() => handleSort('testType')}
                  >
                    <div className="flex items-center justify-center">
                      검사 유형
                      <SortIcon field="testType" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 transition-colors select-none"
                    onClick={() => handleSort('counselorCode')}
                  >
                    <div className="flex items-center justify-center">
                      검사코드
                      <SortIcon field="counselorCode" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 transition-colors select-none"
                    onClick={() => handleSort('code')}
                  >
                    <div className="flex items-center">
                      검사결과 코드
                      <SortIcon field="code" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider"
                  >
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {paginatedRecords.map((record, index) => (
                  <tr 
                    key={record.code || index} 
                    className="group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedRecords.includes(record.code || '')}
                          onChange={() => toggleSelection(record.code || '')}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 text-pink-400 border border-white/30 rounded focus:ring-pink-400 cursor-pointer"
                        />
                      </div>
                    </td>
                    <td 
                      onClick={() => handleRecordClick(record)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                      title="클릭하여 검사 결과 보기"
                    >
                      {record.timestamp ? new Date(record.timestamp).toLocaleString('ko-KR') : 'N/A'}
                    </td>
                    <td 
                      onClick={() => handleRecordClick(record)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                      title="클릭하여 검사 결과 보기"
                    >
                      {record.testType || 'N/A'}
                    </td>
                    <td 
                      onClick={() => handleRecordClick(record)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                      title="클릭하여 검사 결과 보기"
                    >
                      {record.counselorCode || record.code || 'N/A'}
                    </td>
                    <td 
                      onClick={() => handleRecordClick(record)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                      title="클릭하여 검사 결과 보기"
                    >
                      {record.code || 'N/A'}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm text-center hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                      onClick={(e) => handleDeleteClick(e, record)}
                    >
                      <button
                        className="px-3 py-1 text-xs font-medium bg-blue-800/60 text-blue-200 rounded hover:bg-blue-700/80 hover:text-blue-100 transition-colors"
                        onClick={(e) => handleDeleteClick(e, record)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 페이지네이션 */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-blue-200">
              총 {filteredRecords.length}개의 검사 기록 ({currentPage}/{totalPages} 페이지)
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-blue-600/60 text-blue-200 rounded hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
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
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-600/60 text-blue-200 hover:bg-blue-600/80'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm bg-blue-600/60 text-blue-200 rounded hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 일괄 삭제 확인 모달 - 화면 중앙 고정 (Portal 사용) */}
      {showBulkDeleteModal && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" 
          onClick={() => setShowBulkDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-indigo-950 rounded-xl p-6 max-w-md w-full mx-4 border border-indigo-700 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-red-200 mb-4">검사 기록 일괄 삭제</h3>
            <p className="text-blue-200 mb-6">
              선택한 {selectedRecords.length}개의 검사 기록을 삭제하시겠습니까?
            </p>
            <p className="text-blue-300 text-sm mb-6">
              삭제된 검사기록은 삭제코드 페이지에서 확인할 수 있습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-gray-600/60 text-gray-200 rounded-lg hover:bg-gray-600/80 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                className="px-4 py-2 bg-red-600/60 text-red-200 rounded-lg hover:bg-red-600/80 transition-colors"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* 개별 삭제 확인 모달 - 화면 중앙 고정 (Portal 사용) */}
      {showDeleteModal && deleteModalRecord && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" 
          onClick={() => setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-indigo-950 rounded-xl p-6 max-w-md w-full mx-4 border border-indigo-700 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-red-200 mb-4">검사 기록 삭제</h3>
            
            <div className="mb-6 space-y-2">
              <p className="text-blue-200">다음 검사 기록을 삭제하시겠습니까?</p>
              <div className="bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-300">검사 유형:</span>
                  <span className="text-blue-100">{deleteModalRecord.testType || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">검사결과 코드:</span>
                  <span className="text-blue-100">{deleteModalRecord.code || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">검사 일시:</span>
                  <span className="text-blue-100">
                    {deleteModalRecord.timestamp ? new Date(deleteModalRecord.timestamp).toLocaleString('ko-KR') : 'N/A'}
                  </span>
                </div>
                {deleteModalRecord.counselorCode && (
                  <div className="flex justify-between">
                    <span className="text-blue-300">검사코드:</span>
                    <span className="text-blue-100">{deleteModalRecord.counselorCode}</span>
                  </div>
                )}
              </div>
              <p className="text-blue-300 text-sm mt-4">삭제된 검사기록은 삭제코드 에서 확인할수 있습니다.</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteModalRecord(null);
                }}
                className="px-4 py-2 bg-gray-600/60 text-gray-200 rounded-lg hover:bg-gray-600/80 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600/60 text-red-200 rounded-lg hover:bg-red-600/80 transition-colors"
              >
                삭제하기
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
}

// 상담사 연결 상태 컴포넌트
function CounselorConnectionStatus({ 
  connection, 
  loading, 
  onRefetch 
}: { 
  connection: any; 
  loading: boolean; 
  onRefetch: () => void;
}) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-gray-300">상담사 연결 상태를 확인하는 중...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (connection.isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-emerald-400 font-semibold">상담사와 연결됨</h3>
                <p className="text-emerald-300 text-sm">
                  {connection.counselorInfo?.name || '상담사'}와 연결되어 있습니다
                </p>
              </div>
            </div>
            <button
              onClick={onRefetch}
              className="text-emerald-400 hover:text-emerald-300 text-sm underline"
            >
              새로고침
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-blue-400 font-semibold">상담사와 연결하기</h3>
              <p className="text-blue-300 text-sm">
                상담사 인증코드를 입력하여 연결하세요
              </p>
            </div>
          </div>
          <Link
            href="/mypage/connect-counselor"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            연결하기
          </Link>
        </div>
      </div>
    </motion.div>
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