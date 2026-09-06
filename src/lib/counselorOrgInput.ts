/** 상담(코드) — 그룹명(cohortName) · 소속(title 필드 UI 라벨) */

export const ASSESSMENT_GROUP_NAME_LABEL = '그룹명';
export const ASSESSMENT_AFFILIATION_LABEL = '소속';

export const CUSTOM_ORG_GROUP_PREFIX = '* 그룹/기관명 :';
export const CUSTOM_ORG_AFFILIATION_PREFIX = '* 소속 :';

export const CUSTOM_ORG_INPUT_DRAFT = `${CUSTOM_ORG_GROUP_PREFIX} \n${CUSTOM_ORG_AFFILIATION_PREFIX} `;

export const CUSTOM_ORG_GROUP_CURSOR = `${CUSTOM_ORG_GROUP_PREFIX} `.length;
export const CUSTOM_ORG_AFFILIATION_CURSOR = `${CUSTOM_ORG_AFFILIATION_PREFIX} `.length;

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

/** 플랫폼·브랜드명 등 소속으로 쓰이면 안 되는 값 */
function isBlockedAffiliationName(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/[\s._-]+/g, '');
  return (
    normalized === 'wizcoco' ||
    normalized === 'wizcocoai' ||
    normalized === '위즈코코' ||
    normalized === 'psychcare' ||
    normalized === '심리케어'
  );
}

function pickAffiliationOrganizationName(...candidates: Array<string | undefined>): string {
  for (const candidate of candidates) {
    const trimmed = (candidate || '').trim();
    if (!trimmed || isBlockedAffiliationName(trimmed)) continue;
    return trimmed;
  }
  return '';
}

/**
 * 소속(title) 결정 순서:
 * 1순위 상담/운영 정보의 회사(기관)명
 * 2순위 상담사 이름
 */
export function resolveCounselorAffiliationTitle(source: CounselorAffiliationSource): string {
  const org = pickAffiliationOrganizationName(source.organizationName);
  if (org) return org.slice(0, 200);
  const person = (source.reportDisplayName || source.name || source.displayName || '').trim();
  if (person && !isBlockedAffiliationName(person)) return person.slice(0, 200);
  return person.slice(0, 200);
}

export function isCustomOrgDraft(value: string): boolean {
  const trimmed = value.trim();
  return !trimmed || trimmed === CUSTOM_ORG_INPUT_DRAFT.trim();
}

function parseLegacyCustomOrgInput(text: string): ParsedCustomOrgInput | null {
  const groupMatch = text.match(/1\.그룹명\s*:\s*([\s\S]*?)(?:\n\s*2\.소속\s*:|$)/);
  const affiliationMatch = text.match(/2\.소속\s*:\s*([\s\S]*)$/);
  if (!groupMatch && !affiliationMatch) return null;
  return {
    groupName: (groupMatch?.[1] || '').trim(),
    affiliation: (affiliationMatch?.[1] || '').trim(),
  };
}

export function parseCustomOrgInput(raw: string): ParsedCustomOrgInput {
  const text = raw.replace(/\r\n/g, '\n');
  const groupMatch = text.match(
    /\*?\s*그룹\/기관명\s*:\s*([\s\S]*?)(?:\n\s*\*?\s*소속\s*:|$)/,
  );
  const affiliationMatch = text.match(/\*?\s*소속\s*:\s*([\s\S]*)$/);

  if (groupMatch || affiliationMatch) {
    return {
      groupName: (groupMatch?.[1] || '').trim(),
      affiliation: (affiliationMatch?.[1] || '').trim(),
    };
  }

  const legacy = parseLegacyCustomOrgInput(text);
  if (legacy) return legacy;

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

export type CustomOrgFocusTarget = 'group' | 'affiliation';

export function focusCustomOrgTextarea(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  setValue: (next: string) => void,
  target: CustomOrgFocusTarget = 'group',
): void {
  if (!textarea) return;
  const nextValue = currentValue.trim() ? currentValue : CUSTOM_ORG_INPUT_DRAFT;
  if (!currentValue.trim()) {
    setValue(nextValue);
  }
  requestAnimationFrame(() => {
    textarea.focus();
    if (target === 'affiliation') {
      const affIndex = nextValue.indexOf(CUSTOM_ORG_AFFILIATION_PREFIX);
      const cursor =
        affIndex >= 0 ? affIndex + CUSTOM_ORG_AFFILIATION_CURSOR : nextValue.length;
      textarea.setSelectionRange(cursor, cursor);
      return;
    }
    const groupIndex = nextValue.indexOf(CUSTOM_ORG_GROUP_PREFIX);
    const cursor =
      groupIndex >= 0 ? groupIndex + CUSTOM_ORG_GROUP_CURSOR : CUSTOM_ORG_GROUP_CURSOR;
    textarea.setSelectionRange(cursor, cursor);
  });
}

/** textarea 클릭 Y좌표로 그룹명·소속 입력 줄 판별 */
export function resolveCustomOrgFocusFromClick(
  textarea: HTMLTextAreaElement,
  clientY: number,
): CustomOrgFocusTarget {
  const rect = textarea.getBoundingClientRect();
  const relativeY = clientY - rect.top + textarea.scrollTop;
  const lineHeight =
    parseFloat(getComputedStyle(textarea).lineHeight || '') ||
    parseFloat(getComputedStyle(textarea).fontSize || '14') * 1.4;
  const lineIndex = Math.floor(relativeY / Math.max(lineHeight, 12));
  return lineIndex >= 1 ? 'affiliation' : 'group';
}
