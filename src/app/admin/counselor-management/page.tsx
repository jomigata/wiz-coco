"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaUserCheck, FaSearch, FaCheck, FaTimes } from 'react-icons/fa';
import RoleGuard from '@/components/RoleGuard';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import CounselorApplicationReviewModal from '@/app/admin/components/CounselorApplicationReviewModal';
import CounselorApplicationAttachmentList from '@/app/admin/components/CounselorApplicationAttachmentList';
import SortableTableHeader, { type SortOrder } from '@/app/admin/components/SortableTableHeader';
import { formatPhoneDisplayOr } from '@/lib/phoneFormat';
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
  groupCounselorApplicationsByApplicant,
  type GroupedCounselorApplicationRow,
} from '@/lib/firestore/counselorApplicationGrouping';

type SortKey =
  | 'appliedDate'
  | 'name'
  | 'email'
  | 'organizationName'
  | 'region'
  | 'specialization'
  | 'experience'
  | 'status';

type ReviewTarget =
  | { mode: 'single'; application: GroupedCounselorApplicationRow; action: 'approve' | 'reject' }
  | { mode: 'bulk'; ids: string[]; action: 'approve' | 'reject' };

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

function CounselorManagementPageContent() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'verification' | 'profiles' | 'activity'>('verification');
  const [applications, setApplications] = useState<AdminCounselorApplicationRow[]>([]);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('appliedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedApplication, setSelectedApplication] = useState<GroupedCounselorApplicationRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
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
    if (!authLoading && user) {
      void loadApplications();
    }
  }, [authLoading, user?.uid, loadApplications]);

  useEffect(() => {
    setSelectedIds([]);
  }, [searchQuery, statusFilter, activeTab]);

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
    const q = searchQuery.toLowerCase().trim();
    const filtered = groupedApplications.filter((app) => {
      const blob = buildApplicantSearchBlob(app);
      const matchesSearch = !q || blob.includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return sortApplications(filtered, sortKey, sortOrder);
  }, [groupedApplications, searchQuery, statusFilter, sortKey, sortOrder]);

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

  const openReviewModal = (
    target: ReviewTarget,
    defaultMemo = '',
  ) => {
    setReviewMemo(defaultMemo);
    setReviewTarget(target);
  };

  const closeReviewModal = () => {
    setReviewTarget(null);
    setReviewMemo('');
  };

  const confirmReview = async () => {
    if (!reviewTarget || !user?.uid) return;
    setBusy(true);
    try {
      const notifyResults: Array<{ email: string; name: string; approved: boolean }> = [];

      if (reviewTarget.mode === 'single') {
        const app = reviewTarget.application;
        if (reviewTarget.action === 'approve') {
          if (!app.applicantUid?.trim()) {
            alert('신청자 UID가 없어 승인할 수 없습니다.');
            return;
          }
          await approveCounselorApplication({
            applicationId: app.id,
            applicantUid: app.applicantUid,
            personalInfo: app.personalInfo,
            reviewerUid: user.uid,
            reviewNotes: reviewMemo,
          });
          notifyResults.push({
            email: app.email,
            name: app.name,
            approved: true,
          });
        } else {
          await rejectCounselorApplication({
            applicationId: app.id,
            reviewerUid: user.uid,
            reviewNotes: reviewMemo,
          });
          notifyResults.push({
            email: app.email,
            name: app.name,
            approved: false,
          });
        }
      } else {
        for (const id of reviewTarget.ids) {
          const app = applications.find((a) => a.id === id);
          if (!app || app.status !== 'pending') continue;
          if (reviewTarget.action === 'approve') {
            if (!app.applicantUid?.trim()) continue;
            await approveCounselorApplication({
              applicationId: app.id,
              applicantUid: app.applicantUid,
              personalInfo: app.personalInfo,
              reviewerUid: user.uid,
              reviewNotes: reviewMemo,
            });
            notifyResults.push({
              email: app.email,
              name: app.name,
              approved: true,
            });
          } else {
            await rejectCounselorApplication({
              applicationId: app.id,
              reviewerUid: user.uid,
              reviewNotes: reviewMemo,
            });
            notifyResults.push({
              email: app.email,
              name: app.name,
              approved: false,
            });
          }
        }
      }

      await Promise.all(
        notifyResults.map((item) =>
          notifyApplicantCounselorApplicationResult({
            applicantEmail: item.email,
            applicantName: item.name,
            approved: item.approved,
            reviewNotes: reviewMemo,
          }),
        ),
      );

      closeReviewModal();
      setShowModal(false);
      setSelectedIds([]);
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

  const pendingCount = groupedApplications.filter((app) => app.status === 'pending').length;
  const approvedCount = groupedApplications.filter((a) => a.status === 'approved').length;
  const rejectedCount = groupedApplications.filter((a) => a.status === 'rejected').length;

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
    openReviewModal({ mode: 'bulk', ids, action: 'approve' });
  };

  const handleBulkReject = () => {
    const ids = selectedIds.filter((id) => applications.find((a) => a.id === id)?.status === 'pending');
    if (ids.length === 0) return;
    openReviewModal({ mode: 'bulk', ids, action: 'reject' });
  };

  const reviewApplicantName =
    reviewTarget?.mode === 'single' ? reviewTarget.application.name : '';
  const reviewBulkCount =
    reviewTarget?.mode === 'bulk' ? reviewTarget.ids.length : 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 text-slate-100">
      <motion.div
        className="mb-1 shrink-0 rounded-lg border border-sky-500/20 bg-sky-950/25 px-3 py-2"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-snug text-slate-300">
            검토 중 <span className="font-semibold text-amber-200/95">{pendingCount}</span> · 승인{' '}
            <span className="font-semibold text-emerald-200/95">{approvedCount}</span> · 거부{' '}
            <span className="font-semibold text-rose-200/95">{rejectedCount}</span> · 신청자{' '}
            <span className="font-semibold text-slate-200">{groupedApplications.length}</span> — 최신 신청 기준
            그룹 목록입니다.
          </p>
        </div>
      </motion.div>

      <motion.div
        className="mb-2 flex shrink-0 flex-wrap gap-x-1 gap-y-0 border-b border-slate-200"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'verification'
              ? 'border border-b-0 border-slate-200 bg-white/10 text-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          인증 관리 ({filteredApplications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profiles')}
          className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'profiles'
              ? 'border border-b-0 border-slate-200 bg-white/10 text-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          프로필 ({approvedCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`rounded-t-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'activity'
              ? 'border border-b-0 border-slate-200 bg-white/10 text-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          활동 현황
        </button>
      </motion.div>

      {activeTab === 'verification' && (
        <motion.div
          className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm p-3 backdrop-blur-sm sm:p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {loadError && (
            <div className="mb-2 rounded-md border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
              {loadError}
            </div>
          )}
          {busy && !reviewTarget && (
            <div className="mb-2 text-xs text-slate-400">목록 갱신 중…</div>
          )}
          <div className="mb-2 flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <h2 className="text-lg font-semibold text-slate-900 sm:w-auto sm:shrink-0">
              인증 신청{' '}
              <span className="font-normal text-slate-500">({filteredApplications.length})</span>
            </h2>
            <div className="relative min-w-0 flex-1">
              <FaSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="이름 · 이메일 · 기관명 · 지역 · 분야 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500/60"
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
                className="rounded-md border border-emerald-500/30 bg-emerald-800/40 px-2.5 py-1.5 text-sm font-medium text-emerald-100 hover:bg-emerald-700/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                선택 승인 ({selectedPendingCount})
              </button>
              <button
                type="button"
                onClick={handleBulkReject}
                disabled={selectedPendingCount === 0}
                className="rounded-md border border-rose-500/30 bg-rose-900/40 px-2.5 py-1.5 text-sm font-medium text-rose-100 hover:bg-rose-800/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                선택 거부 ({selectedPendingCount})
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-slate-200">
            {filteredApplications.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <FaUserCheck className="mb-2 h-10 w-10 text-slate-600" />
                <p className="text-base text-slate-300">조건에 맞는 인증 신청이 없습니다.</p>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
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
                        className="px-2 py-2"
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
                        className="min-w-[8rem] px-2 py-2"
                      />
                      <SortableTableHeader
                        label="기관명/회사명"
                        sortKey="organizationName"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={handleSort}
                        className="min-w-[6rem] px-2 py-2"
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
                      <th scope="col" className="min-w-[5rem] whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-400">
                        검토 메모
                      </th>
                      <th scope="col" className="whitespace-nowrap px-2 py-2 text-center text-xs font-medium text-slate-400">
                        승인현황
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredApplications.map((application) => (
                      <tr
                        key={`${application.applicantUid}-${application.id}`}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => openModal(application)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openModal(application);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${application.name} 상담사 인증 상세 보기`}
                      >
                        <td
                          className="whitespace-nowrap px-2 py-1.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(application.id)}
                            onChange={() => toggleSelectRow(application.id)}
                            className="h-3.5 w-3.5 cursor-pointer rounded border-white/30 bg-transparent text-sky-400 focus:ring-sky-400/50"
                          />
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-left text-sm text-slate-200">
                          {new Date(application.appliedDate).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-left text-sm font-medium text-white">
                          {application.name}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-center text-xs text-slate-400">
                          {application.applicationCount > 1 ? (
                            <span
                              className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-500/20 px-1.5 py-0.5 text-violet-200"
                              title={`총 ${application.applicationCount}회 신청`}
                            >
                              {application.applicationCount}
                            </span>
                          ) : (
                            '1'
                          )}
                        </td>
                        <td className="px-2 py-2 text-left text-sm text-slate-200" title={application.email}>
                          {application.email}
                        </td>
                        <td className="px-2 py-2 text-left text-sm text-slate-300" title={application.organizationName}>
                          {application.organizationName || '-'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-left text-sm text-slate-300">
                          {application.region || '-'}
                        </td>
                        <td className="px-2 py-2 text-left text-sm text-slate-300" title={application.specialization.join(', ')}>
                          {application.specialization.join(', ') || '-'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-center text-sm text-slate-300">
                          {application.experience}년
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(application.status)}`}>
                            {getStatusText(application.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-xs text-slate-400" title={application.reviewNotes || ''}>
                          {application.reviewNotes || '-'}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(application);
                            }}
                            className="rounded bg-sky-800/50 px-2 py-0.5 text-xs font-medium text-sky-100 hover:bg-sky-700/60"
                          >
                            상세 ({getStatusText(application.status)})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-2 shrink-0 text-xs text-slate-500">총 {filteredApplications.length}건</div>
        </motion.div>
      )}

        {/* 상세보기 모달 */}
        {showModal && selectedApplication && (
          <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/95">
            <div className="flex min-h-full justify-center px-4 py-6 sm:py-8">
              <div className="my-8 w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">상담사 인증 상세 정보</h3>
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
                    <p className="text-white">{formatPhoneDisplayOr(selectedApplication.phone, '-')}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">기관명/회사명</label>
                    <p className="text-white">{selectedApplication.organizationName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">지역</label>
                    <p className="text-white">{selectedApplication.region || '-'}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">경력</label>
                    <p className="text-white">{selectedApplication.experience}년</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">상태</label>
                    <p className="text-white">{getStatusText(selectedApplication.status)}</p>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm">신청일</label>
                    <p className="text-white">
                      {selectedApplication.appliedDate
                        ? new Date(selectedApplication.appliedDate).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm">전문분야</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedApplication.specialization.length > 0 ? (
                      selectedApplication.specialization.map((spec, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-800 rounded text-sm text-slate-100">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-slate-300 text-sm">첨부 파일</label>
                  <div className="mt-1">
                    <CounselorApplicationAttachmentList attachments={selectedApplication.attachments} />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 text-sm">신청자 메모</label>
                  <p className="text-white mt-1">{selectedApplication.notes || '-'}</p>
                </div>

                {selectedApplication.reviewNotes && (
                  <div>
                    <label className="text-slate-300 text-sm">관리자 검토 메모</label>
                    <p className="text-white mt-1 whitespace-pre-wrap">{selectedApplication.reviewNotes}</p>
                  </div>
                )}

                <CounselorApplicationHistoryPanel
                  history={selectedApplication.history}
                  getStatusText={getStatusText}
                  getStatusBadgeClass={getStatusBadgeClass}
                />
              </div>
              
              <div className="flex gap-2 mt-6">
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        openReviewModal({ mode: 'single', application: selectedApplication, action: 'approve' });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <FaCheck className="w-4 h-4" />
                      승인
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        openReviewModal({ mode: 'single', application: selectedApplication, action: 'reject' });
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
        </div>
        )}

        {/* 프로필 관리 탭 */}
        {activeTab === 'profiles' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm p-3 backdrop-blur-sm sm:p-4"
          >
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                승인 프로필{' '}
                <span className="font-normal text-slate-500">({approvedCount})</span>
              </h2>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200">
              {approvedCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-base text-slate-300">
                  승인된 상담사가 없습니다.
                </div>
              ) : (
                <div className="max-h-[min(60vh,32rem)] overflow-auto lg:max-h-none">
                  <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">이름</th>
                        <th className="min-w-[8rem] px-2 py-2 text-left text-xs font-medium text-slate-400">이메일</th>
                        <th className="hidden px-2 py-2 text-left text-xs font-medium text-slate-400 sm:table-cell">기관명</th>
                        <th className="hidden px-2 py-2 text-left text-xs font-medium text-slate-400 md:table-cell">전문분야</th>
                        <th className="whitespace-nowrap px-2 py-2 text-left text-xs font-medium text-slate-400">경력</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-slate-400">작업</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {groupedApplications
                        .filter((app) => app.status === 'approved')
                        .map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="max-w-[6rem] truncate px-2 py-2 text-left text-sm font-medium text-white">{c.name}</td>
                            <td className="max-w-[12rem] truncate px-2 py-2 text-left text-sm text-slate-200" title={c.email}>
                              {c.email}
                            </td>
                            <td className="hidden max-w-[10rem] truncate px-2 py-2 text-left text-sm text-slate-300 sm:table-cell" title={c.organizationName}>
                              {c.organizationName || '-'}
                            </td>
                            <td className="hidden max-w-[12rem] truncate px-2 py-2 text-left text-sm text-slate-300 md:table-cell" title={c.specialization.join(', ')}>
                              {c.specialization.join(', ')}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-left text-sm text-slate-400">{c.experience}년</td>
                            <td className="px-2 py-2 text-center">
                              <button
                                type="button"
                                className="rounded bg-sky-800/50 px-2 py-0.5 text-xs font-medium text-sky-100 hover:bg-sky-700/60"
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
            <div className="mt-2 text-xs text-slate-500">총 {approvedCount}명</div>
          </motion.div>
        )}

        {/* 활동 현황 탭 */}
        {activeTab === 'activity' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col rounded-lg border border-slate-200 bg-white shadow-sm p-3 backdrop-blur-sm sm:p-4"
          >
            <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-emerald-300">
                  {applications.filter((app) => app.status === 'approved').length}
                </div>
                <div className="text-xs text-emerald-400/80">활성 상담사</div>
              </div>
              <div className="rounded-md border border-sky-500/20 bg-sky-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-sky-300">248</div>
                <div className="text-xs text-sky-400/80">월간 세션</div>
              </div>
              <div className="rounded-md border border-violet-500/20 bg-violet-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-violet-300">4.8</div>
                <div className="text-xs text-violet-400/80">만족도</div>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-950/30 px-2 py-2 text-center">
                <div className="text-lg font-bold text-amber-300">156</div>
                <div className="text-xs text-amber-400/80">완료 치료</div>
              </div>
            </div>

            <h2 className="mb-2 text-lg font-semibold text-slate-900">최근 활동</h2>
            <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200">
              <div className="max-h-[min(50vh,24rem)] overflow-auto lg:max-h-none">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="sticky top-0 z-[1] bg-[#0f172a]/95 backdrop-blur-sm">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs font-medium text-slate-400">상담사</th>
                      <th className="min-w-[10rem] px-2 py-2 text-left text-xs font-medium text-slate-400">내용</th>
                      <th className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium text-slate-400">시각</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {[
                      ['김상담', '새 상담 세션 완료', '2시간 전'],
                      ['이치료', '치료 계획 업데이트', '4시간 전'],
                      ['박심리', '내담자 평가 완료', '6시간 전'],
                    ].map(([name, action, time], i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-2 py-2 text-left text-sm text-slate-200">{name}</td>
                        <td className="px-2 py-2 text-left text-sm text-slate-300">{action}</td>
                        <td className="whitespace-nowrap px-2 py-2 text-right text-sm text-slate-400">{time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        <CounselorApplicationReviewModal
          open={Boolean(reviewTarget)}
          action={reviewTarget?.action ?? 'approve'}
          applicantName={reviewApplicantName}
          bulkCount={reviewBulkCount}
          memo={reviewMemo}
          busy={busy}
          onMemoChange={setReviewMemo}
          onConfirm={() => void confirmReview()}
          onCancel={closeReviewModal}
        />
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
