"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUserCheck, FaSearch, FaCheck, FaTimes, FaEye, FaPlus } from 'react-icons/fa';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import RoleGuard from '@/components/RoleGuard';
import CounselorApplicationReviewModal from '@/app/admin/components/CounselorApplicationReviewModal';
import CounselorApplicationAttachmentList from '@/app/admin/components/CounselorApplicationAttachmentList';
import SortableTableHeader, { type SortOrder } from '@/app/admin/components/SortableTableHeader';
import {
  approveCounselorApplication,
  listAllCounselorApplications,
  rejectCounselorApplication,
  type AdminCounselorApplicationRow,
} from '@/lib/firestore/counselorApplicationsStore';
import { notifyApplicantCounselorApplicationResult } from '@/lib/counselorApplicationApi';
import CounselorApplicationHistoryPanel from '@/app/admin/components/CounselorApplicationHistoryPanel';
import {
  buildApplicantSearchBlob,
  countGroupedPendingApplications,
  groupCounselorApplicationsByApplicant,
  type GroupedCounselorApplicationRow,
} from '@/lib/firestore/counselorApplicationGrouping';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';

type SortKey =
  | 'appliedDate'
  | 'name'
  | 'email'
  | 'organizationName'
  | 'region'
  | 'specialization'
  | 'experience'
  | 'status';

function sortApplications(
  list: GroupedCounselorApplicationRow[],
  sortKey: SortKey,
  order: SortOrder,
): GroupedCounselorApplicationRow[] {
  const sorted = [...list];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'appliedDate':
        cmp = new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
        break;
      case 'name':
        cmp = a.name.localeCompare(b.name, 'ko');
        break;
      case 'email':
        cmp = a.email.localeCompare(b.email, 'ko');
        break;
      case 'organizationName':
        cmp = a.organizationName.localeCompare(b.organizationName, 'ko');
        break;
      case 'region':
        cmp = a.region.localeCompare(b.region, 'ko');
        break;
      case 'specialization':
        cmp = a.specialization.join(', ').localeCompare(b.specialization.join(', '), 'ko');
        break;
      case 'experience':
        cmp = a.experience - b.experience;
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status, 'ko');
        break;
      default:
        cmp = 0;
    }
    return order === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function CounselorVerificationPageContent() {
  const searchParams = useSearchParams();
  const { user, loading } = useFirebaseAuth();
  const [applications, setApplications] = useState<AdminCounselorApplicationRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('appliedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedApplication, setSelectedApplication] = useState<GroupedCounselorApplicationRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    application: AdminCounselorApplicationRow;
    action: 'approve' | 'reject';
  } | null>(null);
  const [reviewMemo, setReviewMemo] = useState('');

  const loadApplications = useCallback(async () => {
    try {
      setLoadError('');
      setBusy(true);
      const rows = await listAllCounselorApplications();
      setApplications(rows);
    } catch (e) {
      console.error('상담사 신청 목록 로딩 오류:', e);
      setLoadError('상담사 신청 목록을 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      void loadApplications();
    }
  }, [loading, user?.uid, loadApplications]);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
    }
  }, [searchParams]);

  const handleSort = (key: string) => {
    const k = key as SortKey;
    if (sortKey === k) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortOrder(k === 'appliedDate' ? 'desc' : 'asc');
    }
  };

  const groupedApplications = useMemo(
    () => groupCounselorApplicationsByApplicant(applications),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = groupedApplications.filter((app) => {
      const blob = buildApplicantSearchBlob(app);
      const matchesSearch = !q || blob.includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return sortApplications(filtered, sortKey, sortOrder);
  }, [groupedApplications, searchQuery, statusFilter, sortKey, sortOrder]);

  const pendingCount = useMemo(
    () => countGroupedPendingApplications(applications),
    [applications],
  );

  const getStatusBadgeClass = (status: AdminCounselorApplicationRow['status']) => {
    switch (status) {
      case 'pending':
        return 'border border-amber-500/30 bg-amber-500/10 text-amber-100';
      case 'approved':
        return 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
      case 'rejected':
        return 'border border-rose-500/30 bg-rose-500/10 text-rose-100';
      default:
        return 'border border-slate-200 bg-white/5 text-slate-300';
    }
  };

  const getStatusText = (status: AdminCounselorApplicationRow['status']) => {
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

  const openReviewModal = (application: GroupedCounselorApplicationRow, action: 'approve' | 'reject') => {
    setReviewMemo('');
    setReviewTarget({ application, action });
  };

  const confirmReview = async () => {
    if (!reviewTarget || !user?.uid) return;
    const { application, action } = reviewTarget;
    try {
      setBusy(true);
      if (action === 'approve') {
        if (!application.applicantUid?.trim()) {
          alert('신청자 UID가 없어 승인할 수 없습니다.');
          return;
        }
        await approveCounselorApplication({
          applicationId: application.id,
          applicantUid: application.applicantUid,
          personalInfo: application.personalInfo,
          reviewerUid: user.uid,
          reviewNotes: reviewMemo,
        });
      } else {
        await rejectCounselorApplication({
          applicationId: application.id,
          reviewerUid: user.uid,
          reviewNotes: reviewMemo,
        });
      }
      await notifyApplicantCounselorApplicationResult({
        applicantEmail: application.email,
        applicantName: application.name,
        approved: action === 'approve',
        reviewNotes: reviewMemo,
      });
      setReviewTarget(null);
      setReviewMemo('');
      setShowModal(false);
      await loadApplications();
    } catch (e) {
      console.error('검토 처리 오류:', e);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const openModal = (application: GroupedCounselorApplicationRow) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-2 text-slate-100">
      <motion.div
        className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold text-white">상담사 인증 관리</span>
            <span className="text-slate-400">
              검토 대기 <span className="font-semibold text-amber-200">{pendingCount}</span>
              · 신청자 <span className="font-semibold text-slate-200">{groupedApplications.length}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            disabled
          >
            <FaPlus className="h-3.5 w-3.5" />
            상담사 추가
          </button>
        </div>
      </motion.div>

      {loadError && (
        <div className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <p className="text-red-200 text-sm">{loadError}</p>
        </div>
      )}

      {busy && !reviewTarget && (
        <div className="shrink-0 rounded-lg border border-slate-200 bg-white/5 p-2">
          <p className="text-white/80 text-sm">목록 갱신 중…</p>
        </div>
      )}

      <div className="shrink-0 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="이름 · 이메일 · 기관명 · 지역 · UID · 메모 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
        >
          <option value="all" className="bg-slate-900">전체 상태</option>
          <option value="pending" className="bg-slate-900">검토 중</option>
          <option value="approved" className="bg-slate-900">승인됨</option>
          <option value="rejected" className="bg-slate-900">거부됨</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
        {filteredApplications.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
            <FaUserCheck className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">조건에 맞는 인증 신청이 없습니다.</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-auto divide-y divide-white/10 text-sm">
                <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                  <tr>
                    <SortableTableHeader
                      label="신청일"
                      sortKey="appliedDate"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="whitespace-nowrap px-2 py-2"
                    />
                    <SortableTableHeader
                      label="이름"
                      sortKey="name"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="whitespace-nowrap px-2 py-2"
                    />
                    <th scope="col" className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-400">
                      신청
                    </th>
                    <SortableTableHeader
                      label="이메일"
                      sortKey="email"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="min-w-[10rem] px-2 py-2"
                    />
                    <SortableTableHeader
                      label="기관명/회사명"
                      sortKey="organizationName"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="min-w-[7rem] px-2 py-2"
                    />
                    <SortableTableHeader
                      label="지역"
                      sortKey="region"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="whitespace-nowrap px-2 py-2"
                    />
                    <SortableTableHeader
                      label="전문분야"
                      sortKey="specialization"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="min-w-[8rem] px-2 py-2"
                    />
                    <SortableTableHeader
                      label="경력"
                      sortKey="experience"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="whitespace-nowrap px-2 py-2"
                      align="center"
                    />
                    <SortableTableHeader
                      label="상태"
                      sortKey="status"
                      activeKey={sortKey}
                      order={sortOrder}
                      onSort={handleSort}
                      className="whitespace-nowrap px-2 py-2"
                      align="center"
                    />
                    <th scope="col" className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-400">
                      첨부
                    </th>
                    <th scope="col" className="min-w-[8rem] px-2 py-2 text-center text-xs font-medium text-slate-400">
                      검토 메모
                    </th>
                    <th scope="col" className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-400">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                    {filteredApplications.map((application) => (
                      <tr key={`${application.applicantUid}-${application.id}`} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-2 py-2 text-slate-200">
                        {application.appliedDate
                          ? new Date(application.appliedDate).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 font-medium text-white">
                        {application.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-center text-slate-400">
                        {application.applicationCount > 1 ? (
                          <span
                            className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-200"
                            title={`총 ${application.applicationCount}회 신청`}
                          >
                            {application.applicationCount}
                          </span>
                        ) : (
                          '1'
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-200" title={application.email}>
                        {application.email || '-'}
                      </td>
                      <td className="px-2 py-2 text-slate-300" title={application.organizationName}>
                        {application.organizationName || '-'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-slate-300">
                        {application.region || '-'}
                      </td>
                      <td className="px-2 py-2 text-slate-300" title={application.specialization.join(', ')}>
                        {application.specialization.join(', ') || '-'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-center text-slate-300">
                        {application.experience}년
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-center">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-center text-slate-300">
                        {application.attachments.length > 0 ? (
                          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500/20 px-1.5 py-0.5 text-xs text-sky-200">
                            {application.attachments.length}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-slate-400" title={application.reviewNotes || ''}>
                        {application.reviewNotes || '-'}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openModal(application)}
                            className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-600/80 px-2 py-1 text-xs text-white hover:bg-blue-600"
                            title="상세보기"
                          >
                            <FaEye className="h-3 w-3" />
                            상세
                          </button>
                          {application.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => openReviewModal(application, 'approve')}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-600/80 px-2 py-1 text-xs text-white hover:bg-emerald-600"
                                title="승인"
                              >
                                <FaCheck className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openReviewModal(application, 'reject')}
                                className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-600/80 px-2 py-1 text-xs text-white hover:bg-rose-600"
                                title="거부"
                              >
                                <FaTimes className="h-3 w-3" />
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

      {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">안내</h3>
                <button type="button" onClick={() => setShowAddModal(false)} className="text-red-300 hover:text-white">
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <div className="text-slate-200 space-y-2 text-sm">
                <p>
                  상담사는 사용자 <span className="text-white font-semibold">상담사 전환 승인 요청</span>을 통해 신청하고,
                  관리자가 이 화면에서 <span className="text-white font-semibold">승인/거부</span>합니다.
                </p>
                <p>수동 추가 기능은 운영 혼선 방지를 위해 비활성화되어 있습니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="mt-5 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {showModal && selectedApplication && (
          <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl p-6 shadow-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">상담사 인증 상세 정보</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-red-300 hover:text-white">
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">이름</p>
                    <p className="text-white">{selectedApplication.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">이메일</p>
                    <p className="text-white">{selectedApplication.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">전화번호</p>
                    <p className="text-white">{formatPhoneDisplayOr(selectedApplication.phone, '-')}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">신청자 UID</p>
                    <p className="text-white break-all">{selectedApplication.applicantUid || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">최종 신청일</p>
                    <p className="text-white">
                      {selectedApplication.appliedDate
                        ? new Date(selectedApplication.appliedDate).toLocaleDateString('ko-KR')
                        : '-'}
                      {selectedApplication.applicationCount > 1 && (
                        <span className="ml-2 text-violet-300 text-xs">
                          (총 {selectedApplication.applicationCount}회 신청)
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">경력</p>
                    <p className="text-white">{selectedApplication.experience}년</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">지역</p>
                    <p className="text-white">{selectedApplication.region || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">기관명/회사명</p>
                    <p className="text-white">{selectedApplication.organizationName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">최종 상태</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(selectedApplication.status)}`}>
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                </div>

                <CounselorApplicationHistoryPanel
                  history={selectedApplication.history}
                  getStatusText={getStatusText}
                  getStatusBadgeClass={getStatusBadgeClass}
                />

                <div>
                  <p className="text-slate-400 text-xs mb-1">전문분야</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApplication.specialization.length > 0 ? (
                      selectedApplication.specialization.map((spec) => (
                        <span key={spec} className="px-2 py-0.5 bg-slate-800 rounded text-slate-100 text-xs">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-1">첨부 파일</p>
                  <CounselorApplicationAttachmentList attachments={selectedApplication.attachments} />
                </div>

                <div>
                  <p className="text-slate-400 text-xs mb-0.5">신청자 메모</p>
                  <p className="text-white whitespace-pre-wrap">{selectedApplication.notes || '-'}</p>
                </div>

                {selectedApplication.reviewNotes && (
                  <div>
                    <p className="text-slate-400 text-xs mb-0.5">검토 메모</p>
                    <p className="text-white whitespace-pre-wrap">{selectedApplication.reviewNotes}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-6">
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        openReviewModal(selectedApplication, 'approve');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <FaCheck className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        openReviewModal(selectedApplication, 'reject');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      <FaTimes className="w-4 h-4" />
                      거부
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

      <CounselorApplicationReviewModal
        open={Boolean(reviewTarget)}
        action={reviewTarget?.action ?? 'approve'}
        applicantName={reviewTarget?.application.name ?? ''}
        memo={reviewMemo}
        busy={busy}
        onMemoChange={setReviewMemo}
        onConfirm={() => void confirmReview()}
        onCancel={() => {
          if (!busy) {
            setReviewTarget(null);
            setReviewMemo('');
          }
        }}
      />
    </div>
  );
}

export default function CounselorVerificationPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <CounselorVerificationPageContent />
    </RoleGuard>
  );
}
