/**
 * 멤버십 및 구독 관련 타입 정의
 * 준회원(Explorer) / 정회원 - Professional / 정회원 - Clinic 3단계 구조
 */

import type { Timestamp } from 'firebase/firestore';

/** 멤버십 등급 */
export type MembershipTier = 'explorer' | 'professional' | 'clinic';

/** 멤버십 회원 구분 */
export type MembershipClass = 'associate' | 'full'; // 준회원 | 정회원

/** 결제 주기 */
export type BillingCycle = 'monthly' | 'yearly';

/** 구독 상태 */
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';

/** 결제 수단 */
export type PaymentMethod = 'card' | 'bank_transfer' | 'virtual_account';

/** Add-on 유료 기능 목록 */
export type AddonFeatureId =
  | 'extra_credits_10'      // 추가 크레딧 10개
  | 'extra_credits_30'      // 추가 크레딧 30개
  | 'voice_biomarker'       // 음성 바이오마커 분석
  | 'full_battery_test'     // Full-battery 종합심리검사
  | 'expert_webinar'        // 전문가 웨비나
  | 'custom_branding'       // 완전 맞춤 브랜딩
  | 'additional_counselor'; // 추가 상담사 계정 (Clinic 전용)

/** 선택된 Add-on 유료 기능 */
export interface SubscriptionAddon {
  featureId: AddonFeatureId;
  name: string;
  price: number;           // 월 금액 (원)
  quantity: number;        // 수량
  addedAt: Timestamp | { _seconds: number; _nanoseconds: number };
}

/** 결제 이력 항목 */
export interface PaymentHistoryItem {
  id: string;
  amount: number;           // 결제 금액 (원)
  baseAmount: number;       // 기본 플랜 금액
  addonAmount: number;      // Add-on 합계
  billingDate: Timestamp | { _seconds: number; _nanoseconds: number };
  status: 'paid' | 'failed' | 'refunded' | 'pending';
  method: PaymentMethod;
  description: string;
  receiptUrl?: string;
  failReason?: string;
}

/**
 * subscriptions 컬렉션 문서
 * 경로: /subscriptions/{userId}
 */
export interface Subscription {
  /** Firebase 사용자 UID */
  uid: string;
  /** 멤버십 등급 */
  tier: MembershipTier;
  /** 회원 구분 (준회원/정회원) */
  memberClass: MembershipClass;
  /** 결제 주기 */
  billingCycle: BillingCycle;
  /** 구독 상태 */
  status: SubscriptionStatus;
  /** 기본 플랜 월 금액 (원, 0 = 무료) */
  basePrice: number;
  /** 연간 결제 여부에 따른 실제 월 금액 */
  effectiveMonthlyPrice: number;
  /** 선택된 Add-on 목록 */
  addons: SubscriptionAddon[];
  /** 이번 달 Add-on 합계 금액 */
  addonTotal: number;
  /** 이번 달 총 청구 예정 금액 */
  totalMonthlyAmount: number;
  /** 다음 결제일 */
  nextBillingDate: Timestamp | { _seconds: number; _nanoseconds: number } | null;
  /** 구독 시작일 */
  startedAt: Timestamp | { _seconds: number; _nanoseconds: number };
  /** 마지막 업데이트 */
  updatedAt: Timestamp | { _seconds: number; _nanoseconds: number };
  /** 트라이얼 종료일 */
  trialEndsAt?: Timestamp | { _seconds: number; _nanoseconds: number } | null;
  /** 취소 예약일 (다운그레이드/해지 예약) */
  cancelAt?: Timestamp | { _seconds: number; _nanoseconds: number } | null;
  /** 취소 사유 */
  cancelReason?: string;
  /** AI 크레딧 현황 (Professional 플랜용) */
  credits?: {
    total: number;
    used: number;
    resetAt: Timestamp | { _seconds: number; _nanoseconds: number };
  };
  /** 활성 상담사 계정 수 (Clinic 전용) */
  counselorSeats?: number;
  /** 사용 중인 저장 공간 (MB) */
  storageUsedMb?: number;
  /** 활성 고객 수 */
  activeClientsCount?: number;
}

/** Firestore 조회 결과용 (id 포함) */
export interface SubscriptionDocument extends Subscription {
  id: string;
}

/** 플랜별 기능 정의 */
export interface PlanFeature {
  label: string;
  explorer: string | boolean;
  professional: string | boolean;
  clinic: string | boolean;
  highlight?: boolean;
}

/** 플랜 정보 */
export interface MembershipPlan {
  id: MembershipTier;
  name: string;
  nameKo: string;
  tagline: string;
  memberClass: MembershipClass;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  yearlyTotalPrice: number;
  currency: 'KRW';
  color: string;
  icon: string;
  badge?: string;
  description: string;
  targetAudience: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

/** Add-on 기능 카탈로그 */
export interface AddonCatalogItem {
  id: AddonFeatureId;
  name: string;
  description: string;
  price: number;
  unit: string;
  availableFor: MembershipTier[];
  icon: string;
  category: 'credit' | 'feature' | 'seat' | 'education';
}

/** 컬렉션 이름 상수 */
export const MEMBERSHIP_COLLECTIONS = {
  /** @deprecated 클라이언트는 users 문서의 membership 필드를 사용. 서버/결제 연동용으로 이름만 유지 */
  SUBSCRIPTIONS: 'subscriptions',
  PAYMENT_HISTORY: 'paymentHistory',
} as const;

/** Firestore `users/{uid}` 문서에 저장되는 멤버십 필드명 (기존 users 쓰기 규칙으로 동기화 가능) */
export const USER_MEMBERSHIP_FIELD = 'membership' as const;

export const USERS_COLLECTION = 'users' as const;

/** 플랜별 기능 제한 상수 */
export const PLAN_LIMITS = {
  explorer: {
    maxClients: 3,
    storageGb: 1,
    aiCreditsPerMonth: 5,
    counselorSeats: 1,
    templateSlots: 3,
  },
  professional: {
    maxClients: 30,
    storageGb: 50,
    aiCreditsPerMonth: 50,
    counselorSeats: 1,
    templateSlots: -1, // 무제한
  },
  clinic: {
    maxClients: -1, // 무제한
    storageGb: 100, // 사용자당
    aiCreditsPerMonth: -1, // 무제한
    counselorSeats: 2, // 기본 2인, 추가 가능
    templateSlots: -1,
  },
} as const;

/** Add-on 카탈로그 */
export const ADDON_CATALOG: AddonCatalogItem[] = [
  {
    id: 'extra_credits_10',
    name: '추가 크레딧 10개',
    description: 'AI 리포트 생성 크레딧 10개 추가 구매',
    price: 10000,
    unit: '10크레딧',
    availableFor: ['professional'],
    icon: '🎫',
    category: 'credit',
  },
  {
    id: 'extra_credits_30',
    name: '추가 크레딧 30개',
    description: 'AI 리포트 생성 크레딧 30개 추가 구매 (10% 할인)',
    price: 27000,
    unit: '30크레딧',
    availableFor: ['professional'],
    icon: '🎟️',
    category: 'credit',
  },
  {
    id: 'voice_biomarker',
    name: '음성 바이오마커 분석',
    description: '음성 데이터를 활용한 심리 상태 바이오마커 분석',
    price: 29000,
    unit: '월',
    availableFor: ['clinic'],
    icon: '🎙️',
    category: 'feature',
  },
  {
    id: 'full_battery_test',
    name: 'Full-battery 종합심리검사',
    description: '전문 종합심리검사 1건 (저작권료 포함)',
    price: 50000,
    unit: '건',
    availableFor: ['professional', 'clinic'],
    icon: '🧠',
    category: 'feature',
  },
  {
    id: 'expert_webinar',
    name: '전문가 웨비나 참여권',
    description: '월 1회 전문가 초빙 온라인 교육 및 워크숍',
    price: 30000,
    unit: '월',
    availableFor: ['explorer', 'professional', 'clinic'],
    icon: '📡',
    category: 'education',
  },
  {
    id: 'additional_counselor',
    name: '추가 상담사 계정',
    description: 'Clinic 플랜에 상담사 계정 1개 추가',
    price: 39000,
    unit: '월/1인',
    availableFor: ['clinic'],
    icon: '👩‍⚕️',
    category: 'seat',
  },
];

/** 멤버십 플랜 정보 */
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'explorer',
    name: 'Explorer',
    nameKo: '탐색가 (준회원)',
    tagline: 'AI 기능 맛보기와 개인적 활용',
    memberClass: 'associate',
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlyTotalPrice: 0,
    currency: 'KRW',
    color: 'emerald',
    icon: '🌱',
    description: '심리학 전공 학생, 수련 상담사, 플랫폼을 처음 접하는 분들을 위한 무료 플랜',
    targetAudience: '심리학 전공 학생, 수련 상담사, 초입자',
    features: [
      '활성 고객 최대 3명',
      'AI 인테이크 프로파일러 5 크레딧/월',
      'AI 상담 리포트 자동 생성 5 크레딧/월',
      '기본 태그 5개',
      '저장 공간 1GB',
      '개인 예약 링크 공유',
      '커뮤니케이션 템플릿 3개 저장',
      '커뮤니티 지원',
    ],
    limitations: [
      '실시간 AI 상담 코파일럿 미포함',
      '나만의 브랜딩 리포트 미포함',
      '팀 기능 미포함',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    nameKo: '전문가 (정회원)',
    tagline: '개인 상담사를 위한 완벽한 AI 파트너',
    memberClass: 'full',
    monthlyPrice: 59000,
    yearlyMonthlyPrice: 47200,
    yearlyTotalPrice: 566400,
    currency: 'KRW',
    color: 'blue',
    icon: '⚡',
    badge: '인기',
    description: '독립적으로 활동하는 개인 상담사, 소규모 상담실 운영자를 위한 핵심 플랜',
    targetAudience: '개인 상담사, 소규모 상담실',
    popular: true,
    features: [
      '활성 고객 최대 30명',
      'AI 인테이크 프로파일러 50 크레딧/월',
      'AI 상담 리포트 자동 생성 50 크레딧/월',
      '실시간 AI 상담 코파일럿 (무제한)',
      'AI 기반 장기 추적 리포트',
      '무제한 고객 태그',
      '저장 공간 50GB',
      '커뮤니케이션 템플릿 무제한 저장',
      '나만의 브랜딩 리포트 (로고 삽입)',
      '전자 서명 및 보안 문서함',
      '이메일 지원',
    ],
    limitations: [
      '고급 AI 슈퍼비전 미포함',
      'AI 위기 신호 감지 미포함',
      '팀 기능 미포함',
    ],
  },
  {
    id: 'clinic',
    name: 'Clinic',
    nameKo: '기관/클리닉 (정회원+)',
    tagline: '팀 협업과 비즈니스 성장을 위한 통합 솔루션',
    memberClass: 'full',
    monthlyPrice: 149000,
    yearlyMonthlyPrice: 119200,
    yearlyTotalPrice: 1430400,
    currency: 'KRW',
    color: 'purple',
    icon: '🏥',
    description: '2인 이상 그룹 상담센터, 대학 학생상담센터, EAP 기업, 연구기관을 위한 프리미엄 플랜',
    targetAudience: '그룹 상담센터, 대학상담센터, EAP 기업',
    features: [
      '무제한 활성 고객',
      'AI 기능 모두 무제한',
      '실시간 AI 상담 코파일럿 (무제한)',
      'AI 슈퍼비전 미러',
      'AI 관계 역학 분석기',
      'AI 위기 신호 사전 감지',
      'AI 상담기법 추천 엔진',
      '상담사 계정 2인 기본 포함',
      '팀 공유 템플릿 무제한',
      '사용자당 저장 공간 100GB',
      '완전 맞춤 브랜딩 리포트',
      '팀 대시보드 및 관리자 기능',
      '고객 데이터 접근 제어',
      '전담 매니저 및 전화 지원',
      '계좌이체 및 세금계산서 발행',
    ],
  },
];
