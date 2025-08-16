"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUser, FaClipboard, FaBrain, FaClock, FaKey, FaHeart, FaComment } from 'react-icons/fa';
import { getItem, setItem, getAuthState, setAuthState } from '@/utils/localStorageManager';
import { setupSyncMonitor, onSyncStatusChange, SyncStatus } from '@/utils/syncService';
import dynamic from 'next/dynamic';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { auth, db } from '@/lib/firebase'; // Firebase 인증 토큰 가져오기 위해 추가
import { doc, getDoc } from 'firebase/firestore';

// 삭제코드 페이지 컴포넌트 import
import { DeletedCodesContent } from '@/app/mypage/deleted-codes/components';
import ProfileEditor from './components/ProfileEditor';

// 동적 import로 컴포넌트 로드
const TestRecordsContent = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
    <h2 className="text-2xl font-bold text-blue-100 mb-6">검사 기록</h2>
    <p className="text-blue-200">검사 기록 기능이 준비 중입니다.</p>
  </div>
);

const StatsContent = () => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
    <h2 className="text-2xl font-bold text-blue-100 mb-6">통계 보기</h2>
    <p className="text-blue-200">통계 기능이 준비 중입니다.</p>
  </div>
);

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
  
  // URL에서 탭 파라미터 확인
  const initialTab = searchParams.get('tab') || 'profile';
  
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
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

  // 탭 변경 함수
  const changeTab = (tabName: string) => {
    setActiveTab(tabName);
    const params = new URLSearchParams(searchParams);
    params.set('tab', tabName);
    router.push(`/mypage?${params.toString()}`);
  };

  // 로컬 테스트 기록 로드
  const loadLocalTestRecords = (): TestRecord[] => {
    try {
      const allRecords = JSON.parse(localStorage.getItem('test_records') || '[]');
      console.log(`사용자 ${user?.email}의 로컬 테스트 기록 ${allRecords.length}개를 로드했습니다.`);
      
      return allRecords.sort((a: any, b: any) => {
        const timeA = new Date(a.timestamp || new Date()).getTime();
        const timeB = new Date(b.timestamp || new Date()).getTime();
        return timeB - timeA;
      }).slice(0, 10);
    } catch (error) {
      console.error('로컬 테스트 기록 로드 오류:', error);
      return [];
    }
  };

  if (isLoading) {
    return <LoadingMyPage />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <Navigation />
      <div className="h-20"></div>
      
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
              <Link
                href="/mypage/deleted-codes"
                className="px-4 py-2 font-medium text-blue-300 hover:text-blue-200"
              >
                삭제코드
              </Link>
            </motion.div>

            {activeTab === 'profile' && (
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 transition-all hover:bg-white/15 hover:shadow-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h2 className="text-2xl font-bold text-blue-100 mb-6 flex items-center">
                  <FaUser className="w-6 h-6 mr-3 text-blue-300" />
                  기본 정보
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 계정 정보 그룹 */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
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
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <h3 className="text-lg font-semibold text-blue-100 mb-4 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-purple-400" />
                      개인 정보
                    </h3>
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
                        <span className="text-blue-100">{user.gender || '정보 없음'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">직업</span>
                        <span className="text-blue-100">{user.occupation || '정보 없음'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 프로필 편집 버튼 */}
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <button
                    onClick={() => setShowProfileEditor(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    프로필 편집
                  </button>
                </motion.div>
              </motion.div>
            )}

            {activeTab === 'records' && (
              <TestRecordsContent />
            )}

            {activeTab === 'stats' && (
              <StatsContent />
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