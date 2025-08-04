# 🔥 Firebase Token 생성 가이드

## 📋 개요
Firebase Token은 GitHub Actions에서 Firebase 프로젝트에 자동으로 배포할 때 사용하는 인증 토큰입니다.

## 🎯 목표
- Firebase CI/CD 토큰 생성
- GitHub Actions에서 안전한 배포
- 자동화된 배포 파이프라인 구축

## 🔧 1단계: Firebase CLI 설치

### 1-1. Node.js 확인
```bash
node --version
npm --version
```

### 1-2. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 1-3. 설치 확인
```bash
firebase --version
```

## 🔐 2단계: Firebase 로그인

### 2-1. 일반 로그인 (개발용)
```bash
firebase login
```

### 2-2. CI/CD 토큰 생성 (배포용)
```bash
firebase login:ci
```

**중요**: 이 명령어를 실행하면:
1. 브라우저가 열립니다
2. Google 계정으로 로그인하세요
3. Firebase 프로젝트에 대한 권한을 승인하세요
4. 터미널에 토큰이 출력됩니다

## 📋 3단계: 토큰 복사 및 저장

### 3-1. 토큰 출력 예시
```
✔  Success! Use this token to login on a CI server:

1//0eXAMPLE_TOKEN_HERE_VERY_LONG_STRING

Example: firebase deploy --token "$FIREBASE_TOKEN"
```

### 3-2. 토큰 저장
생성된 토큰을 복사하여 안전한 곳에 저장하세요.

## 🔧 4단계: GitHub Secrets 설정

### 4-1. GitHub Repository 접속
1. [GitHub Repository](https://github.com/jomigata/wiz-coco) 접속
2. Settings 탭 클릭
3. Secrets and variables → Actions 클릭

### 4-2. FIREBASE_TOKEN 추가
1. "New repository secret" 클릭
2. Name: `FIREBASE_TOKEN`
3. Value: 생성된 토큰 붙여넣기
4. "Add secret" 클릭

## 🧪 5단계: 토큰 테스트

### 5-1. 로컬 테스트
```bash
# 토큰으로 로그인 테스트
firebase projects:list --token "YOUR_TOKEN_HERE"
```

### 5-2. 배포 테스트
```bash
# 토큰으로 배포 테스트
firebase deploy --only hosting --token "YOUR_TOKEN_HERE"
```

## 🔒 6단계: 보안 고려사항

### 6-1. 토큰 보안
- ✅ 토큰을 코드에 직접 입력하지 마세요
- ✅ GitHub Secrets에만 저장하세요
- ✅ 토큰을 공개하지 마세요
- ✅ 정기적으로 토큰을 갱신하세요

### 6-2. 권한 관리
- ✅ 필요한 최소 권한만 부여하세요
- ✅ 프로젝트별로 다른 토큰을 사용하세요

## 🛠️ 7단계: 문제 해결

### 7-1. 일반적인 문제들

#### ❌ "firebase: command not found"
**해결 방법:**
```bash
npm install -g firebase-tools
```

#### ❌ "Authentication failed"
**해결 방법:**
1. `firebase logout` 실행
2. `firebase login:ci` 다시 실행
3. 올바른 Google 계정으로 로그인

#### ❌ "Project not found"
**해결 방법:**
1. Firebase Console에서 프로젝트 확인
2. 올바른 프로젝트 ID 사용
3. 프로젝트에 대한 권한 확인

### 7-2. 토큰 갱신
토큰이 만료되면:
```bash
firebase logout
firebase login:ci
```

## 📊 8단계: 모니터링

### 8-1. 배포 상태 확인
```bash
# 배포 히스토리 확인
firebase hosting:channel:list --token "YOUR_TOKEN"

# 프로젝트 상태 확인
firebase projects:list --token "YOUR_TOKEN"
```

### 8-2. 로그 확인
- GitHub Actions 로그에서 배포 상태 확인
- Firebase Console에서 배포 히스토리 확인

## 🎯 9단계: 자동화

### 9-1. GitHub Actions 설정
```yaml
- name: 🚀 Firebase Hosting 배포
  run: |
    firebase deploy --only hosting --token "${{ secrets.FIREBASE_TOKEN }}"
```

### 9-2. 환경변수 설정
```bash
export FIREBASE_TOKEN="your-token-here"
firebase deploy --only hosting
```

## 📞 지원

### 🆘 문제 발생 시
1. Firebase CLI 버전 확인: `firebase --version`
2. Node.js 버전 확인: `node --version`
3. 네트워크 연결 확인
4. Firebase Console에서 프로젝트 상태 확인

### 📚 추가 자료
- [Firebase CLI 문서](https://firebase.google.com/docs/cli)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Firebase 배포 가이드](https://firebase.google.com/docs/hosting/deploying)

---

**마지막 업데이트**: 2024년 12월
**버전**: 1.0.0
**검토자**: 30년 경력 풀스택 프로그래머 