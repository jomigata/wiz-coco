/**
 * 사용자 계정 관리 시스템
 * 같은 이메일로 여러 인증 방법 지원
 */

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'counselor' | 'admin';
  authMethods: AuthMethod[];
  createdAt: string;
  lastLoginAt?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface AuthMethod {
  provider: 'email' | 'google' | 'naver' | 'kakao';
  providerId: string;
  createdAt: string;
  lastUsedAt?: string;
}

export class UserAccountManager {
  private static accounts: Map<string, UserAccount> = new Map();
  private static nextId = 1;

  // 테스트용 샘플 데이터 초기화
  static {
    // SNS로만 가입된 사용자 (이메일/비밀번호 없음)
    this.accounts.set('1', {
      id: '1',
      email: 'test@gmail.com',
      name: '테스트 사용자',
      role: 'user',
      authMethods: [{
        provider: 'google',
        providerId: 'google_123',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'active'
    });

    // 이메일/비밀번호로만 가입된 사용자
    this.accounts.set('2', {
      id: '2',
      email: 'email@example.com',
      name: '이메일 사용자',
      role: 'user',
      authMethods: [{
        provider: 'email',
        providerId: 'email_456',
        createdAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'active'
    });

    // 여러 인증 방법을 가진 사용자
    this.accounts.set('3', {
      id: '3',
      email: 'multi@naver.com',
      name: '다중 사용자',
      role: 'user',
      authMethods: [
        {
          provider: 'email',
          providerId: 'email_789',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString()
        },
        {
          provider: 'naver',
          providerId: 'naver_101',
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'active'
    });
  }

  /**
   * 이메일로 사용자 계정 찾기
   */
  static findUserByEmail(email: string): UserAccount | null {
    const accounts = Array.from(this.accounts.values());
    for (const account of accounts) {
      if (account.email.toLowerCase() === email.toLowerCase()) {
        return account;
      }
    }
    return null;
  }

  /**
   * 사용자 계정 생성 또는 업데이트
   */
  static createOrUpdateUser(
    email: string,
    name: string,
    provider: 'email' | 'google' | 'naver' | 'kakao',
    providerId: string,
    role: 'user' | 'counselor' | 'admin' = 'user'
  ): UserAccount {
    const existingUser = this.findUserByEmail(email);
    
    if (existingUser) {
      // 기존 사용자에 새로운 인증 방법 추가
      const existingMethod = existingUser.authMethods.find(
        method => method.provider === provider
      );
      
      if (!existingMethod) {
        existingUser.authMethods.push({
          provider,
          providerId,
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString()
        });
      } else {
        existingMethod.lastUsedAt = new Date().toISOString();
      }
      
      existingUser.lastLoginAt = new Date().toISOString();
      return existingUser;
    } else {
      // 새 사용자 생성
      const newUser: UserAccount = {
        id: (this.nextId++).toString(),
        email: email.toLowerCase(),
        name,
        role,
        authMethods: [{
          provider,
          providerId,
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString()
        }],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        status: 'active'
      };
      
      this.accounts.set(newUser.id, newUser);
      return newUser;
    }
  }

  /**
   * 사용자 인증 방법 확인
   */
  static hasAuthMethod(email: string, provider: 'email' | 'google' | 'naver' | 'kakao'): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    
    return user.authMethods.some(method => method.provider === provider);
  }

  /**
   * 사용자의 모든 인증 방법 조회
   */
  static getUserAuthMethods(email: string): AuthMethod[] {
    const user = this.findUserByEmail(email);
    return user ? user.authMethods : [];
  }

  /**
   * 사용자 계정 정보 조회
   */
  static getUserInfo(email: string): UserAccount | null {
    return this.findUserByEmail(email);
  }

  /**
   * 모든 사용자 목록 조회
   */
  static getAllUsers(): UserAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * 사용자 역할 업데이트
   */
  static updateUserRole(email: string, role: 'user' | 'counselor' | 'admin'): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    
    user.role = role;
    return true;
  }

  /**
   * 사용자 상태 업데이트
   */
  static updateUserStatus(email: string, status: 'active' | 'inactive' | 'suspended'): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    
    user.status = status;
    return true;
  }

  /**
   * 사용자 계정 삭제
   */
  static deleteUser(email: string): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    
    this.accounts.delete(user.id);
    return true;
  }

  /**
   * 인증 방법 제거
   */
  static removeAuthMethod(email: string, provider: 'email' | 'google' | 'naver' | 'kakao'): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    
    const methodIndex = user.authMethods.findIndex(method => method.provider === provider);
    if (methodIndex === -1) return false;
    
    user.authMethods.splice(methodIndex, 1);
    
    // 모든 인증 방법이 제거되면 계정 비활성화
    if (user.authMethods.length === 0) {
      user.status = 'inactive';
    }
    
    return true;
  }
}
