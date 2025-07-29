# WizCoCo 2025 - 심리케어 서비스

Next.js로 구현된 심리 테스트 및 심리 케어 서비스입니다.

## 🎉 **배포 성공!**

**WizCoCo 사이트가 성공적으로 배포되었습니다!**
- **배포 URL**: https://wiz-coco.web.app
- **상태**: ✅ 정상 작동 중
- **배포 시간**: 2025년 1월 27일

---

## 시작하기

### 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드 및 프로덕션 실행

```bash
# 빌드
npm run build

# 배포 전 데이터 준비
npm run prepare-data

# 프로덕션 서버 실행
npm run start
```

## 배포 방법

이 프로젝트는 [Firebase](https://firebase.google.com) 플랫폼에 최적화되어 있으며, GitHub Actions를 통한 자동 배포를 지원합니다.

### 🚀 **로컬 배포 (완료됨)**

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 빌드 및 배포
npm run build
firebase deploy --only hosting
```

### 🔧 **GitHub Actions 자동 배포 설정**

**현재 상태**: 로컬 배포 완료, 자동 배포 설정 진행 중

1. **GitHub Secrets 설정**
   
   GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 시크릿들을 설정하세요:

   **Firebase 클라이언트 설정:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

   **Firebase Admin SDK 설정:**
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_PRIVATE_KEY_ID`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_CLIENT_ID`
   - `FIREBASE_ADMIN_CLIENT_X509_CERT_URL`

   **Firebase Service Account (배포용):**
   - `FIREBASE_SERVICE_ACCOUNT` (Firebase 콘솔에서 다운로드한 서비스 계정 JSON 파일의 전체 내용)

2. **자동 배포**
   
   main 브랜치에 푸시하면 자동으로 빌드 및 배포가 실행됩니다.

### 📋 **상세 설정 가이드**

- **GitHub Secrets 완전 설정 가이드**: [docs/github-secrets-complete-setup.md](docs/github-secrets-complete-setup.md)
- **배포 상태 확인**: [docs/deployment-status.md](docs/deployment-status.md)

## 환경 변수

프로젝트 실행에 필요한 환경 변수:

### 클라이언트 사이드 (NEXT_PUBLIC_)
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API 키
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth 도메인
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase 프로젝트 ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase Storage 버킷
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase Messaging Sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: Firebase Analytics Measurement ID

### 서버 사이드
- `FIREBASE_ADMIN_PROJECT_ID`: Firebase Admin 프로젝트 ID
- `FIREBASE_ADMIN_PRIVATE_KEY_ID`: Firebase Admin Private Key ID
- `FIREBASE_ADMIN_PRIVATE_KEY`: Firebase Admin Private Key
- `FIREBASE_ADMIN_CLIENT_EMAIL`: Firebase Admin Client Email
- `FIREBASE_ADMIN_CLIENT_ID`: Firebase Admin Client ID
- `FIREBASE_ADMIN_CLIENT_X509_CERT_URL`: Firebase Admin Client X509 Cert URL
- `NODE_ENV`: 실행 환경 (development, production)
- `DATA_DIR`: 로컬 데이터 저장 디렉토리 경로 (개발용)

## 주요 기능

- 다양한 심리 테스트 제공
- 사용자 계정 관리 및 인증 (Firebase Auth)
- 테스트 결과 저장 및 조회 (Firestore)
- 관리자 대시보드
- Firebase Hosting을 통한 빠른 배포
- GitHub Actions를 통한 자동 CI/CD

## 기술 스택

- **프론트엔드**: Next.js, React, TailwindCSS
- **백엔드**: Next.js API Routes
- **인증**: Firebase Authentication
- **데이터 저장**: Firebase Firestore
- **호스팅**: Firebase Hosting
- **스토리지**: Firebase Storage
- **CI/CD**: GitHub Actions

## 문제해결

### 배포 중 문제가 발생할 경우:

1. **GitHub Secrets 확인**
   - 모든 Firebase 관련 시크릿이 올바르게 설정되었는지 확인
   - `FIREBASE_SERVICE_ACCOUNT` 시크릿이 JSON 형태로 설정되었는지 확인

2. **로컬 배포 테스트**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

3. **Firebase Console 확인**
   - https://console.firebase.google.com/project/wiz-coco/hosting

## 🔗 **관련 링크**

### **배포 확인:**
- **메인 사이트**: https://wiz-coco.web.app
- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/overview

### **GitHub:**
- **Actions**: https://github.com/jomigata/wiz-coco/actions
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **문서:**
- **배포 상태**: [docs/deployment-status.md](docs/deployment-status.md)
- **GitHub Secrets 설정**: [docs/github-secrets-complete-setup.md](docs/github-secrets-complete-setup.md)
