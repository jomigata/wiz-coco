export type CounselorPracticeType = 'solo' | 'organization';

export interface CounselorProfileData {
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  experience: number;
  /** 활동 지역 (구 학력 필드 대체) */
  region: string;
  /** @deprecated Firestore 호환용 — region과 동기화 */
  education: string;
  bio: string;
  /** @deprecated UI 미사용 */
  license: string;
  practiceType: CounselorPracticeType;
  /** 기관명/회사명 */
  organizationName: string;
  reportDisplayName: string;
}

export const COUNSELOR_REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export const COUNSELOR_SPECIALIZATIONS = [
  '개인상담',
  '가족상담',
  '커플상담',
  '청소년상담',
  '노인상담',
  '우울증',
  '불안장애',
  '트라우마',
  '중독',
  '성격장애',
  '직장상담',
  '진로상담',
  '학습상담',
  '인간관계',
  '기타',
] as const;

export const EMPTY_COUNSELOR_PROFILE: CounselorProfileData = {
  name: '',
  email: '',
  phone: '',
  specialization: [],
  experience: 0,
  region: '',
  education: '',
  bio: '',
  license: '',
  practiceType: 'solo',
  organizationName: '',
  reportDisplayName: '',
};
