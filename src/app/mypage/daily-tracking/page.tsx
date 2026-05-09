'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useCounselorConnection } from '@/hooks/useCounselorConnection';
import { DailyRecord } from '@/types/counselor';

export default function DailyTrackingPage() {
  const { user, loading } = useFirebaseAuth();
  const { connection: counselorConnection } = useCounselorConnection();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<'daily_mood' | 'weekly_check' | 'monthly_review' | 'emotion_diary'>('daily_mood');

  // 폼 데이터
  const [formData, setFormData] = useState({
    content: '',
    moodScore: 5,
    stressLevel: 5,
    energyLevel: 5,
    isShared: true
  });

  // 일상 기록 목록 조회
  const fetchRecords = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/daily-records?clientId=${user.uid}&limit=30`);
      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data);
      } else {
        setError(result.error || '일상 기록 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('일상 기록 조회 오류:', err);
      setError('일상 기록 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 일상 기록 생성
  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/daily-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: user?.uid,
          counselorId: counselorConnection.counselorId || '',
          recordType: selectedType,
          content: formData.content.trim(),
          moodScore: formData.moodScore,
          stressLevel: formData.stressLevel,
          energyLevel: formData.energyLevel,
          isShared: formData.isShared
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFormData({
          content: '',
          moodScore: 5,
          stressLevel: 5,
          energyLevel: 5,
          isShared: true
        });
        setShowRecordForm(false);
        await fetchRecords(); // 목록 새로고침
      } else {
        setError(result.error || '일상 기록 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error('일상 기록 저장 오류:', err);
      setError('일상 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchRecords();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-300 text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const recordTypes = [
    { value: 'daily_mood', label: '일일 마음 상태', icon: '😊', description: '매일의 기분과 감정을 기록하세요' },
    { value: 'weekly_check', label: '주간 체크', icon: '📅', description: '일주일을 돌아보며 정리하세요' },
    { value: 'monthly_review', label: '월간 리뷰', icon: '📊', description: '한 달의 변화를 점검하세요' },
    { value: 'emotion_diary', label: '감정 일기', icon: '📝', description: '깊이 있는 감정을 기록하세요' }
  ];

  return (
    <div className="min-h-screen bg-gray-900"><div className="pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">일상생활 추적</h1>
            <p className="text-gray-300">
              매일의 마음 상태와 감정을 기록하여 자신을 더 잘 이해해보세요.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 기록 유형 선택 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">기록 유형 선택</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recordTypes.map((type) => (
                <motion.button
                  key={type.value}
                  onClick={() => {
                    setSelectedType(type.value as any);
                    setShowRecordForm(true);
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedType === type.value
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <h3 className="text-white font-semibold mb-1">{type.label}</h3>
                  <p className="text-gray-400 text-sm">{type.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 기록 작성 폼 */}
          {showRecordForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {recordTypes.find(t => t.value === selectedType)?.label} 기록
                </h3>
                <button
                  onClick={() => setShowRecordForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitRecord} className="space-y-6">
                {/* 점수 입력 (일일 마음 상태인 경우) */}
                {selectedType === 'daily_mood' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        기분 점수 (1-10)
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">😢</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.moodScore}
                          onChange={(e) => setFormData(prev => ({ ...prev, moodScore: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-400">😊</span>
                        <span className="text-white font-semibold w-8">{formData.moodScore}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        스트레스 수준 (1-10)
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">😌</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.stressLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-400">😰</span>
                        <span className="text-white font-semibold w-8">{formData.stressLevel}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        에너지 수준 (1-10)
                      </label>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">😴</span>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formData.energyLevel}
                          onChange={(e) => setFormData(prev => ({ ...prev, energyLevel: parseInt(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-400">⚡</span>
                        <span className="text-white font-semibold w-8">{formData.energyLevel}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 내용 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    오늘의 기록
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder={
                      selectedType === 'daily_mood' ? '오늘 하루는 어땠나요? 어떤 일이 있었고 어떤 감정을 느꼈나요?' :
                      selectedType === 'weekly_check' ? '이번 주는 어떠했나요? 잘한 점과 아쉬운 점을 정리해보세요.' :
                      selectedType === 'monthly_review' ? '이번 달의 변화와 성장을 돌아보며 다음 달 목표를 세워보세요.' :
                      '깊이 있는 감정과 생각을 자유롭게 표현해보세요.'
                    }
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* 공유 설정 */}
                {counselorConnection.isConnected && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isShared"
                      checked={formData.isShared}
                      onChange={(e) => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-600 rounded bg-gray-700"
                    />
                    <label htmlFor="isShared" className="ml-2 text-sm text-gray-300">
                      상담사와 공유하기
                    </label>
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        저장 중...
                      </div>
                    ) : (
                      '기록 저장하기'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 기록 목록 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">최근 기록</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">기록을 불러오는 중...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">아직 기록이 없습니다</h3>
                <p className="text-gray-400">첫 번째 기록을 작성해보세요.</p>
              </div>
            ) : (
              records.map((record) => (
                <DailyRecordCard key={record.id} record={record} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 일상 기록 카드 컴포넌트
function DailyRecordCard({ record }: { record: DailyRecord }) {
  const getRecordTypeInfo = (type: string) => {
    switch (type) {
      case 'daily_mood': return { label: '일일 마음 상태', icon: '😊', color: 'bg-blue-500/20 text-blue-400' };
      case 'weekly_check': return { label: '주간 체크', icon: '📅', color: 'bg-green-500/20 text-green-400' };
      case 'monthly_review': return { label: '월간 리뷰', icon: '📊', color: 'bg-purple-500/20 text-purple-400' };
      case 'emotion_diary': return { label: '감정 일기', icon: '📝', color: 'bg-pink-500/20 text-pink-400' };
      default: return { label: '기록', icon: '📄', color: 'bg-gray-500/20 text-gray-400' };
    }
  };

  const typeInfo = getRecordTypeInfo(record.recordType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{typeInfo.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{typeInfo.label}</h3>
            <p className="text-gray-400 text-sm">
              {new Date(record.recordedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeInfo.color}`}>
          {typeInfo.label}
        </span>
      </div>

      {/* 점수 표시 (일일 마음 상태인 경우) */}
      {record.recordType === 'daily_mood' && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          {record.moodScore && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">기분</p>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-400">{record.moodScore}</span>
                <span className="text-sm text-gray-400 ml-1">/10</span>
              </div>
            </div>
          )}
          {record.stressLevel && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">스트레스</p>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-red-400">{record.stressLevel}</span>
                <span className="text-sm text-gray-400 ml-1">/10</span>
              </div>
            </div>
          )}
          {record.energyLevel && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">에너지</p>
              <div className="flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-400">{record.energyLevel}</span>
                <span className="text-sm text-gray-400 ml-1">/10</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 내용 */}
      <div className="mb-4">
        <p className="text-gray-300 leading-relaxed">{record.content}</p>
      </div>

      {/* 상담사 메모 */}
      {record.counselorNotes && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <p className="text-sm text-emerald-400 font-medium mb-1">상담사 메모</p>
          <p className="text-emerald-300 text-sm">{record.counselorNotes}</p>
        </div>
      )}

      {/* 공유 상태 */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          {record.isShared ? (
            <div className="flex items-center text-emerald-400">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">상담사와 공유됨</span>
            </div>
          ) : (
            <div className="flex items-center text-gray-400">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm">개인 기록</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
