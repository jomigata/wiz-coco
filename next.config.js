/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Firebase Hosting을 위한 정적 내보내기 설정
  output: 'export',
  trailingSlash: true, // Firebase Hosting 호환성을 위해 true로 변경
  
  images: {
    unoptimized: true // 정적 내보내기에서는 최적화 비활성화
  },
  
  // Firebase 프로덕션 환경을 위한 환경 변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://wiz-coco.web.app',
    SKIP_ENV_VALIDATION: 'true',
    SKIP_DB_INIT: process.env.SKIP_DB_INIT || 'true',
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://wiz-coco.web.app',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret-key-at-least-32-chars-production',
    // Firebase 환경변수 (빌드 시점에 주입)
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  
  // 웹팩 설정: 서버 전용 모듈만 제외
  webpack: (config, { isServer, dev }) => {
    // 테스트 파일들을 빌드에서 제외
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      use: 'ignore-loader'
    });

    if (!isServer) {
      // 클라이언트 빌드에서 서버 전용 모듈들만 제외
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        url: false,
        querystring: false,
        // 서버 전용 모듈들만 제외
        'ioredis': false,
        'redis': false,
        '@prisma/client': false,
        'pg': false,
        'bcrypt': false,
        'jsonwebtoken': false,
        'nodemailer': false,
        // Firebase Admin SDK는 서버 전용이므로 클라이언트에서 제외
        'firebase-admin': false,
        // NextAuth 관련 모듈들 제외 (정적 배포에서는 사용하지 않음)
        'next-auth': false,
        '@next-auth/prisma-adapter': false,
        // Firebase 클라이언트 SDK는 사용하므로 제외하지 않음
      };
      
      // 서버 전용 모듈들만 외부 의존성으로 표시
      config.externals = config.externals || [];
      config.externals.push({
        'ioredis': 'commonjs ioredis',
        'redis': 'commonjs redis',
        '@prisma/client': 'commonjs @prisma/client',
        'pg': 'commonjs pg',
        'bcrypt': 'commonjs bcrypt',
        'jsonwebtoken': 'commonjs jsonwebtoken',
        'nodemailer': 'commonjs nodemailer',
        'firebase-admin': 'commonjs firebase-admin',
        'next-auth': 'commonjs next-auth',
        '@next-auth/prisma-adapter': 'commonjs @next-auth/prisma-adapter',
        // Firebase 클라이언트 SDK는 제외하지 않음
      });
    }
    
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    
    return config;
  },
  
  // 정적 자산 처리 최적화
  poweredByHeader: false,
  compress: true,
  
  // 빌드 최적화
  swcMinify: true,
  
  // 정적 내보내기 최적화 - out 폴더로 변경
  distDir: 'out',
  
  // 환경 변수 검증 비활성화 (CI/CD 환경에서)
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
};

module.exports = nextConfig; 