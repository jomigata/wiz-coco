'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaUsers } from 'react-icons/fa';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';
import { AuthLoadingState, AuthRequiredState } from '@/components/auth/AuthStatusViews';
import { useAuthResolved } from '@/hooks/useAuthResolved';
import { useRedirectOnLoginRequiredError } from '@/hooks/useRequireLoginRedirect';
import { formatAccessCodeDisplay } from '@/lib/accessCodeFormat';
import { formatPhoneDisplay } from '@/lib/phoneFormat';
import CounselorListPagination from '@/components/counselor/CounselorListPagination';
import CounselorListSearchInput from '@/components/counselor/CounselorListSearchInput';
import CounselorActionProgressOverlay from '@/components/counselor/CounselorActionProgressOverlay';
import CounselorActionCompleteModal from '@/components/counselor/CounselorActionCompleteModal';
import CounselorListBackLink from '@/components/counselor/CounselorListBackLink';
import AuthLink from '@/components/auth/AuthLink';
import {
  counselorListBodyRowStaticClass,
  counselorListHeaderRowClass,
  counselorListNoThClass,
  counselorListSelectTdClass,
  counselorListSelectThClass,
  counselorListTableWrapperClass,
  counselorListTdCompactClass,
  counselorListThClass,
} from '@/lib/counselorListTableStyles';
import { useListPagination } from '@/hooks/useListPagination';
import { useCounselorListPageSize } from '@/hooks/useCounselorListPageSize';
import { matchesWildcardFields } from '@/lib/wildcardSearch';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import { CounselorAdminEmailTd, CounselorAdminEmailTh } from '@/components/counselor/CounselorAdminEmailColumn';
import {
  fetchPermanentlyDeletedRecords,
  restorePermanentlyDeletedRecords,
  type PermanentlyDeletedPortal,
} from '@/lib/adminDeletionsApi';

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return String(iso);
  }
}

export default function PermanentlyDeletedRecipientsPage() {
  const { authPending, showLoginRequired } = useAuthResolved();
  const adminUser = isAdmin(getAppRoleSync());
  const [items, setItems] = useState<PermanentlyDeletedPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);
  const [actionComplete, setActionComplete] = useState<{
    title: string;
    message: string;
    error?: boolean;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { pageSize, setPageSize } = useCounselorListPageSize();

  const load = useCallback(async () => {
    if (!adminUser) return;
    setLoading(true);
    setError('');
    try {
      const data = await fetchPermanentlyDeletedRecords();
      setItems(data.portals || []);
      setSelected(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록 조회 실패');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (authPending || !adminUser) {
      setLoading(false);
      return;
    }
    void load();
  }, [authPending, adminUser, load]);

  useRedirectOnLoginRequiredError(error);

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return items;
    return items.filter((row) =>
      matchesWildcardFields(
        [row.displayName, row.email, row.phone, row.myCode, row.counselorEmail],
        q,
      ),
    );
  }, [items, searchQuery]);

  const {
    page,
    setPage,
    paginatedItems,
    totalPages,
    totalCount,
    currentCount,
    startIndex,
  } = useListPagination(filtered, pageSize);

  const allPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((row) => selected.has(row.portalId));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const row of paginatedItems) next.delete(row.portalId);
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const row of paginatedItems) next.add(row.portalId);
        return next;
      });
    }
  };

  const handleRestore = async () => {
    if (selected.size === 0) return;
    setRestoring(true);
    try {
      const result = await restorePermanentlyDeletedRecords({
        portalIds: Array.from(selected),
      });
      setActionComplete({
        title: '복구 완료',
        message: `삭제된 내담자로 복구 ${result.restoredPortals}건${result.failed ? `, 실패 ${result.failed}건` : ''}`,
      });
      await load();
    } catch (err) {
      setActionComplete({
        title: '복구 실패',
        message: err instanceof Error ? err.message : '복구에 실패했습니다.',
        error: true,
      });
    } finally {
      setRestoring(false);
    }
  };

  if (authPending) return <AuthLoadingState className="py-8" />;
  if (showLoginRequired) {
    return <AuthRequiredState description="Firebase에 로그인한 상태에서 다시 시도해 주세요." />;
  }
  if (!adminUser) {
    return (
      <AuthRequiredState description="관리자 계정으로 로그인해야 영구삭제 내담자 목록을 이용할 수 있습니다." />
    );
  }

  return (
    <CounselorPageSection
      title="영구삭제 내담자"
      className="flex min-h-0 flex-1"
      bodyClassName="flex min-h-0 flex-1 flex-col !p-0"
      noBodyPadding
      dense
      description={
        <span className="inline-flex w-full flex-wrap items-center gap-x-3 gap-y-2">
          <CounselorListBackLink href="/counselor/clients" label="내담자" />
          <AuthLink
            href="/counselor/assessments/deleted-recipients"
            className="inline-flex shrink-0 items-center rounded-md border border-white/15 bg-[#101f38]/90 px-2.5 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
          >
            삭제된 내담자
          </AuthLink>
          <CounselorListSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="이름 · 연락처 · 나의코드 · 상담사 이메일 검색"
          />
        </span>
      }
    >
      <motion.div
        className="flex min-h-0 flex-1 flex-col p-2.5 text-sm sm:p-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {error ? <p className="mb-2 shrink-0 text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <AuthLoadingState className="py-8" message="목록을 불러오는 중…" />
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center rounded-md border border-white/10 bg-white/[0.03] py-10 text-center">
            <FaUsers className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-base text-slate-300">
              {items.length === 0 ? '영구삭제된 내담자가 없습니다' : '검색 결과가 없습니다'}
            </p>
          </div>
        ) : (
          <>
            <div className={`min-h-0 flex-1 ${counselorListTableWrapperClass}`}>
              <table className="w-max min-w-full table-fixed text-sm">
                <thead>
                  <tr className={counselorListHeaderRowClass}>
                    <th className={counselorListNoThClass}>No.</th>
                    <th className={counselorListSelectThClass}>
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAllOnPage}
                        className="rounded accent-blue-500"
                        aria-label="현재 페이지 전체 선택"
                      />
                    </th>
                    <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
                      영구삭제일
                    </th>
                    <th scope="col" className={`${counselorListThClass} whitespace-nowrap`}>
                      이름
                    </th>
                    <th scope="col" className={`${counselorListThClass} whitespace-nowrap`}>
                      연락처
                    </th>
                    <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-center`}>
                      나의코드
                    </th>
                    <CounselorAdminEmailTh />
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((row, idx) => {
                    const isSelected = selected.has(row.portalId);
                    const contact = row.email || formatPhoneDisplay(row.phone) || '—';
                    return (
                      <tr
                        key={row.portalId}
                        className={`${counselorListBodyRowStaticClass} ${isSelected ? 'bg-white/[0.04]' : ''}`}
                      >
                        <td className={`${counselorListTdCompactClass} tabular-nums text-slate-500`}>
                          {startIndex + idx + 1}
                        </td>
                        <td className={counselorListSelectTdClass}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(row.portalId)}
                            className="rounded accent-blue-500"
                            aria-label={`${row.displayName || '내담자'} 선택`}
                          />
                        </td>
                        <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center text-slate-300`}>
                          {formatWhen(row.permanentlyDeletedAt)}
                        </td>
                        <td className={`${counselorListTdCompactClass} text-white`}>
                          {row.displayName || '—'}
                        </td>
                        <td className={`${counselorListTdCompactClass} text-slate-300`}>{contact}</td>
                        <td className={`whitespace-nowrap ${counselorListTdCompactClass} text-center font-mono text-cyan-300/95`}>
                          {formatAccessCodeDisplay(row.myCode)}
                        </td>
                        <CounselorAdminEmailTd email={row.counselorEmail} />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CounselorListPagination
              page={page}
              totalPages={totalPages}
              currentCount={currentCount}
              totalCount={totalCount}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              unit="명"
              footerAction={
                <button
                  type="button"
                  onClick={() => void handleRestore()}
                  disabled={restoring || selected.size === 0}
                  className="inline-flex items-center rounded-md bg-emerald-600 px-2.5 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {restoring ? '복구 중…' : `삭제된 내담자로 복구 (${selected.size})`}
                </button>
              }
            />
          </>
        )}
      </motion.div>

      {restoring ? (
        <CounselorActionProgressOverlay
          open={restoring}
          title="복구 진행 중…"
          message="선택한 내담자를 삭제된 내담자로 복구하고 있습니다."
        />
      ) : null}
      <CounselorActionCompleteModal
        open={Boolean(actionComplete)}
        title={actionComplete?.title ?? ''}
        message={actionComplete?.message}
        error={actionComplete?.error}
        onConfirm={() => setActionComplete(null)}
      />
    </CounselorPageSection>
  );
}
