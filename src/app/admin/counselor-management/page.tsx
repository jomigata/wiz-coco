"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUserCheck, FaSearch, FaCheck, FaTimes, FaEye, FaFileAlt, FaPlus, FaSave, FaEdit } from 'react-icons/fa';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // URL 파라미터 확인하여 자동으로 추가 모달 열기
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, statusFilter, activeTab]);

  // 필터링
  const filteredApplications = applications
    .filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const blob = [
        app.name,
        app.email,
        app.licenseNumber,
        app.institution,
        app.education,
        app.specialization.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !q || blob.includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());

  const getStatusBadgeClass = (status: CounselorApplication['status']) => {
    switch (status) {
      case 'pending':
        return 'border border-amber-500/30 bg-amber-500/10 text-amber-100';
      case 'approved':
        return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
      case 'rejected':
        return 'border border-rose-500/30 bg-rose-500/10 text-rose-100';
      default:
        return 'border border-white/15 bg-white/5 text-slate-300';
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
  const approvedForProfile = applications.filter((a) => a.status === 'approved').length;

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    if (selectedIds.length === filteredApplications.length && filteredApplications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplications.map((a) => a.id));
    }
  };

  const selectedPendingCount = selectedIds.filter((id) => {
    const row = applications.find((a) => a.id === id);
    return row?.status === 'pending';
  }).length;

  const handleBulkApprove = () => {
    const ids = selectedIds.filter((id) => applications.find((a) => a.id === id)?.status === 'pending');
    if (ids.length === 0) return;
    setApplications((prev) =>
      prev.map((app) => (ids.includes(app.id) ? { ...app, status: 'approved' as const } : app)),
    );
    setSelectedIds([]);
  };

  const handleBulkReject = () => {
    const ids = selectedIds.filter((id) => applications.find((a) => a.id === id)?.status === 'pending');
    if (ids.length === 0) return;
    setApplications((prev) =>
      prev.map((app) => (ids.includes(app.id) ? { ...app, status: 'rejected' as const } : app)),
    );
    setSelectedIds([]);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 text-slate-100">
      <motion.div
        className="mb-1 shrink-0 rounded-lg border border-sky-500/20 bg-sky-950/25 px-3 py-2"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-snug text-slate-300 sm:text-xs">
            검토 대기 <span className="font-semibold text-amber-200/95">{pendingCount}</span>건 · 자격·학력 서류를
            확인한 뒤 승인 또는 거부를 선택하세요.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="shrink-0 self-start rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 sm:self-auto"
          >
            상담사 추가
          </button>
        </div>
      </motion.div>

      <motion.div
        className="mb-2 flex shrink-0 flex-wrap gap-x-1 gap-y-0 border-b border-white/10"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'verification'
              ? 'border border-b-0 border-white/15 bg-white/10 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          인증 관리 ({applications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profiles')}
          className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'profiles'
              ? 'border border-b-0 border-white/15 bg-white/10 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          프로필 ({approvedForProfile})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'activity'
              ? 'border border-b-0 border-white/15 bg-white/10 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          활동 현황
        </button>
      </motion.div>

      {activeTab === 'verification' && (
        <motion.div
          className="flex min-h-0 flex-1 flex-col bg-white/[0.06] p-3 sm:p-4 rounded-lg border border-white/10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-sm font-semibold text-slate-100 sm:shrink-0">
              인증 신청{' '}
              <span className="font-normal text-slate-500">({filteredApplications.length})</span>
            </h2>
            <div className="relative min-w-0 flex-1">
              <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="이름 · 이메일 · 자격증 · 소속 · 학력 · 분야 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/[0.06] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/50 sm:text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="rounded-md border border-white/10 bg-slate-900/80 px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/50 sm:text-sm"
              >
                <option value="all" className="bg-slate-900">전체</option>
                <option value="pending" className="bg-slate-900">검토 중</option>
                <option value="approved" className="bg-slate-900">승인됨</option>
                <option value="rejected" className="bg-slate-900">거부됨</option>
              </select>
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={selectedPendingCount === 0}
                className="rounded-md border border-emerald-500/30 bg-emerald-800/40 px-2.5 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-700/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                선택 승인 ({selectedPendingCount})
              </button>
              <button
                type="button"
                onClick={handleBulkReject}
                disabled={selectedPendingCount === 0}
                className="rounded-md border border-rose-500/30 bg-rose-900/40 px-2.5 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-800/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                선택 거부 ({selectedPendingCount})
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-white/10">
            {filteredApplications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <FaUserCheck className="mb-2 h-10 w-10 text-slate-600" />
                <p className="text-sm text-slate-400">조건에 맞는 인증 신청이 없습니다.</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-white/10 text-xs">
                  <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                    <tr>
                      <th scope="col" className="w-10 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredApplications.length > 0 &&
                            selectedIds.length === filteredApplications.length
                          }
                          onChange={toggleSelectAllFiltered}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-white/30 bg-transparent text-sky-400 focus:ring-sky-400/50"
                        />
                      </th>
                      <th scope="col" className="whitespace-nowrap px-2 py-2 text-left font-medium text-slate-400">
                        신청일
                      </th>
                      <th scope="col" className="px-2 py-2 text-left font-medium text-slate-400">
                        이름
                      </th>
                      <th scope="col" className="min-w-[8rem] px-2 py-2 text-left font-medium text-slate-400">
                        이메일
                      </th>
                      <th scope="col" className="min-w-[6rem] px-2 py-2 text-left font-medium text-slate-400">
                        자격증 번호
                      </th>
                      <th scope="col" className="hidden min-w-[6rem] px-2 py-2 text-left font-medium text-slate-400 lg:table-cell">
                        소속
                      </th>
                      <th scope="col" className="hidden min-w-[7rem] px-2 py-2 text-left font-medium text-slate-400 xl:table-cell">
                        학력
                      </th>
                      <th scope="col" className="hidden px-2 py-2 text-left font-medium text-slate-400 md:table-cell">
                        전문분야
                      </th>
                      <th scope="col" className="whitespace-nowrap px-2 py-2 text-center font-medium text-slate-400">
                        상태
                      </th>
                      <th scope="col" className="whitespace-nowrap px-2 py-2 text-center font-medium text-slate-400">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredApplications.map((application) => (
                      <tr key={application.id} className="hover:bg-white/[0.04]">
                        <td className="whitespace-nowrap px-2 py-1.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(application.id)}
                            onChange={() => toggleSelectRow(application.id)}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-white/30 bg-transparent text-sky-400 focus:ring-sky-400/50"
                          />
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-left text-slate-300">
                          {new Date(application.appliedDate).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="max-w-[6rem] truncate px-2 py-1.5 text-left font-medium text-white">
                          {application.name}
                        </td>
                        <td className="max-w-[10rem] truncate px-2 py-1.5 text-left text-slate-300" title={application.email}>
                          {application.email}
                        </td>
                        <td className="max-w-[8rem] truncate px-2 py-1.5 text-left font-mono text-[11px] text-slate-400" title={application.licenseNumber}>
                          {application.licenseNumber}
                        </td>
                        <td className="hidden max-w-[8rem] truncate px-2 py-1.5 text-left text-slate-400 lg:table-cell" title={application.institution}>
                          {application.institution}
                        </td>
                        <td className="hidden max-w-[10rem] truncate px-2 py-1.5 text-left text-slate-400 xl:table-cell" title={application.education}>
                          {application.education}
                        </td>
                        <td className="hidden max-w-[10rem] truncate px-2 py-1.5 text-left text-slate-500 md:table-cell" title={application.specialization.join(', ')}>
                          {application.specialization.join(', ')}
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusBadgeClass(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openModal(application)}
                              className="rounded bg-sky-800/50 px-2 py-0.5 text-[11px] font-medium text-sky-100 hover:bg-sky-700/60"
                            >
                              상세
                            </button>
                            {application.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(application.id)}
                                  className="rounded bg-emerald-800/50 px-2 py-0.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-700/60"
                                >
                                  승인
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(application.id)}
                                  className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:bg-white/15"
                                >
                                  거부
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-2 shrink-0 text-[11px] text-slate-500">총 {filteredApplications.length}건</div>
        </motion.div>
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
            className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-white/[0.06] p-3 sm:p-4"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                승인 프로필{' '}
                <span className="font-normal text-slate-500">({approvedForProfile})</span>
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-white/10">
              {approvedForProfile === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-slate-400">
                  승인된 상담사가 없습니다.
                </div>
              ) : (
                <div className="max-h-[min(60vh,32rem)] overflow-auto lg:max-h-none">
                  <table className="min-w-full divide-y divide-white/10 text-xs">
                    <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                      <tr>
                        <th className="px-2 py-2 text-left font-medium text-slate-400">이름</th>
                        <th className="min-w-[8rem] px-2 py-2 text-left font-medium text-slate-400">이메일</th>
                        <th className="hidden px-2 py-2 text-left font-medium text-slate-400 sm:table-cell">소속</th>
                        <th className="hidden px-2 py-2 text-left font-medium text-slate-400 md:table-cell">전문분야</th>
                        <th className="whitespace-nowrap px-2 py-2 text-left font-medium text-slate-400">경력</th>
                        <th className="px-2 py-2 text-center font-medium text-slate-400">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {applications
                        .filter((app) => app.status === 'approved')
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.04]">
                            <td className="max-w-[6rem] truncate px-2 py-1.5 text-left font-medium text-white">{c.name}</td>
                            <td className="max-w-[12rem] truncate px-2 py-1.5 text-left text-slate-300" title={c.email}>
                              {c.email}
                            </td>
                            <td className="hidden max-w-[10rem] truncate px-2 py-1.5 text-left text-slate-400 sm:table-cell" title={c.institution}>
                              {c.institution}
                            </td>
                            <td className="hidden max-w-[12rem] truncate px-2 py-1.5 text-left text-slate-500 md:table-cell" title={c.specialization.join(', ')}>
                              {c.specialization.join(', ')}
                            </td>
                            <td className="whitespace-nowrap px-2 py-1.5 text-left text-slate-400">{c.experience}년</td>
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                className="rounded bg-sky-800/50 px-2 py-0.5 text-[11px] font-medium text-sky-100 hover:bg-sky-700/60"
                              >
                                편집
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">총 {approvedForProfile}명</div>
          </motion.div>
        )}

        {/* 활동 현황 탭 */}
        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/10 bg-white/[0.06] p-3 sm:p-4"
          >
            <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
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

            <h2 className="mb-2 text-sm font-semibold text-slate-100">최근 활동</h2>
            <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-white/10">
              <div className="max-h-[min(50vh,24rem)] overflow-auto lg:max-h-none">
                <table className="min-w-full divide-y divide-white/10 text-xs">
                  <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-slate-400">상담사</th>
                      <th className="min-w-[10rem] px-2 py-2 text-left font-medium text-slate-400">내용</th>
                      <th className="whitespace-nowrap px-2 py-2 text-right font-medium text-slate-400">시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {[
                      ['김상담', '새 상담 세션 완료', '2시간 전'],
                      ['이치료', '치료 계획 업데이트', '4시간 전'],
                      ['박심리', '내담자 평가 완료', '6시간 전'],
                    ].map(([name, action, time], i) => (
                      <tr key={i} className="hover:bg-white/[0.04]">
                        <td className="whitespace-nowrap px-2 py-1.5 text-left text-slate-200">{name}</td>
                        <td className="px-2 py-1.5 text-left text-slate-400">{action}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-right text-slate-500">{time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
