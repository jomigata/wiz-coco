# 🔥 Firebase Service Account 설정 가이드

## 📋 개요
Firebase Service Account는 서버 사이드에서 Firebase 서비스에 안전하게 접근할 수 있도록 하는 인증 정보입니다.

## 🎯 목표
- Firebase Service Account 키 생성
- GitHub Actions에서 안전한 서버 사이드 접근
- 자동화된 배포 및 관리 시스템 구축

## 🔧 1단계: Firebase Console 접속

### 1-1. Firebase Console 이동
1. [Firebase Console](https://console.firebase.google.com) 접속
2. `wiz-coco` 프로젝트 선택
3. ⚙️ 프로젝트 설정 클릭

### 1-2. 서비스 계정 탭 이동
1. "서비스 계정" 탭 클릭
2. "Firebase Admin SDK" 섹션 확인

## 🔐 2단계: Service Account 키 생성

### 2-1. 새 비공개 키 생성
1. "새 비공개 키 생성" 버튼 클릭
2. "키 생성" 버튼 클릭
3. JSON 파일이 자동으로 다운로드됩니다

### 2-2. 파일 이름 변경
다운로드된 파일을 `firebase-service-account.json`으로 이름을 변경하세요.

## 📁 3단계: 파일 위치 설정

### 3-1. 프로젝트 루트에 저장
```
WizCoCo/
├── firebase-service-account.json  # 여기에 저장
├── package.json
├── next.config.js
└── ...
```

### 3-2. .gitignore 확인
`.gitignore` 파일에 다음 내용이 있는지 확인:
```
# Firebase Service Account
firebase-service-account.json
```

## 🔧 4단계: GitHub Secrets 설정

### 4-1. JSON 파일 내용 복사
1. `firebase-service-account.json` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)

### 4-2. GitHub Secrets 추가
1. [GitHub Repository Settings](https://github.com/jomigata/wiz-coco/settings/secrets/actions) 접속
2. "New repository secret" 클릭
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: 복사한 JSON 내용 붙여넣기
5. "Add secret" 클릭

## 🧪 5단계: Service Account 테스트

### 5-1. 로컬 테스트
```bash
# Service Account 파일 확인
node -e "
const fs = require('fs');
const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));
console.log('✅ Service Account 파일 확인됨');
console.log('📊 프로젝트 ID:', serviceAccount.project_id);
console.log('📧 클라이언트 이메일:', serviceAccount.client_email);
"
```

### 5-2. Firebase Admin SDK 테스트
```bash
# Firebase Admin SDK 설치 (필요시)
npm install firebase-admin

# 테스트 스크립트 실행
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('✅ Firebase Admin SDK 초기화 성공');
"
```

## 🔒 6단계: 보안 고려사항

### 6-1. 파일 보안
- ✅ Service Account 파일을 Git에 커밋하지 마세요
- ✅ GitHub Secrets에만 저장하세요
- ✅ 파일을 공개하지 마세요
- ✅ 정기적으로 키를 갱신하세요

### 6-2. 권한 관리
- ✅ 필요한 최소 권한만 부여하세요
- ✅ 프로젝트별로 다른 Service Account 사용
- ✅ 키가 노출되면 즉시 재생성하세요

## 🛠️ 7단계: 문제 해결

### 7-1. 일반적인 문제들

#### ❌ "Service Account file not found"
**해결 방법:**
1. 파일이 올바른 위치에 있는지 확인
2. 파일 이름이 정확한지 확인
3. 파일 권한 확인

#### ❌ "Invalid service account"
**해결 방법:**
1. JSON 파일 형식 확인
2. 필수 필드가 모두 있는지 확인
3. Firebase Console에서 새 키 생성

#### ❌ "Permission denied"
**해결 방법:**
1. Firebase Console에서 권한 확인
2. 프로젝트 ID 확인
3. Service Account 권한 설정 확인

### 7-2. 키 갱신
키가 만료되거나 노출된 경우:
1. Firebase Console에서 기존 키 삭제
2. 새 키 생성
3. GitHub Secrets 업데이트

## 📊 8단계: 모니터링

### 8-1. 사용량 확인
- Firebase Console에서 Service Account 사용량 확인
- API 호출 횟수 모니터링
- 오류 로그 확인

### 8-2. 보안 모니터링
- 비정상적인 접근 패턴 감지
- 권한 변경 알림 설정
- 정기적인 보안 검토

## 🎯 9단계: 자동화

### 9-1. GitHub Actions 설정
```yaml
- name: 📄 Firebase Service Account 파일 생성
  run: |
    echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}' > firebase-service-account.json
```

### 9-2. 환경변수 설정
```bash
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/firebase-service-account.json"
```

## 📋 10단계: Service Account 정보

### 10-1. JSON 파일 구조
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "your-private-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@wiz-coco.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40wiz-coco.iam.gserviceaccount.com"
}
```

### 10-2. 필수 필드
- `type`: "service_account"
- `project_id`: Firebase 프로젝트 ID
- `private_key`: RSA 개인키
- `client_email`: Service Account 이메일
- `client_id`: 클라이언트 ID

## 📞 지원

### 🆘 문제 발생 시
1. Firebase Console에서 Service Account 상태 확인
2. JSON 파일 형식 검증
3. GitHub Secrets 설정 확인
4. Firebase 프로젝트 권한 확인

### 📚 추가 자료
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Service Account 가이드](https://cloud.google.com/iam/docs/service-accounts)
- [GitHub Secrets 문서](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**마지막 업데이트**: 2024년 12월
**버전**: 1.0.0
**검토자**: 30년 경력 풀스택 프로그래머 