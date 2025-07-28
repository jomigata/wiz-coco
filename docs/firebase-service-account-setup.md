# Firebase Service Account 설정 가이드

## 🚨 **FIREBASE_SERVICE_ACCOUNT 설정이 필요합니다!**

GitHub Actions에서 Firebase 배포를 위해 서비스 계정 키가 필요합니다.

## **1단계: Firebase Console 접속**

1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk 접속
2. Firebase 프로젝트 `wiz-coco` 선택

## **2단계: 서비스 계정 키 생성**

1. **"Service accounts" 탭 클릭**
2. **"Firebase Admin SDK" 섹션 확인**
3. **"Generate new private key" 버튼 클릭**
4. **경고 메시지 확인 후 "Generate key" 클릭**
5. **JSON 파일이 자동으로 다운로드됨**

## **3단계: 다운로드된 JSON 파일 확인**

다운로드된 파일명: `wiz-coco-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

파일 내용 예시:
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "69c4c2375c4522bf1631300a09c1001bbbcc802a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

## **4단계: GitHub Secrets에 설정**

1. **GitHub 저장소 접속**: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
2. **"New repository secret" 클릭**
3. **Name 입력**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value 입력**: 다운로드된 JSON 파일의 **전체 내용**을 복사하여 붙여넣기
5. **"Add secret" 클릭**

## **⚠️ 중요 사항**

- **JSON 전체 내용을 복사**: `{` 부터 `}` 까지 모든 내용
- **줄바꿈 유지**: JSON 형식이 깨지지 않도록 주의
- **보안 유지**: 이 파일은 절대 공개되지 않도록 주의
- **백업**: 로컬에 안전한 곳에 백업 보관

## **5단계: 설정 확인**

1. GitHub Secrets 목록에서 `FIREBASE_SERVICE_ACCOUNT` 확인
2. 값이 올바르게 설정되었는지 확인
3. GitHub Actions 재실행

## **🔗 관련 링크**

- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk
- **GitHub Secrets**: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
- **GitHub Actions**: https://github.com/jomigata/wizcoco_2025/actions

## **📞 문제 해결**

만약 문제가 발생하면:
1. JSON 파일이 올바른 형식인지 확인
2. GitHub Secrets에 전체 내용이 복사되었는지 확인
3. Firebase 프로젝트 ID가 `wiz-coco`인지 확인 