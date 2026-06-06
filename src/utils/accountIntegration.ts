import { auth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import {
  beginAuthLoginAttempt,
  endAuthLoginAttempt,
  markAuthenticatedTabSession,
} from '@/utils/authSessionLifecycle';

function mapFirebaseAuthError(code?: string, fallback?: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return '등록되지 않은 이메일이거나 비밀번호가 올바르지 않습니다.';
    case 'auth/wrong-password':
      return '비밀번호가 일치하지 않습니다.';
    case 'auth/invalid-email':
      return '올바르지 않은 이메일 형식입니다.';
    case 'auth/user-disabled':
      return '비활성화된 계정입니다.';
    case 'auth/too-many-requests':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다. 로그인을 시도해보세요.';
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.';
    case 'auth/network-request-failed':
      return '네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해주세요.';
    default:
      return fallback || '인증 처리 중 오류가 발생했습니다.';
  }
}

/**
 * 이메일·비밀번호 전용 계정 관리 (Firebase Authentication)
 */
export class AccountIntegrationManager {
  static async signInWithEmail(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: import('firebase/auth').User; error?: string }> {
    beginAuthLoginAttempt();
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      markAuthenticatedTabSession();
      return { success: true, user: result.user };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      return {
        success: false,
        error: mapFirebaseAuthError(code, (error as { message?: string })?.message),
      };
    } finally {
      endAuthLoginAttempt();
    }
  }

  static async unifiedSignIn(
    email: string,
    password?: string,
  ): Promise<{
    success: boolean;
    user?: import('firebase/auth').User;
    error?: string;
    method?: 'email';
  }> {
    if (!password) {
      return { success: false, error: '비밀번호를 입력해주세요.' };
    }
    const result = await this.signInWithEmail(email, password);
    if (!result.success) return result;
    return { ...result, method: 'email' };
  }

  static async signUpWithEmail(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ success: boolean; user?: import('firebase/auth').User; error?: string }> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(result.user, { displayName: displayName.trim() });
      try {
        await sendEmailVerification(result.user);
      } catch {
        // 인증 메일 실패해도 가입은 완료
      }
      return { success: true, user: result.user };
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      return {
        success: false,
        error: mapFirebaseAuthError(code, (error as { message?: string })?.message),
      };
    }
  }
}
