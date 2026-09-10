import {
  resendDispatchCredentials,
  sendDispatchTestReminders,
} from '@/lib/clientPortalApi';
import type { NotifyChannelKey, NotifyRecipientContact } from '@/lib/counselorNotifyChannels';

export type DispatchNotifyGroup = {
  assessmentId: string;
  portalIds: string[];
  recipients: NotifyRecipientContact[];
};

export function buildDispatchGroupsFromSelections(
  items: Array<{
    portalId: string;
    displayName?: string | null;
    email?: string | null;
    phone?: string | null;
    assessments: { assessmentId: string }[];
  }>,
): DispatchNotifyGroup[] {
  const map = new Map<string, { portalIds: string[]; recipients: NotifyRecipientContact[] }>();
  for (const item of items) {
    const assessmentId = item.assessments[0]?.assessmentId;
    if (!assessmentId) continue;
    const existing = map.get(assessmentId) || { portalIds: [], recipients: [] };
    if (!existing.portalIds.includes(item.portalId)) {
      existing.portalIds.push(item.portalId);
      existing.recipients.push({
        displayName: item.displayName,
        phone: item.phone,
      });
    }
    map.set(assessmentId, existing);
  }
  return Array.from(map.entries()).map(([assessmentId, value]) => ({
    assessmentId,
    portalIds: value.portalIds,
    recipients: value.recipients,
  }));
}

export async function executeGroupedDispatchNotify(params: {
  kind: 'remind' | 'resend';
  groups: DispatchNotifyGroup[];
  notifyChannels: NotifyChannelKey[];
}): Promise<{ sent: number; failed: number; skipped: number }> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const group of params.groups) {
    if (!group.portalIds.length) continue;
    const result =
      params.kind === 'remind'
        ? await sendDispatchTestReminders(group.assessmentId, group.portalIds, params.notifyChannels)
        : await resendDispatchCredentials(group.assessmentId, group.portalIds, params.notifyChannels);
    sent += result.sent || 0;
    failed += result.failed || 0;
    skipped += result.skipped || 0;
  }
  return { sent, failed, skipped };
}

export function flattenDispatchRecipients(groups: DispatchNotifyGroup[]): NotifyRecipientContact[] {
  return groups.flatMap((g) => g.recipients);
}
