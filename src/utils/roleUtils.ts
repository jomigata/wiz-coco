// 역할 기반 접근 제어 유틸리티 함수들
// 이메일이 아닌 Firebase 로그인 사용자(uid)의 프로필 문서(/users/{uid}.role)를 기준으로 판단합니다.

export type AppRole = 'user' | 'counselor' | 'admin';

export const isAdmin = (role: unknown): boolean => role === 'admin';

export const isCounselor = (role: unknown): boolean => role === 'counselor' || role === 'admin';

export const shouldShowCounselorMenu = (role: unknown): boolean => isCounselor(role);

export const shouldShowAdminMenu = (role: unknown): boolean => isAdmin(role);

export const hasPageAccess = (role: unknown, pageType: 'counselor' | 'admin'): boolean => {
  if (pageType === 'counselor') return shouldShowCounselorMenu(role);
  if (pageType === 'admin') return shouldShowAdminMenu(role);
  return false;
};
