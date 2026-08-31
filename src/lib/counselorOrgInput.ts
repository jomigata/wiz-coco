/** 상담(코드) — 그룹명(cohortName) · 소속(title 필드 UI 라벨) */

export const ASSESSMENT_GROUP_NAME_LABEL = '그룹명';
export const ASSESSMENT_AFFILIATION_LABEL = '소속';

export const CUSTOM_ORG_GROUP_PREFIX = '1.그룹명 :';
export const CUSTOM_ORG_AFFILIATION_PREFIX = '2.소속 :';

export const CUSTOM_ORG_INPUT_DRAFT = `${CUSTOM_ORG_GROUP_PREFIX} \n${CUSTOM_ORG_AFFILIATION_PREFIX} `;

export const CUSTOM_ORG_GROUP_CURSOR = `${CUSTOM_ORG_GROUP_PREFIX} `.length;

export type ParsedCustomOrgInput = {
  groupName: string;
  affiliation: string;
};

export type CounselorAffiliationSource = {
  /** 상담/운영 정보 — 회사/기관명 */
  organizationName?: string;
  name?: string;
  reportDisplayName?: string;
  displayName?: string;
};

/**
 * 소속(title) 결정 순서:
 * 1순위 상담/운영 정보의 회사(기관)명
 * 2순위 상담사 이름
 */
export function resolveCounselorAffiliationTitle(source: CounselorAffiliationSource): string {
  const org = (source.organizationName || '').trim();
  if (org) return org.slice(0, 200);
  const person = (source.reportDisplayName || source.name || source.displayName || '').trim();
  return person.slice(0, 200);
}

export function isCustomOrgDraft(value: string): boolean {
  const trimmed = value.trim();
  return !trimmed || trimmed === CUSTOM_ORG_INPUT_DRAFT.trim();
}

export function parseCustomOrgInput(raw: string): ParsedCustomOrgInput {
  const text = raw.replace(/\r\n/g, '\n');
  const groupMatch = text.match(/1\.그룹명\s*:\s*([\s\S]*?)(?:\n\s*2\.소속\s*:|$)/);
  const affiliationMatch = text.match(/2\.소속\s*:\s*([\s\S]*)$/);

  if (groupMatch || affiliationMatch) {
    return {
      groupName: (groupMatch?.[1] || '').trim(),
      affiliation: (affiliationMatch?.[1] || '').trim(),
    };
  }

  return {
    groupName: text.trim(),
    affiliation: '',
  };
}

export function formatCustomOrgDisplay(parsed: ParsedCustomOrgInput): string {
  const group = parsed.groupName.trim();
  const affiliation = parsed.affiliation.trim();
  if (group && affiliation) return `${group} / ${affiliation}`;
  if (group) return group;
  if (affiliation) return affiliation;
  return '';
}

export function focusCustomOrgTextarea(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  setValue: (next: string) => void,
): void {
  if (!textarea) return;
  const nextValue = currentValue.trim() ? currentValue : CUSTOM_ORG_INPUT_DRAFT;
  if (!currentValue.trim()) {
    setValue(nextValue);
  }
  requestAnimationFrame(() => {
    textarea.focus();
    const groupIndex = nextValue.indexOf(CUSTOM_ORG_GROUP_PREFIX);
    const cursor =
      groupIndex >= 0 ? groupIndex + CUSTOM_ORG_GROUP_CURSOR : CUSTOM_ORG_GROUP_CURSOR;
    textarea.setSelectionRange(cursor, cursor);
  });
}
