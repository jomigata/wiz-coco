import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendEmailVerification,
  signInWithCustomToken,
} from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { UserAccountManager } from './userAccountManager';

// 로깅 헬퍼 함수
const logToFirebase = async (level: string, message: string, data?: any) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data || {},
      source: 'account-integration'
    };
    
    // Firebase Functions로 로그 전송
    await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    console.error('[Logging] Firebase 로그 전송 실패:', error);
  }
};

export interface AccountInfo {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  providerId: string;
  isEmailVerified: boolean;
}

/**
 * 이메일 기반 계정 통합 관리
 */
export class AccountIntegrationManager {
  /**
   * 이메일로 기존 계정 찾기 (Firebase + NextAuth)
   */
  static async findExistingAccount(email: string): Promise<{
    firebaseAccount?: AccountInfo;
    nextAuthAccount?: AccountInfo;
  }> {
    try {
      // Firebase 계정 확인 (실제로는 서버에서 확인해야 함)
      // 여기서는 클라이언트에서 확인할 수 있는 방법을 사용
      console.log(`[AccountIntegration] 이메일 ${email}로 기존 계정 검색 중...`);
      
      return {
        firebaseAccount: undefined, // 서버에서 확인 필요
        nextAuthAccount: undefined // 서버에서 확인 필요
      };
    } catch (error) {
      console.error('[AccountIntegration] 계정 검색 오류:', error);
      return {};
    }
  }

  /**
   * 이메일/비밀번호로 로그인 시도
   */
  static async signInWithEmail(email: string, password: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    needsAccountLinking?: boolean;
    snsAuthMethods?: string[];
  }> {
    try {
      console.log('[AccountIntegration] 이메일 로그인 시도:', { email });
      await logToFirebase('info', '이메일 로그인 시도', { email });
      
      // 먼저 사용자 계정 관리 시스템에서 확인
      const userAccount = UserAccountManager.findUserByEmail(email);
      
      if (!userAccount) {
        console.log('[AccountIntegration] 사용자 계정을 찾을 수 없음:', { email });
        await logToFirebase('warn', '사용자 계정을 찾을 수 없음', { email });
        
        return {
          success: false,
          error: '등록되지 않은 이메일입니다.',
          needsAccountLinking: false
        };
      }
      
      console.log('[AccountIntegration] 사용자 계정 발견:', { 
        email, 
        authMethods: userAccount.authMethods.map(m => m.provider) 
      });
      await logToFirebase('info', '사용자 계정 발견', { 
        email, 
        authMethods: userAccount.authMethods.map(m => m.provider) 
      });

      // Firebase Authentication으로 이메일/비밀번호 로그인 시도
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, email, password);
        console.log('[AccountIntegration] Firebase 로그인 성공:', {
          uid: result.user.uid,
          email: result.user.email
        });
      } catch (firebaseError: any) {
        console.log('[AccountIntegration] Firebase 로그인 실패, 에러 코드:', firebaseError.code);
        
        // Firebase에 계정이 없는 경우, 자동으로 생성
        if (firebaseError.code === 'auth/user-not-found') {
          console.log('[AccountIntegration] Firebase에 계정이 없어 자동 생성합니다:', email);
          
          try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            result = await createUserWithEmailAndPassword(auth, email, password);
            
            console.log('[AccountIntegration] Firebase 계정 자동 생성 완료:', {
              uid: result.user.uid,
              email: result.user.email
            });
          } catch (createError: any) {
            console.error('[AccountIntegration] Firebase 계정 생성 실패:', createError);
            throw createError;
          }
        } else {
          console.error('[AccountIntegration] Firebase 로그인 에러:', firebaseError);
          throw firebaseError;
        }
      }
      
      // 사용자 계정 정보 업데이트 (2중 가입된 경우에도 정상 작동)
      UserAccountManager.createOrUpdateUser(
        email,
        result.user.displayName || userAccount.name,
        'email',
        result.user.uid,
        userAccount.role
      );
      
      console.log('[AccountIntegration] 이메일 로그인 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        providerId: result.user.providerId,
        authMethods: userAccount.authMethods
      });

      return {
        success: true,
        user: result.user
      };
    } catch (error: any) {
      console.error('[AccountIntegration] 이메일 로그인 실패:', error);
      
      // 계정이 존재하지 않는 경우
      if (error.code === 'auth/user-not-found') {
        // 사용자 계정 관리 시스템에서 확인
        const userAccount = UserAccountManager.findUserByEmail(email);
        
        if (userAccount) {
          // SNS 인증 방법이 있는지 확인
          const snsMethods = userAccount.authMethods
            .filter((method: any) => method.provider !== 'email')
            .map((method: any) => method.provider);
          
          if (snsMethods.length > 0) {
            return {
              success: false,
              error: 'SNS로 가입되어 있습니다. SNS 로그인을 이용하세요.',
              needsAccountLinking: true,
              snsAuthMethods: snsMethods
            };
          }
          
          // 이메일 인증 방법이 있는 경우 Firebase 계정 자동 생성 시도
          const hasEmailAuth = userAccount.authMethods.some((method: any) => method.provider === 'email');
          if (hasEmailAuth) {
            console.log('[AccountIntegration] 이메일 인증 방법이 있으므로 Firebase 계정 자동 생성 시도:', email);
            try {
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              const result = await createUserWithEmailAndPassword(auth, email, password);
              
              // 사용자 계정 정보 업데이트
              UserAccountManager.createOrUpdateUser(
                email,
                result.user.displayName || userAccount.name,
                'email',
                result.user.uid,
                userAccount.role
              );
              
              console.log('[AccountIntegration] Firebase 계정 자동 생성 후 로그인 성공:', {
                uid: result.user.uid,
                email: result.user.email
              });
              
              return {
                success: true,
                user: result.user
              };
            } catch (createError: any) {
              console.error('[AccountIntegration] Firebase 계정 자동 생성 실패:', createError);
              return {
                success: false,
                error: '계정 생성 중 오류가 발생했습니다.',
                needsAccountLinking: false
              };
            }
          }
        }
        
        return {
          success: false,
          error: '등록되지 않은 이메일입니다.',
          needsAccountLinking: false
        };
      }
      
      // 비밀번호가 잘못된 경우
      if (error.code === 'auth/wrong-password') {
        return {
          success: false,
          error: '비밀번호가 일치하지 않습니다.',
          needsAccountLinking: false
        };
      }

      return {
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * Google 소셜 로그인
   */
  static async signInWithGoogle(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    needsAccountLinking?: boolean;
  }> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // 사용자 계정 관리 시스템에 등록/업데이트
      const userAccount = UserAccountManager.createOrUpdateUser(
        result.user.email!,
        result.user.displayName || 'Google 사용자',
        'google',
        result.user.uid,
        'user'
      );
      
      console.log('[AccountIntegration] Google 로그인 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        providerId: result.user.providerId,
        authMethods: userAccount.authMethods
      });

      return {
        success: true,
        user: result.user
      };
    } catch (error: any) {
      console.error('[AccountIntegration] Google 로그인 실패:', error);
      
      // 계정이 이미 다른 제공자로 연결된 경우
      if (error.code === 'auth/account-exists-with-different-credential') {
        return {
          success: false,
          error: '이 이메일은 다른 방법으로 이미 가입되어 있습니다.',
          needsAccountLinking: true
        };
      }

      return {
        success: false,
        error: 'Google 로그인 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /** Firebase Functions 등으로 배포된 소셜 OAuth 교환 API 전체 URL */
  static getSocialAuthEndpoint(): string {
    const fromEnv = process.env.NEXT_PUBLIC_SOCIAL_AUTH_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/api/social-oauth`;
    }
    return '';
  }

  /**
   * 카카오 OAuth 시작 (페이지 이동)
   * @param returnPath 로그인 후 이동할 경로 (예: /mypage 또는 redirect 쿼리 값)
   */
  static startKakaoOAuth(returnPath?: string): { ok: boolean; error?: string } {
    if (typeof window === 'undefined') {
      return { ok: false, error: '브라우저에서만 사용할 수 있습니다.' };
    }
    const clientId = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY?.trim();
    if (!clientId) {
      return {
        ok: false,
        error:
          '카카오 로그인이 설정되지 않았습니다. NEXT_PUBLIC_KAKAO_REST_API_KEY를 확인하세요.',
      };
    }
    const redirectUri = `${window.location.origin}/login/kakao-callback/`;
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    // sessionStorage가 탭/복원/리다이렉트 과정에서 유실되는 케이스가 있어 localStorage에 백업
    // (state 불일치 시에는 여전히 실패 처리)
    localStorage.setItem('oauth_state', state);
    if (returnPath) sessionStorage.setItem('oauth_return', returnPath);
    sessionStorage.setItem('oauth_provider', 'kakao');
    const scope = encodeURIComponent('account_email');
    const url =
      `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code` +
      `&state=${encodeURIComponent(state)}&scope=${scope}`;
    window.location.href = url;
    return { ok: true };
  }

  /**
   * 네이버 OAuth 시작 (페이지 이동)
   */
  static startNaverOAuth(returnPath?: string): { ok: boolean; error?: string } {
    if (typeof window === 'undefined') {
      return { ok: false, error: '브라우저에서만 사용할 수 있습니다.' };
    }
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID?.trim();
    if (!clientId) {
      return {
        ok: false,
        error:
          '네이버 로그인이 설정되지 않았습니다. NEXT_PUBLIC_NAVER_CLIENT_ID를 확인하세요.',
      };
    }
    const redirectUri = `${window.location.origin}/login/naver-callback/`;
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_state', state);
    if (returnPath) sessionStorage.setItem('oauth_return', returnPath);
    sessionStorage.setItem('oauth_provider', 'naver');
    const url =
      `https://nid.naver.com/oauth2.0/authorize?response_type=code` +
      `&client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}`;
    window.location.href = url;
    return { ok: true };
  }

  /**
   * OAuth 콜백에서 authorization_code → Custom Token 로그인
   */
  static async completeOAuthFromCallback(params: {
    provider: 'kakao' | 'naver';
    code: string;
    state: string | null;
    redirectUri: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const stored = sessionStorage.getItem('oauth_state') || localStorage.getItem('oauth_state');
      // 저장된 state가 없으면(탭/스토리지 유실) UX를 위해 진행은 허용하되,
      // 저장된 값이 있는데 불일치하면 CSRF 방지 차원에서 실패 처리
      if (!params.state) {
        return {
          success: false,
          error: '잘못된 로그인 요청입니다. 다시 시도해 주세요.',
        };
      }
      if (stored && params.state !== stored) {
        return {
          success: false,
          error: '잘못된 로그인 요청입니다. 다시 시도해 주세요.',
        };
      }
      sessionStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_state');

      const endpoint = this.getSocialAuthEndpoint();
      if (!endpoint) {
        return {
          success: false,
          error: '소셜 로그인 API 주소가 설정되지 않았습니다. NEXT_PUBLIC_SOCIAL_AUTH_URL 또는 Hosting 리라이트를 확인하세요.',
        };
      }

      const body: Record<string, string> = {
        provider: params.provider,
        code: params.code,
        redirectUri: params.redirectUri,
      };
      if (params.provider === 'naver' && params.state) {
        body.state = params.state;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        customToken?: string;
      };
      if (!res.ok) {
        return {
          success: false,
          error: data.error || '로그인 처리에 실패했습니다.',
        };
      }
      if (!data.customToken) {
        return { success: false, error: '토큰이 반환되지 않았습니다.' };
      }

      const { auth: authed } = initializeFirebase();
      if (!authed) {
        return { success: false, error: 'Firebase 인증을 초기화할 수 없습니다.' };
      }
      await signInWithCustomToken(authed, data.customToken);
      return { success: true };
    } catch (error: unknown) {
      console.error('[AccountIntegration] OAuth 콜백 실패:', error);
      return {
        success: false,
        error: '로그인 처리 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * Naver 소셜 로그인 (OAuth 리다이렉트)
   * @param returnPath 로그인 후 이동할 경로 (미지정 시 콜백에서 /mypage)
   */
  static async signInWithNaver(returnPath?: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    const r = this.startNaverOAuth(returnPath);
    if (!r.ok) {
      return { success: false, error: r.error };
    }
    return { success: true };
  }

  /**
   * Kakao 소셜 로그인 (OAuth 리다이렉트)
   * @param returnPath 로그인 후 이동할 경로
   */
  static async signInWithKakao(returnPath?: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    const r = this.startKakaoOAuth(returnPath);
    if (!r.ok) {
      return { success: false, error: r.error };
    }
    return { success: true };
  }

  /**
   * 이메일/비밀번호로 회원가입
   */
  static async signUpWithEmail(email: string, password: string, displayName: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      // 사용자 계정 관리 시스템에서 확인
      const existingUser = UserAccountManager.findUserByEmail(email);
      
      if (existingUser && UserAccountManager.hasAuthMethod(email, 'email')) {
        return {
          success: false,
          error: '이미 이메일/비밀번호로 가입된 계정입니다. 로그인을 시도해보세요.'
        };
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      await updateProfile(result.user, {
        displayName: displayName
      });

      // 이메일 인증 발송
      await sendEmailVerification(result.user);
      
      // 사용자 계정 관리 시스템에 등록/업데이트
      UserAccountManager.createOrUpdateUser(
        email,
        displayName,
        'email',
        result.user.uid,
        'user'
      );
      
      console.log('[AccountIntegration] 이메일 회원가입 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });

      return {
        success: true,
        user: result.user
      };
    } catch (error: any) {
      console.error('[AccountIntegration] 이메일 회원가입 실패:', error);
      
      // 이미 존재하는 이메일인 경우
      if (error.code === 'auth/email-already-in-use') {
        return {
          success: false,
          error: '이미 사용 중인 이메일입니다. 로그인을 시도해보세요.'
        };
      }

      return {
        success: false,
        error: '회원가입 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 계정 연결 (이메일/비밀번호 계정에 소셜 계정 연결)
   */
  static async linkAccount(email: string, password: string, provider: 'google' | 'naver' | 'kakao'): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      // 먼저 이메일/비밀번호로 로그인
      const emailResult = await this.signInWithEmail(email, password);
      
      if (!emailResult.success) {
        return {
          success: false,
          error: '이메일 로그인에 실패했습니다.'
        };
      }

      const user = emailResult.user;

      if (provider === 'google') {
        // Google 계정 연결
        const googleProvider = new GoogleAuthProvider();
        const credential = EmailAuthProvider.credential(email, password);
        
        const linkResult = await linkWithCredential(user, credential);
        
        console.log('[AccountIntegration] Google 계정 연결 성공');
        
        return {
          success: true,
          user: linkResult.user
        };
      } else if (provider === 'naver' || provider === 'kakao') {
        // Naver, Kakao는 NextAuth를 사용하므로 별도 처리 필요
        console.log(`[AccountIntegration] ${provider} 계정 연결은 서버에서 처리해야 합니다.`);
        
        return {
          success: false,
          error: `${provider} 계정 연결은 현재 지원되지 않습니다.`
        };
      }

      return {
        success: false,
        error: '지원되지 않는 제공자입니다.'
      };
    } catch (error: any) {
      console.error('[AccountIntegration] 계정 연결 실패:', error);
      return {
        success: false,
        error: '계정 연결 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 이메일 기반 계정 검색 및 연결 제안
   */
  static async findAndSuggestAccountLinking(email: string): Promise<{
    hasEmailAccount: boolean;
    hasGoogleAccount: boolean;
    hasNaverAccount: boolean;
    hasKakaoAccount: boolean;
    suggestions: string[];
    shouldShowSuggestions: boolean;
  }> {
    const suggestions: string[] = [];
    
    try {
      // 이메일 도메인 기반으로 가능한 계정 유형 추정
      const domain = email.split('@')[1]?.toLowerCase();
      
      // 실제로는 서버에서 계정 존재 여부를 확인해야 하지만,
      // 현재는 도메인 기반으로 추정
      const hasGoogleAccount = domain === 'gmail.com' || domain === 'googlemail.com';
      const hasNaverAccount = domain === 'naver.com';
      const hasKakaoAccount = domain === 'kakao.com' || domain === 'kakao.co.kr';
      
      // 이메일/비밀번호 계정이 있는지 확인 (실제로는 서버에서 확인 필요)
      const hasEmailAccount = false; // 임시로 false 설정
      
      // SNS 계정만 있고 이메일/비밀번호 계정이 없는 경우에만 제안 표시
      const hasAnySnsAccount = hasGoogleAccount || hasNaverAccount || hasKakaoAccount;
      const shouldShowSuggestions = hasAnySnsAccount && !hasEmailAccount;
      
      if (shouldShowSuggestions) {
        if (hasGoogleAccount) {
          suggestions.push('Google 계정으로 로그인해보세요.');
        }
        if (hasNaverAccount) {
          suggestions.push('Naver 계정으로 로그인해보세요.');
        }
        if (hasKakaoAccount) {
          suggestions.push('Kakao 계정으로 로그인해보세요.');
        }
      }

      return {
        hasEmailAccount,
        hasGoogleAccount,
        hasNaverAccount,
        hasKakaoAccount,
        suggestions,
        shouldShowSuggestions
      };
    } catch (error) {
      console.error('[AccountIntegration] 계정 검색 실패:', error);
      return {
        hasEmailAccount: false,
        hasGoogleAccount: false,
        hasNaverAccount: false,
        hasKakaoAccount: false,
        suggestions: [],
        shouldShowSuggestions: false
      };
    }
  }

  /**
   * 통합 로그인 (이메일 기반으로 모든 방법 시도)
   */
  static async unifiedSignIn(email: string, password?: string): Promise<{
    success: boolean;
    user?: any;
    error?: string;
    method?: 'email' | 'google' | 'naver' | 'kakao';
    snsAuthMethods?: string[];
  }> {
    // 1. 이메일/비밀번호로 로그인 시도 (비밀번호가 제공된 경우에만)
    if (password) {
      const emailResult = await this.signInWithEmail(email, password);
      if (emailResult.success) {
        return {
          success: true,
          user: emailResult.user,
          method: 'email'
        };
      }
      
      // 이메일/비밀번호 로그인이 실패한 경우, 해당 에러 메시지 반환
      return {
        success: false,
        error: emailResult.error || '이메일/비밀번호 로그인에 실패했습니다.',
        snsAuthMethods: emailResult.snsAuthMethods
      };
    }

    // 2. 비밀번호가 없는 경우, 사용자 계정 관리 시스템에서 확인
    const userAccount = UserAccountManager.findUserByEmail(email);
    
    if (!userAccount) {
      return {
        success: false,
        error: '등록되지 않은 이메일입니다.'
      };
    }

    // 3. 사용 가능한 인증 방법이 있는지 확인
    const availableMethods = userAccount.authMethods.map(method => method.provider);
    
    if (availableMethods.includes('email')) {
      return {
        success: false,
        error: '이 이메일은 이메일/비밀번호로 가입되었습니다. 비밀번호를 입력해주세요.'
      };
    }

    // 4. SNS 로그인 제안
    if (availableMethods.includes('google')) {
      return {
        success: false,
        error: 'Google 계정으로 로그인해주세요.'
      };
    }
    
    if (availableMethods.includes('naver')) {
      return {
        success: false,
        error: 'Naver 계정으로 로그인해주세요.'
      };
    }
    
    if (availableMethods.includes('kakao')) {
      return {
        success: false,
        error: 'Kakao 계정으로 로그인해주세요.'
      };
    }

    return {
      success: false,
      error: '등록되지 않은 이메일입니다.'
    };
  }
}
