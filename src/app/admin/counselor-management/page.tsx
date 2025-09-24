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

interface CounselorApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  institution: string;
  experience: number;
  specialization: string[];
  education: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedDate: string;
  documents: string[];
  notes: string;
  reviewNotes?: string;
}

// 샘플 데이터
const sampleApplications: CounselorApplication[] = [
  {
    id: '1',
    name: '김상담',
    email: 'counselor1@example.com',
    phone: '010-1234-5678',
    licenseNumber: 'PSY-2024-001',
    institution: '한국심리상담협회',
    experience: 5,
    specialization: ['우울증', '불안장애', '관계상담'],
    education: '서울대학교 심리학과 석사',
    status: 'pending',
    appliedDate: '2024-01-20',
    documents: ['자격증.pdf', '경력증명서.pdf', '학위증명서.pdf'],
    notes: '5년간의 상담 경험을 보유하고 있으며, 다양한 연령대의 내담자와 상담한 경험이 있습니다.'
  },
  {
    id: '2',
    name: '이치료',
    email: 'counselor2@example.com',
    phone: '010-2345-6789',
    licenseNumber: 'PSY-2024-002',
    institution: '한국상담심리학회',
    experience: 3,
    specialization: ['가족상담', '부부상담', '청소년상담'],
    education: '연세대학교 상담심리학과 석사',
    status: 'pending',
    appliedDate: '2024-01-18',
    documents: ['자격증.pdf', '경력증명서.pdf'],
    notes: '가족상담 전문가로서 다양한 가족 문제 해결에 경험이 있습니다.'
  },
  {
    id: '3',
    name: '박심리',
    email: 'counselor3@example.com',
    phone: '010-3456-7890',
    licenseNumber: 'PSY-2024-003',
    institution: '한국임상심리학회',
    experience: 8,
    specialization: ['트라우마', 'PTSD', '인지행동치료'],
    education: '고려대학교 임상심리학과 박사',
    status: 'approved',
    appliedDate: '2024-01-15',
    documents: ['자격증.pdf', '경력증명서.pdf', '학위증명서.pdf', '추천서.pdf'],
    notes: '트라우마 전문가로서 많은 임상 경험을 보유하고 있습니다.',
    reviewNotes: '우수한 자격과 경험을 보유하고 있어 승인합니다.'
  },
  {
    id: '4',
    name: '최상담',
    email: 'counselor4@example.com',
    phone: '010-4567-8901',
    licenseNumber: 'PSY-2024-004',
    institution: '한국심리상담협회',
    experience: 1,
    specialization: ['일반상담'],
    education: '이화여자대학교 심리학과 학사',
    status: 'rejected',
    appliedDate: '2024-01-10',
    documents: ['자격증.pdf'],
    notes: '신규 상담사로서 경험이 부족합니다.',
    reviewNotes: '상담 경험이 부족하여 현재로서는 승인하기 어렵습니다. 추가 경험 후 재신청 바랍니다.'
  }
];

function CounselorManagementPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'verification' | 'profiles' | 'activity'>('verification');
  const [applications, setApplications] = useState<CounselorApplication[]>(sampleApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedApplication, setSelectedApplication] = useState<CounselorApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingApplication, setEditingApplication] = useState<CounselorApplication | null>(null);
  const [newApplication, setNewApplication] = useState<Partial<CounselorApplication>>({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    institution: '',
    experience: 0,
    specialization: [],
    education: '',
    status: 'pending',
    appliedDate: new Date().toISOString().split('T')[0],
    documents: [],
    notes: ''
  });

  // URL 파라미터 확인하여 자동으로 추가 모달 열기
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  // 필터링
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleApprove = (id: string) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: 'approved' as const } : app
    ));
  };

  const handleReject = (id: string) => {
    setApplications(prev => prev.map(app => 
      app.id === id ? { ...app, status: 'rejected' as const } : app
    ));
  };

  const openModal = (application: CounselorApplication) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const openAddModal = () => {
    setNewApplication({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      institution: '',
      experience: 0,
      specialization: [],
      education: '',
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      documents: [],
      notes: ''
    });
    setShowAddModal(true);
  };

  const handleAddCounselor = () => {
    if (!newApplication.name || !newApplication.email) {
      alert('이름과 이메일은 필수 입력 항목입니다.');
      return;
    }

    const counselor: CounselorApplication = {
      id: Date.now().toString(),
      name: newApplication.name!,
      email: newApplication.email!,
      phone: newApplication.phone || '',
      licenseNumber: newApplication.licenseNumber || '',
      institution: newApplication.institution || '',
      experience: newApplication.experience || 0,
      specialization: newApplication.specialization || [],
      education: newApplication.education || '',
      status: newApplication.status || 'pending',
      appliedDate: newApplication.appliedDate || new Date().toISOString().split('T')[0],
      documents: newApplication.documents || [],
      notes: newApplication.notes || ''
    };

    setApplications(prev => [counselor, ...prev]);
    setShowAddModal(false);
    setNewApplication({
      name: '',
      email: '',
      phone: '',
      licenseNumber: '',
      institution: '',
      experience: 0,
      specialization: [],
      education: '',
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      documents: [],
      notes: ''
    });
  };

  const handleSpecializationChange = (value: string) => {
    const specializations = value.split(',').map(s => s.trim()).filter(s => s);
    setNewApplication(prev => ({ ...prev, specialization: specializations }));
  };

  const handleDocumentsChange = (value: string) => {
    const documents = value.split(',').map(d => d.trim()).filter(d => d);
    setNewApplication(prev => ({ ...prev, documents }));
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
                상담사 관리
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
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                <FaPlus className="w-4 h-4" />
                상담사 추가
              </button>
            </div>
          </div>
        </motion.div>

        {/* 탭 네비게이션 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-700/50">
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'verification'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FaUserCheck className="w-5 h-5" />
              상담사 인증 관리
            </button>
            <button
              onClick={() => setActiveTab('profiles')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'profiles'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FaEdit className="w-5 h-5" />
              프로필 관리
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'activity'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <FaFileAlt className="w-5 h-5" />
              활동 현황
            </button>
          </div>
        </motion.div>

        {/* 탭별 콘텐츠 */}
        {activeTab === 'verification' && (
          <>
            {/* 인증 관리 탭 */}
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
                placeholder="이름, 이메일, 자격증 번호로 검색..."
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
                    {application.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{application.name}</h3>
                    <p className="text-red-200 text-sm">{application.email}</p>
                    <p className="text-red-300 text-xs">{application.licenseNumber}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.status)}`}>
                  {getStatusText(application.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-red-200">
                  <FaGraduationCap className="w-4 h-4" />
                  <span className="text-sm">{application.education}</span>
                </div>
                <div className="flex items-center gap-2 text-red-200">
                  <FaCertificate className="w-4 h-4" />
                  <span className="text-sm">{application.institution}</span>
                </div>
                <div className="text-sm text-red-200">
                  경력: {application.experience}년
                </div>
                <div className="text-sm text-red-200">
                  전문분야: {application.specialization.join(', ')}
                </div>
                <div className="text-sm text-red-200">
                  신청일: {new Date(application.appliedDate).toLocaleDateString('ko-KR')}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm text-red-300 mb-1">첨부 문서</div>
                <div className="flex flex-wrap gap-1">
                  {application.documents.map((doc, idx) => (
                    <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs text-red-200">
                      {doc}
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
                      onClick={() => handleApprove(application.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <FaCheck className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(application.id)}
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
                <h3 className="text-2xl font-bold text-white">상담사 수동 추가</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-red-300 hover:text-white transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-red-300 text-sm font-medium">이름 *</label>
                    <input
                      type="text"
                      value={newApplication.name || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="상담사 이름"
                    />
                  </div>
                  <div>
                    <label className="text-red-300 text-sm font-medium">이메일 *</label>
                    <input
                      type="email"
                      value={newApplication.email || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="이메일 주소"
                    />
                  </div>
                  <div>
                    <label className="text-red-300 text-sm font-medium">전화번호</label>
                    <input
                      type="tel"
                      value={newApplication.phone || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="text-red-300 text-sm font-medium">자격증 번호</label>
                    <input
                      type="text"
                      value={newApplication.licenseNumber || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="PSY-2024-001"
                    />
                  </div>
                  <div>
                    <label className="text-red-300 text-sm font-medium">소속 기관</label>
                    <input
                      type="text"
                      value={newApplication.institution || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="한국심리상담협회"
                    />
                  </div>
                  <div>
                    <label className="text-red-300 text-sm font-medium">경력 (년)</label>
                    <input
                      type="number"
                      value={newApplication.experience || 0}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm font-medium">학력</label>
                  <input
                    type="text"
                    value={newApplication.education || ''}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, education: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="서울대학교 심리학과 석사"
                  />
                </div>
                
                <div>
                  <label className="text-red-300 text-sm font-medium">전문분야 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newApplication.specialization?.join(', ') || ''}
                    onChange={(e) => handleSpecializationChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="우울증, 불안장애, 관계상담"
                  />
                </div>
                
                <div>
                  <label className="text-red-300 text-sm font-medium">첨부 문서 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newApplication.documents?.join(', ') || ''}
                    onChange={(e) => handleDocumentsChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="자격증.pdf, 경력증명서.pdf, 학위증명서.pdf"
                  />
                </div>
                
                <div>
                  <label className="text-red-300 text-sm font-medium">메모</label>
                  <textarea
                    value={newApplication.notes || ''}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="상담사에 대한 추가 정보나 메모"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-red-300 text-sm font-medium">상태</label>
                  <select
                    value={newApplication.status || 'pending'}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="pending" className="bg-gray-800">검토 중</option>
                    <option value="approved" className="bg-gray-800">승인됨</option>
                    <option value="rejected" className="bg-gray-800">거부됨</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleAddCounselor}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaSave className="w-4 h-4" />
                  상담사 추가
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  취소
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
                    <p className="text-white">{selectedApplication.name}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">이메일</label>
                    <p className="text-white">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">전화번호</label>
                    <p className="text-white">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">자격증 번호</label>
                    <p className="text-white">{selectedApplication.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">소속 기관</label>
                    <p className="text-white">{selectedApplication.institution}</p>
                  </div>
                  <div>
                    <label className="text-red-300 text-sm">경력</label>
                    <p className="text-white">{selectedApplication.experience}년</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">학력</label>
                  <p className="text-white">{selectedApplication.education}</p>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">전문분야</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.specialization.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-500/20 rounded text-sm text-red-200">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-red-300 text-sm">첨부 문서</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.documents.map((doc, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white/10 rounded text-sm text-red-200">
                        {doc}
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
                        handleApprove(selectedApplication.id);
                        setShowModal(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaCheck className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedApplication.id);
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
        </>
        )}

        {/* 프로필 관리 탭 */}
        {activeTab === 'profiles' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20"
          >
            <div className="text-center">
              <FaEdit className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">상담사 프로필 관리</h3>
              <p className="text-gray-300 mb-6">승인된 상담사들의 프로필 정보를 관리하고 업데이트할 수 있습니다.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications
                  .filter(app => app.status === 'approved')
                  .map((counselor) => (
                    <div key={counselor.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{counselor.name[0]}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{counselor.name}</h4>
                          <p className="text-gray-400 text-sm">{counselor.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <span className="text-blue-400">전문분야:</span> {counselor.specialization.join(', ')}
                        </p>
                        <p className="text-gray-300">
                          <span className="text-blue-400">경력:</span> {counselor.experience}년
                        </p>
                        <p className="text-gray-300">
                          <span className="text-blue-400">소속:</span> {counselor.institution}
                        </p>
                      </div>
                      <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                        프로필 편집
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* 활동 현황 탭 */}
        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20"
          >
            <div className="text-center">
              <FaFileAlt className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">상담사 활동 현황</h3>
              <p className="text-gray-300 mb-6">상담사들의 상담 활동, 성과 지표, 피드백 등을 확인할 수 있습니다.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-green-500/20 rounded-lg p-6 border border-green-500/30">
                  <div className="text-3xl font-bold text-green-400">
                    {applications.filter(app => app.status === 'approved').length}
                  </div>
                  <div className="text-green-300 text-sm mt-1">활성 상담사</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-6 border border-blue-500/30">
                  <div className="text-3xl font-bold text-blue-400">248</div>
                  <div className="text-blue-300 text-sm mt-1">이번 달 상담 세션</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-6 border border-purple-500/30">
                  <div className="text-3xl font-bold text-purple-400">4.8</div>
                  <div className="text-purple-300 text-sm mt-1">평균 만족도</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-6 border border-yellow-500/30">
                  <div className="text-3xl font-bold text-yellow-400">156</div>
                  <div className="text-yellow-300 text-sm mt-1">완료된 치료</div>
                </div>
              </div>

              <div className="text-left">
                <h4 className="text-xl font-semibold text-white mb-4">최근 활동 로그</h4>
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-white">김상담 - 새로운 상담 세션 완료</span>
                      <span className="text-gray-400 text-sm">2시간 전</span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-white">이치료 - 치료 계획 업데이트</span>
                      <span className="text-gray-400 text-sm">4시간 전</span>
                    </div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex justify-between items-center">
                      <span className="text-white">박심리 - 내담자 평가 완료</span>
                      <span className="text-gray-400 text-sm">6시간 전</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function CounselorManagementPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <CounselorManagementPageContent />
    </RoleGuard>
  );
}
