import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { signIn } from 'next-auth/react';

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
  }> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('[AccountIntegration] 이메일 로그인 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        providerId: result.user.providerId
      });

      return {
        success: true,
        user: result.user
      };
    } catch (error: any) {
      console.error('[AccountIntegration] 이메일 로그인 실패:', error);
      
      // 계정이 존재하지 않는 경우
      if (error.code === 'auth/user-not-found') {
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
          error: '비밀번호가 올바르지 않습니다.',
          needsAccountLinking: true // 소셜 계정과 연결 가능성
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
      
      console.log('[AccountIntegration] Google 로그인 성공:', {
        uid: result.user.uid,
        email: result.user.email,
        providerId: result.user.providerId
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

  /**
   * Naver 소셜 로그인 (NextAuth 사용)
   */
  static async signInWithNaver(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const result = await signIn('naver', { 
        callbackUrl: '/mypage',
        redirect: false 
      });
      
      if (result?.ok) {
        console.log('[AccountIntegration] Naver 로그인 성공');
        return {
          success: true,
          user: result
        };
      } else {
        return {
          success: false,
          error: 'Naver 로그인에 실패했습니다.'
        };
      }
    } catch (error: any) {
      console.error('[AccountIntegration] Naver 로그인 실패:', error);
      return {
        success: false,
        error: 'Naver 로그인 처리 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * Kakao 소셜 로그인 (NextAuth 사용)
   */
  static async signInWithKakao(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      const result = await signIn('kakao', { 
        callbackUrl: '/mypage',
        redirect: false 
      });
      
      if (result?.ok) {
        console.log('[AccountIntegration] Kakao 로그인 성공');
        return {
          success: true,
          user: result
        };
      } else {
        return {
          success: false,
          error: 'Kakao 로그인에 실패했습니다.'
        };
      }
    } catch (error: any) {
      console.error('[AccountIntegration] Kakao 로그인 실패:', error);
      return {
        success: false,
        error: 'Kakao 로그인 처리 중 오류가 발생했습니다.'
      };
    }
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 프로필 업데이트
      await updateProfile(result.user, {
        displayName: displayName
      });

      // 이메일 인증 발송
      await sendEmailVerification(result.user);
      
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
  }> {
    const suggestions: string[] = [];
    
    try {
      // 이메일 도메인 기반으로 가능한 계정 유형 추정
      const domain = email.split('@')[1]?.toLowerCase();
      
      if (domain === 'gmail.com' || domain === 'googlemail.com') {
        suggestions.push('Google 계정으로 로그인해보세요.');
      } else if (domain === 'naver.com') {
        suggestions.push('Naver 계정으로 로그인해보세요.');
      } else if (domain === 'kakao.com' || domain === 'kakao.co.kr') {
        suggestions.push('Kakao 계정으로 로그인해보세요.');
      } else {
        suggestions.push('이메일/비밀번호로 로그인해보세요.');
        suggestions.push('Google, Naver, Kakao 계정으로도 시도해보세요.');
      }

      return {
        hasEmailAccount: false, // 실제로는 서버에서 확인 필요
        hasGoogleAccount: domain === 'gmail.com' || domain === 'googlemail.com',
        hasNaverAccount: domain === 'naver.com',
        hasKakaoAccount: domain === 'kakao.com' || domain === 'kakao.co.kr',
        suggestions
      };
    } catch (error) {
      console.error('[AccountIntegration] 계정 검색 실패:', error);
      return {
        hasEmailAccount: false,
        hasGoogleAccount: false,
        hasNaverAccount: false,
        hasKakaoAccount: false,
        suggestions: ['이메일/비밀번호로 로그인해보세요.']
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
  }> {
    // 1. 이메일/비밀번호로 로그인 시도
    if (password) {
      const emailResult = await this.signInWithEmail(email, password);
      if (emailResult.success) {
        return {
          success: true,
          user: emailResult.user,
          method: 'email'
        };
      }
    }

    // 2. Google 로그인 시도 (이메일이 Google 계정인 경우)
    if (email.includes('@gmail.com') || email.includes('@googlemail.com')) {
      const googleResult = await this.signInWithGoogle();
      if (googleResult.success && googleResult.user?.email === email) {
        return {
          success: true,
          user: googleResult.user,
          method: 'google'
        };
      }
    }

    // 3. Naver 로그인 시도 (이메일이 Naver 계정인 경우)
    if (email.includes('@naver.com')) {
      const naverResult = await this.signInWithNaver();
      if (naverResult.success) {
        return {
          success: true,
          user: naverResult.user,
          method: 'naver'
        };
      }
    }

    // 4. Kakao 로그인 시도 (이메일이 Kakao 계정인 경우)
    if (email.includes('@kakao.com') || email.includes('@kakao.co.kr')) {
      const kakaoResult = await this.signInWithKakao();
      if (kakaoResult.success) {
        return {
          success: true,
          user: kakaoResult.user,
          method: 'kakao'
        };
      }
    }

    return {
      success: false,
      error: '해당 이메일로 등록된 계정을 찾을 수 없습니다.'
    };
  }
}
