import type {
  CareProgressEntry,
  CareProgressStatus,
  CareProgressSummary,
  CounselorCareAssignmentListItem,
} from '@/types/careAssignment';

export type RealtimeCareProgressDoc = {
  id: string;
  assignmentId: string;
  portalId?: string;
  counselorId?: string;
  status?: CareProgressStatus;
  progressPercent?: number;
  entries?: CareProgressEntry[];
  lastActivityAt?: unknown;
  completedAt?: unknown;
};

export type RealtimeCareAssignmentDoc = {
  id: string;
  counselorId?: string;
  portalId?: string;
  portalDisplayName?: string;
  status?: string;
  title?: string;
  type?: string;
  dueAt?: string | null;
  updatedAt?: unknown;
  completedAt?: unknown;
};

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

function progressSummaryFromDoc(doc: RealtimeCareProgressDoc): CareProgressSummary {
  const entries = doc.entries || [];
  return {
    progressId: doc.id,
    status: (doc.status || 'not_started') as CareProgressStatus,
    progressPercent: Number(doc.progressPercent) || 0,
    entryCount: entries.length,
    lastActivityAt: toIso(doc.lastActivityAt),
    completedAt: toIso(doc.completedAt),
    recentEntries: entries.slice(-5),
  };
}

export function applyRealtimeToCareAssignments(
  base: CounselorCareAssignmentListItem[],
  progressDocs: RealtimeCareProgressDoc[],
  assignmentDocs: RealtimeCareAssignmentDoc[],
): CounselorCareAssignmentListItem[] {
  const progressByAssignment = new Map(
    progressDocs.map((doc) => [(doc.assignmentId || '').trim(), doc]),
  );
  const assignmentById = new Map(assignmentDocs.map((doc) => [doc.id, doc]));

  return base.map((item) => {
    const progressDoc = progressByAssignment.get(item.id);
    const assignmentDoc = assignmentById.get(item.id);
    let next: CounselorCareAssignmentListItem = { ...item };

    if (progressDoc) {
      next = { ...next, progress: progressSummaryFromDoc(progressDoc) };
    }
    if (assignmentDoc) {
      next = {
        ...next,
        status: (assignmentDoc.status as CounselorCareAssignmentListItem['status']) || next.status,
        title: assignmentDoc.title || next.title,
        portalDisplayName: assignmentDoc.portalDisplayName || next.portalDisplayName,
        dueAt: assignmentDoc.dueAt ?? next.dueAt,
        updatedAt: toIso(assignmentDoc.updatedAt) ?? next.updatedAt,
        completedAt: toIso(assignmentDoc.completedAt) ?? next.completedAt,
      };
    }
    return next;
  });
}

export type CareRecentActivity = {
  assignmentId: string;
  portalId: string;
  portalDisplayName: string;
  assignmentTitle: string;
  entryId: string;
  kind: string;
  title?: string;
  content?: string;
  moodScore?: number;
  completedAt: string | null;
};

export function collectCareRecentActivity(
  items: CounselorCareAssignmentListItem[],
  max = 20,
): CareRecentActivity[] {
  const rows: CareRecentActivity[] = [];

  for (const item of items) {
    const entries = item.progress?.recentEntries || [];
    for (const entry of entries) {
      rows.push({
        assignmentId: item.id,
        portalId: item.portalId,
        portalDisplayName: item.portalDisplayName || '내담자',
        assignmentTitle: item.title,
        entryId: entry.id,
        kind: entry.kind,
        title: entry.title,
        content: entry.content,
        moodScore: entry.moodScore,
        completedAt: entry.completedAt ?? null,
      });
    }
  }

  rows.sort((a, b) => {
    const ta = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const tb = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return tb - ta;
  });

  return rows.slice(0, max);
}

export function summarizeCareAssignments(items: CounselorCareAssignmentListItem[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let active = 0;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let overdue = 0;

  for (const item of items) {
    const status = item.status;
    if (status === 'completed') {
      completed += 1;
      continue;
    }
    if (status !== 'active') continue;
    active += 1;

    const progressStatus = item.progress?.status;
    if (progressStatus === 'in_progress') inProgress += 1;
    else if (!progressStatus || progressStatus === 'not_started') notStarted += 1;

    if (item.dueAt) {
      const due = new Date(item.dueAt.slice(0, 10));
      if (!Number.isNaN(due.getTime()) && due < today) overdue += 1;
    }
  }

  return { active, completed, inProgress, notStarted, overdue, total: items.length };
}
