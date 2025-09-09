// 역할 기반 접근 제어 유틸리티 함수들

export interface UserRole {
  email: string;
  role: 'user' | 'counselor' | 'admin';
  isCounselorVerified?: boolean;
  isAdminVerified?: boolean;
}

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  'jomigata@gmail.com',
  'wizcocoai@gmail.com'
];

// 상담사 인증된 사용자 확인
export const isCounselorVerified = (userEmail: string): boolean => {
  // 실제 구현에서는 Firestore에서 상담사 인증 상태를 확인
  // 현재는 임시로 특정 이메일들만 상담사로 인증된 것으로 처리
  const verifiedCounselors = [
    'counselor1@example.com',
    'counselor2@example.com',
    // 관리자 이메일도 상담사 권한을 가짐
    ...ADMIN_EMAILS
  ];
  
  return verifiedCounselors.includes(userEmail);
};

// 관리자 권한 확인
export const isAdmin = (userEmail: string): boolean => {
  return ADMIN_EMAILS.includes(userEmail);
};

// 사용자 역할 결정
export const getUserRole = (userEmail: string): UserRole['role'] => {
  if (isAdmin(userEmail)) {
    return 'admin';
  } else if (isCounselorVerified(userEmail)) {
    return 'counselor';
  } else {
    return 'user';
  }
};

// 상담사 메뉴 표시 여부 확인
export const shouldShowCounselorMenu = (userEmail: string): boolean => {
  return isCounselorVerified(userEmail) || isAdmin(userEmail);
};

// 관리자 메뉴 표시 여부 확인
export const shouldShowAdminMenu = (userEmail: string): boolean => {
  return isAdmin(userEmail);
};

// 페이지 접근 권한 확인
export const hasPageAccess = (userEmail: string, pageType: 'counselor' | 'admin'): boolean => {
  if (pageType === 'counselor') {
    return shouldShowCounselorMenu(userEmail);
  } else if (pageType === 'admin') {
    return shouldShowAdminMenu(userEmail);
  }
  return false;
};
