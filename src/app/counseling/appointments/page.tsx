'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useCounselorConnection } from '@/hooks/useCounselorConnection';
import { CounselingAppointment } from '@/app/api/counseling-appointments/route';

export default function CounselingAppointmentsPage() {
  const { user, loading } = useFirebaseAuth();
  const { connection: counselorConnection } = useCounselorConnection();
  const [appointments, setAppointments] = useState<CounselingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    appointmentType: 'individual' as 'individual' | 'family' | 'couple' | 'group',
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    location: 'online' as 'online' | 'offline' | 'phone',
    meetingLink: '',
    address: '',
    phoneNumber: '',
    notes: ''
  });

  // 상담 유형 목록
  const appointmentTypes = [
    { value: 'individual', label: '개인 상담', icon: '👤', description: '1:1 개인 심리 상담' },
    { value: 'family', label: '가족 상담', icon: '👨‍👩‍👧‍👦', description: '가족 구성원과 함께하는 상담' },
    { value: 'couple', label: '커플 상담', icon: '💑', description: '연인/부부 관계 상담' },
    { value: 'group', label: '그룹 상담', icon: '👥', description: '여러 명이 함께하는 상담' }
  ];

  // 예약 목록 조회
  const fetchAppointments = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/counseling-appointments?clientId=${user.uid}`);
      const result = await response.json();
      
      if (result.success) {
        setAppointments(result.data);
      } else {
        setError(result.error || '예약 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('예약 조회 오류:', err);
      setError('예약 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 예약 생성
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.scheduledAt) {
      setError('제목과 예약 시간을 입력해주세요.');
      return;
    }

    if (!counselorConnection.counselorId) {
      setError('상담사와 연결되어 있지 않습니다.');
      return;
    }

    setIsBooking(true);
    setError('');

    try {
      const response = await fetch('/api/counseling-appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: user?.uid,
          counselorId: counselorConnection.counselorId,
          ...formData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setFormData({
          appointmentType: 'individual',
          title: '',
          description: '',
          scheduledAt: '',
          duration: 60,
          location: 'online',
          meetingLink: '',
          address: '',
          phoneNumber: '',
          notes: ''
        });
        setShowBookingForm(false);
        await fetchAppointments(); // 목록 새로고침
      } else {
        setError(result.error || '예약 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('예약 생성 오류:', err);
      setError('예약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsBooking(false);
    }
  };

  useEffect(() => {
    if (user && !loading) {
      fetchAppointments();
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

  if (!counselorConnection.isConnected) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-400 mb-2">상담사와 연결이 필요합니다</h1>
              <p className="text-gray-300 mb-4">
                상담 예약을 이용하려면 먼저 상담사와 연결해야 합니다.
              </p>
              <a
                href="/mypage/connect-counselor"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
              >
                상담사 연결하기
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">상담 예약 관리</h1>
            <p className="text-gray-300">
              상담사와의 상담 일정을 예약하고 관리하세요.
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* 새 예약 버튼 */}
          <div className="mb-6">
            <motion.button
              onClick={() => setShowBookingForm(!showBookingForm)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showBookingForm ? '취소' : '+ 새 상담 예약'}
            </motion.button>
          </div>

          {/* 예약 폼 */}
          {showBookingForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-gray-800 rounded-lg p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-4">새 상담 예약</h3>
              <form onSubmit={handleBookAppointment} className="space-y-6">
                {/* 상담 유형 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    상담 유형
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {appointmentTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, appointmentType: type.value as any }))}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.appointmentType === type.value
                            ? 'border-emerald-500 bg-emerald-500/10'
                            : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <h4 className="text-white font-semibold mb-1">{type.label}</h4>
                        <p className="text-gray-400 text-sm">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      상담 제목 *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="예: 스트레스 관리 상담"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      상담 시간 (분)
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value={30}>30분</option>
                      <option value={60}>60분</option>
                      <option value={90}>90분</option>
                      <option value={120}>120분</option>
                    </select>
                  </div>
                </div>

                {/* 예약 시간 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    예약 시간 *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* 상담 방식 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    상담 방식
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location: 'online' }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.location === 'online'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">💻</div>
                      <h4 className="text-white font-semibold">온라인</h4>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location: 'offline' }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.location === 'offline'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">🏢</div>
                      <h4 className="text-white font-semibold">오프라인</h4>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, location: 'phone' }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.location === 'phone'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-2xl mb-2">📞</div>
                      <h4 className="text-white font-semibold">전화</h4>
                    </button>
                  </div>
                </div>

                {/* 상담 방식별 추가 정보 */}
                {formData.location === 'online' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      화상회의 링크
                    </label>
                    <input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                      placeholder="https://meet.google.com/..."
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {formData.location === 'offline' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      상담 장소 주소
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="상담실 주소를 입력하세요"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {formData.location === 'phone' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      연락처
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="연락받을 전화번호를 입력하세요"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* 상담 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    상담 내용 및 요청사항
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="상담하고 싶은 내용이나 특별한 요청사항을 입력하세요"
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 추가 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    추가 메모
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="기타 참고사항이나 특별한 요청이 있다면 입력하세요"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end">
                  <motion.button
                    type="submit"
                    disabled={isBooking}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isBooking ? (
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        예약 중...
                      </div>
                    ) : (
                      '상담 예약하기'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* 예약 목록 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4">예약 목록</h2>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">예약을 불러오는 중...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 bg-gray-800 rounded-lg">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">예약된 상담이 없습니다</h3>
                <p className="text-gray-400">새로운 상담을 예약해보세요.</p>
              </div>
            ) : (
              appointments.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 예약 카드 컴포넌트
function AppointmentCard({ appointment }: { appointment: CounselingAppointment }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
      case 'confirmed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
      case 'no_show': return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'confirmed': return '확정됨';
      case 'cancelled': return '취소됨';
      case 'completed': return '완료됨';
      case 'no_show': return '불참';
      default: return status;
    }
  };

  const getAppointmentTypeText = (type: string) => {
    switch (type) {
      case 'individual': return '개인 상담';
      case 'family': return '가족 상담';
      case 'couple': return '커플 상담';
      case 'group': return '그룹 상담';
      default: return type;
    }
  };

  const getLocationText = (location: string) => {
    switch (location) {
      case 'online': return '온라인';
      case 'offline': return '오프라인';
      case 'phone': return '전화';
      default: return location;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <h3 className="text-xl font-semibold text-white">{appointment.title}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <p><span className="text-gray-300">상담 유형:</span> {getAppointmentTypeText(appointment.appointmentType)}</p>
            <p><span className="text-gray-300">예약 시간:</span> {new Date(appointment.scheduledAt).toLocaleString('ko-KR')}</p>
            <p><span className="text-gray-300">상담 시간:</span> {appointment.duration}분</p>
            <p><span className="text-gray-300">상담 방식:</span> {getLocationText(appointment.location)}</p>
            {appointment.description && (
              <p><span className="text-gray-300">상담 내용:</span> {appointment.description}</p>
            )}
            {appointment.counselorNotes && (
              <p><span className="text-gray-300">상담사 메모:</span> {appointment.counselorNotes}</p>
            )}
          </div>

          {/* 상담 방식별 정보 */}
          {appointment.location === 'online' && appointment.meetingLink && (
            <div className="mb-4">
              <a
                href={appointment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-emerald-400 hover:text-emerald-300"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                화상회의 참여하기
              </a>
            </div>
          )}

          {appointment.location === 'offline' && appointment.address && (
            <div className="mb-4">
              <p className="text-gray-300 text-sm">
                <span className="font-medium">상담 장소:</span> {appointment.address}
              </p>
            </div>
          )}

          {appointment.location === 'phone' && appointment.phoneNumber && (
            <div className="mb-4">
              <p className="text-gray-300 text-sm">
                <span className="font-medium">연락처:</span> {appointment.phoneNumber}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
