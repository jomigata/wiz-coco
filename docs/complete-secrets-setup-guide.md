# 🔐 완전한 GitHub Secrets 설정 가이드

## 📋 개요
이 가이드는 WizCoCo 프로젝트의 3가지 핵심 환경변수를 설정하는 완전한 가이드입니다.

## 🎯 목표
- FIREBASE_TOKEN 설정
- FIREBASE_SERVICE_ACCOUNT 설정  
- NEXTAUTH_SECRET 설정
- GitHub Actions에서 안전한 자동 배포

## 🔥 1단계: FIREBASE_TOKEN 설정

### 1-1. Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 1-2. CI/CD 토큰 생성
```bash
firebase login:ci
```

### 1-3. 토큰 복사
터미널에 출력된 토큰을 복사하세요:
```
✔  Success! Use this token to login on a CI server:

1//0eXAMPLE_TOKEN_HERE_VERY_LONG_STRING
```

### 1-4. GitHub Secrets 설정
1. [GitHub Repository Settings](https://github.com/jomigata/wiz-coco/settings/secrets/actions) 접속
2. "New repository secret" 클릭
3. Name: `FIREBASE_TOKEN`
4. Value: 복사한 토큰 붙여넣기
5. "Add secret" 클릭

## 🔧 2단계: FIREBASE_SERVICE_ACCOUNT 설정

### 2-1. Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com) 접속
2. `wiz-coco` 프로젝트 선택
3. ⚙️ 프로젝트 설정 → 서비스 계정 탭

### 2-2. Service Account 키 생성
1. "새 비공개 키 생성" 버튼 클릭
2. "키 생성" 버튼 클릭
3. JSON 파일 다운로드

### 2-3. JSON 파일 내용 복사
1. 다운로드된 JSON 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)

### 2-4. GitHub Secrets 설정
1. [GitHub Repository Settings](https://github.com/jomigata/wiz-coco/settings/secrets/actions) 접속
2. "New repository secret" 클릭
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: 복사한 JSON 내용 붙여넣기
5. "Add secret" 클릭

## 🔐 3단계: NEXTAUTH_SECRET 설정

### 3-1. Secret 생성 스크립트 실행
```bash
node scripts/generate-nextauth-secret.js
```

### 3-2. 생성된 Secret 복사
스크립트에서 출력된 권장 Secret을 복사하세요:
```
🎉 권장 Secret (방법 2):
📊 길이: 88자
🔐 Secret: YOUR_GENERATED_SECRET_HERE
```

### 3-3. GitHub Secrets 설정
1. [GitHub Repository Settings](https://github.com/jomigata/wiz-coco/settings/secrets/actions) 접속
2. "New repository secret" 클릭
3. Name: `NEXTAUTH_SECRET`
4. Value: 복사한 Secret 붙여넣기
5. "Add secret" 클릭

## 📋 4단계: 설정 확인

### 4-1. GitHub Secrets 목록 확인
[GitHub Secrets 페이지](https://github.com/jomigata/wiz-coco/settings/secrets/actions)에서 다음 3개가 모두 설정되었는지 확인:

✅ `FIREBASE_TOKEN`
✅ `FIREBASE_SERVICE_ACCOUNT`  
✅ `NEXTAUTH_SECRET`

### 4-2. 환경변수 검증
```bash
npm run verify-env
```

## 🧪 5단계: 테스트 및 배포

### 5-1. 로컬 테스트
```bash
# 환경변수 검증
npm run verify-env

# 빌드 테스트
npm run build

# 로컬 서버 테스트
npm run dev
```

### 5-2. GitHub Actions 배포
1. GitHub Repository에서 변경사항 푸시
2. Actions 탭에서 워크플로우 실행 확인
3. 배포 완료 후 사이트 확인

### 5-3. 배포 확인
- **배포 URL**: https://wiz-coco.web.app
- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/hosting

## 🔒 6단계: 보안 고려사항

### 6-1. 일반 보안 규칙
- ✅ Secrets를 코드에 직접 입력하지 마세요
- ✅ GitHub Secrets에만 저장하세요
- ✅ Secrets를 공개하지 마세요
- ✅ 정기적으로 Secrets를 갱신하세요

### 6-2. 각 Secret별 보안
- **FIREBASE_TOKEN**: Firebase CLI 토큰, 배포용
- **FIREBASE_SERVICE_ACCOUNT**: 서버 사이드 인증, JSON 형태
- **NEXTAUTH_SECRET**: NextAuth 암호화, 32자 이상 권장

## 🛠️ 7단계: 문제 해결

### 7-1. 일반적인 문제들

#### ❌ "Secret not found"
**해결 방법:**
1. GitHub Secrets 설정 확인
2. Secret 이름 정확성 확인
3. Secret 값 복사/붙여넣기 확인

#### ❌ "Authentication failed"
**해결 방법:**
1. Firebase Console에서 권한 확인
2. 토큰/키 재생성
3. GitHub Secrets 업데이트

#### ❌ "Invalid format"
**해결 방법:**
1. JSON 형식 확인 (Service Account)
2. 토큰 형식 확인 (Firebase Token)
3. Secret 길이 확인 (NextAuth)

### 7-2. 디버깅 명령어
```bash
# 환경변수 확인
npm run verify-env

# Firebase 상태 확인
firebase projects:list --token "YOUR_TOKEN"

# NextAuth 설정 확인
node -e "console.log(process.env.NEXTAUTH_SECRET ? '✅ 설정됨' : '❌ 설정되지 않음')"
```

## 📊 8단계: 모니터링

### 8-1. 배포 모니터링
- GitHub Actions 로그 확인
- Firebase Console 배포 히스토리
- 사이트 접속 테스트

### 8-2. 보안 모니터링
- 비정상적인 접근 패턴 감지
- Secret 사용량 모니터링
- 정기적인 보안 검토

## 🎯 9단계: 완료 체크리스트

### 9-1. 필수 설정 완료 확인
- [ ] FIREBASE_TOKEN 설정 완료
- [ ] FIREBASE_SERVICE_ACCOUNT 설정 완료
- [ ] NEXTAUTH_SECRET 설정 완료
- [ ] GitHub Secrets 3개 모두 등록
- [ ] 환경변수 검증 통과
- [ ] 로컬 빌드 성공
- [ ] GitHub Actions 배포 성공
- [ ] 배포된 사이트 접속 확인

### 9-2. 기능 테스트
- [ ] 메인 페이지 로딩 확인
- [ ] MBTI 테스트 기능 확인
- [ ] 로그인/회원가입 기능 확인
- [ ] 반응형 디자인 확인

## 🚀 10단계: 다음 단계

### 10-1. 즉시 실행 가능한 작업
1. ✅ 위의 3가지 Secret 설정
2. ✅ GitHub에 변경사항 푸시
3. ✅ GitHub Actions 배포 실행
4. ✅ 배포된 사이트 확인

### 10-2. 추가 개선사항
- 🔄 자동 배포 파이프라인 최적화
- 🧪 자동화된 테스트 추가
- 📊 성능 모니터링 설정
- 🔒 보안 강화

## 📞 지원

### 🆘 문제 발생 시
1. 이 가이드의 문제 해결 섹션 확인
2. GitHub Issues에 문제 보고
3. Firebase Console 상태 확인
4. 개발팀에 문의

### 📚 추가 자료
- [Firebase Token 가이드](./firebase-token-setup-guide.md)
- [Firebase Service Account 가이드](./firebase-service-account-guide.md)
- [Firebase 환경변수 가이드](./firebase-env-setup-guide.md)
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [NextAuth 문서](https://next-auth.js.org/)

---

**마지막 업데이트**: 2024년 12월
**버전**: 1.0.0
**검토자**: 30년 경력 풀스택 프로그래머, 웹디자이너, 심리상담전문가 