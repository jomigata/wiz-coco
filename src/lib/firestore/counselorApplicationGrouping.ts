import type { AdminCounselorApplicationRow } from '@/lib/firestore/counselorApplicationsStore';

export interface GroupedCounselorApplicationRow extends AdminCounselorApplicationRow {
  /** 동일 신청자(UID/이메일)의 총 신청 횟수 */
  applicationCount: number;
  /** 최신순 신청 이력 (첫 항목 = 최종/최신 결과) */
  history: AdminCounselorApplicationRow[];
}

function applicantGroupKey(row: AdminCounselorApplicationRow): string {
  const uid = (row.applicantUid || '').trim();
  if (uid) return `uid:${uid}`;
  const email = (row.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  return `id:${row.id}`;
}

function sortByAppliedDateDesc(a: AdminCounselorApplicationRow, b: AdminCounselorApplicationRow): number {
  return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
}

/** 신청자별로 묶어 최신 신청(최종 결과) 1행만 반환 */
export function groupCounselorApplicationsByApplicant(
  rows: AdminCounselorApplicationRow[],
): GroupedCounselorApplicationRow[] {
  const groups = new Map<string, AdminCounselorApplicationRow[]>();

  for (const row of rows) {
    const key = applicantGroupKey(row);
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  }

  return Array.from(groups.values()).map((history) => {
    const sorted = [...history].sort(sortByAppliedDateDesc);
    const latest = sorted[0];
    return {
      ...latest,
      applicationCount: sorted.length,
      history: sorted,
    };
  });
}

export function countGroupedPendingApplications(rows: AdminCounselorApplicationRow[]): number {
  return groupCounselorApplicationsByApplicant(rows).filter((row) => row.status === 'pending').length;
}

export function buildApplicantSearchBlob(row: GroupedCounselorApplicationRow): string {
  const parts = row.history.flatMap((item) => [
    item.name,
    item.email,
    item.organizationName,
    item.region,
    item.specialization.join(' '),
    item.applicantUid,
    item.notes,
    item.reviewNotes || '',
  ]);
  return parts.join(' ').toLowerCase();
}
