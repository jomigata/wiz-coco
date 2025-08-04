# 🔥 Firebase 환경변수 설정 가이드

## 📋 개요
이 가이드는 WizCoCo 프로젝트의 Firebase 배포를 위한 환경변수 설정 방법을 설명합니다.

## 🎯 목표
- Firebase Hosting 배포 시 환경변수 설정 문제 해결
- 안전하고 효율적인 배포 프로세스 구축
- 개발자 친화적인 설정 가이드 제공

## 📁 파일 구조
```
WizCoCo/
├── env.local.example          # 환경변수 예시 파일
├── scripts/
│   ├── verify-env.js         # 환경변수 검증 스크립트
│   └── deploy-with-verification.js  # 배포 스크립트
├── .github/workflows/ci.yml  # GitHub Actions 워크플로우
└── deploy-firebase.bat       # Windows 배포 스크립트
```

## 🔧 1단계: 환경변수 파일 생성

### 1-1. 예시 파일 복사
```bash
# 프로젝트 루트에서 실행
cp env.local.example .env.local
```

### 1-2. Firebase Console에서 설정값 가져오기

#### 🔍 Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com) 접속
2. `wiz-coco` 프로젝트 선택
3. ⚙️ 프로젝트 설정 클릭
4. 일반 탭에서 웹 앱 설정 확인

#### 📋 필요한 설정값들
```env
# Firebase 설정 (클라이언트 사이드)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wiz-coco.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wiz-coco
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wiz-coco.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdefghijklmnop
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# NextAuth 설정
NEXTAUTH_URL=https://wiz-coco.web.app
NEXTAUTH_SECRET=your-nextauth-secret-key-at-least-32-chars-production

# 서비스 설정
NODE_ENV=production
SKIP_DB_INIT=true
NEXT_TELEMETRY_DISABLED=1

# API 설정
NEXT_PUBLIC_API_URL=https://wiz-coco.web.app
```

## 🔍 2단계: 환경변수 검증

### 2-1. 검증 스크립트 실행
```bash
npm run verify-env
```

### 2-2. 검증 결과 확인
✅ 성공 시:
```
🎉 모든 필수 환경변수가 올바르게 설정되었습니다!
✅ 배포 준비 완료
```

❌ 실패 시:
```
❌ 환경변수 설정에 문제가 있습니다.
💡 해결 방법:
1. Firebase Console에서 실제 값으로 교체
2. 이 스크립트를 다시 실행
```

## 🚀 3단계: 배포 실행

### 3-1. 안전한 배포 (권장)
```bash
npm run deploy
```

### 3-2. 빠른 배포
```bash
npm run deploy:quick
```

### 3-3. Windows 배포
```cmd
deploy-firebase.bat
```

## 🔧 4단계: GitHub Actions 설정

### 4-1. GitHub Secrets 설정
1. [GitHub Repository Settings](https://github.com/jomigata/wiz-coco/settings/secrets/actions) 접속
2. "New repository secret" 클릭
3. 다음 Secrets 추가:

#### 🔥 Firebase Secrets
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

#### 🔐 인증 Secrets
```
FIREBASE_TOKEN
FIREBASE_SERVICE_ACCOUNT
NEXTAUTH_SECRET
```

### 4-2. Firebase Token 생성
```bash
# 로컬에서 실행
firebase login:ci
```

## 🧪 5단계: 테스트 및 확인

### 5-1. 로컬 테스트
```bash
npm run build
firebase serve --only hosting
```

### 5-2. 배포 확인
- **배포 URL**: https://wiz-coco.web.app
- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/hosting

### 5-3. 기능 테스트
1. ✅ 메인 페이지 로딩 확인
2. ✅ MBTI 테스트 기능 확인
3. ✅ 로그인/회원가입 기능 확인
4. ✅ 반응형 디자인 확인

## 🛠️ 6단계: 문제 해결

### 6-1. 일반적인 문제들

#### ❌ "환경변수가 설정되지 않았습니다"
**해결 방법:**
1. `.env.local` 파일이 존재하는지 확인
2. Firebase Console에서 실제 값으로 교체
3. `npm run verify-env` 실행

#### ❌ "Firebase CLI가 설치되지 않았습니다"
**해결 방법:**
```bash
npm install -g firebase-tools
```

#### ❌ "빌드 실패"
**해결 방법:**
1. `npm install` 실행
2. 환경변수 검증: `npm run verify-env`
3. 캐시 정리: `npm run clean`

### 6-2. 디버깅 명령어
```bash
# 환경변수 확인
npm run verify-env

# 빌드 테스트
npm run build

# Firebase 상태 확인
firebase projects:list

# 배포 히스토리 확인
firebase hosting:channel:list
```

## 📊 7단계: 성능 최적화

### 7-1. 빌드 최적화
- ✅ 정적 파일 압축
- ✅ 이미지 최적화
- ✅ 캐싱 전략 적용
- ✅ 번들 크기 최적화

### 7-2. 배포 최적화
- ✅ 환경변수 검증 자동화
- ✅ 빌드 결과 확인
- ✅ 배포 상태 모니터링

## 🔒 8단계: 보안 고려사항

### 8-1. 환경변수 보안
- ✅ `.env.local` 파일을 `.gitignore`에 추가
- ✅ GitHub Secrets 사용
- ✅ 민감한 정보 노출 방지

### 8-2. Firebase 보안
- ✅ Firebase Security Rules 설정
- ✅ 인증 및 권한 관리
- ✅ 데이터베이스 보안

## 📈 9단계: 모니터링

### 9-1. 성능 모니터링
- 📊 페이지 로딩 시간
- 📊 번들 크기
- 📊 사용자 경험

### 9-2. 오류 모니터링
- 🔍 Firebase Crashlytics
- 🔍 사용자 피드백
- 🔍 시스템 로그

## 🎯 10단계: 다음 단계

### 10-1. 추가 개선사항
- 🔄 자동 배포 파이프라인
- 🧪 자동화된 테스트
- 📊 성능 분석 도구

### 10-2. 확장 계획
- 🌐 다국어 지원
- 📱 PWA 기능
- 🔔 푸시 알림

---

## 📞 지원

### 🆘 문제 발생 시
1. 이 가이드의 문제 해결 섹션 확인
2. GitHub Issues에 문제 보고
3. 개발팀에 문의

### 📚 추가 자료
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

**마지막 업데이트**: 2024년 12월
**버전**: 1.0.0
**검토자**: 30년 경력 풀스택 프로그래머, 웹디자이너, 심리상담전문가 