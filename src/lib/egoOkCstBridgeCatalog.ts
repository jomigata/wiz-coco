import type { EgoOkReportTabId } from '@/components/tests/egoOk/egoOkReportTabNav';
import type { EgoOkPersonalityScaleType } from '@/lib/egoOkReportScaleTaxonomy';

export type CstMinorDef = {
  id: string;
  label: string;
};

export type CstMiddleKind = 'scale-map' | 'composite-refs' | 'validity' | 'derived';

export type CstMiddleDef = {
  id: string;
  label: string;
  labelEn?: string;
  kind: CstMiddleKind;
  /** kind=scale-map: 이고-오케이 90문항 척도 */
  scaleTypes?: EgoOkPersonalityScaleType[];
  /** 원래 검사 하위척도 권장 문항 수(적합도·충분성 산출) */
  targetItemCount?: number;
  /** scaleType별 내용 적합도 0~1 */
  contentFit?: Partial<Record<EgoOkPersonalityScaleType, number>>;
  /** kind=composite-refs: 다른 중분류 id 평균 */
  refMiddleIds?: string[];
  /** kind=derived: 계산 키 */
  derivedKey?: string;
  minors: CstMinorDef[];
};

export type CstMajorDef = {
  id: string;
  label: string;
  labelEn: string;
  relatedTabId: EgoOkReportTabId;
  middles: CstMiddleDef[];
};

function minors(prefix: string, labels: [string, string, string]): CstMinorDef[] {
  return labels.map((label, i) => ({ id: `${prefix}.${i + 1}`, label }));
}

function scaleMiddle(
  id: string,
  label: string,
  labelEn: string,
  scaleTypes: EgoOkPersonalityScaleType[],
  minorLabels: [string, string, string],
  targetItemCount = 5,
  contentFit = 0.76,
): CstMiddleDef {
  const fitMap: Partial<Record<EgoOkPersonalityScaleType, number>> = {};
  for (const st of scaleTypes) fitMap[st] = contentFit;
  return {
    id,
    label,
    labelEn,
    kind: 'scale-map',
    scaleTypes,
    targetItemCount,
    contentFit: fitMap,
    minors: minors(id, minorLabels),
  };
}

/** CST(긍정심리학 성격강점) 대·중·소 — 이고-오케이 90문항 근사 매핑 (학지사 CST 시트 미연동) */
export const EGO_OK_CST_MAJORS: CstMajorDef[] = [
  {
    id: '1',
    label: '지혜 및 지식',
    labelEn: 'Wisdom & Knowledge',
    relatedTabId: 'scale-90',
    middles: [
      scaleMiddle('1.1', '창의성', 'Creativity', ['fc_positive', 'np_positive'], [
        '독창적 사고력',
        '아이디어 발산력',
        '실용적 구현력',
      ]),
      scaleMiddle('1.2', '호기심', 'Curiosity', ['fc_positive', 'a_positive'], [
        '새로운 대상에 대한 매혹',
        '능동적 탐색 행동',
        '다방면 관심도',
      ]),
      scaleMiddle('1.3', '개방성', 'Open-mindedness', ['a_positive', 'np_positive'], [
        '다각도 사고 유연성',
        '편견 없는 공정성',
        '반대 증거 수용력',
      ]),
      scaleMiddle('1.4', '학구열', 'Love of Learning', ['a_positive', 'cp_positive'], [
        '지식 습득 내적 동기',
        '학습 지속성 및 몰입',
        '전문 기술 숙달 욕구',
      ]),
      scaleMiddle('1.5', '지혜', 'Wisdom', ['a_positive', 'np_positive', 'u_plus'], [
        '전체 맥락 조망력',
        '핵심 꿰뚫기',
        '현명한 조언 및 자문력',
      ]),
    ],
  },
  {
    id: '2',
    label: '인간애',
    labelEn: 'Humanity',
    relatedTabId: 'scale-90',
    middles: [
      scaleMiddle('2.1', '사랑', 'Love', ['np_positive', 'u_plus'], [
        '친밀한 애착 형성력',
        '상호 애정 교환력',
        '정서적 헌신도',
      ]),
      scaleMiddle('2.2', '친절성', 'Kindness', ['np_positive', 'ac_positive'], [
        '이타적 조력 동기',
        '일상 속 배려 실천도',
        '타인 복지에 대한 관심',
      ]),
      scaleMiddle('2.3', '사회지능', 'Social Intelligence', ['np_positive', 'a_positive', 'u_plus'], [
        '타인 정서/의도 포착력',
        '사회적 역학 이해력',
        '대인관계 상황 적응력',
      ]),
    ],
  },
  {
    id: '3',
    label: '용기',
    labelEn: 'Courage',
    relatedTabId: 'scale-90',
    middles: [
      scaleMiddle('3.1', '용감성', 'Bravery', ['cp_positive', 'fc_positive'], [
        '위협 및 두려움 직면력',
        '신념 기반 행동력',
        '집단 동조 압박 저항',
      ]),
      scaleMiddle('3.2', '끈기', 'Perseverance', ['cp_positive', 'a_positive'], [
        '과업 완수력',
        '역경 극복 인내심',
        '장기 집중 지속도',
      ]),
      scaleMiddle('3.3', '진실성', 'Integrity', ['cp_positive', 'a_positive'], [
        '언행일치 및 정직성',
        '자기기만 배제',
        '결과에 대한 책임 수용',
      ]),
      scaleMiddle('3.4', '활력', 'Zest', ['fc_positive', 'np_positive'], [
        '심신 에너지 수준',
        '열정적 몰입도',
        '생동감 넘치는 태도',
      ]),
    ],
  },
  {
    id: '4',
    label: '절제',
    labelEn: 'Temperance',
    relatedTabId: 'scale-90',
    middles: [
      scaleMiddle('4.1', '관대성', 'Forgiveness', ['np_positive', 'ac_positive'], [
        '잘못한 타인 수용',
        '보복/앙심 억제력',
        '재기의 기회 부여',
      ]),
      scaleMiddle('4.2', '겸손', 'Humility', ['ac_positive', 'i_plus'], [
        '자화자찬 억제력',
        '주목 추구 절제',
        '자기 한계 인정도',
      ]),
      scaleMiddle('4.3', '신중성', 'Prudence', ['a_positive', 'cp_positive'], [
        '위험 예측 및 회피력',
        '장기적 영향 고려',
        '신중한 의사결정',
      ]),
      scaleMiddle('4.4', '자기조절', 'Self-Regulation', ['a_positive', 'ac_positive', 'cp_positive'], [
        '충동 및 본능 제어',
        '감정 표출 조절력',
        '자기 규율 및 규칙 준수',
      ]),
    ],
  },
  {
    id: '5',
    label: '정의',
    labelEn: 'Justice',
    relatedTabId: 'scale-90',
    middles: [
      scaleMiddle('5.1', '시민의식', 'Citizenship', ['u_plus', 'np_positive'], [
        '공동체 책임 의식',
        '협동 및 팀워크 실천',
        '조직 규범 준수도',
      ]),
      scaleMiddle('5.2', '공정성', 'Fairness', ['cp_positive', 'u_plus'], [
        '사적 감정 배제 객관성',
        '기회의 동등성 보장',
        '일관된 원칙 적용',
      ]),
      scaleMiddle('5.3', '리더십', 'Leadership', ['cp_positive', 'np_positive'], [
        '비전 제시 및 방향 설정',
        '구성원 사기 진작',
        '집단 갈등 조율 및 통합',
      ]),
    ],
  },
  {
    id: '6',
    label: '초월',
    labelEn: 'Transcendence',
    relatedTabId: 'scale-90',
    middles: [
      scaleMiddle('6.1', '심미안', 'Appreciation of Beauty', ['fc_positive', 'i_plus'], [
        '아름다움 인식 민감도',
        '탁월성에 대한 감동',
        '일상 속 의미 발견',
      ]),
      scaleMiddle('6.2', '감사', 'Gratitude', ['np_positive', 'u_plus'], [
        '긍정적 측면 인식력',
        '내적 축복감 체험',
        '적극적 감사 표현도',
      ]),
      scaleMiddle('6.3', '낙관성', 'Hope', ['np_positive', 'fc_positive'], [
        '미래 긍정 기대감',
        '문제 해결 가능성 신념',
        '목표 지향적 희망',
      ]),
      scaleMiddle('6.4', '유머감각', 'Humor', ['fc_positive', 'np_positive'], [
        '인생의 역설 포착력',
        '긴장 완화 및 재치',
        '타인에게 웃음 선사',
      ]),
      scaleMiddle('6.5', '영성', 'Spirituality', ['i_plus', 'ac_positive'], [
        '삶의 궁극적 의미 추구',
        '초월적 가치/신념 체계',
        '내적 평온감',
      ]),
    ],
  },
  {
    id: '7',
    label: '2차원 심리역동 모델',
    labelEn: '2D Structural Model',
    relatedTabId: 'trait-overview',
    middles: [
      {
        id: '7.1',
        label: '관계 지향성 차원',
        labelEn: 'Relationship Orientation',
        kind: 'composite-refs',
        refMiddleIds: [],
        minors: minors('7.1', [
          '자기지향 강점 지수 (Self)',
          '타인지향 강점 지수 (Other)',
          '관계 지향 편중도',
        ]),
        derivedKey: 'relationship-dimension',
      },
      {
        id: '7.2',
        label: '심리 기능 차원',
        labelEn: 'Psychological Function',
        kind: 'composite-refs',
        refMiddleIds: [],
        minors: minors('7.2', [
          '지성적 강점 지수 (Intellect)',
          '감성적 강점 지수 (Emotion)',
          '인지-정서 통합비',
        ]),
        derivedKey: 'function-dimension',
      },
    ],
  },
  {
    id: '8',
    label: '대표강점 및 삶의 적용',
    labelEn: 'Signature Strengths & Life Application',
    relatedTabId: 'scale-90',
    middles: [
      {
        id: '8.1',
        label: '대표강점 서열 및 집중도',
        labelEn: 'Strengths Profile Index',
        kind: 'derived',
        derivedKey: 'strength-profile',
        minors: minors('8.1', [
          '5대 대표강점 서열',
          '상위 강점 집중도',
          '프로파일 평탄도/분산도',
        ]),
      },
      {
        id: '8.2',
        label: '인생 영역별 강점 적용 지수',
        labelEn: 'Domain Application Index',
        kind: 'derived',
        derivedKey: 'domain-application',
        minors: minors('8.2', [
          '학업 및 직무 적응 지수',
          '대인관계 및 조직 적응 지수',
          '심리적 웰빙 및 회복탄력성 지수',
        ]),
      },
    ],
  },
  {
    id: '9',
    label: '검사 타당도 및 점수 보정',
    labelEn: 'Test Validity & Calibration',
    relatedTabId: 'validity',
    middles: [
      {
        id: '9.1',
        label: '응답 타당도 척도',
        labelEn: 'Response Validity Index',
        kind: 'validity',
        derivedKey: 'response-validity',
        minors: minors('9.1', [
          '사회적 선호도 보정 지수',
          '무작위/불성실 응답률',
          '극단 응답 경향성',
        ]),
      },
      {
        id: '9.2',
        label: '척도 점수 환산 지표',
        labelEn: 'Standardized Scoring',
        kind: 'derived',
        derivedKey: 'standardized-scoring',
        minors: minors('9.2', [
          '원점수 평균 (0.00~3.00)',
          '보정 T점수 (평균 50)',
          '백분위 순위 (%)',
        ]),
      },
    ],
  },
];

/** 7.1·7.2 소분류 계산용 — VIA 중분류 id */
export const CST_SELF_ORIENT_MIDDLE_IDS = ['3.1', '3.3', '1.4', '1.2', '3.4', '6.3'] as const;
export const CST_OTHER_ORIENT_MIDDLE_IDS = ['5.1', '2.1', '2.2', '5.3', '5.2', '4.1'] as const;
export const CST_INTELLECT_MIDDLE_IDS = ['1.1', '1.2', '1.3', '1.4', '1.5', '4.3'] as const;
export const CST_EMOTION_MIDDLE_IDS = ['2.1', '3.4', '6.1', '6.2', '6.3', '6.4', '6.5'] as const;

export const CST_DOMAIN_WORK_MIDDLE_IDS = ['1.1', '1.4', '3.2', '4.3', '4.4'] as const;
export const CST_DOMAIN_RELATION_MIDDLE_IDS = ['2.1', '2.2', '2.3', '5.1'] as const;
export const CST_DOMAIN_WELLBEING_MIDDLE_IDS = ['3.4', '6.3', '6.2', '6.1', '6.4'] as const;

export const CST_VIA_MIDDLE_IDS = EGO_OK_CST_MAJORS.filter((m) => m.id >= '1' && m.id <= '6').flatMap((m) =>
  m.middles.map((mid) => mid.id),
);

import { EGO_OK_INTEGRATED_EXTRA_MAJORS } from '@/lib/egoOkIntegratedScaleCatalog';

/** CST(1~9) + 통합 임상·성격 척도(10~19) */
export const EGO_OK_ALL_SCALE_MAJORS: CstMajorDef[] = [...EGO_OK_CST_MAJORS, ...EGO_OK_INTEGRATED_EXTRA_MAJORS];
