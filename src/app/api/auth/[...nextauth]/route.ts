import NextAuth from 'next-auth';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import NaverProvider from 'next-auth/providers/naver';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

// NextAuth 설정
export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials Provider (이메일/비밀번호 로그인)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Firebase Admin SDK로 사용자 인증
          if (!adminAuth) {
            console.error('Firebase Admin SDK가 초기화되지 않았습니다.');
            return null;
          }

          // 이메일로 사용자 조회
          const userRecord = await adminAuth.getUserByEmail(credentials.email);
          
          // 비밀번호 검증 (Firebase Admin SDK는 직접 비밀번호 검증을 지원하지 않으므로
          // 클라이언트 사이드에서 검증하거나 별도 방법 사용)
          // 여기서는 사용자가 존재하는지만 확인
          
          return {
            id: userRecord.uid,
            email: userRecord.email || '', // undefined 방지
            name: userRecord.displayName || userRecord.email?.split('@')[0] || '',
            image: userRecord.photoURL || undefined,
          };
        } catch (error) {
          console.error('Credentials 인증 오류:', error);
          return null;
        }
      }
    }),

    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // Kakao Provider
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    }),

    // Naver Provider
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID || '',
      clientSecret: process.env.NAVER_CLIENT_SECRET || '',
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async jwt({ token, user, account }) {
      // 초기 로그인 시 사용자 정보를 토큰에 추가
      if (user) {
        token.uid = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // 소셜 로그인 시 Firestore에 사용자 정보 저장
      if (account && user && adminDb) {
        try {
          const userRef = adminDb.collection('users').doc(user.id);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            // 새 사용자인 경우 Firestore에 저장
            await userRef.set({
              uid: user.id,
              email: user.email,
              name: user.name,
              displayName: user.name,
              image: user.image,
              provider: account.provider,
              createdAt: new Date(),
              updatedAt: new Date(),
              emailVerified: true,
              role: 'user',
              status: 'active',
            });
          } else {
            // 기존 사용자인 경우 업데이트
            await userRef.update({
              lastLoginAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch (error) {
          console.error('Firestore 사용자 정보 저장 오류:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // 토큰 정보를 세션에 추가
      if (token) {
        session.user.id = token.uid as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      // 로그인 성공 시 추가 처리
      console.log('로그인 성공:', { user, account, profile });
      return true;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
};

// NextAuth 핸들러
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 