'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

// chart.js 타입만 임포트 (실제 라이브러리는 클라이언트에서 동적으로 로드)
import type { ChartData, ChartOptions } from 'chart.js';

// Chart.js 컴포넌트를 동적으로 임포트
const DynamicBar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { ssr: false });
const DynamicPie = dynamic(() => import('react-chartjs-2').then(mod => mod.Pie), { ssr: false });
const DynamicLine = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), { ssr: false });
const DynamicRadar = dynamic(() => import('react-chartjs-2').then(mod => mod.Radar), { ssr: false });

// 테스트 기록 타입 정의
interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface TestRecord {
  code: string;
  timestamp: string;
  testType: string;
  counselorCode?: string;
  userData?: {
    birthYear?: number;
    gender?: string;
    name?: string;
    testDate?: string;
    answers?: any;
    clientInfo?: any;
    groupCode?: string;
    counselorCode?: string;
  };
  result?: any;
  status?: string;
}

// 테스트 접두사 정보 타입 정의
interface TestPrefix {
  code: string;
  name: string;
  description: string;
  count: number;
  lastGenerated: string | null;
  active: boolean;
}

// 코드 생성 정보 타입 정의
interface CodeGenerationStats {
  totalGenerated: number;
  lastGeneratedCode: string;
  lastGeneratedTime: string | null;
  byPrefix: Record<string, {
    code: string;
    name: string;
    count: number;
    lastGenerated: string | null;
  }>;
}

// 삭제된 테스트 기록 타입 정의
interface DeletedTestRecord extends TestRecord {
  deletedAt: string;
}

// 로딩 컴포넌트
const LoadingRecords = () => (
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
          <p className="text-xl text-blue-200">기록을 불러오는 중입니다...</p>
        </div>
      </div>
    </div>
  </main>
);

// 클라이언트 컴포넌트 (useSearchParams 사용)
function TestRecordsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: firebaseUser, loading: firebaseLoading } = useFirebaseAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [sortField, setSortField] = useState<'code' | 'timestamp' | 'testType'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [codeStats, setCodeStats] = useState<CodeGenerationStats>({
    totalGenerated: 0,
    lastGeneratedCode: '',
    lastGeneratedTime: null,
    byPrefix: {}
  });
  const [prefixStats, setPrefixStats] = useState<TestPrefix[]>([]);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [chartInitialized, setChartInitialized] = useState(false);
  const [barData, setBarData] = useState<any>({
    labels: [],
    datasets: [{
      label: '생성된 코드 수',
      data: [],
      backgroundColor: ['rgba(54, 162, 235, 0.6)'],
      borderColor: ['rgba(54, 162, 235, 1)'],
      borderWidth: 1,
    }]
  });
  const [pieData, setPieData] = useState<any>({
    labels: [],
    datasets: [{
      label: '검사 유형 분포',
      data: [],
      backgroundColor: ['rgba(54, 162, 235, 0.6)'],
      borderColor: ['rgba(54, 162, 235, 1)'],
      borderWidth: 1,
    }]
  });
  const [radarData, setRadarData] = useState<any>({
    labels: ['MBTI', '애니어그램', '이고-오케이', '기타'],
    datasets: [{
      label: '검사 유형별 분포',
      data: [10, 8, 6, 4],
      backgroundColor: 'rgba(90, 120, 255, 0.2)',
      borderColor: 'rgba(90, 120, 255, 1)',
      borderWidth: 2,
    }]
  });
  const [lineData, setLineData] = useState<any>({
    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    datasets: [{
      label: `월별 검사 횟수`,
      data: [5, 8, 12, 9, 7, 15, 18, 16, 9, 11, 13, 7],
      fill: true,
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      tension: 0.3,
    }]
  });
  const [activeTab, setActiveTab] = useState<string>('records');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  // Chart.js 초기화 (클라이언트 사이드에서만)
  useEffect(() => {
    if (typeof window !== 'undefined' && !chartInitialized) {
      import('chart.js').then((ChartModule) => {
        const { 
          Chart, 
          CategoryScale, 
          LinearScale, 
          BarElement, 
          ArcElement,
          Title, 
          Tooltip, 
          Legend,
          PointElement,
          LineElement,
          RadialLinearScale,
          Filler
        } = ChartModule;
        
        Chart.register(
          CategoryScale, 
          LinearScale, 
          BarElement, 
          ArcElement,
          Title, 
          Tooltip, 
          Legend,
          PointElement,
          LineElement,
          RadialLinearScale,
          Filler
        );
        
        setChartInitialized(true);
      });
    }
  }, [chartInitialized]);

  // 통계 차트 데이터 업데이트를 위한 useEffect 추가
  useEffect(() => {
    if (showStats && chartInitialized) {
      try {
        // 기존 데이터 생성 함수 사용
        const { barData: newBarData, pieData: newPieData, radarData: newRadarData, lineData: newLineData } = generateChartData();
        
        // 데이터가 있으면 실제 데이터 사용
        if (newBarData.datasets[0].data.some((val: number) => val > 0)) {
          setBarData(newBarData);
          setPieData(newPieData);
          setRadarData(newRadarData);
          setLineData(newLineData);
        } else {
          // 데이터가 없는 경우 기본 더미 데이터 유지 (이미 초기 상태에 정의됨)
          console.log('데이터가 없어 기본 더미 데이터를 사용합니다.');
        }
      } catch (error) {
        console.error('차트 데이터 생성 오류:', error);
      }
    }
  }, [showStats, chartInitialized, testRecords, prefixStats]);

  // Firebase 인증 상태 확인
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
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };
          setUser(userData);
          setIsLoading(false);
          return;
        }

        setUser(null);
        setIsLoading(false);
      } catch (error) {
        console.error('사용자 정보 로딩 오류:', error);
        setUser(null);
        setIsLoading(false);
      }
    };

    checkAuthAndLoadUser();
  }, [firebaseUser, firebaseLoading]);

  // URL 파라미터에서 stats 값 확인하여 통계 탭 활성화
  useEffect(() => {
    const statsParam = searchParams.get('stats');
    if (statsParam === 'true') {
      setShowStats(true);
      setActiveTab('stats');
    }
  }, [searchParams]);

  // 통계 그래프용 데이터 생성 함수
  const generateChartData = () => {
    // 프리픽스 레이블/카운트 초기화
    let prefixLabels = prefixStats.map(p => p.code);
    let prefixCounts = prefixStats.map(p => p.count);
    let prefixNames = prefixStats.map(p => p.name);

    // 데이터가 없는 경우 더미 데이터 생성
    if (prefixLabels.length === 0 || prefixCounts.every(c => c === 0)) {
      prefixLabels = ['MB', 'MP', 'EP', 'AP'];
      prefixCounts = [testRecords.filter(r => r.code.startsWith('MB') || r.code.startsWith('MP')).length || 5, 
                     testRecords.filter(r => r.code.startsWith('EP')).length || 3, 
                     testRecords.filter(r => r.code.startsWith('AP')).length || 2, 
                     1];
      prefixNames = ['MBTI 검사', '이고-오케이 검사', '애니어그램 검사', '기타'];
    }
    
    // 막대 차트 데이터
    const barData = {
      labels: prefixLabels,
      datasets: [
        {
          label: '생성된 코드 수',
          data: prefixCounts,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // 파이 차트 데이터
    const pieData = {
      labels: prefixNames,
      datasets: [
        {
          label: '생성된 코드 수',
          data: prefixCounts,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 206, 86, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };

    // 검사 유형별 분포 (레이더 차트용)
    const testTypes = ['MBTI', '애니어그램', '이고-오케이', '기타'];
    let testTypeCounts = [0, 0, 0, 0];
    
    // 실제 데이터가 있는지 확인
    if (testRecords.length > 0) {
      testRecords.forEach(record => {
        const testTypeLower = record.testType.toLowerCase();
        if (testTypeLower.includes('mbti')) {
          testTypeCounts[0]++;
        } else if (testTypeLower.includes('애니어그램') || testTypeLower.includes('enneagram')) {
          testTypeCounts[1]++;
        } else if (testTypeLower.includes('이고') || testTypeLower.includes('ego') || testTypeLower.includes('ok')) {
          testTypeCounts[2]++;
        } else {
          testTypeCounts[3]++;
        }
      });
    } else {
      // 데이터가 없는 경우 더미 데이터
      testTypeCounts = [5, 3, 2, 1];
    }
    
    const radarData = {
      labels: testTypes,
      datasets: [
        {
          label: '검사 유형별 분포',
          data: testTypeCounts,
          backgroundColor: 'rgba(90, 120, 255, 0.2)',
          borderColor: 'rgba(90, 120, 255, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(90, 120, 255, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(90, 120, 255, 1)',
        },
      ],
    };

    // 월별 검사 횟수 (선 그래프용)
    const monthlyData = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    // 실제 데이터가 있는지 확인
    if (testRecords.length > 0) {
      testRecords.forEach(record => {
        try {
          const recordDate = new Date(record.timestamp);
          if (!isNaN(recordDate.getTime()) && recordDate.getFullYear() === currentYear) {
            monthlyData[recordDate.getMonth()]++;
          }
        } catch (e) {
          console.error('날짜 처리 오류:', e);
        }
      });
    }
    
    // 데이터가 모두 0인 경우 예시 데이터 사용
    if (monthlyData.every(val => val === 0)) {
      // 더미 데이터 (월별 분포)
      monthlyData[0] = 3; // 1월
      monthlyData[1] = 2; // 2월
      monthlyData[2] = 4; // 3월
      monthlyData[3] = 5; // 4월
      monthlyData[4] = 3; // 5월
      monthlyData[5] = 6; // 6월 
      monthlyData[6] = 7; // 7월
      monthlyData[7] = 4; // 8월
      monthlyData[8] = 3; // 9월
      monthlyData[9] = 5; // 10월
      monthlyData[10] = 2; // 11월
      monthlyData[11] = 4; // 12월
    }
    
    const lineData = {
      labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      datasets: [
        {
          label: `${currentYear}년 월별 검사 횟수`,
          data: monthlyData,
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.3,
        },
      ],
    };
    
    return { barData, pieData, radarData, lineData };
  };

  // 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      title: {
        display: true,
        color: 'rgba(255, 255, 255, 0.8)',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };
  
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
      }
    }
  };
  
  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.8)'
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)'
        }
      }
    }
  };
  
  // 초기 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 로컬 스토리지에서 사용자 정보 가져오기
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('userToken');
      
      if (userStr && token) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          
          // DB에서 테스트 기록 가져오기
          fetchTestRecordsFromDB(userData.id, token);
        } catch (e) {
          console.error('사용자 정보 파싱 오류:', e);
          setIsLoading(false);
        }
      } else {
        console.log('로그인 정보가 없습니다.');
        router.push('/login');
      }
    }
  }, [router]);

  // Firebase DB에서 테스트 기록 가져오기 (주 저장소)
  const fetchTestRecordsFromDB = async (userId: string, token: string) => {
    try {
      // 로딩 상태 설정
      setIsLoading(true);
      
      // 1. Firebase DB에서 먼저 조회
      try {
        const { initializeFirebase } = await import('@/lib/firebase');
        const { testResults } = await import('@/utils/firebaseIntegration');
        initializeFirebase();
        
        const firebaseRecords = await testResults.getUserTestResults(userId);
        
        if (firebaseRecords && firebaseRecords.length > 0) {
          // Firebase 데이터를 TestRecord 형식으로 변환
          const formattedRecords: TestRecord[] = firebaseRecords.map((test: any) => ({
            code: test.code,
            timestamp: test.timestamp || test.createdAt?.toDate?.()?.toISOString() || test.testDate || new Date().toISOString(),
            testType: test.testType || 'MBTI',
            counselorCode: test.counselorCode,
            userData: test.userData || {},
            status: test.status || 'completed',
            result: test.mbtiType || test.result || null
          }));
          
          setTestRecords(formattedRecords);
          calculateCodeStats(formattedRecords);
          
          // Firebase 데이터를 LocalStorage에 캐시 업데이트
          try {
            const cacheData = {
              records: formattedRecords,
              lastUpdated: new Date().toISOString(),
              userId: userId
            };
            localStorage.setItem('test_records_cache', JSON.stringify(cacheData));
            console.log('✅ Firebase 데이터를 LocalStorage 캐시에 업데이트 완료');
          } catch (cacheError) {
            console.warn('LocalStorage 캐시 업데이트 실패:', cacheError);
          }
          
          setIsLoading(false);
          return;
        }
      } catch (firebaseError) {
        console.warn('Firebase DB 조회 실패, LocalStorage 캐시 확인:', firebaseError);
      }
      
      // 2. Firebase 조회 실패 시 LocalStorage 캐시 사용
      const cacheDataStr = localStorage.getItem('test_records_cache');
      if (cacheDataStr) {
        try {
          const cacheData = JSON.parse(cacheDataStr);
          if (cacheData.userId === userId && cacheData.records && Array.isArray(cacheData.records)) {
            setTestRecords(cacheData.records);
            calculateCodeStats(cacheData.records);
            setIsLoading(false);
            console.log('✅ LocalStorage 캐시에서 검사 기록 로드 완료');
            return;
          }
        } catch (cacheError) {
          console.warn('캐시 데이터 파싱 실패:', cacheError);
        }
      }
      
      // 3. 캐시도 없으면 LocalStorage에서 직접 로드 (최종 폴백)
      fetchLocalTestRecords();
      
    } catch (error) {
      console.error('DB 테스트 기록 로드 오류:', error);
      
      // 오류 발생 시 로컬 기록 가져오기
      fetchLocalTestRecords();
    } finally {
      setIsLoading(false);
    }
  };

  // 테스트 기록 가져오기
  useEffect(() => {
    fetchLocalTestRecords();
  }, []);
  
  // 실시간 동기화 설정 (Firestore onSnapshot)
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.uid) return;
    
    let unsubscribe: (() => void) | null = null;
    
    const setupRealtimeSync = async () => {
      try {
        const { initializeFirebase } = await import('@/lib/firebase');
        const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');
        initializeFirebase();
        const { db } = await import('@/lib/firebase');
        
        if (!db) {
          console.warn('Firestore가 초기화되지 않았습니다.');
          return;
        }
        
        // 실시간 리스너 설정
        const q = query(
          collection(db, 'test_results'),
          where('userId', '==', firebaseUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('🔄 실시간 업데이트 수신:', snapshot.docs.length, '개 문서');
          
          const updatedRecords: TestRecord[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              code: data.code,
              timestamp: data.timestamp || data.createdAt?.toDate?.()?.toISOString() || data.testDate || new Date().toISOString(),
              testType: data.testType || 'MBTI',
              counselorCode: data.counselorCode,
              userData: data.userData || {},
              status: data.status || 'completed',
              result: data.mbtiType || data.result || null
            };
          });
          
          setTestRecords(updatedRecords);
          calculateCodeStats(updatedRecords);
          
          // LocalStorage 캐시 업데이트
          try {
            const cacheData = {
              records: updatedRecords,
              lastUpdated: new Date().toISOString(),
              userId: firebaseUser.uid
            };
            localStorage.setItem('test_records_cache', JSON.stringify(cacheData));
            console.log('✅ 실시간 업데이트를 LocalStorage 캐시에 반영 완료');
          } catch (cacheError) {
            console.warn('LocalStorage 캐시 업데이트 실패:', cacheError);
          }
        }, (error) => {
          console.error('실시간 동기화 오류:', error);
        });
        
        console.log('✅ 실시간 동기화 설정 완료');
      } catch (error) {
        console.error('실시간 동기화 설정 오류:', error);
      }
    };
    
    setupRealtimeSync();
    
    // 정리 함수
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('실시간 동기화 구독 해제');
      }
    };
  }, [firebaseUser]);
  
  // 오프라인 큐 자동 동기화 설정
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const { setupOfflineSync } = require('@/utils/offlineQueue');
    const cleanup = setupOfflineSync();
    
    return cleanup;
  }, []);

  // 선택된 레코드 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSelections = localStorage.getItem('selected-test-records');
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
      localStorage.setItem('selected-test-records', JSON.stringify(selectedRecords));
    }
  }, [selectedRecords]);

  // 사용자 정보 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (e) {
          console.error('사용자 정보 파싱 오류:', e);
          setUser(null);
        }
      }
    }
  }, []);

  // 로컬 스토리지에서 테스트 기록 가져오기
  const fetchLocalTestRecords = () => {
    try {
      setIsLoading(true);
      
      if (typeof window !== 'undefined') {
        const allRecordsMap = new Map<string, TestRecord>();
        
        // 1. MBTI 테스트 기록 가져오기
        const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records');
        
        if (mbtiRecordsStr) {
          try {
            const mbtiRecords = JSON.parse(mbtiRecordsStr);
            
            if (Array.isArray(mbtiRecords) && mbtiRecords.length > 0) {
              mbtiRecords.forEach(record => {
                if (record.testCode) {
                  // counselorCode 추출 (여러 위치에서 확인)
                  const counselorCode = record.counselorCode || 
                                       record.userData?.counselorCode || 
                                       record.userData?.clientInfo?.counselorCode ||
                                       record.userData?.clientInfo?.groupCode ||
                                       record.userData?.groupCode ||
                                       null;
                  
                  // 맵에 테스트 코드를 키로 추가
                  allRecordsMap.set(record.testCode, {
                    code: record.testCode,
                    timestamp: record.timestamp || new Date().toISOString(),
                    testType: record.testType || 'MBTI 검사',
                    counselorCode: counselorCode, // counselorCode 추가
                    userData: {
                      ...(record.userData || {}),
                      counselorCode: counselorCode, // userData에도 추가
                      groupCode: record.userData?.groupCode || record.userData?.clientInfo?.groupCode || undefined
                    },
                    result: record.result || {}
                  });
                  console.log(`mbti-user-test-records에서 찾은 기록: ${record.testCode}, counselorCode: ${counselorCode}`);
                }
              });
            }
          } catch (e) {
            console.error('MBTI 테스트 기록 파싱 오류:', e);
          }
        }
        
        // MP250-AA002 코드 복원 로직 제거 (자동 복원 방지)
        
        // 2. 테스트 기록 가져오기 (main)
        const savedRecordsStr = localStorage.getItem('test_records');
        
        if (savedRecordsStr) {
          try {
            const savedRecords = JSON.parse(savedRecordsStr);
            
            if (Array.isArray(savedRecords) && savedRecords.length > 0) {
              // 코드 형식 검증 및 중복 제거
              savedRecords.filter(record => {
                // 테스트 코드 형식 검증 (MB와 MP로 시작하는 코드 모두 허용)
                const codeRegex = /^(MB|MP|EP|AP|EA|AA|EG|AG)\d{2,3}-[A-Z]{5}$|^(MB|MP|EP|AP|EA|AA|EG|AG)\d{1,3}[A-Za-z0-9\-]{1,10}$/;
                return record.code && codeRegex.test(record.code);
              }).forEach(record => {
                // counselorCode 추출 (여러 위치에서 확인)
                const counselorCode = record.counselorCode || 
                                     record.userData?.counselorCode || 
                                     record.userData?.clientInfo?.counselorCode ||
                                     record.userData?.clientInfo?.groupCode ||
                                     record.userData?.groupCode ||
                                     null;
                
                // 해당 코드의 기록이 아직 맵에 없는 경우에만 추가
                if (!allRecordsMap.has(record.code)) {
                  allRecordsMap.set(record.code, {
                    ...record,
                    counselorCode: counselorCode || record.counselorCode, // counselorCode 추가
                    status: record.status || '완료', // 상태 정보가 없으면 '완료'로 설정
                    userData: {
                      ...(record.userData || {}),
                      counselorCode: counselorCode || record.userData?.counselorCode,
                      groupCode: record.userData?.groupCode || record.userData?.clientInfo?.groupCode || undefined
                    }
                  });
                  console.log(`test_records에서만 찾은 기록: ${record.code}, counselorCode: ${counselorCode}`);
                } else {
                  // 이미 맵에 있지만 test_records의 정보가 더 상세한 경우 병합
                  const existingRecord = allRecordsMap.get(record.code);
                  if (existingRecord) {
                    const mergedRecord = {
                      ...existingRecord,
                      ...record,
                      counselorCode: counselorCode || existingRecord.counselorCode || record.counselorCode, // counselorCode 병합
                      userData: { 
                        ...(existingRecord.userData || {}), 
                        ...(record.userData || {}),
                        counselorCode: counselorCode || existingRecord.userData?.counselorCode || record.userData?.counselorCode,
                        groupCode: record.userData?.groupCode || record.userData?.clientInfo?.groupCode || existingRecord.userData?.groupCode
                      },
                      result: { ...(existingRecord.result || {}), ...(record.result || {}) }
                    };
                    allRecordsMap.set(record.code, mergedRecord);
                    console.log(`기존 기록과 병합: ${record.code}, counselorCode: ${mergedRecord.counselorCode}`);
                  }
                }
              });
            }
          } catch (e) {
            console.error('테스트 기록 파싱 오류:', e);
          }
        }

        // 모든 기록에 대해 결과 상태 확인 및 업데이트
        const finalRecords = Array.from(allRecordsMap.values()).map(record => {
          // 결과 파일 확인
          const hasResult = Boolean(
            localStorage.getItem(`mbti-test-result-${record.code}`) ||
            localStorage.getItem(`test-result-${record.code}`)
          );
          
          return {
            ...record,
            status: hasResult ? '완료' : '진행중'
          };
        });
        
        // 정렬 (기본: 최신순)
        const sortedRecords = finalRecords.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
        
        // 내부 상태는 업데이트하지만 localStorage에 다시 저장하지 않음 (삭제된 항목의 자동 복구 방지)
        console.log(`기록 로드 완료. 총 기록 수: ${sortedRecords.length}`);
        setTestRecords(sortedRecords);
      } else {
        setTestRecords([]);
      }
    } catch (error) {
      console.error('테스트 기록 로드 오류:', error);
      setTestRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 코드 통계 계산 함수
  const calculateCodeStats = (records: TestRecord[]) => {
    // 기본 통계 정보 초기화
    const stats: CodeGenerationStats = {
      totalGenerated: records.length,
      lastGeneratedCode: '',
      lastGeneratedTime: null,
      byPrefix: {}
    };

    // 정렬된 기록에서 가장 최근 생성 코드 찾기
    if (records.length > 0) {
      stats.lastGeneratedCode = records[0].code;
      stats.lastGeneratedTime = records[0].timestamp;
    }

    // 접두사별 통계 계산
    records.forEach(record => {
      // 코드에서 접두사 추출 (예: "MP250-AA001"에서 "MP")
      const prefix = record.code.substring(0, 2);
      
      if (!stats.byPrefix[prefix]) {
        stats.byPrefix[prefix] = {
          code: prefix,
          name: getTestTypeName(prefix),
          count: 0,
          lastGenerated: null
        };
      }
      
      // 접두사 카운트 증가
      stats.byPrefix[prefix].count++;
      
      // 최신 생성 시간 업데이트
      if (!stats.byPrefix[prefix].lastGenerated || 
          new Date(record.timestamp) > new Date(stats.byPrefix[prefix].lastGenerated!)) {
        stats.byPrefix[prefix].lastGenerated = record.timestamp;
      }
    });
    
    // 접두사 정보를 배열로 변환하여 저장 (정렬을 위해)
    const prefixArray = Object.values(stats.byPrefix).sort((a, b) => b.count - a.count);
    
    setCodeStats(stats);
    setPrefixStats(prefixArray.map(p => ({
      code: p.code,
      name: p.name,
      description: getTestTypeDescription(p.code),
      count: p.count,
      lastGenerated: p.lastGenerated,
      active: true
    })));
  };
  
  // 접두사 코드에서 테스트 유형 이름 가져오기
  const getTestTypeName = (prefix: string): string => {
    const testTypeNames: Record<string, string> = {
      'MP': '전문가용 MBTI 검사',
      'MA': '개인용 MBTI 검사',
      'MG': '그룹형 MBTI 검사',
      'MI': '인사이드 MBTI 검사',
      'EP': '전문가용 이고-오케이 검사',
      'EA': '개인용 이고-오케이 검사',
      'EG': '그룹형 이고-오케이 검사',
      'AP': '전문가용 애니어그램 검사',
      'AA': '개인용 애니어그램 검사',
      'AG': '그룹형 애니어그램 검사'
    };
    
    return testTypeNames[prefix] || `${prefix} 검사`;
  };
  
  // 접두사 코드 설명 가져오기
  const getTestTypeDescription = (prefix: string): string => {
    const descMap: Record<string, string> = {
      'MP': '전문가 심리상담사를 위한 MBTI 검사',
      'MA': '일반 개인 사용자를 위한 MBTI 검사',
      'MG': '기업 및 단체를 위한 MBTI 검사',
      'MI': '인사이드 MBTI 검사',
      'EP': '전문가를 위한 이고-오케이 검사',
      'EA': '일반 개인용 이고-오케이 검사',
      'EG': '단체용 이고-오케이 검사',
      'AP': '전문가를 위한 애니어그램 검사',
      'AA': '일반 개인용 애니어그램 검사',
      'AG': '단체용 애니어그램 검사'
    };
    
    return descMap[prefix] || `${prefix} 검사 유형`;
  };

  // 필터링된 레코드
  const filteredRecords = React.useMemo(() => {
    if (!testRecords.length) return [];
    
    let filtered = testRecords
      .filter(record => {
        // 검색어 필터링
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
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
          return record.testType.toLowerCase() === filterType.toLowerCase();
        }
        return true;
      })
      .sort((a, b) => {
        // 컬럼 헤더 클릭 정렬 우선
        let comparison = 0;
        
        if (sortField === 'code') {
          comparison = (a.code || '').localeCompare(b.code || '');
        } else if (sortField === 'timestamp') {
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        } else if (sortField === 'testType') {
          comparison = (a.testType || '').localeCompare(b.testType || '');
        }
        
        // sortOrder도 고려 (하위 정렬 기준)
        if (comparison === 0 && sortOrder === 'newest') {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          comparison = timeB - timeA;
        } else if (comparison === 0 && sortOrder === 'oldest') {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          comparison = timeA - timeB;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    
      return filtered;
    }, [testRecords, searchTerm, filterType, sortOrder, sortField, sortDirection]);

  // 컬럼 헤더 클릭 핸들러 (삭제코드 페이지와 동일한 구조)
  const handleSort = (field: 'code' | 'timestamp' | 'testType') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 페이지네이션을 위한 계산
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 날짜 형식화
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error);
      return dateString;
    }
  };

  // 선택 토글
  const toggleSelection = (code: string) => {
    setSelectedRecords(prev => {
      const newSelection = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code];
      
      return newSelection;
    });
  };

  // 전체 선택 토글
  const toggleAllSelection = () => {
    setSelectedRecords(prev => {
      return prev.length === filteredRecords.length
        ? []
        : filteredRecords.map(record => record.code);
    });
  };

  // 선택한 기록 삭제
  const deleteSelectedRecords = () => {
    if (selectedRecords.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      if (typeof window !== 'undefined') {
        // 삭제할 레코드를 저장할 배열
        const recordsToDelete: DeletedTestRecord[] = [];
        
        // 삭제할 레코드 정보 수집
        selectedRecords.forEach(code => {
          const record = testRecords.find(r => r.code === code);
          if (record) {
            recordsToDelete.push({
              ...record,
              deletedAt: new Date().toISOString() // 삭제 시점 기록
            });
          }
        });
        
        // 기존 삭제된 레코드 가져오기
        const deletedRecordsStr = localStorage.getItem('deleted_test_records');
        let deletedRecords: DeletedTestRecord[] = [];
        
        if (deletedRecordsStr) {
          try {
            deletedRecords = JSON.parse(deletedRecordsStr);
          } catch (e) {
            console.error('삭제된 레코드 파싱 오류:', e);
          }
        }
        
        // 새로 삭제된 레코드 추가
        const updatedDeletedRecords = [...deletedRecords, ...recordsToDelete];
        localStorage.setItem('deleted_test_records', JSON.stringify(updatedDeletedRecords));
        
        // test_records에서 삭제
        const savedRecordsStr = localStorage.getItem('test_records');
        if (savedRecordsStr) {
          try {
            const savedRecords = JSON.parse(savedRecordsStr);
            const updatedRecords = savedRecords.filter(
              (record: TestRecord) => !selectedRecords.includes(record.code)
            );
            localStorage.setItem('test_records', JSON.stringify(updatedRecords));
          } catch (e) {
            console.error('테스트 기록 파싱 오류:', e);
          }
        }
        
        // mbti-user-test-records에서 삭제
        const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records');
        if (mbtiRecordsStr) {
          try {
            const mbtiRecords = JSON.parse(mbtiRecordsStr);
            const updatedMbtiRecords = mbtiRecords.filter(
              (record: any) => !selectedRecords.includes(record.testCode)
            );
            localStorage.setItem('mbti-user-test-records', JSON.stringify(updatedMbtiRecords));
          } catch (e) {
            console.error('MBTI 테스트 기록 파싱 오류:', e);
          }
        }
        
        // 상태 업데이트
        setTestRecords(prev => prev.filter(record => !selectedRecords.includes(record.code)));
        setSelectedRecords([]);
        localStorage.removeItem('selected-test-records'); // 선택된 레코드 리셋
        setShowDeleteConfirm(false);
        
        console.log(`${selectedRecords.length}개의 기록 삭제 완료, 삭제된 기록에 저장됨`);
      }
    } catch (error) {
      console.error('기록 삭제 오류:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // 기록 상세 보기
  const viewTestDetail = (code: string) => {
    // 코드에 따라 적절한 테스트 결과 페이지로 이동
    const testRecord = testRecords.find(record => record.code === code);
    if (!testRecord) {
      console.warn('현재 상태에서 해당 코드의 테스트 기록을 찾을 수 없습니다:', code);
      // 결과 페이지에서 검색하도록 바로 이동 처리 (오류 메시지는 결과 페이지에서 표시됨)
      router.push(`/tests/mbti_pro/result?code=${encodeURIComponent(code)}`);
      return;
    } else {
      console.log('테스트 기록을 찾았습니다:', testRecord);
    }
    
    // 테스트 유형 결정
    const testType = testRecord?.testType?.toLowerCase() || '';
    let resultPath = '';
    
    // 모든 유형을 전문가용 MBTI 결과 페이지로 연결
    try {
      // clientInfo 우선순위: userData.clientInfo > userData 직접 > 기본값
      // userData.clientInfo가 가장 정확한 실제 입력값이므로 최우선 사용
      let clientInfo = null;
      
      if (testRecord?.userData?.clientInfo) {
        // userData.clientInfo가 있으면 최우선 사용 (실제 입력값)
        clientInfo = {
          name: testRecord.userData.clientInfo.name || testRecord.userData.name || '테스트 사용자',
          groupCode: testRecord.userData.clientInfo.groupCode || testRecord.userData.groupCode || null,
          birthYear: testRecord.userData.clientInfo.birthYear || testRecord.userData.birthYear || null,
          gender: testRecord.userData.clientInfo.gender || testRecord.userData.gender || '여',
          privacyAgreed: testRecord.userData.clientInfo.privacyAgreed || false
        };
      } else if (testRecord?.userData) {
        // userData만 있으면 직접 사용
        clientInfo = {
          name: testRecord.userData.name || '테스트 사용자',
          groupCode: testRecord.userData.groupCode || null,
          birthYear: testRecord.userData.birthYear || null,
          gender: testRecord.userData.gender || '여',
          privacyAgreed: false
        };
      } else {
        // 기본값
        clientInfo = {
          name: '테스트 사용자',
          groupCode: null,
          birthYear: null,
          gender: '여',
          privacyAgreed: false
        };
      }
      
      const dataObj = {
        answers: testRecord?.userData?.answers || {},
        clientInfo: clientInfo,
        timestamp: testRecord?.timestamp || new Date().toISOString()
      };
      
      const dataStr = encodeURIComponent(JSON.stringify(dataObj));
      // code 파라미터도 함께 전달하여 결과 페이지에서 test_records에서 직접 로드할 수 있도록 함
      resultPath = `/tests/mbti_pro/result?code=${encodeURIComponent(code)}&data=${dataStr}`;
      
      // URL 길이 체크 (너무 길면 절단될 수 있음)
      if (resultPath.length > 2000) {
        console.warn('URL이 너무 깁니다. 데이터를 로컬 스토리지에 저장합니다.');
        localStorage.setItem('mbti_pro_result_data', JSON.stringify(dataObj));
        resultPath = `/tests/mbti_pro/result?code=${encodeURIComponent(code)}`;
      }
    } catch (e) {
      console.error('URL 생성 오류:', e);
      resultPath = `/tests/mbti_pro/result?code=${encodeURIComponent(code)}`;
    }
    
    // 검사 코드를 로컬 스토리지에 저장하여 결과 페이지가 확인할 수 있도록 함
    try {
      localStorage.setItem('last_viewed_test_code', code);
      // 바로 결과 페이지가 보이도록 추가 데이터 저장
      localStorage.setItem('show_graph_result', 'true');
    } catch (e) {
      console.error('로컬 스토리지 저장 오류:', e);
    }
    
    // 검사기록 페이지에서 접근한 경우 플래그 설정
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('returnToTestRecords', 'true');
    }
    
    console.log(`테스트 결과 페이지로 이동: ${resultPath}`);
    router.push(resultPath);
  };

  // 로그아웃 처리
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      
      router.push('/login');
    }
  };

  // 탭 전환
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  // 레코드 상세 보기 페이지 렌더링
  if (firebaseLoading || isLoading) {
    return <LoadingRecords />;
  }

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 overflow-hidden min-h-screen pt-16 pb-12">
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
        
        {!user ? (
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
              <Link
                href="/mypage?tab=profile"
                className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
              >
                기본 정보
              </Link>
              <Link
                href="/mypage?tab=records"
                className={`px-4 py-2 font-medium ${!showStats ? 'text-blue-200 border-b-2 border-blue-200' : 'text-blue-300 hover:text-blue-200'}`}
              >
                검사 기록
              </Link>
              <Link
                href="/mypage?tab=stats"
                className={`px-4 py-2 font-medium ${showStats ? 'text-blue-200 border-b-2 border-blue-200' : 'text-blue-300 hover:text-blue-200'}`}
              >
                통계 보기
              </Link>
              <Link
                href="/mypage/deleted-codes"
                className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
              >
                삭제코드
              </Link>
            </div>

            {/* 검색 및 필터링 섹션 - 통계보기에서는 숨김 */}
            {!showStats && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg mb-8 border border-white/20">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="w-full sm:w-auto flex-1">
                    <label htmlFor="search" className="block text-blue-300 text-sm font-medium mb-2">
                      검색
                    </label>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="검사 코드, 유형 등으로 검색"
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-blue-300/70 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <label htmlFor="filter" className="block text-blue-300 text-sm font-medium mb-2">
                      유형 필터
                    </label>
                    <select
                      id="filter"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">모든 유형</option>
                      <option value="mbti">MBTI</option>
                      <option value="enneagram">에니어그램</option>
                    </select>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    <label htmlFor="sort" className="block text-blue-300 text-sm font-medium mb-2">
                      정렬
                    </label>
                    <select
                      id="sort"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">최신순</option>
                      <option value="oldest">오래된순</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('all');
                      setSortOrder('newest');
                    }}
                    className="bg-blue-600/40 hover:bg-blue-600/60 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    필터 초기화
                  </button>
                </div>
              </div>
            )}
            
            {/* 레코드 테이블 또는 통계 섹션 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
              {/* 전체 생성 코드 수 정보 - 항상 표시 */}
              <div className="mb-4 flex justify-between items-center">
                {!showStats && (
                  <div className="text-blue-200 text-sm flex items-center">
                    <button
                      onClick={() => {
                        if (selectedRecords.length > 0) setShowDeleteConfirm(true);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        selectedRecords.length > 0 
                          ? 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white cursor-pointer shadow-lg shadow-red-600/50' 
                          : 'bg-[#8A569B] hover:bg-[#9A66AB] text-white cursor-pointer'
                      }`}
                      disabled={selectedRecords.length === 0}
                    >
                      선택 삭제 {selectedRecords.length > 0 && `(${selectedRecords.length})`}
                    </button>
                  </div>
                )}
                <div className={`text-blue-200 text-sm ${showStats ? 'ml-auto' : ''}`}>
                  전체 생성 코드: {codeStats.totalGenerated}개
                </div>
              </div>
              
              {/* 통계 보기 또는 일반 기록 테이블 */}
              {showStats ? (
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-5 border-b border-white/10 pb-2">검사 코드 통계 대시보드</h3>
                  
                  {codeStats.lastGeneratedTime && (
                    <div className="mb-4">
                      <p className="text-blue-200">최근 생성 코드: <span className="font-mono text-white">{codeStats.lastGeneratedCode}</span></p>
                      <p className="text-blue-200">마지막 생성 시간: {formatDate(codeStats.lastGeneratedTime)}</p>
                    </div>
                  )}
                  
                  {/* 통계 요약 카드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-600/40 to-indigo-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h5 className="text-sm font-medium text-blue-200 mb-1">총 검사 횟수</h5>
                      <p className="text-2xl font-bold text-white">{testRecords.length}</p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h5 className="text-sm font-medium text-blue-200 mb-1">검사 유형 수</h5>
                      <p className="text-2xl font-bold text-white">
                        {prefixStats.length > 0 
                          ? prefixStats.length 
                          : testRecords.length > 0 
                            ? Math.min(3, Array.from(new Set(testRecords.map(r => r.testType))).length) 
                            : 3}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-600/40 to-teal-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h5 className="text-sm font-medium text-blue-200 mb-1">완료된 검사</h5>
                      <p className="text-2xl font-bold text-white">
                        {testRecords.filter(r => r.status === '완료').length || testRecords.length}
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-600/40 to-yellow-600/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h5 className="text-sm font-medium text-blue-200 mb-1">가장 많은 검사</h5>
                      <p className="text-2xl font-bold text-white">
                        {prefixStats.length > 0 ? prefixStats[0].name.split(' ')[0] : 'MBTI'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 차트 그리드 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* 생성된 코드 수 (막대 차트) */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h4 className="text-lg font-medium text-white mb-3">접두사별 생성된 코드 수</h4>
                      <div className="h-64">
                        {chartInitialized ? (
                          <DynamicBar data={barData} options={chartOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-10 h-10 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-blue-200">차트 데이터 불러오는 중...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 검사 유형 분포 (파이 차트) */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h4 className="text-lg font-medium text-white mb-3">검사 유형 분포</h4>
                      <div className="h-64">
                        {chartInitialized ? (
                          <DynamicPie data={pieData} options={pieOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-10 h-10 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-blue-200">차트 데이터 불러오는 중...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 월별 검사 횟수 (선 그래프) */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h4 className="text-lg font-medium text-white mb-3">월별 검사 횟수</h4>
                      <div className="h-64">
                        {chartInitialized ? (
                          <DynamicLine data={lineData} options={chartOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-10 h-10 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-blue-200">차트 데이터 불러오는 중...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 검사 유형별 분포 (레이더 차트) */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/10">
                      <h4 className="text-lg font-medium text-white mb-3">검사 유형별 분포</h4>
                      <div className="h-64">
                        {chartInitialized ? (
                          <DynamicRadar data={radarData} options={radarOptions} />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-10 h-10 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-blue-200">차트 데이터 불러오는 중...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {currentRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xl text-blue-200">검사 기록이 없습니다.</p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5">
                        <tr>
                          <th scope="col" className="px-2 py-3">
                            <input
                              type="checkbox"
                              checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                              onChange={toggleAllSelection}
                              className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                            />
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 select-none"
                            onClick={() => handleSort('timestamp')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              검사 일시
                              <span className={`text-xs ${sortField === 'timestamp' ? 'text-red-500' : 'text-blue-300'}`}>
                                <span className={sortField === 'timestamp' && sortDirection === 'asc' ? 'text-red-500' : 'text-blue-300/50'}>▲</span>
                                <span className={sortField === 'timestamp' && sortDirection === 'desc' ? 'text-red-500' : 'text-blue-300/50'}>▼</span>
                              </span>
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 select-none"
                            onClick={() => handleSort('testType')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              검사 유형
                              <span className={`text-xs ${sortField === 'testType' ? 'text-red-500' : 'text-blue-300'}`}>
                                <span className={sortField === 'testType' && sortDirection === 'asc' ? 'text-red-500' : 'text-blue-300/50'}>▲</span>
                                <span className={sortField === 'testType' && sortDirection === 'desc' ? 'text-red-500' : 'text-blue-300/50'}>▼</span>
                              </span>
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 select-none"
                            onClick={() => handleSort('code')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              검사코드
                              <span className={`text-xs ${sortField === 'code' ? 'text-red-500' : 'text-blue-300'}`}>
                                <span className={sortField === 'code' && sortDirection === 'asc' ? 'text-red-500' : 'text-blue-300/50'}>▲</span>
                                <span className={sortField === 'code' && sortDirection === 'desc' ? 'text-red-500' : 'text-blue-300/50'}>▼</span>
                              </span>
                            </div>
                          </th>
                          <th 
                            scope="col" 
                            className="px-6 py-3 text-center text-sm font-medium text-blue-300 tracking-wider cursor-pointer hover:text-blue-200 select-none"
                          >
                            <div className="flex items-center justify-center gap-1">
                              검사결과 코드
                              <span className="text-xs text-blue-300">
                                <span className="text-blue-300/50">▲</span>
                                <span className="text-blue-300/50">▼</span>
                              </span>
                            </div>
                          </th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                            삭제
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {currentRecords.map((record, index) => (
                          <tr key={record.code} className={index % 2 === 0 ? 'bg-white/5' : 'bg-white/0'}>
                            <td className="px-2 py-4">
                              <input
                                type="checkbox"
                                checked={selectedRecords.includes(record.code)}
                                onChange={() => toggleSelection(record.code)}
                                className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
                              />
                            </td>
                            <td 
                              onClick={() => viewTestDetail(record.code)}
                              className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                              title="클릭하여 검사 결과 보기"
                            >
                              {formatDate(record.timestamp)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-300">
                              {record.testType}
                            </td>
                            <td 
                              onClick={() => viewTestDetail(record.code)}
                              className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                              title="클릭하여 검사 결과 보기"
                            >
                              {record.counselorCode || 
                               record.userData?.counselorCode || 
                               record.userData?.clientInfo?.counselorCode ||
                               record.userData?.clientInfo?.groupCode ||
                               record.userData?.groupCode ||
                               '-'}
                            </td>
                            <td 
                              onClick={() => viewTestDetail(record.code)}
                              className="px-6 py-4 whitespace-nowrap text-sm text-center text-blue-100 hover:bg-white/10 hover:text-blue-50 cursor-pointer transition-colors duration-150"
                              title="클릭하여 검사 결과 보기"
                            >
                              {record.code || '-'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-300">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRecords([record.code]);
                                  setShowDeleteConfirm(true);
                                }}
                                className="bg-red-600/40 hover:bg-red-600/60 text-white px-3 py-1 rounded transition-colors"
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#8A569B] rounded-xl p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl"
          >
            {/* 제목 */}
            <h3 className="text-2xl font-bold text-white mb-4">삭제 확인</h3>
            
            {/* 주요 질문 */}
            <p className="text-white text-lg mb-6">
              다음 검사 기록을 삭제하시겠습니까?
            </p>
            
            {/* 검사 기록 상세 정보 */}
            <div className="bg-[#6B3F7A] rounded-lg p-4 mb-6 space-y-2">
              {selectedRecords.length === 1 ? (
                // 단일 기록인 경우 상세 정보 표시
                (() => {
                  const record = testRecords.find(r => r.code === selectedRecords[0]);
                  if (!record) return null;
                  
                  const recordDate = new Date(record.timestamp);
                  const formattedDate = recordDate.toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  });
                  
                  return (
                    <>
                      <p className="text-white text-sm">검사 유형: {record.testType || '개인용 MBTI 검사'}</p>
                      <p className="text-white text-sm">검사결과 코드: {record.code}</p>
                      <p className="text-white text-sm">검사 일시: {formattedDate}</p>
                    </>
                  );
                })()
              ) : (
                // 여러 기록인 경우 요약 정보 표시
                <p className="text-white text-sm">
                  선택한 {selectedRecords.length}개의 검사 기록
                </p>
              )}
            </div>
            
            {/* 추가 안내 */}
            <p className="text-white/90 text-sm mb-6">
              삭제된 기록은 삭제코드 페이지에서 복원 가능합니다.
            </p>
            
            {/* 버튼 그룹 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-3 bg-[#4A4A4A] text-white rounded-lg hover:bg-[#5A5A5A] transition-colors font-medium"
                disabled={isDeleting}
              >
                취소
              </button>
              <button
                onClick={deleteSelectedRecords}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 페이지네이션 컨트롤 */}
      {!showStats && filteredRecords.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md ${
              currentPage === 1
                ? 'bg-blue-900/30 text-blue-400 cursor-not-allowed'
                : 'bg-blue-700 text-white hover:bg-blue-600'
            }`}
          >
            이전
          </button>
          
          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
            // 현재 페이지 주변의 페이지 번호만 표시
            let pageNum;
            if (totalPages <= 5) {
              pageNum = index + 1;
            } else if (currentPage <= 3) {
              pageNum = index + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + index;
            } else {
              pageNum = currentPage - 2 + index;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/60'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md ${
              currentPage === totalPages
                ? 'bg-blue-900/30 text-blue-400 cursor-not-allowed'
                : 'bg-blue-700 text-white hover:bg-blue-600'
            }`}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function TestRecordsPage() {
  return (
    <Suspense fallback={<LoadingRecords />}>
      <TestRecordsContent />
    </Suspense>
  );
} 