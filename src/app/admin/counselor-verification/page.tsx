"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUserCheck, FaSearch, FaFilter, FaCheck, FaTimes, FaEye, FaFileAlt, FaGraduationCap, FaCertificate, FaPlus, FaSave, FaEdit } from 'react-icons/fa';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { shouldShowAdminMenu } from '@/utils/roleUtils';
import RoleGuard from '@/components/RoleGuard';
import { initializeFirebase } from '@/lib/firebase';
import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';

interface CounselorApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  notes: string;
  reviewNotes?: string;
  applicantUid: string;
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    specialization?: string[];
    experience?: number;
    education?: string;
    bio?: string;
  };
  documents?: {
    resume?: string;
    license?: string;
    portfolio?: string[];
    other?: string[];
  };
}

function toDateString(value: any): string {
  if (!value) return '';
  const d =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : typeof value === 'string'
          ? new Date(value)
          : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function CounselorVerificationPageContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useFirebaseAuth();
  const [applications, setApplications] = useState<CounselorApplication[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<CounselorApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // URL 파라미터 확인하여 자동으로 추가 모달 열기
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const loadApplications = async () => {
    try {
      setLoadError('');
      const { db } = initializeFirebase();
      if (!db) return;
      setBusy(true);
      const q = query(collection(db, 'counselorApplications'), orderBy('submittedAt', 'desc'), limit(200));
      const snap = await getDocs(q);
      const apps: CounselorApplication[] = snap.docs.map((d) => {
        const data: any = d.data();
        const personalInfo = (data?.personalInfo || {}) as any;
        return {
          id: d.id,
          applicantUid: String(data?.applicantUid || ''),
          status: (data?.status || 'pending') as CounselorApplication['status'],
          appliedDate: toDateString(data?.submittedAt) || '',
          notes: String(personalInfo?.bio || ''),
          reviewNotes: typeof data?.reviewNotes === 'string' ? data.reviewNotes : undefined,
          personalInfo,
          documents: data?.documents || {},
        };
      });
      setApplications(apps);
    } catch (e) {
      console.error('상담사 신청 목록 로딩 오류:', e);
      setLoadError('상담사 신청 목록을 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      loadApplications();
    }
  }, [loading, user?.uid]);

  // 필터링
  const filteredApplications = applications
    .filter(app => {
      const q = searchQuery.toLowerCase();
      const name = (app.personalInfo?.name || '').toLowerCase();
      const email = (app.personalInfo?.email || '').toLowerCase();
      const uid = (app.applicantUid || '').toLowerCase();
      const matchesSearch = name.includes(q) || email.includes(q) || uid.includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

  const getStatusColor = (status: CounselorApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500 text-white';
      case 'approved':
        return 'bg-green-500 text-white';
      case 'rejected':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: CounselorApplication['status']) => {
    switch (status) {
      case 'pending':
        return '검토 중';
      case 'approved':
        return '승인됨';
      case 'rejected':
        return '거부됨';
      default:
        return '알 수 없음';
    }
  };

  const handleApprove = async (application: CounselorApplication) => {
    try {
      const { db } = initializeFirebase();
      if (!db) return;
      if (!application.applicantUid?.trim()) {
        alert('신청자 UID가 없어 승인할 수 없습니다.');
        return;
      }
      setBusy(true);
      await updateDoc(doc(db, 'counselorApplications', application.id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewerUid: user?.uid || null,
      });
      await updateDoc(doc(db, 'users', application.applicantUid), {
        role: 'counselor',
        roleUpdatedAt: serverTimestamp(),
      });
      await loadApplications();
    } catch (e) {
      console.error('승인 처리 오류:', e);
      alert('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (application: CounselorApplication) => {
    try {
      const { db } = initializeFirebase();
      if (!db) return;
      setBusy(true);
      await updateDoc(doc(db, 'counselorApplications', application.id), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewerUid: user?.uid || null,
      });
      await loadApplications();
    } catch (e) {
      console.error('반려 처리 오류:', e);
      alert('반려 처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const openModal = (application: CounselorApplication) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const openAddModal = () => {
    setShowAddModal(true);
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <Navigation />
      <div className="h-20"></div>
      
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 페이지 헤더 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-blue-200 to-purple-300 inline-block drop-shadow-lg">
                상담사 인증 관리
              </h1>
              <motion.div 
                className="h-1.5 w-32 bg-gradient-to-r from-red-500 via-blue-500 to-purple-500 rounded-full mt-2 shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: 128 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              ></motion.div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {applications.filter(app => app.status === 'pending').length}
                </div>
                <div className="text-sm text-red-200">검토 대기 중</div>
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50"
                disabled={true}
              >
                <FaPlus className="w-4 h-4" />
                상담사 추가
              </button>
            </div>
          </div>
        </motion.div>

        {loadError && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-200">{loadError}</p>
          </div>
        )}

        {busy && (
          <div className="mb-6 bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="text-white/80">처리 중...</p>
          </div>
        )}

        {/* 검색 및 필터 */}
        <motion.div
          className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-300 w-4 h-4" />
              <input
                type="text"
                placeholder="이름, 이메일, UID로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all" className="bg-gray-800">전체 상태</option>
                <option value="pending" className="bg-gray-800">검토 중</option>
                <option value="approved" className="bg-gray-800">승인됨</option>
                <option value="rejected" className="bg-gray-800">거부됨</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* 상담사 인증 신청 목록 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {filteredApplications.map((application, index) => (
            <motion.div
              key={application.id}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:border-white/40 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {(application.personalInfo?.name || '?').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{application.personalInfo?.name || '(이름 없음)'}</h3>
                    <p className="text-red-200 text-sm">{application.personalInfo?.email || '(이메일 없음)'}</p>
                    <p className="text-red-300 text-xs">UID: {application.applicantUid || '(없음)'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                  {getStatusText(application.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-red-200">
                  <FaGraduationCap className="w-4 h-4" />
                  <span className="text-sm">{application.personalInfo?.education || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-red-200">
                  <FaCertificate className="w-4 h-4" />
                  <span className="text-sm">-</span>
                </div>
                <div className="text-sm text-red-200">
                  경력: {application.personalInfo?.experience ?? 0}년
                </div>
                <div className="text-sm text-red-200">
                  전문분야: {(application.personalInfo?.specialization || []).join(', ')}
                </div>
                <div className="text-sm text-red-200">
                  신청일: {new Date(application.appliedDate).toLocaleDateString('ko-KR')}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-red-300 mb-1">첨부 문서</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(application.documents || {}).flatMap(([k, v]) => {
                    if (!v) return [];
                    if (Array.isArray(v)) return v.map((x, idx) => ({ key: `${k}-${idx}`, label: String(x) }));
                    return [{ key: k, label: String(v) }];
                  }).map(({ key, label }) => (
                    <span key={key} className="px-2 py-1 bg-white/10 rounded text-xs text-red-200">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-red-300 mb-1">신청자 메모</div>
                <p className="text-sm text-red-200 line-clamp-2">{application.notes}</p>
              </div>

              {application.reviewNotes && (
                <div className="mb-4">
                  <div className="text-sm text-red-300 mb-1">검토 메모</div>
                  <p className="text-sm text-red-200 line-clamp-2">{application.reviewNotes}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openModal(application)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FaEye className="w-4 h-4" />
                  상세보기
                </button>
                {application.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(application)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <FaCheck className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(application)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <FaTimes className="w-4 h-4" />
                      거부
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredApplications.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <FaUserCheck className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">인증 신청이 없습니다</h3>
            <p className="text-red-200 mb-4">검색 조건에 맞는 상담사 인증 신청이 없습니다.</p>
          </motion.div>
        )}

        {/* 상담사 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">안내</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-red-300 hover:text-white transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="text-white/80 space-y-3">
                <p className="text-sm">
                  상담사는 <span className="text-white font-semibold">사용자 “상담사 지원 신청”</span>을 통해 신청하고,
                  관리자가 이 화면에서 <span className="text-white font-semibold">승인/반려</span>하는 프로세스로 운영됩니다.
                </p>
                <p className="text-sm">
                  수동으로 상담사를 “추가”하는 기능은 운영 혼선을 막기 위해 비활성화되어 있습니다.
                </p>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상세보기 모달 */}
        {showModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">상담사 인증 상세 정보</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-red-300 hover:text-white transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-red-300 text-sm">이름</label>
                    <p className="text-white">{selectedApplication.personalInfo?.name || '(이름 없음)'}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">이메일</label>
                    <p className="text-white">{selectedApplication.personalInfo?.email || '(이메일 없음)'}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">전화번호</label>
                    <p className="text-white">{selectedApplication.personalInfo?.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">신청자 UID</label>
                    <p className="text-white">{selectedApplication.applicantUid || '-'}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">신청일</label>
                    <p className="text-white">{selectedApplication.appliedDate ? new Date(selectedApplication.appliedDate).toLocaleDateString('ko-KR') : '-'}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">경력</label>
                    <p className="text-white">{selectedApplication.personalInfo?.experience ?? 0}년</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">학력</label>
                  <p className="text-white">{selectedApplication.personalInfo?.education || '-'}</p>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">전문분야</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(selectedApplication.personalInfo?.specialization || []).map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-500/20 rounded text-sm text-red-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">첨부 문서</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(selectedApplication.documents || {}).flatMap(([k, v]) => {
                      if (!v) return [];
                      if (Array.isArray(v)) return v.map((x, idx) => ({ key: `${k}-${idx}`, label: String(x) }));
                      return [{ key: k, label: String(v) }];
                    }).map(({ key, label }) => (
                      <span key={key} className="px-2 py-1 bg-white/10 rounded text-sm text-red-200">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">신청자 메모</label>
                  <p className="text-white mt-1">{selectedApplication.notes}</p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedApplication);
                        setShowModal(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaCheck className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApplication);
                        setShowModal(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaTimes className="w-4 h-4" />
                      거부
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CounselorVerificationPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <CounselorVerificationPageContent />
    </RoleGuard>
  );
}
