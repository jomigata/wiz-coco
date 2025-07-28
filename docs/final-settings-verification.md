# 최종 설정 검증 및 미설정 부분 확인 가이드

## 🚨 **최종 설정 검증 및 미설정 부분 확인**

이전 작업들에서 미설정되었거나 잘못된 설정들을 최종적으로 확인하고 설정하는 방법을 안내합니다.

---

## **1단계: 현재 설정 상태 최종 확인**

### **1-1. GitHub Secrets 현재 상태 확인**
다음 URL에서 현재 설정된 Secrets를 확인하세요:
```
https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
```

### **1-2. 미설정된 필수 Secrets 최종 목록**
다음 Secrets들이 미설정되어 있을 가능성이 높습니다:

#### **최우선 필수 (즉시 설정 필요):**
- [ ] `FIREBASE_TOKEN` ⚠️ **현재 미설정**
- [ ] `FIREBASE_SERVICE_ACCOUNT` ⚠️ **현재 미설정**

#### **Firebase 클라이언트 설정 (필수):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` ⚠️ **현재 미설정**
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` ⚠️ **현재 미설정**
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ⚠️ **현재 미설정**
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ⚠️ **현재 미설정**
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` ⚠️ **현재 미설정**
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` ⚠️ **현재 미설정**
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` ⚠️ **현재 미설정**

---

## **2단계: 미설정된 부분 설정 (수동 작업)**

### **🚨 긴급 작업 (지금 바로 실행):**

#### **2-1. FIREBASE_TOKEN 설정 (최우선)**

**1단계: 터미널에서 토큰 생성**
```bash
firebase login:ci
```

**2단계: 생성된 토큰 확인**
터미널에 표시되는 토큰을 복사:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**3단계: GitHub Secrets에 설정**
1. https://github.com/jomigata/wizcoco_2025/settings/secrets/actions 접속
2. "New repository secret" 클릭
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: 위에서 생성된 토큰 붙여넣기
5. "Add secret" 클릭

#### **2-2. FIREBASE_SERVICE_ACCOUNT 설정 (최우선)**

**1단계: Firebase Console에서 서비스 계정 키 다운로드**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk 접속
2. "Generate new private key" 클릭
3. JSON 파일 다운로드

**2단계: JSON 파일 내용 확인**
다운로드된 JSON 파일을 메모장으로 열어서 전체 내용을 확인:
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "3fbc430944e609b27bba866039d6e84b5c858f9d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEVQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDLdWcnIURortrb\nvYNEVrEAtGH...",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

**3단계: GitHub Secrets에 설정**
1. https://github.com/jomigata/wizcoco_2025/settings/secrets/actions 접속
2. "New repository secret" 클릭
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: JSON 전체 내용 붙여넣기
5. "Add secret" 클릭

#### **2-3. Firebase 클라이언트 설정**

**1단계: Firebase Console에서 웹 앱 설정값 복사**
1. https://console.firebase.google.com/project/wiz-coco/settings/general 접속
2. "Your apps" 섹션에서 웹 앱 설정 확인
3. 다음 값들을 복사:

| 설정값 | 복사 방법 | 실제 값 예시 |
|--------|-----------|-------------|
| **API Key** | 더블클릭하여 전체 선택 후 Ctrl+C | `AIzaSyC...` (실제 값) |
| **Auth Domain** | 값 확인 | `wiz-coco.firebaseapp.com` |
| **Project ID** | 값 확인 | `wiz-coco` |
| **Storage Bucket** | 값 확인 | `wiz-coco.appspot.com` |
| **Messaging Sender ID** | 더블클릭하여 선택 후 Ctrl+C | `123456789` (실제 값) |
| **App ID** | 더블클릭하여 전체 선택 후 Ctrl+C | `1:123456789:web:abcdef` (실제 값) |
| **Measurement ID** | 더블클릭하여 전체 선택 후 Ctrl+C | `G-XXXXXXXXXX` (실제 값) |

**2단계: 각 설정값을 GitHub Secrets에 설정**
각각 개별적으로 GitHub Secrets에 설정:

| GitHub Secret Name | 실제 Value |
|-------------------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 복사한 실제 API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 복사한 실제 Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 복사한 실제 App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | 복사한 실제 Measurement ID |

---

## **3단계: 설정값 최종 검증**

### **3-1. GitHub Secrets 목록 최종 확인**
https://github.com/jomigata/wizcoco_2025/settings/secrets/actions 에서 다음 항목들이 모두 설정되었는지 확인:

- ✅ `FIREBASE_TOKEN`
- ✅ `FIREBASE_SERVICE_ACCOUNT`
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. 실제 값 최종 검증**
각 설정값이 올바른지 확인:
- **FIREBASE_TOKEN**: `1//`로 시작하는 긴 문자열
- **FIREBASE_SERVICE_ACCOUNT**: 유효한 JSON 형태
- **API Key**: `AIzaSyC...`로 시작하는 긴 문자열
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: 숫자만으로 구성
- **App ID**: `1:숫자:web:문자열` 형식
- **Measurement ID**: `G-`로 시작하는 문자열

---

## **4단계: GitHub Actions 재실행**

### **4-1. GitHub Actions 페이지 접속**
1. https://github.com/jomigata/wizcoco_2025/actions 접속
2. 최신 워크플로우 실행 확인

### **4-2. 워크플로우 재실행**
1. "Re-run jobs" 버튼 클릭
2. "Re-run all jobs" 클릭

---

## **5단계: 배포 성공 최종 확인**

### **5-1. GitHub Actions 로그 확인**
1. 워크플로우 실행 상태 확인
2. 성공 메시지 확인

### **5-2. 배포된 사이트 최종 확인**
1. https://wiz-coco.web.app 접속
2. 사이트가 정상적으로 로드되는지 확인

---

## **🔗 관련 링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wizcoco_2025/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 확인:**
- **메인 사이트**: https://wiz-coco.web.app

---

## **📞 문제 해결**

### **문제 1: FIREBASE_TOKEN이 설정되지 않음**
**해결방법:**
1. `firebase login:ci` 실행
2. 생성된 토큰을 GitHub Secrets에 설정

### **문제 2: FIREBASE_SERVICE_ACCOUNT가 설정되지 않음**
**해결방법:**
1. Firebase Console에서 서비스 계정 키 다운로드
2. JSON 전체 내용을 GitHub Secrets에 설정

### **문제 3: Firebase 클라이언트 설정값이 없음**
**해결방법:**
1. Firebase Console에서 웹 앱 설정 확인
2. 각 설정값을 복사하여 GitHub Secrets에 설정

### **문제 4: 값이 올바르지 않음**
**해결방법:**
1. Firebase Console에서 설정값 재확인
2. 복사한 값이 올바른지 확인
3. GitHub Secrets에서 값 재설정

---

## **✅ 최종 완료 체크리스트**

- [ ] FIREBASE_TOKEN 설정 완료
- [ ] FIREBASE_SERVICE_ACCOUNT 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID 설정 완료
- [ ] GitHub Actions 재실행 완료
- [ ] 배포 성공 확인 완료

---

## **🎯 최종 성공 확인**

모든 설정이 완료되면:
1. **GitHub Actions에서 성공 메시지 확인**
2. **배포 완료 후 https://wiz-coco.web.app 접속**
3. **사이트가 정상적으로 로드되는지 확인**

**축하합니다! 모든 미설정된 부분이 최종적으로 해결되었습니다!** 🎉 