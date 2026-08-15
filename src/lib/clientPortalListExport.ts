import type { DispatchRecipient } from '@/lib/clientPortalApi';
import {
  downloadDispatchRecipientsExcel,
  printDispatchRecipients,
  type DispatchExportMeta,
} from '@/lib/dispatchRecipientExport';
import type { CounselorClientPortalListItem } from '@/types/clientPortal';

function toDispatchRecipient(item: CounselorClientPortalListItem): DispatchRecipient {
  const primary = item.assessments[0];
  let testStatus: DispatchRecipient['testStatus'] = 'not_started';
  if (item.progress.label === 'completed') testStatus = 'completed';
  else if (item.progress.label === 'in_progress') testStatus = 'in_progress';

  return {
    portalId: item.portalId,
    displayName: item.displayName,
    email: item.email || '',
    phone: item.phone || '',
    myCode: item.accessCode,
    joinAccessCode: primary?.joinAccessCode || '',
    notifyStatus: item.notifyStatus || 'not_sent',
    notifyError: item.notifyError,
    notifyAt: item.notifyAt,
    testStatus,
    completedCount: item.progress.completedTests,
    requiredCount: item.progress.totalTests,
    tests: [],
  };
}

export function exportClientPortalItems(
  items: CounselorClientPortalListItem[],
  mode: 'download' | 'print',
): void {
  if (!items.length) return;
  const recipients = items.map(toDispatchRecipient);
  const primary = items[0].assessments[0];
  const meta: DispatchExportMeta = {
    title: primary?.title || '내담자 목록',
    cohortName: primary?.orgName || items[0].cohortName || '',
    joinAccessCode: primary?.joinAccessCode || '',
  };
  if (mode === 'download') {
    downloadDispatchRecipientsExcel(recipients, meta);
  } else {
    printDispatchRecipients(recipients, meta);
  }
}
