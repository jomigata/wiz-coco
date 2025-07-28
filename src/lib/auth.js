import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

// JWT 환경 변수
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-must-be-changed-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h'; // 기본 24시간 유효

// JWT 인코딩 시크릿 생성
const secretKey = new TextEncoder().encode(JWT_SECRET);

/**
 * JWT 토큰 생성
 * @param {Object} payload - 토큰에 포함할 데이터
 * @returns {Promise<string>} - 생성된 JWT 토큰
 */
export async function createToken(payload) {
  try {
    // 사용자 고유 식별자 확인
    if (!payload.userId && !payload.email) {
      throw new Error('토큰 생성을 위한 사용자 식별자가 필요합니다.');
    }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRY)
      .sign(secretKey);

    return token;
  } catch (error) {
    console.error('토큰 생성 오류:', error);
    throw new Error('인증 토큰 생성 중 오류가 발생했습니다.');
  }
}

/**
 * JWT 토큰 검증
 * @param {string} token - 검증할 JWT 토큰
 * @returns {Promise<Object>} - 디코딩된 토큰 페이로드
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload;
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    throw new Error('유효하지 않거나 만료된 인증 토큰입니다.');
  }
}

/**
 * 쿠키에서 토큰 가져오기
 * @returns {string|null} 쿠키에 저장된 토큰 또는 null
 */
export function getTokenFromCookies() {
  try {
    const cookieStore = cookies();
    return cookieStore.get('auth_token')?.value || null;
  } catch (error) {
    console.error('쿠키 접근 오류:', error);
    return null;
  }
}

/**
 * 현재 인증된 사용자 가져오기
 * @returns {Promise<Object|null>} - 인증된 사용자 정보 또는 null
 */
export async function getCurrentUser() {
  try {
    const token = getTokenFromCookies();
    
    if (!token) {
      return null;
    }
    
    const payload = await verifyToken(token);
    
    // 사용자 ID가 없는 경우
    if (!payload.userId) {
      return null;
    }
    
    // 여기서 데이터베이스에서 사용자 정보를 가져올 수 있음
    // 예: const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    
    // 현재는 토큰 페이로드만 반환
    return {
      id: payload.userId,
      email: payload.email,
      role: payload.role || 'user',
    };
  } catch (error) {
    console.error('현재 사용자 조회 오류:', error);
    return null;
  }
}

/**
 * 사용자가 인증되었는지 확인
 * @returns {Promise<boolean>} - 인증 여부
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * 사용자가 특정 역할을 가지고 있는지 확인
 * @param {string} role - 필요한 역할
 * @returns {Promise<boolean>} - 역할 확인 결과
 */
export async function hasRole(role) {
  const user = await getCurrentUser();
  
  if (!user) {
    return false;
  }
  
  return user.role === role;
}

/**
 * 클라이언트 측에서 로그인 처리
 * @param {string} token - JWT 토큰
 * @param {boolean} remember - 로그인 유지 여부
 */
export function clientLogin(token, remember = false) {
  if (typeof window !== 'undefined') {
    // 토큰 저장
    localStorage.setItem('auth_token', token);
    
    // 로그인 상태 저장 (선택적)
    if (remember) {
      localStorage.setItem('remember_login', 'true');
    }
  }
}

/**
 * 클라이언트 측에서 로그아웃 처리
 */
export function clientLogout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('remember_login');
    
    // 리디렉션 등 추가 로직
    window.location.href = '/auth/login';
  }
}

/**
 * 서버 측에서 로그아웃 처리
 */
export function serverLogout() {
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('user_role');
} 