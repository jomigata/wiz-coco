"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUserCheck, FaSearch, FaCheck, FaTimes, FaEye, FaFileAlt, FaGraduationCap, FaCertificate, FaPlus, FaSave, FaEdit } from 'react-icons/fa';
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


  const pendingCount = applications.filter((app) => app.status === 'pending').length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 text-slate-100">
      <motion.div
        className="flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('verification')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
              activeTab === 'verification'
                ? 'bg-sky-600/90 text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FaUserCheck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            인증 관리
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
              activeTab === 'profiles'
                ? 'bg-sky-600/90 text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FaEdit className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            프로필
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
              activeTab === 'activity'
                ? 'bg-sky-600/90 text-white shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <FaFileAlt className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            활동
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500">
            대기 <span className="font-semibold text-amber-200/95">{pendingCount}</span>
          </span>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 sm:text-sm"
          >
            <FaPlus className="h-3.5 w-3.5" />
            추가
          </button>
        </div>
      </motion.div>

      {activeTab === 'verification' && (
        <>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="이름 · 이메일 · 자격증 번호"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/[0.06] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 sm:text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="w-full shrink-0 rounded-md border border-white/10 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/50 sm:w-36 sm:text-sm"
            >
              <option value="all" className="bg-slate-900">
                전체 상태
              </option>
              <option value="pending" className="bg-slate-900">
                검토 중
              </option>
              <option value="approved" className="bg-slate-900">
                승인됨
              </option>
              <option value="rejected" className="bg-slate-900">
                거부됨
              </option>
            </select>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {filteredApplications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] py-10 text-center">
                <FaUserCheck className="mb-2 h-10 w-10 text-slate-600" />
                <p className="text-sm text-slate-300">조건에 맞는 인증 신청이 없습니다.</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto pr-0.5">
                <div className="grid grid-cols-1 gap-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {filteredApplications.map((application, index) => (
                    <motion.div
                      key={application.id}
                      className="rounded-lg border border-white/10 bg-white/[0.05] p-3 transition-colors hover:border-white/20"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(0.04 * index, 0.24), duration: 0.25 }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-indigo-700 text-sm font-semibold text-white">
                            {application.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-white">{application.name}</h3>
                            <p className="truncate text-[11px] text-slate-400">{application.email}</p>
                            <p className="truncate font-mono text-[10px] text-slate-500">{application.licenseNumber}</p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(application.status)}`}
                        >
                          {getStatusText(application.status)}
                        </span>
                      </div>

                      <div className="mb-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                        <div className="col-span-2 flex min-w-0 items-start gap-1">
                          <FaGraduationCap className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                          <span className="line-clamp-2">{application.education}</span>
                        </div>
                        <div className="col-span-2 flex min-w-0 items-start gap-1">
                          <FaCertificate className="mt-0.5 h-3 w-3 shrink-0 text-slate-500" />
                          <span className="line-clamp-1">{application.institution}</span>
                        </div>
                        <span>경력 {application.experience}년</span>
                        <span className="text-right">
                          {new Date(application.appliedDate).toLocaleDateString('ko-KR')}
                        </span>
                        <div className="col-span-2 line-clamp-1 text-slate-500">
                          분야: {application.specialization.join(', ')}
                        </div>
                      </div>

                      <div className="mb-2 flex flex-wrap gap-1">
                        {application.documents.slice(0, 4).map((doc, idx) => (
                          <span
                            key={idx}
                            className="max-w-[7rem] truncate rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-slate-300"
                          >
                            {doc}
                          </span>
                        ))}
                        {application.documents.length > 4 ? (
                          <span className="text-[10px] text-slate-500">+{application.documents.length - 4}</span>
                        ) : null}
                      </div>

                      <p className="mb-2 line-clamp-1 text-[11px] text-slate-500" title={application.notes}>
                        메모: {application.notes}
                      </p>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openModal(application)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-sky-700/70 py-1.5 text-[11px] font-medium text-white hover:bg-sky-600/80"
                        >
                          <FaEye className="h-3 w-3" />
                          상세
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(application.id)}
                              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-700/80 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-600/90"
                            >
                              <FaCheck className="h-3 w-3" />
                              승인
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(application.id)}
                              className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-rose-800/80 py-1.5 text-[11px] font-medium text-white hover:bg-rose-700/90"
                            >
                              <FaTimes className="h-3 w-3" />
                              거부
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

        {/* 상담사 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4">
            <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    <label className="text-slate-300 text-sm font-medium">이름 *</label>
                    <input
                      type="text"
                      value={newApplication.name || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="상담사 이름"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium">이메일 *</label>
                    <input
                      type="email"
                      value={newApplication.email || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="이메일 주소"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium">전화번호</label>
                    <input
                      type="tel"
                      value={newApplication.phone || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium">자격증 번호</label>
                    <input
                      type="text"
                      value={newApplication.licenseNumber || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="PSY-2024-001"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium">소속 기관</label>
                    <input
                      type="text"
                      value={newApplication.institution || ''}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="한국심리상담협회"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium">경력 (년)</label>
                    <input
                      type="number"
                      value={newApplication.experience || 0}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm font-medium">학력</label>
                  <input
                    type="text"
                    value={newApplication.education || ''}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, education: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="서울대학교 심리학과 석사"
                  />
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm font-medium">전문분야 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newApplication.specialization?.join(', ') || ''}
                    onChange={(e) => handleSpecializationChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="우울증, 불안장애, 관계상담"
                  />
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm font-medium">첨부 문서 (쉼표로 구분)</label>
                  <input
                    type="text"
                    value={newApplication.documents?.join(', ') || ''}
                    onChange={(e) => handleDocumentsChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="자격증.pdf, 경력증명서.pdf, 학위증명서.pdf"
                  />
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm font-medium">메모</label>
                  <textarea
                    value={newApplication.notes || ''}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="상담사에 대한 추가 정보나 메모"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-slate-300 text-sm font-medium">상태</label>
                  <select
                    value={newApplication.status || 'pending'}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4">
            <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                    <label className="text-slate-300 text-sm">이름</label>
                    <p className="text-white">{selectedApplication.name}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">이메일</label>
                    <p className="text-white">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">전화번호</label>
                    <p className="text-white">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">자격증 번호</label>
                    <p className="text-white">{selectedApplication.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">소속 기관</label>
                    <p className="text-white">{selectedApplication.institution}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">경력</label>
                    <p className="text-white">{selectedApplication.experience}년</p>
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm">학력</label>
                  <p className="text-white">{selectedApplication.education}</p>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm">전문분야</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.specialization.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-100">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm">첨부 문서</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.documents.map((doc, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-100">
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm">신청자 메모</label>
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

        {/* 프로필 관리 탭 */}
        {activeTab === 'profiles' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
          >
            <div className="border-b border-white/10 px-3 py-2">
              <h3 className="text-sm font-semibold text-white">승인된 상담사 프로필</h3>
              <p className="text-[11px] text-slate-500">카드에서 바로 편집을 시작할 수 있습니다.</p>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {applications
                  .filter((app) => app.status === 'approved')
                  .map((counselor) => (
                    <div
                      key={counselor.id}
                      className="rounded-lg border border-white/10 bg-slate-900/40 p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-indigo-700 text-sm font-bold text-white">
                          {counselor.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold text-white">{counselor.name}</h4>
                          <p className="truncate text-[11px] text-slate-400">{counselor.email}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-400">
                        <p className="line-clamp-2">
                          <span className="text-slate-500">분야</span> {counselor.specialization.join(', ')}
                        </p>
                        <p>
                          <span className="text-slate-500">경력</span> {counselor.experience}년 · {counselor.institution}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-2 w-full rounded-md bg-sky-700/70 py-1.5 text-[11px] font-medium text-white hover:bg-sky-600/80"
                      >
                        편집
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]"
          >
            <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-white/10 p-2 sm:grid-cols-4">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-emerald-300">
                  {applications.filter((app) => app.status === 'approved').length}
                </div>
                <div className="text-[10px] text-emerald-400/80">활성 상담사</div>
              </div>
              <div className="rounded-md border border-sky-500/20 bg-sky-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-sky-300">248</div>
                <div className="text-[10px] text-sky-400/80">월간 세션</div>
              </div>
              <div className="rounded-md border border-violet-500/20 bg-violet-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-violet-300">4.8</div>
                <div className="text-[10px] text-violet-400/80">만족도</div>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-amber-300">156</div>
                <div className="text-[10px] text-amber-400/80">완료 치료</div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-3">
              <h4 className="mb-2 text-xs font-semibold text-slate-300">최근 활동</h4>
              <div className="space-y-1.5">
                {[
                  ['김상담', '새 상담 세션 완료', '2시간 전'],
                  ['이치료', '치료 계획 업데이트', '4시간 전'],
                  ['박심리', '내담자 평가 완료', '6시간 전'],
                ].map(([name, action, time], i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-slate-900/40 px-2 py-1.5 text-[11px]"
                  >
                    <span className="truncate text-slate-200">
                      {name} — {action}
                    </span>
                    <span className="shrink-0 text-slate-500">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
    </div>
  );
}

export default function CounselorManagementPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <CounselorManagementPageContent />
      </div>
    </RoleGuard>
  );
}
