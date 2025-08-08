"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { updateProfile, onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface ProfileEditorProps {
  onClose: () => void;
  onUpdate: () => void;
}

export default function ProfileEditor({ onClose, onUpdate }: ProfileEditorProps) {
  const { user: authUser } = useFirebaseAuth();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // 폼 상태
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    occupation: '',
    interests: [] as string[],
    bio: ''
  });

  // 관심사 옵션
  const interestOptions = [
    '심리학', '상담', '자기계발', '인간관계', '스트레스 관리',
    '감정 관리', '직업 상담', '가족 상담', '학습', '건강'
  ];

  // 날짜 선택기 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  // Firebase Auth 원본 사용자 객체 가져오기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (authUser) {
        try {
          // Firestore에서 사용자 정보 가져오기
          const userRef = doc(db, 'users', authUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const birthDate = userData.birthDate || '';
            
            // 기존 생년월일이 있으면 선택된 값들도 설정
            if (birthDate) {
              const date = new Date(birthDate);
              setSelectedYear(date.getFullYear());
              setSelectedMonth(date.getMonth() + 1);
              setSelectedDay(date.getDate());
            }
            
            setFormData({
              displayName: authUser.displayName || userData.displayName || '',
              email: authUser.email || '',
              phoneNumber: userData.phoneNumber || '',
              birthDate: birthDate,
              gender: userData.gender || '',
              occupation: userData.occupation || '',
              interests: userData.interests || [],
              bio: userData.bio || ''
            });
          } else {
            // Firestore에 데이터가 없으면 기본값 설정
            setFormData({
              displayName: authUser.displayName || '',
              email: authUser.email || '',
              phoneNumber: '',
              birthDate: '',
              gender: '',
              occupation: '',
              interests: [],
              bio: ''
            });
          }
        } catch (error) {
          console.error('사용자 데이터 로드 오류:', error);
          // 오류 발생 시 기본값 설정
          setFormData({
            displayName: authUser.displayName || '',
            email: authUser.email || '',
            phoneNumber: '',
            birthDate: '',
            gender: '',
            occupation: '',
            interests: [],
            bio: ''
          });
        }
      }
    };

    loadUserData();
  }, [authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterestChange = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (year: number, month: number, day: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
    
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      birthDate: formattedDate
    }));
    setShowDatePicker(false);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${(date.getMonth() + 1).toString().padStart(2, '0')}. ${date.getDate().toString().padStart(2, '0')}.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    setIsLoading(true);
    setMessage('');

    try {
      // Firebase Auth 프로필 업데이트
      await updateProfile(firebaseUser, {
        displayName: formData.displayName
      });

      // Firestore에 추가 정보 저장
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        birthDate: formData.birthDate,
        gender: formData.gender,
        occupation: formData.occupation,
        interests: formData.interests,
        bio: formData.bio,
        updatedAt: new Date()
      });

      setMessageType('success');
      setMessage('프로필이 성공적으로 업데이트되었습니다!');
      
      // 부모 컴포넌트에 업데이트 알림
      onUpdate();
      
      // 2초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setMessageType('error');
      setMessage('프로필 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

    // 포털을 사용하여 body에 직접 렌더링
  if (typeof window === 'undefined') return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl border border-emerald-500/30 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="relative px-8 py-6 border-b border-gradient-to-r from-emerald-500/30 to-blue-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 to-blue-600/10 rounded-t-2xl"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">프로필 편집</h2>
              <p className="text-emerald-300 text-sm mt-1">개인정보를 수정하고 관리하세요</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mx-8 mt-4 p-4 rounded-lg ${
            messageType === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">이름</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">이메일</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-400 cursor-not-allowed"
                  placeholder="이메일 (수정 불가)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">전화번호</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                  placeholder="전화번호를 입력하세요"
                />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-emerald-300 mb-2">생년월일</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatDate(formData.birthDate)}
                    readOnly
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300 cursor-pointer"
                    placeholder="연도. 월. 일."
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* 커스텀 날짜 선택기 */}
                {showDatePicker && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 rounded-xl shadow-2xl border border-emerald-500/30 z-[10000] p-4">
                    {/* 연도 선택 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-300">연도 선택</span>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                                             <div className="grid grid-cols-7 gap-1 max-h-32 overflow-y-auto">
                         {Array.from({ length: 80 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                           <button
                             key={year}
                             onClick={() => setSelectedYear(year)}
                             className={`px-2 py-1 text-xs rounded ${
                               selectedYear === year
                                 ? 'bg-emerald-500 text-white'
                                 : 'text-emerald-300 hover:bg-emerald-500/20'
                             }`}
                           >
                             {year}
                           </button>
                         ))}
                       </div>
                    </div>
                    
                    {/* 월 선택 */}
                    <div className="mb-4">
                      <span className="text-sm font-medium text-emerald-300 block mb-2">월 선택</span>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <button
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className={`px-3 py-2 text-sm rounded ${
                              selectedMonth === month
                                ? 'bg-blue-500 text-white'
                                : 'text-blue-300 hover:bg-blue-500/20'
                            }`}
                          >
                            {month}월
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 일 선택 */}
                    <div>
                      <span className="text-sm font-medium text-emerald-300 block mb-2">일 선택</span>
                      <div className="grid grid-cols-7 gap-1">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                          <div key={day} className="text-xs text-gray-400 text-center py-1">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            onClick={() => handleDateSelect(selectedYear, selectedMonth, day)}
                            className={`px-2 py-1 text-xs rounded ${
                              selectedDay === day
                                ? 'bg-purple-500 text-white'
                                : 'text-purple-300 hover:bg-purple-500/20'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 하단 버튼 */}
                    <div className="flex justify-between mt-4 pt-4 border-t border-white/20">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => handleDateSelect(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())}
                        className="px-3 py-1 text-sm bg-emerald-500 text-white rounded hover:bg-emerald-600"
                      >
                        오늘
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">성별</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                  style={{
                    color: 'white'
                  }}
                >
                  <option value="" style={{ backgroundColor: '#1e293b', color: 'white' }}>선택하세요</option>
                  <option value="male" style={{ backgroundColor: '#1e293b', color: 'white' }}>남성</option>
                  <option value="female" style={{ backgroundColor: '#1e293b', color: 'white' }}>여성</option>
                  <option value="other" style={{ backgroundColor: '#1e293b', color: 'white' }}>기타</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-emerald-300 mb-2">직업</label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300"
                  placeholder="직업을 입력하세요"
                />
              </div>
            </div>
          </div>

          {/* 관심사 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">관심사</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interestOptions.map((interest) => (
                <label key={interest} className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.interests.includes(interest)}
                    onChange={() => handleInterestChange(interest)}
                    className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500/50 focus:ring-2"
                  />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors duration-200">
                    {interest}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 자기소개 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">자기소개</h3>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/15 transition-all duration-300 resize-none"
              placeholder="자기소개를 입력하세요..."
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-300 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all duration-300"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <span>저장</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
} 