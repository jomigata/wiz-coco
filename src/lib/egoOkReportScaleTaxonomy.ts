import type { EgoOkReportTabId } from '@/components/tests/egoOk/egoOkReportTabNav';

/** 90문항 성격 척도 scaleType (타당도 제외) */
export const EGO_OK_PERSONALITY_SCALE_TYPES = [
  'cp_positive',
  'cp_negative',
  'np_positive',
  'np_negative',
  'a_positive',
  'a_negative',
  'fc_positive',
  'fc_negative',
  'ac_positive',
  'ac_negative',
  'u_plus',
  'u_minus',
  'i_plus',
  'i_minus',
] as const;

export type EgoOkPersonalityScaleType = (typeof EGO_OK_PERSONALITY_SCALE_TYPES)[number];

export type EgoOkScaleTaxonomyNode = {
  major: string;
  middle: string;
  minor: string;
  formTag: string;
  scaleType: EgoOkPersonalityScaleType;
  itemCount: number;
  maxScore: number;
  relatedTabId: EgoOkReportTabId;
  /** 학지사 xlsx · 자료입력조건 시트 결과 항목(해당 시) */
  legacyReportSection?: string;
};

/** 대분류 → 중분류 → 소분류 (90문항 척도) + 연결 탭 */
export const EGO_OK_PERSONALITY_SCALE_TAXONOMY: EgoOkScaleTaxonomyNode[] = [
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · CP (비판적 부모)',
    minor: 'CP 긍정 (5문항)',
    formTag: 'CP · 긍',
    scaleType: 'cp_positive',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
    legacyReportSection: '243 이고그램 · 부정성(CP)',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · CP (비판적 부모)',
    minor: 'CP 부정 (5문항)',
    formTag: 'CP · 부',
    scaleType: 'cp_negative',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
    legacyReportSection: '부정성분석(CP)',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · NP (양육적 부모)',
    minor: 'NP 긍정 (5문항)',
    formTag: 'NP · 긍',
    scaleType: 'np_positive',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
    legacyReportSection: '부정성분석(NP)',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · NP (양육적 부모)',
    minor: 'NP 부정 (5문항)',
    formTag: 'NP · 부',
    scaleType: 'np_negative',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · A (성인)',
    minor: 'A 긍정 (5문항)',
    formTag: 'A · 긍',
    scaleType: 'a_positive',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
    legacyReportSection: '부정성분석(A)',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · A (성인)',
    minor: 'A 부정 (5문항)',
    formTag: 'A · 부',
    scaleType: 'a_negative',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · FC (자유로운 아이)',
    minor: 'FC 긍정 (5문항)',
    formTag: 'FC · 긍',
    scaleType: 'fc_positive',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
    legacyReportSection: '부정성분석(FC)',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · FC (자유로운 아이)',
    minor: 'FC 부정 (5문항)',
    formTag: 'FC · 부',
    scaleType: 'fc_negative',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · AC (순응하는 아이)',
    minor: 'AC 긍정 (5문항)',
    formTag: 'AC · 긍',
    scaleType: 'ac_positive',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
    legacyReportSection: '부정성분석(AC)',
  },
  {
    major: '이고-오케이 90문항',
    middle: '이고그램 · AC (순응하는 아이)',
    minor: 'AC 부정 (5문항)',
    formTag: 'AC · 부',
    scaleType: 'ac_negative',
    itemCount: 5,
    maxScore: 25,
    relatedTabId: 'egogram',
  },
  {
    major: '이고-오케이 90문항',
    middle: '오케이그램 · 타인(U)',
    minor: 'U+ 타인긍정 (10문항)',
    formTag: 'U+',
    scaleType: 'u_plus',
    itemCount: 10,
    maxScore: 50,
    relatedTabId: 'ok-life',
    legacyReportSection: '기본적인생태도 · 타인',
  },
  {
    major: '이고-오케이 90문항',
    middle: '오케이그램 · 타인(U)',
    minor: 'U− 타인부정 (10문항)',
    formTag: 'U−',
    scaleType: 'u_minus',
    itemCount: 10,
    maxScore: 50,
    relatedTabId: 'ok-life',
  },
  {
    major: '이고-오케이 90문항',
    middle: '오케이그램 · 자기(I)',
    minor: 'I+ 자기긍정 (10문항)',
    formTag: 'I+',
    scaleType: 'i_plus',
    itemCount: 10,
    maxScore: 50,
    relatedTabId: 'ok-life',
    legacyReportSection: '겉마음과 속마음',
  },
  {
    major: '이고-오케이 90문항',
    middle: '오케이그램 · 자기(I)',
    minor: 'I− 자기부정 (10문항)',
    formTag: 'I−',
    scaleType: 'i_minus',
    itemCount: 10,
    maxScore: 50,
    relatedTabId: 'ok-life',
  },
];

/** 상담사 보고서 탭 ↔ 학지사 결과 HTML 항목(자료입력조건) ↔ 90문항 척도 */
export const EGO_OK_TAB_TO_LEGACY_AND_SCALES: {
  tabId: EgoOkReportTabId;
  tabTitle: string;
  legacySections: string[];
  majorGroup: string;
}[] = [
  { tabId: 'cover', tabTitle: '종합 요약', legacySections: ['표지(앞)', '표지(뒤)'], majorGroup: '개요' },
  { tabId: 'basic', tabTitle: '기본정보 · 종합 점수', legacySections: ['표지(앞)'], majorGroup: '기본·종합표' },
  { tabId: 'scale-90', tabTitle: '90문항 척도별 분석', legacySections: ['(90문항 산출 척도)'], majorGroup: '90문항' },
  { tabId: 'validity', tabTitle: '타당도', legacySections: ['(검사 반응 — 96문항 중 6)'], majorGroup: '검사 반응 품질' },
  { tabId: 'ktaa', tabTitle: 'KTAA 종합 그래프', legacySections: ['종합적/개별적인 성격진단결과'], majorGroup: '통합 그래프' },
  { tabId: 'trait-overview', tabTitle: '전체적인 성격특성', legacySections: ['개인의 전체적인 성격특성'], majorGroup: '성격 요약' },
  { tabId: 'egogram', tabTitle: '이고그램 · 243 유형', legacySections: ['243 이고그램 유형'], majorGroup: '이고그램 50문항' },
  { tabId: 'plus243', tabTitle: '243+ Plus 해석', legacySections: ['243 이고그램 유형', '종합적/개별적인 성격진단결과'], majorGroup: '243+ 9단계' },
  { tabId: 'ok-life', tabTitle: '오케이그램 · 인생태도', legacySections: ['기본적인생태도'], majorGroup: '오케이그램 40문항' },
  { tabId: 'inner', tabTitle: '나의 속마음', legacySections: ['겉마음과 속마음의 비교'], majorGroup: '겉·속 마음' },
  { tabId: 'polarity', tabTitle: '이고그램-부정성', legacySections: ['부정성분석(CP~AC)'], majorGroup: '이고 부정성 비율' },
  { tabId: 'self-help', tabTitle: '자율치료 및 대책', legacySections: ['개선방안'], majorGroup: '상담·자율치료' },
  { tabId: 'career', tabTitle: '직업', legacySections: ['직업'], majorGroup: '생활 적용' },
  { tabId: 'marriage', tabTitle: '결혼생활', legacySections: ['결혼생활'], majorGroup: '생활 적용' },
];
