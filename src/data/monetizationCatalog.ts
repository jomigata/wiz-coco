/** 협회·B2B2C 중심 수익화 상품 카탈로그 (1단계: 정적, Admin/PG 연동 전) */

export type MonetizationChannel = 'b2b2c' | 'b2b' | 'b2c';

export interface MonetizationProduct {
  id: string;
  channel: MonetizationChannel;
  name: string;
  description: string;
  priceLabel: string;
  priceNote?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel: string;
  ctaHref: string;
}

export const monetizationChannelSummaries: {
  id: MonetizationChannel;
  title: string;
  subtitle: string;
  bullets: string[];
}[] = [
  {
    id: 'b2b2c',
    title: '전문상담사 · 센터',
    subtitle: 'B2B2C — 도매 크레딧 · 코드 발송',
    bullets: [
      '내담자에게 나의코드·링크 발송 (회원가입 불필요)',
      '검사 결과는 상담사에게 우선 전달',
      '상담사가 판매가·상담료에 검사비 포함 가능',
    ],
  },
  {
    id: 'b2b',
    title: '학교 · 기업 · 기관',
    subtitle: 'B2B — 선결제 · 0원 입장',
    bullets: [
      '기관 담당자 1명 계약, 임직원·학생은 무료 검사',
      '반·부서별 cohort 일괄 발송 (최대 2,000명)',
      '익명 조직 통계 리포트 (3단계에서 별도 과금)',
    ],
  },
  {
    id: 'b2c',
    title: '개인 (협회 직판)',
    subtitle: 'B2C — 2단계 이후 본격화',
    bullets: [
      '코드 또는 1회 결제로 검사 (2단계 PG 연동)',
      'No-Name Policy · 선택적 결과 삭제 안내',
      '해석 상담 연결 (선택)',
    ],
  },
];

/** 상담사·기관 대상 파일럿·정식 패키지 */
export const counselorMonetizationProducts: MonetizationProduct[] = [
  {
    id: 'pilot-50',
    channel: 'b2b2c',
    name: '파일럿 패키지',
    description: '협회 승인 상담사 파일럿 — 검사코드(내담자 1명 = 1크레딧)',
    priceLabel: '무료 50크레딧',
    priceNote: '1단계 파일럿 한정 · 협회 Admin 지급',
    features: ['검사코드 50건 상당', '일괄 발송·진행률 대시보드', '결과 PDF·상담사 열람'],
    highlighted: true,
    ctaLabel: '상담사 신청',
    ctaHref: '/counselor-application/',
  },
  {
    id: 'counselor-starter',
    channel: 'b2b2c',
    name: '스타터',
    description: '월 정기 크레딧 (2단계 PG 연동 예정)',
    priceLabel: '월 150,000원',
    priceNote: '20크레딧 · 초과 건당 7,500원',
    features: ['월 20크레딧', '카카오·문자 발송', '상담사 전용 지원'],
    ctaLabel: '구매하기',
    ctaHref: '/counselor/credits/',
  },
  {
    id: 'counselor-pro',
    channel: 'b2b2c',
    name: '프로',
    description: '활동량 많은 상담사·센터',
    priceLabel: '월 250,000원',
    priceNote: '50크레딧 · 초과 건당 6,000원',
    features: ['월 50크레딧', '우선 지원', '센터 로고 (3단계 화이트라벨)'],
    ctaLabel: '구매하기',
    ctaHref: '/counselor/credits/',
  },
];

export const orgMonetizationProducts: MonetizationProduct[] = [
  {
    id: 'org-class-30',
    channel: 'b2b',
    name: '학급·부서 패키지',
    description: '30명 일괄 검사 + 진행률 모니터링',
    priceLabel: '200,000 ~ 400,000원',
    priceNote: '협의 · 선결제',
    features: ['30 크레딧 상당', 'cohort 관리', '담당자 대시보드'],
    ctaLabel: '기관 문의',
    ctaHref: '/partners/#inquiry',
  },
  {
    id: 'org-100',
    channel: 'b2b',
    name: '기관 100명',
    description: 'EAP·진로·적성 일괄 실시',
    priceLabel: '약 500,000원',
    priceNote: '그룹 분석 리포트 +300,000원 (3단계)',
    features: ['100명 일괄', '익명 통계 (예정)', '연간 갱신 할인'],
    highlighted: true,
    ctaLabel: '제안서 요청',
    ctaHref: '/partners/#inquiry',
  },
];

export const PILOT_FREE_CREDITS = 50;

/** B2C Discover 개인 이용권 (4단계) */
export const b2cMonetizationProducts: MonetizationProduct[] = [
  {
    id: 'b2c-basic',
    channel: 'b2c',
    name: 'Basic 리포트',
    description: '미니 검사 후 요약·패턴 정리',
    priceLabel: '5,000원',
    priceNote: '1년 이용 · Discover 경로',
    features: ['요약 PDF', '6문항 확장 해석', 'No-Name Policy'],
    ctaLabel: '구매하기',
    ctaHref: '/discover/shop/?tier=basic',
  },
  {
    id: 'b2c-premium',
    channel: 'b2c',
    name: 'Premium 심층',
    description: '스트레스·정서 패턴 심층 분석',
    priceLabel: '15,000원',
    priceNote: '1년 이용',
    features: ['심층 리포트', '대처 전략 제안', 'Premium 등급 유지'],
    highlighted: true,
    ctaLabel: '구매하기',
    ctaHref: '/discover/shop/?tier=premium',
  },
  {
    id: 'b2c-pro',
    channel: 'b2c',
    name: 'Pro + 상담 연결',
    description: '리포트 + 협회 상담사 매칭 (파일럿)',
    priceLabel: '50,000원',
    priceNote: '1년 · 상담 별도',
    features: ['Pro 등급', '상담 연결 안내', '우선 지원'],
    ctaLabel: '구매하기',
    ctaHref: '/discover/shop/?tier=pro',
  },
];

export const privacyTrustPoints = [
  {
    title: '회원가입 없이 시작',
    body: '나의코드와 4자리 PIN만으로 검사실 입장. 실명·이메일은 선택입니다.',
  },
  {
    title: '결제와 검사 데이터 분리',
    body: '결제 정보와 검사 결과는 분리 저장합니다. (2단계 PG 연동 시 적용)',
  },
  {
    title: '보관 기간 선택',
    body: 'B2C 직판 경로는 열람 후 30일 자동 삭제 안내(예정). 상담·기관 계약은 별도 보관.',
  },
  {
    title: '협회 품질 관리',
    body: '검사지·상담사 자격은 협회(플랫폼)가 승인·관리합니다.',
  },
];
