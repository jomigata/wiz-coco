'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

export default function CounselorApplicationPage() {
  const { user, loading } = useFirebaseAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasExistingApplication, setHasExistingApplication] = useState(false);

  // 폼 데이터
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      email: '',
      phone: '',
      specialization: [] as string[],
      experience: 0,
      education: '',
      bio: ''
    },
    documents: {
      resume: '',
      license: '',
      portfolio: [] as string[],
      other: [] as string[]
    }
  });

  // 기존 지원 신청 확인
  useEffect(() => {
    if (user && !loading) {
      checkExistingApplication();
    }
  }, [user, loading]);

  const checkExistingApplication = async () => {
    try {
      const response = await fetch(`/api/counselor-applications?applicantId=${user?.uid}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const activeApplication = result.data.find((app: any) => 
          ['pending', 'under_review', 'approved'].includes(app.status)
        );
        
        if (activeApplication) {
          setHasExistingApplication(true);
        }
      }
    } catch (err) {
      console.error('기존 지원 신청 확인 오류:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof typeof prev],
        [childField]: value
      }
    }));
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        specialization: checked
          ? [...prev.personalInfo.specialization, specialization]
          : prev.personalInfo.specialization.filter(s => s !== specialization)
      }
    }));
  };

  const handleFileUpload = (field: string, file: File) => {
    // 실제 구현에서는 파일을 Firebase Storage에 업로드하고 URL을 반환
    // 여기서는 임시로 파일명만 저장
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file.name
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('로그인이 필요합니다.');
      return;
    }

    // 필수 필드 검증
    if (!formData.personalInfo.name || !formData.personalInfo.email || !formData.personalInfo.phone) {
      setError('필수 정보를 모두 입력해주세요.');
      return;
    }

    if (formData.personalInfo.specialization.length === 0) {
      setError('전문 분야를 최소 하나 이상 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/counselor-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicantId: user.uid,
          personalInfo: formData.personalInfo,
          documents: formData.documents
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSuccess('상담사 지원 신청이 제출되었습니다. 검토 후 결과를 알려드리겠습니다.');
        setFormData({
          personalInfo: {
            name: '',
            email: '',
            phone: '',
            specialization: [],
            experience: 0,
            education: '',
            bio: ''
          },
          documents: {
            resume: '',
            license: '',
            portfolio: [],
            other: []
          }
        });
      } else {
        setError(result.error || '지원 신청 제출에 실패했습니다.');
      }
    } catch (err) {
      console.error('상담사 지원 신청 오류:', err);
      setError('지원 신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (hasExistingApplication) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-yellow-400 mb-2">이미 지원 신청이 있습니다</h1>
              <p className="text-gray-300 mb-4">
                상담사 지원 신청이 이미 진행 중입니다. 검토 후 결과를 알려드리겠습니다.
              </p>
              <button
                onClick={() => router.push('/mypage')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                마이페이지로 이동
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  const specializations = [
    '개인상담', '가족상담', '커플상담', '청소년상담', '노인상담',
    '우울증', '불안장애', '트라우마', '중독', '성격장애',
    '직장상담', '진로상담', '학습상담', '인간관계', '기타'
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <div className="pt-16 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">상담사 지원 신청</h1>
              <p className="text-gray-300">
                전문 상담사가 되어 내담자들을 도와주세요.
              </p>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {/* 성공 메시지 */}
            {success && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-emerald-400">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 개인 정보 */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">개인 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.name}
                      onChange={(e) => handleNestedInputChange('personalInfo', 'name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => handleNestedInputChange('personalInfo', 'email', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      전화번호 *
                    </label>
                    <input
                      type="tel"
                      value={formData.personalInfo.phone}
                      onChange={(e) => handleNestedInputChange('personalInfo', 'phone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      경력 (년)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.personalInfo.experience}
                      onChange={(e) => handleNestedInputChange('personalInfo', 'experience', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 전문 분야 */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">전문 분야 *</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializations.map((spec) => (
                    <label key={spec} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.personalInfo.specialization.includes(spec)}
                        onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                      />
                      <span className="ml-2 text-gray-300">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 학력 및 소개 */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">학력 및 소개</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      학력
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.education}
                      onChange={(e) => handleNestedInputChange('personalInfo', 'education', e.target.value)}
                      placeholder="예: 심리학 학사, 상담심리학 석사"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      자기소개
                    </label>
                    <textarea
                      value={formData.personalInfo.bio}
                      onChange={(e) => handleNestedInputChange('personalInfo', 'bio', e.target.value)}
                      placeholder="상담 경험, 전문성, 상담 철학 등을 자유롭게 작성해주세요"
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 제출 서류 */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">제출 서류</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      이력서
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('resume', e.target.files[0])}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      자격증/면허증
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload('license', e.target.files[0])}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                  </div>
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      제출 중...
                    </div>
                  ) : (
                    '지원 신청 제출'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
