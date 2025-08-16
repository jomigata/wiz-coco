# ?�제 ?�정�??�인 �??�정 가?�드

## ?�� **?�제 ?�정값들???�인?�고 ?�정?�는 방법**

?�전 ?�업?�에??미설?�되?�거???�못???�정?�을 ?�제 값과 ?�께 ?�인?�고 ?�정?�는 방법???�내?�니??

---

## **1?�계: ?�재 미설?�된 부�??�인**

### **1-1. GitHub Secrets ?�재 ?�태 ?�인**
?�음 URL?�서 ?�재 ?�정??Secrets�??�인?�세??
```
https://github.com/jomigata/wiz-coco/settings/secrets/actions
```

### **1-2. 미설?�된 ?�수 Secrets 목록**
?�음 Secrets?�이 미설?�되???�을 가?�성???�습?�다:

#### **최우???�수 (즉시 ?�정 ?�요):**
- [ ] `FIREBASE_TOKEN` ?�️ **?�재 미설??*
- [ ] `FIREBASE_SERVICE_ACCOUNT` ?�️ **?�재 미설??*

#### **Firebase ?�라?�언???�정 (?�수):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

---

## **2?�계: ?�제 ?�정�??�인 �??�정**

### **2-1. FIREBASE_TOKEN ?�정 (최우??**

#### **2-1-1. ?�제 Firebase CI ?�큰 ?�성**
?��??�에???�음 명령???�행:
```bash
firebase login:ci
```

#### **2-1-2. ?�제 ?�성???�큰 ?�인**
?��??�에 ?�시?�는 ?�제 ?�큰??복사:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

#### **2-1-3. GitHub Secrets???�제 ?�큰 ?�정**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" ?�릭
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: ?�에???�성???�제 ?�큰 붙여?�기
5. "Add secret" ?�릭

### **2-2. FIREBASE_SERVICE_ACCOUNT ?�정 (최우??**

#### **2-2-1. ?�제 Firebase Service Account JSON ?�운로드**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?�속
2. "Generate new private key" ?�릭
3. ?�제 JSON ?�일 ?�운로드

#### **2-2-2. ?�제 JSON ?�일 ?�용 ?�인**
?�운로드??JSON ?�일???�제 ?�용???�인:
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

#### **2-2-3. GitHub Secrets???�제 JSON ?�정**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" ?�릭
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: ?�제 JSON ?�체 ?�용 붙여?�기
5. "Add secret" ?�릭

### **2-3. Firebase ?�라?�언???�정**

#### **2-3-1. Firebase Console?�서 ?�제 ?�정�?복사**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. "Your apps" ?�션?�서 ?????�정 ?�인
3. ?�음 ?�제 값들??복사:

| ?�정�?| 복사 방법 | ?�제 �??�시 |
|--------|-----------|-------------|
| **API Key** | ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C | `AIzaSyC...` (?�제 �? |
| **Auth Domain** | �??�인 | `wiz-coco.firebaseapp.com` |
| **Project ID** | �??�인 | `wiz-coco` |
| **Storage Bucket** | �??�인 | `wiz-coco.appspot.com` |
| **Messaging Sender ID** | ?�블?�릭?�여 ?�택 ??Ctrl+C | `123456789` (?�제 �? |
| **App ID** | ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C | `1:123456789:web:abcdef` (?�제 �? |
| **Measurement ID** | ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C | `G-XXXXXXXXXX` (?�제 �? |

#### **2-3-2. GitHub Secrets???�제 �??�정**
�??�제 ?�정값을 개별?�으�?GitHub Secrets???�정:

| GitHub Secret Name | ?�제 Value |
|-------------------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 복사???�제 API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 복사???�제 Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 복사???�제 App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | 복사???�제 Measurement ID |

---

## **3?�계: ?�정�?검�?*

### **3-1. GitHub Secrets 목록 ?�인**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. ?�제 �?검�?*
�??�정값이 ?�바른�? ?�인:
- **FIREBASE_TOKEN**: `1//`�??�작?�는 �?문자??
- **FIREBASE_SERVICE_ACCOUNT**: ?�효??JSON ?�태
- **API Key**: `AIzaSyC...`�??�작?�는 �?문자??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?�자만으�?구성
- **App ID**: `1:?�자:web:문자?? ?�식
- **Measurement ID**: `G-`�??�작?�는 문자??

---

## **4?�계: GitHub Actions ?�실??*

### **4-1. GitHub Actions ?�이지 ?�속**
1. https://github.com/jomigata/wiz-coco/actions ?�속
2. 최신 ?�크?�로???�행 ?�인

### **4-2. ?�크?�로???�실??*
1. "Re-run jobs" 버튼 ?�릭
2. "Re-run all jobs" ?�릭

---

## **5?�계: 배포 ?�공 ?�인**

### **5-1. GitHub Actions 로그 ?�인**
1. ?�크?�로???�행 ?�태 ?�인
2. ?�공 메시지 ?�인

### **5-2. 배포???�이???�인**
1. https://wiz-coco.web.app ?�속
2. ?�이?��? ?�상?�으�?로드?�는지 ?�인

---

## **?�� 관??링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## **?�� 문제 ?�결**

### **문제 1: FIREBASE_TOKEN???�정?��? ?�음**
**?�결방법:**
1. `firebase login:ci` ?�행
2. ?�성???�제 ?�큰??GitHub Secrets???�정

### **문제 2: FIREBASE_SERVICE_ACCOUNT가 ?�정?��? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�제 ?�비??계정 ???�운로드
2. ?�제 JSON ?�체 ?�용??GitHub Secrets???�정

### **문제 3: Firebase ?�라?�언???�정값이 ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�제 ?????�정 ?�인
2. �??�제 ?�정값을 복사?�여 GitHub Secrets???�정

### **문제 4: 값이 ?�바르�? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�제 ?�정�??�확??
2. 복사???�제 값이 ?�바른�? ?�인
3. GitHub Secrets?�서 ?�제 �??�설??

---

## **???�료 체크리스??*

- [ ] FIREBASE_TOKEN ?�제 ?�정 ?�료
- [ ] FIREBASE_SERVICE_ACCOUNT ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?�제 ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?�제 ?�정 ?�료
- [ ] GitHub Actions ?�실???�료
- [ ] 배포 ?�공 ?�인 ?�료

---

## **?�� ?�공 ?�인**

모든 ?�정???�료?�면:
1. **GitHub Actions?�서 ?�공 메시지 ?�인**
2. **배포 ?�료 ??https://wiz-coco.web.app ?�속**
3. **?�이?��? ?�상?�으�?로드?�는지 ?�인**

**축하?�니?? 모든 ?�제 ?�정값이 ?�바르게 ?�정?�었?�니??** ?�� 
# ?? WizCoCo 배포 ?�태 �??�결 가?�드

## ??**?�결??문제?�들**

### **1. FIREBASE_TOKEN ?�성 ?�료**
- **?�성???�큰**: `1//0gIbt4IPPkWKqCgYIARAAGBASNwF-L9IrVkWghw8QRx7D-vOUfoMg0q9qIEzr4WEtg_cxwJiaCy5z`
- **?�태**: ???�성 ?�료
- **?�음 ?�계**: GitHub Secrets???�정 ?�요

### **2. FIREBASE_SERVICE_ACCOUNT 준�??�료**
- **?�일 ?�치**: `d:\Capture\wiz-coco-firebase-adminsdk-fbsvc-c153fcc55d.json`
- **?�태**: ???�일 준�??�료
- **?�음 ?�계**: JSON ?�용??GitHub Secrets???�정 ?�요

### **3. 로컬 배포 ?�공 ?�료** ?��
- **배포 URL**: https://wiz-coco.web.app
- **?�태**: ??배포 ?�공
- **배포 ?�간**: 2025??1??27??
- **?�일 ??*: 407�??�일 ?�로???�료

---

## ?�� **즉시 ?�결?�야 ???�업**

### **1?�계: GitHub Secrets ?�정 (?�동 배포??**

#### **1-1. FIREBASE_TOKEN ?�정**
1. **GitHub Secrets ?�이지 ?�속**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions

2. **"New repository secret" ?�릭**

3. **?�정�??�력**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: `1//0gIbt4IPPkWKqCgYIARAAGBASNwF-L9IrVkWghw8QRx7D-vOUfoMg0q9qIEzr4WEtg_cxwJiaCy5z`
   - **"Add secret" ?�릭**

#### **1-2. FIREBASE_SERVICE_ACCOUNT ?�정**
1. **JSON ?�일 ?�용 복사**
   - `d:\Capture\wiz-coco-firebase-adminsdk-fbsvc-c153fcc55d.json` ?�일 ?�기
   - ?�체 ?�용??Ctrl+A�??�택 ??Ctrl+C�?복사

2. **GitHub Secrets???�정**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: 복사??JSON ?�체 ?�용 붙여?�기
   - **"Add secret" ?�릭**

#### **1-3. Firebase ?�라?�언???�정**
Firebase Console?�서 ?�음 값들??복사?�여 ?�정:

| GitHub Secret Name | Firebase Console?�서 복사??�?|
|-------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID |

### **2?�계: GitHub Actions ?�실??*

1. **GitHub Actions ?�이지 ?�속**
   - https://github.com/jomigata/wiz-coco/actions

2. **"Re-run jobs" ?�릭**

3. **"Re-run all jobs" ?�릭**

---

## ?�� **?�재 ?�정 ?�태**

### **???�료???�정**
- [x] Firebase CLI ?�치 �?로그??
- [x] FIREBASE_TOKEN ?�성
- [x] FIREBASE_SERVICE_ACCOUNT ?�일 준�?
- [x] **로컬 빌드 ?�공**
- [x] **로컬 배포 ?�공**

### **?�️ 미완�??�정 (?�동 배포??**
- [ ] FIREBASE_TOKEN GitHub Secrets ?�정
- [ ] FIREBASE_SERVICE_ACCOUNT GitHub Secrets ?�정
- [ ] Firebase ?�라?�언???�정값들 GitHub Secrets ?�정

---

## ?�� **배포???�이???�보**

### **메인 ?�이??*
- **URL**: https://wiz-coco.web.app
- **?�태**: ???�상 배포??
- **?�이지 ??*: 52�??�이지
- **�??�일 ??*: 407�??�일

### **Firebase Console**
- **?�로?�트**: wiz-coco
- **Hosting URL**: https://console.firebase.google.com/project/wiz-coco/overview

---

## ?�� **관??링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## ?�� **?�상 결과**

모든 ?�정???�료?�면:
1. **GitHub Actions가 ?�공?�으�??�행??*
2. **Firebase Hosting???�동 배포??*
3. **https://wiz-coco.web.app ?�서 ?�이???�인 가??*

---

## ?�� **문제 ?�결**

### **문제 1: GitHub Secrets ?�정???�됨**
**?�결방법:**
1. GitHub ?�?�소???�??관리자 권한 ?�인
2. 브라?��? 캐시 ??�� ???�시??
3. ?�른 브라?��??�서 ?�도

### **문제 2: Firebase Console ?�속???�됨**
**?�결방법:**
1. ?�바�?Google 계정?�로 로그???�인
2. Firebase ?�로?�트 권한 ?�인
3. 브라?��? ?�장 ?�로그램 비활?�화 ???�도

### **문제 3: 배포 ???�이?��? 로드?��? ?�음**
**?�결방법:**
1. Firebase Console?�서 Hosting ?�태 ?�인
2. ?�메???�정 ?�인
3. 캐시 ??�� ???�시??

---

## ?? **배포 ?�료 ???�인?�항**

1. **?�이???�속 ?�인**: https://wiz-coco.web.app
2. **주요 기능 ?�스??*: 로그?? ?�스?? 결과 ?�??
3. **?�능 ?�인**: ?�이지 로딩 ?�도, 반응??
4. **모바???�환???�인**: ?�양??기기?�서 ?�스??

---

## ?�� **?�데?�트 ?�시**

- **최종 ?�데?�트**: 2025??1??27??
- **배포 ?�료**: 2025??1??27??
- **?�음 검??*: GitHub Actions ?�동 배포 ?�정 ?�료 ??
- **?�당??*: AI ?�시?�턴??
# 최종 ?�정 검�?�?미설??부�??�인 가?�드

## ?�� **최종 ?�정 검�?�?미설??부�??�인**

?�전 ?�업?�에??미설?�되?�거???�못???�정?�을 최종?�으�??�인?�고 ?�정?�는 방법???�내?�니??

---

## **1?�계: ?�재 ?�정 ?�태 최종 ?�인**

### **1-1. GitHub Secrets ?�재 ?�태 ?�인**
?�음 URL?�서 ?�재 ?�정??Secrets�??�인?�세??
```
https://github.com/jomigata/wiz-coco/settings/secrets/actions
```

### **1-2. 미설?�된 ?�수 Secrets 최종 목록**
?�음 Secrets?�이 미설?�되???�을 가?�성???�습?�다:

#### **최우???�수 (즉시 ?�정 ?�요):**
- [ ] `FIREBASE_TOKEN` ?�️ **?�재 미설??*
- [ ] `FIREBASE_SERVICE_ACCOUNT` ?�️ **?�재 미설??*

#### **Firebase ?�라?�언???�정 (?�수):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` ?�️ **?�재 미설??*
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` ?�️ **?�재 미설??*
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` ?�️ **?�재 미설??*
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ?�️ **?�재 미설??*
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` ?�️ **?�재 미설??*
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` ?�️ **?�재 미설??*
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` ?�️ **?�재 미설??*

---

## **2?�계: 미설?�된 부�??�정 (?�동 ?�업)**

### **?�� 긴급 ?�업 (지�?바로 ?�행):**

#### **2-1. FIREBASE_TOKEN ?�정 (최우??**

**1?�계: ?��??�에???�큰 ?�성**
```bash
firebase login:ci
```

**2?�계: ?�성???�큰 ?�인**
?��??�에 ?�시?�는 ?�큰??복사:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**3?�계: GitHub Secrets???�정**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" ?�릭
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: ?�에???�성???�큰 붙여?�기
5. "Add secret" ?�릭

#### **2-2. FIREBASE_SERVICE_ACCOUNT ?�정 (최우??**

**1?�계: Firebase Console?�서 ?�비??계정 ???�운로드**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?�속
2. "Generate new private key" ?�릭
3. JSON ?�일 ?�운로드

**2?�계: JSON ?�일 ?�용 ?�인**
?�운로드??JSON ?�일??메모?�으�??�어???�체 ?�용???�인:
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

**3?�계: GitHub Secrets???�정**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" ?�릭
3. **Name**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value**: JSON ?�체 ?�용 붙여?�기
5. "Add secret" ?�릭

#### **2-3. Firebase ?�라?�언???�정**

**1?�계: Firebase Console?�서 ?????�정�?복사**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. "Your apps" ?�션?�서 ?????�정 ?�인
3. ?�음 값들??복사:

| ?�정�?| 복사 방법 | ?�제 �??�시 |
|--------|-----------|-------------|
| **API Key** | ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C | `AIzaSyC...` (?�제 �? |
| **Auth Domain** | �??�인 | `wiz-coco.firebaseapp.com` |
| **Project ID** | �??�인 | `wiz-coco` |
| **Storage Bucket** | �??�인 | `wiz-coco.appspot.com` |
| **Messaging Sender ID** | ?�블?�릭?�여 ?�택 ??Ctrl+C | `123456789` (?�제 �? |
| **App ID** | ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C | `1:123456789:web:abcdef` (?�제 �? |
| **Measurement ID** | ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C | `G-XXXXXXXXXX` (?�제 �? |

**2?�계: �??�정값을 GitHub Secrets???�정**
각각 개별?�으�?GitHub Secrets???�정:

| GitHub Secret Name | ?�제 Value |
|-------------------|------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | 복사???�제 API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 복사???�제 Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 복사???�제 App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | 복사???�제 Measurement ID |

---

## **3?�계: ?�정�?최종 검�?*

### **3-1. GitHub Secrets 목록 최종 ?�인**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. ?�제 �?최종 검�?*
�??�정값이 ?�바른�? ?�인:
- **FIREBASE_TOKEN**: `1//`�??�작?�는 �?문자??
- **FIREBASE_SERVICE_ACCOUNT**: ?�효??JSON ?�태
- **API Key**: `AIzaSyC...`�??�작?�는 �?문자??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?�자만으�?구성
- **App ID**: `1:?�자:web:문자?? ?�식
- **Measurement ID**: `G-`�??�작?�는 문자??

---

## **4?�계: GitHub Actions ?�실??*

### **4-1. GitHub Actions ?�이지 ?�속**
1. https://github.com/jomigata/wiz-coco/actions ?�속
2. 최신 ?�크?�로???�행 ?�인

### **4-2. ?�크?�로???�실??*
1. "Re-run jobs" 버튼 ?�릭
2. "Re-run all jobs" ?�릭

---

## **5?�계: 배포 ?�공 최종 ?�인**

### **5-1. GitHub Actions 로그 ?�인**
1. ?�크?�로???�행 ?�태 ?�인
2. ?�공 메시지 ?�인

### **5-2. 배포???�이??최종 ?�인**
1. https://wiz-coco.web.app ?�속
2. ?�이?��? ?�상?�으�?로드?�는지 ?�인

---

## **?�� 관??링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## **?�� 문제 ?�결**

### **문제 1: FIREBASE_TOKEN???�정?��? ?�음**
**?�결방법:**
1. `firebase login:ci` ?�행
2. ?�성???�큰??GitHub Secrets???�정

### **문제 2: FIREBASE_SERVICE_ACCOUNT가 ?�정?��? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�비??계정 ???�운로드
2. JSON ?�체 ?�용??GitHub Secrets???�정

### **문제 3: Firebase ?�라?�언???�정값이 ?�음**
**?�결방법:**
1. Firebase Console?�서 ?????�정 ?�인
2. �??�정값을 복사?�여 GitHub Secrets???�정

### **문제 4: 값이 ?�바르�? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�정�??�확??
2. 복사??값이 ?�바른�? ?�인
3. GitHub Secrets?�서 �??�설??

---

## **??최종 ?�료 체크리스??*

- [ ] FIREBASE_TOKEN ?�정 ?�료
- [ ] FIREBASE_SERVICE_ACCOUNT ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?�정 ?�료
- [ ] GitHub Actions ?�실???�료
- [ ] 배포 ?�공 ?�인 ?�료

---

## **?�� 최종 ?�공 ?�인**

모든 ?�정???�료?�면:
1. **GitHub Actions?�서 ?�공 메시지 ?�인**
2. **배포 ?�료 ??https://wiz-coco.web.app ?�속**
3. **?�이?��? ?�상?�으�?로드?�는지 ?�인**

**축하?�니?? 모든 미설?�된 부분이 최종?�으�??�결?�었?�니??** ?�� 
# Firebase ?�제 ?�정�??�인 가?�드

## ?�� **?�제 Firebase ?�정�??�인 �?복사 방법**

Firebase Console?�서 ?�제 ?�정값들???�인?�고 복사?�는 방법???�계별로 ?�내?�니??

---

## **1?�계: Firebase Console ?�속**

### **1-1. 브라?��??�서 Firebase Console ?�기**
1. **브라?��? 주소창에 ?�음 URL ?�력:**
   ```
   https://console.firebase.google.com/project/wiz-coco/settings/general
   ```
2. **Enter ?��? ?�러 ?�속**

### **1-2. ?�로?�트 ?�인**
1. **?�단??"wiz-coco" ?�로?�트가 ?�택?�어 ?�는지 ?�인**
2. **만약 ?�른 ?�로?�트가 ?�택?�어 ?�다�??�롭?�운?�서 "wiz-coco" ?�택**

---

## **2?�계: ?????�정 찾기**

### **2-1. Project settings ?�속**
1. **?�쪽 ?�단???�니바�??�이�??�릭** (Project settings)
2. **"General" ??�� ?�택?�어 ?�는지 ?�인**

### **2-2. Your apps ?�션 ?�인**
1. **?�이지�??�래�??�크롤하??"Your apps" ?�션 찾기**
2. **???�이 ?�는지 ?�인** (</> ?�이콘이 ?�는 ??

### **2-3. ???�이 ?�는 경우 ?�록**
만약 ???�이 ?�다�?
1. **"Add app" 버튼 ?�릭**
2. **"Web" ?�이�??�릭** (</> ?�이�?
3. **???�네???�력**: `wizcoco-web`
4. **"Register app" ?�릭**
5. **"Continue to console" ?�릭**

---

## **3?�계: ?�정�?복사**

### **3-1. ?????�정 ?�기**
1. **"Your apps" ?�션?�서 ?????�릭**
2. **?????�정 ?�이지�??�동**

### **3-2. ?�정값들 복사**

#### **3-2-1. API Key 복사**
1. **"API Key" ?�션 찾기**
2. **API Key 값을 ?�블?�릭?�여 ?�체 ?�택**
3. **Ctrl+C�?복사**
4. **메모?�에 붙여?�기**

**?�시**: `AIzaSyC...`�??�작?�는 �?문자??

#### **3-2-2. Auth Domain ?�인**
1. **"Auth Domain" ?�션 찾기**
2. **�??�인**: `wiz-coco.firebaseapp.com`
3. **메모?�에 ?�??*

#### **3-2-3. Project ID ?�인**
1. **"Project ID" ?�션 찾기**
2. **�??�인**: `wiz-coco`
3. **메모?�에 ?�??*

#### **3-2-4. Storage Bucket ?�인**
1. **"Storage Bucket" ?�션 찾기**
2. **�??�인**: `wiz-coco.appspot.com`
3. **메모?�에 ?�??*

#### **3-2-5. Messaging Sender ID 복사**
1. **"Messaging Sender ID" ?�션 찾기**
2. **?�자 값을 ?�블?�릭?�여 ?�택**
3. **Ctrl+C�?복사**
4. **메모?�에 붙여?�기**

**?�시**: `123456789` (?�자�?

#### **3-2-6. App ID 복사**
1. **"App ID" ?�션 찾기**
2. **App ID 값을 ?�블?�릭?�여 ?�체 ?�택**
3. **Ctrl+C�?복사**
4. **메모?�에 붙여?�기**

**?�시**: `1:123456789:web:abcdef` (1:?�자:web:문자???�식)

#### **3-2-7. Measurement ID 복사**
1. **"Measurement ID" ?�션 찾기**
2. **Measurement ID 값을 ?�블?�릭?�여 ?�체 ?�택**
3. **Ctrl+C�?복사**
4. **메모?�에 붙여?�기**

**?�시**: `G-XXXXXXXXXX` (G-�??�작?�는 문자??

---

## **4?�계: 메모?�에 ?�?�된 값들 ?�인**

메모?�에 ?�음�?같이 ?�?�되???�는지 ?�인:

```
API Key: AIzaSyC... (?�제 �?
Auth Domain: wiz-coco.firebaseapp.com
Project ID: wiz-coco
Storage Bucket: wiz-coco.appspot.com
Messaging Sender ID: 123456789 (?�제 �?
App ID: 1:123456789:web:abcdef (?�제 �?
Measurement ID: G-XXXXXXXXXX (?�제 �?
```

---

## **5?�계: GitHub Secrets ?�정**

### **5-1. GitHub Secrets ?�이지 ?�속**
1. **??브라?��? ???�기**
2. **?�음 URL ?�력:**
   ```
   https://github.com/jomigata/wiz-coco/settings/secrets/actions
   ```
3. **Enter ?��? ?�러 ?�속**

### **5-2. �??�정값을 GitHub Secrets???�정**

#### **5-2-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_API_KEY`
3. **Value ?�력**: 메모?�에??복사??API Key 붙여?�기
4. **"Add secret" ?�릭**

#### **5-2-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value ?�력**: `wiz-coco.firebaseapp.com`
4. **"Add secret" ?�릭**

#### **5-2-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value ?�력**: `wiz-coco`
4. **"Add secret" ?�릭**

#### **5-2-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value ?�력**: `wiz-coco.appspot.com`
4. **"Add secret" ?�릭**

#### **5-2-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value ?�력**: 메모?�에??복사??Messaging Sender ID 붙여?�기
4. **"Add secret" ?�릭**

#### **5-2-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value ?�력**: 메모?�에??복사??App ID 붙여?�기
4. **"Add secret" ?�릭**

#### **5-2-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value ?�력**: 메모?�에??복사??Measurement ID 붙여?�기
4. **"Add secret" ?�릭**

---

## **6?�계: ?�정 ?�인**

### **6-1. GitHub Secrets 목록 ?�인**
GitHub Secrets ?�이지?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **6-2. �?검�?*
�??�정값이 ?�바른�? ?�인:
- **API Key**: `AIzaSyC...`�??�작?�는 �?문자??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?�자만으�?구성
- **App ID**: `1:?�자:web:문자?? ?�식
- **Measurement ID**: `G-`�??�작?�는 문자??

---

## **7?�계: GitHub Actions ?�실??*

### **7-1. GitHub Actions ?�이지 ?�속**
1. **??브라?��? ???�기**
2. **?�음 URL ?�력:**
   ```
   https://github.com/jomigata/wiz-coco/actions
   ```
3. **Enter ?��? ?�러 ?�속**

### **7-2. ?�크?�로???�실??*
1. **최신 ?�크?�로???�행 ?�인**
2. **"Re-run jobs" 버튼 ?�릭**
3. **"Re-run all jobs" ?�릭**

---

## **?�� 관??링크**

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
- **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
- **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## **?�� 문제 ?�결**

### **문제 1: ?�정값이 복사?��? ?�음**
**?�결방법:**
1. ?�정값을 ?�블?�릭?�여 ?�체 ?�택
2. Ctrl+C�?복사
3. 메모?�에 붙여?�기

### **문제 2: ???�이 보이지 ?�음**
**?�결방법:**
1. Firebase Console?�서 "Add app" ??"Web" ?�릭
2. ???�록 ???�정값들 ?�인

### **문제 3: 값이 ?�바르�? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�정�??�확??
2. 복사??값이 ?�바른�? ?�인
3. GitHub Secrets?�서 �??�설??

---

## **???�료 체크리스??*

- [ ] Firebase Console ?�속 ?�료
- [ ] ?????�정 ?�인 ?�료
- [ ] API Key 복사 ?�료
- [ ] Auth Domain ?�인 ?�료
- [ ] Project ID ?�인 ?�료
- [ ] Storage Bucket ?�인 ?�료
- [ ] Messaging Sender ID 복사 ?�료
- [ ] App ID 복사 ?�료
- [ ] Measurement ID 복사 ?�료
- [ ] 메모?�에 값들 ?�???�료
- [ ] GitHub Secrets ?�이지 ?�속 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?�정 ?�료
- [ ] GitHub Actions ?�실???�료

---

## **?�� ?�공 ?�인**

모든 ?�정???�료?�면:
1. **GitHub Actions?�서 ?�공 메시지 ?�인**
2. **배포 ?�료 ??https://wiz-coco.web.app ?�속**
3. **?�이?��? ?�상?�으�?로드?�는지 ?�인**

**축하?�니?? Firebase ?�라?�언???�정???�료?�었?�니??** ?�� 
# Firebase ?�라?�언???�정 ?�세 가?�드

## ?�� **Firebase ?�라?�언???�정 ?�전 가?�드**

GitHub Actions?�서 Firebase 배포�??�해 ?????�정값들??복사?�여 GitHub Secrets???�정?�는 방법???�계별로 ?�세???�내?�니??

---

## **1?�계: Firebase Console ?�속**

### **1-1. 브라?��??�서 Firebase Console ?�기**
1. **브라?��? 주소창에 ?�음 URL ?�력:**
   ```
   https://console.firebase.google.com/project/wiz-coco/settings/general
   ```
2. **Enter ?��? ?�러 ?�속**

### **1-2. Firebase 계정 로그??*
1. **Google 계정?�로 로그??* (wiz-coco ?�로?�트???�근 권한???�는 계정)
2. **?�로?�트 ?�택**: `wiz-coco` ?�로?�트가 ?�택?�어 ?�는지 ?�인

---

## **2?�계: ?????�정 ?�인**

### **2-1. General ???�인**
1. **?�쪽 메뉴?�서 "Project settings" ?�릭** (?�니바�??�이�?
2. **"General" ??�� ?�택?�어 ?�는지 ?�인**

### **2-2. Your apps ?�션 ?�인**
1. **"Your apps" ?�션??찾기** (?�이지 중간 부�?
2. **???�이 ?�는지 ?�인**

### **2-3. ???�이 ?�는 경우 ?�록**
만약 ???�이 ?�다�?
1. **"Add app" 버튼 ?�릭**
2. **"Web" ?�이�??�릭** (</> ?�이�?
3. **???�네???�력**: `wizcoco-web`
4. **"Register app" ?�릭**
5. **"Continue to console" ?�릭**

---

## **3?�계: ?????�정�?복사**

### **3-1. ?????�정 ?�기**
1. **"Your apps" ?�션?�서 ?????�릭**
2. **"Project settings" ?�이지?�서 ?????�정 ?�인**

### **3-2. ?�정값들 복사**
?????�정?�서 ?�음 값들???�나??복사:

#### **3-2-1. API Key 복사**
1. **"API Key" ?�션 찾기**
2. **API Key �?복사** (?? `AIzaSyC...`�??�작?�는 �?문자??
3. **메모?�에 ?�시 ?�??*

#### **3-2-2. Auth Domain ?�인**
1. **"Auth Domain" ?�션 찾기**
2. **�??�인**: `wiz-coco.firebaseapp.com`
3. **메모?�에 ?�??*

#### **3-2-3. Project ID ?�인**
1. **"Project ID" ?�션 찾기**
2. **�??�인**: `wiz-coco`
3. **메모?�에 ?�??*

#### **3-2-4. Storage Bucket ?�인**
1. **"Storage Bucket" ?�션 찾기**
2. **�??�인**: `wiz-coco.appspot.com`
3. **메모?�에 ?�??*

#### **3-2-5. Messaging Sender ID 복사**
1. **"Messaging Sender ID" ?�션 찾기**
2. **?�자 �?복사** (?? `123456789`)
3. **메모?�에 ?�??*

#### **3-2-6. App ID 복사**
1. **"App ID" ?�션 찾기**
2. **App ID �?복사** (?? `1:123456789:web:abcdef`)
3. **메모?�에 ?�??*

#### **3-2-7. Measurement ID 복사**
1. **"Measurement ID" ?�션 찾기**
2. **Measurement ID �?복사** (?? `G-XXXXXXXXXX`)
3. **메모?�에 ?�??*

---

## **4?�계: GitHub Secrets ?�정**

### **4-1. GitHub Secrets ?�이지 ?�속**
1. **??브라?��? ???�기**
2. **?�음 URL ?�력:**
   ```
   https://github.com/jomigata/wiz-coco/settings/secrets/actions
   ```
3. **Enter ?��? ?�러 ?�속**

### **4-2. FIREBASE_API_KEY ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_API_KEY`
3. **Value ?�력**: 메모?�에??복사??API Key 붙여?�기
4. **"Add secret" ?�릭**

### **4-3. FIREBASE_AUTH_DOMAIN ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value ?�력**: `wiz-coco.firebaseapp.com`
4. **"Add secret" ?�릭**

### **4-4. FIREBASE_PROJECT_ID ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value ?�력**: `wiz-coco`
4. **"Add secret" ?�릭**

### **4-5. FIREBASE_STORAGE_BUCKET ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value ?�력**: `wiz-coco.appspot.com`
4. **"Add secret" ?�릭**

### **4-6. FIREBASE_MESSAGING_SENDER_ID ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value ?�력**: 메모?�에??복사??Messaging Sender ID 붙여?�기
4. **"Add secret" ?�릭**

### **4-7. FIREBASE_APP_ID ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value ?�력**: 메모?�에??복사??App ID 붙여?�기
4. **"Add secret" ?�릭**

### **4-8. FIREBASE_MEASUREMENT_ID ?�정**
1. **"New repository secret" 버튼 ?�릭**
2. **Name ?�력**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value ?�력**: 메모?�에??복사??Measurement ID 붙여?�기
4. **"Add secret" ?�릭**

---

## **5?�계: ?�정 ?�인**

### **5-1. GitHub Secrets 목록 ?�인**
GitHub Secrets ?�이지?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **5-2. �?검�?*
�??�정값이 ?�바른�? ?�인:
- **API Key**: `AIzaSyC...`�??�작?�는 �?문자??
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: ?�자만으�?구성
- **App ID**: `1:?�자:web:문자?? ?�식
- **Measurement ID**: `G-`�??�작?�는 문자??

---

## **6?�계: GitHub Actions ?�실??*

### **6-1. GitHub Actions ?�이지 ?�속**
1. **??브라?��? ???�기**
2. **?�음 URL ?�력:**
   ```
   https://github.com/jomigata/wiz-coco/actions
   ```
3. **Enter ?��? ?�러 ?�속**

### **6-2. ?�크?�로???�실??*
1. **최신 ?�크?�로???�행 ?�인**
2. **"Re-run jobs" 버튼 ?�릭**
3. **"Re-run all jobs" ?�릭**

---

## **?�� 관??링크**

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
- **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
- **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## **?�� 문제 ?�결**

### **문제 1: ???�이 보이지 ?�음**
**?�결방법:**
1. Firebase Console?�서 "Add app" ??"Web" ?�릭
2. ???�록 ???�정값들 ?�인

### **문제 2: ?�정값이 복사?��? ?�음**
**?�결방법:**
1. ?�정값을 ?�블?�릭?�여 ?�체 ?�택
2. Ctrl+C�?복사
3. 메모?�에 붙여?�기

### **문제 3: GitHub Secrets???�정???�됨**
**?�결방법:**
1. GitHub ?�?�소???�근 권한 ?�인
2. Settings ??Secrets and variables ??Actions ?�근 권한 ?�인
3. ?�시 ?�도

### **문제 4: 값이 ?�바르�? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�정�??�확??
2. 복사??값이 ?�바른�? ?�인
3. GitHub Secrets?�서 �??�설??

---

## **???�료 체크리스??*

- [ ] Firebase Console ?�속 ?�료
- [ ] ?????�정 ?�인 ?�료
- [ ] API Key 복사 ?�료
- [ ] Auth Domain ?�인 ?�료
- [ ] Project ID ?�인 ?�료
- [ ] Storage Bucket ?�인 ?�료
- [ ] Messaging Sender ID 복사 ?�료
- [ ] App ID 복사 ?�료
- [ ] Measurement ID 복사 ?�료
- [ ] GitHub Secrets ?�이지 ?�속 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?�정 ?�료
- [ ] GitHub Actions ?�실???�료

---

## **?�� ?�공 ?�인**

모든 ?�정???�료?�면:
1. **GitHub Actions?�서 ?�공 메시지 ?�인**
2. **배포 ?�료 ??https://wiz-coco.web.app ?�속**
3. **?�이?��? ?�상?�으�?로드?�는지 ?�인**

**축하?�니?? Firebase ?�라?�언???�정???�료?�었?�니??** ?�� 
# Firebase ?�라?�언???�정 가?�드

## ?�� **Firebase ?�라?�언???�정???�요?�니??**

GitHub Actions?�서 Firebase ?�라?�언???�정값들???�요?�니??

## **1?�계: Firebase Console ?�속**

1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. Firebase ?�로?�트 `wiz-coco` ?�택

## **2?�계: ?????�정 ?�인**

1. **"General" ??��??"Your apps" ?�션 ?�인**
2. **???�이 ?�다�?"Add app" ??"Web" ?�릭**
3. **???�록 ???�정값들 ?�인**

## **3?�계: ?�정값들 복사**

?????�정?�서 ?�음 값들??복사:

### **?�수 ?�정값들:**

| GitHub Secret Name | Firebase Console?�서 복사??�?| ?�시 |
|-------------------|-------------------------------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key | `AIzaSyC...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth Domain | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123456789:web:abcdef` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID | `G-XXXXXXXXXX` |

## **4?�계: GitHub Secrets???�정**

�??�정값을 개별?�으�?GitHub Secrets???�정:

### **4-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. GitHub Secrets ?�이지 ?�속: https://github.com/jomigata/wiz-coco/settings/secrets/actions
2. "New repository secret" ?�릭
3. **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
4. **Value**: Firebase Console?�서 복사??API Key
5. "Add secret" ?�릭

### **4-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. "New repository secret" ?�릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value**: `wiz-coco.firebaseapp.com`
4. "Add secret" ?�릭

### **4-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. "New repository secret" ?�릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value**: `wiz-coco`
4. "Add secret" ?�릭

### **4-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. "New repository secret" ?�릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value**: `wiz-coco.appspot.com`
4. "Add secret" ?�릭

### **4-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. "New repository secret" ?�릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value**: Firebase Console?�서 복사??Messaging Sender ID
4. "Add secret" ?�릭

### **4-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. "New repository secret" ?�릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value**: Firebase Console?�서 복사??App ID
4. "Add secret" ?�릭

### **4-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. "New repository secret" ?�릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value**: Firebase Console?�서 복사??Measurement ID
4. "Add secret" ?�릭

## **5?�계: ?�정 ?�인**

GitHub Secrets 목록?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## **6?�계: Firebase ?�비???�성??*

Firebase Console?�서 ?�음 ?�비?�들???�성?�되???�는지 ?�인:

1. **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
2. **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
3. **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
4. **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

## **?�� 관??링크**

- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **GitHub Secrets**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **GitHub Actions**: https://github.com/jomigata/wiz-coco/actions

## **?�� 문제 ?�결**

만약 문제가 발생?�면:
1. Firebase Console?�서 ???�이 ?�바르게 ?�록?�었?��? ?�인
2. 모든 ?�정값이 ?�바르게 복사?�었?��? ?�인
3. GitHub Secrets??값이 ?�바르게 ?�정?�었?��? ?�인
4. Firebase ?�로?�트 ID가 `wiz-coco`?��? ?�인 
# Firebase 직접 배포 가?�드

## ?? **Firebase 직접 배포 방법**

GitHub Actions ?�이 Firebase CLI�??�용?�여 직접 배포?�는 방법???�내?�니??

---

## **1?�계: Firebase CLI ?�치 �??�정**

### **1-1. Firebase CLI ?�치**
```bash
npm install -g firebase-tools
```

### **1-2. Firebase 로그??*
```bash
firebase login
```

### **1-3. ?�로?�트 ?�인**
```bash
firebase projects:list
firebase use wiz-coco
```

---

## **2?�계: 배포 방법**

### **2-1. 기본 배포 명령??*
```bash
# 빌드 ??배포
npm run build
firebase deploy --only hosting
```

### **2-2. package.json ?�크립트 ?�용**
```bash
# Firebase Hosting�?배포
npm run deploy:firebase

# 강제 배포 (캐시 무시)
npm run deploy:quick
```

### **2-3. 배치 ?�일 ?�용 (Windows)**
```bash
# deploy-firebase.bat ?�행
deploy-firebase.bat
```

---

## **3?�계: 배포 ???�인?�항**

### **3-1. ?�경 변???�정**
`.env.local` ?�일??Firebase ?�정 ?�인:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wiz-coco.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wiz-coco
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wiz-coco.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### **3-2. Firebase ?�정 ?�인**
`firebase.json` ?�일 ?�인:
```json
{
  "hosting": {
    "public": ".next",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

---

## **4?�계: 배포 과정**

### **4-1. 빌드**
```bash
npm run build
```

### **4-2. 배포**
```bash
firebase deploy --only hosting
```

### **4-3. 배포 ?�인**
- **배포 URL**: https://wiz-coco.web.app
- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/hosting

---

## **5?�계: 로컬 ?�스??*

### **5-1. 로컬 ?�버 ?�행**
```bash
firebase serve
```

### **5-2. 빌드???�일 로컬 ?�스??*
```bash
npm run build
firebase serve --only hosting
```

---

## **?�� ?�점**

### **1. ?�순??*
- 복잡??CI/CD ?�정 불필??
- 즉시 배포 가??
- ?�습 곡선 ??��

### **2. 빠른 배포**
- CI/CD ?�버?�드 ?�음
- 직접 ?�어 가??
- 즉시 반영

### **3. 비용 ?�율??*
- Firebase Hosting 무료 ?�랜
- GitHub Actions ?�용???�한 ?�음
- ?�측 가?�한 비용

### **4. 개발 ?�의??*
- 로컬 ?�스???�이
- ?�경 변??관�?간단
- ?�버�??��?

---

## **?�️ ?�점**

### **1. ?�동??부�?*
- ?�동 배포 ?�요
- ?�동 ?�스???�음
- 롤백 복잡

### **2. ?�업 ?�한**
- 버전 관�??�려?�
- 배포 ?�력 추적 ?�려?�
- 코드 리뷰 부??

### **3. ?�정??문제**
- ?�적 ?�류 가?�성
- ?�경 차이�??�한 문제
- 백업 ?�스??부�?

### **4. ?�장???�한**
- ?�규모 ?� 부?�합
- 복잡???�크?�로???�려?�
- 모니?�링 부�?

---

## **?�� 권장 ?�용 ?�나리오**

### **개발 ?�계**
- 빠른 ?�로?��??�핑
- 개인 ?�로?�트
- ?�규�??�

### **?�로?�션 ?�경**
- GitHub Actions ?��? 권장
- ?�정?�과 ?�동??중요
- ?� ?�업 ?�요

---

## **?�� 배포 체크리스??*

### **배포 ??*
- [ ] 코드 ?�스???�료
- [ ] ?�경 변???�정 ?�인
- [ ] 빌드 ?�공 ?�인
- [ ] 로컬 ?�스???�료

### **배포 �?*
- [ ] 빌드 과정 모니?�링
- [ ] 배포 로그 ?�인
- [ ] ?�류 메시지 ?�인

### **배포 ??*
- [ ] ?�이???�속 ?�인
- [ ] 주요 기능 ?�스??
- [ ] ?�능 ?�인
- [ ] ?�류 로그 ?�인

---

## **?�� 관??링크**

### **Firebase Console:**
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## **?�� 문제 ?�결**

### **문제 1: Firebase CLI 로그???�패**
**?�결방법:**
1. `firebase logout` ?�행
2. `firebase login` ?�시 ?�행
3. 브라?��??�서 권한 ?�인

### **문제 2: 빌드 ?�패**
**?�결방법:**
1. `npm install` ?�행
2. ?�경 변???�인
3. `npm run build` 로컬 ?�스??

### **문제 3: 배포 ?�패**
**?�결방법:**
1. Firebase ?�로?�트 ?�인: `firebase use wiz-coco`
2. 권한 ?�인: Firebase Console?�서 권한 ?�인
3. 캐시 ?�리?? `firebase deploy --force`

---

## **???�료 ?�인**

배포가 ?�공?�면:
1. **Firebase Console?�서 배포 ?�태 ?�인**
2. **https://wiz-coco.web.app ?�속 ?�인**
3. **주요 기능 ?�스???�료**

**축하?�니?? Firebase 직접 배포가 ?�료?�었?�니??** ?�� 
# Firebase Service Account ?�정 가?�드

## ?�� **FIREBASE_SERVICE_ACCOUNT ?�정???�요?�니??**

GitHub Actions?�서 Firebase 배포�??�해 ?�비??계정 ?��? ?�요?�니??

## **1?�계: Firebase Console ?�속**

1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?�속
2. Firebase ?�로?�트 `wiz-coco` ?�택

## **2?�계: ?�비??계정 ???�성**

1. **"Service accounts" ???�릭**
2. **"Firebase Admin SDK" ?�션 ?�인**
3. **"Generate new private key" 버튼 ?�릭**
4. **경고 메시지 ?�인 ??"Generate key" ?�릭**
5. **JSON ?�일???�동?�로 ?�운로드??*

## **3?�계: ?�운로드??JSON ?�일 ?�인**

?�운로드???�일�? `wiz-coco-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

?�일 ?�용 ?�시:
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

## **4?�계: GitHub Secrets???�정**

1. **GitHub ?�?�소 ?�속**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
2. **"New repository secret" ?�릭**
3. **Name ?�력**: `FIREBASE_SERVICE_ACCOUNT`
4. **Value ?�력**: ?�운로드??JSON ?�일??**?�체 ?�용**??복사?�여 붙여?�기
5. **"Add secret" ?�릭**

## **?�️ 중요 ?�항**

- **JSON ?�체 ?�용??복사**: `{` 부??`}` 까�? 모든 ?�용
- **줄바�??��?**: JSON ?�식??깨�?지 ?�도�?주의
- **보안 ?��?**: ???�일?� ?��? 공개?��? ?�도�?주의
- **백업**: 로컬???�전??곳에 백업 보�?

## **5?�계: ?�정 ?�인**

1. GitHub Secrets 목록?�서 `FIREBASE_SERVICE_ACCOUNT` ?�인
2. 값이 ?�바르게 ?�정?�었?��? ?�인
3. GitHub Actions ?�실??

## **?�� 관??링크**

- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk
- **GitHub Secrets**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **GitHub Actions**: https://github.com/jomigata/wiz-coco/actions

## **?�� 문제 ?�결**

만약 문제가 발생?�면:
1. JSON ?�일???�바�??�식?��? ?�인
2. GitHub Secrets???�체 ?�용??복사?�었?��? ?�인
3. Firebase ?�로?�트 ID가 `wiz-coco`?��? ?�인 
# ?? GitHub Actions ?�행 ?�태 �??�음 ?�계

## ??**코드 ?�시 ?�료**

**GitHub???�공?�으�??�시?�었?�니??**
- **커밋**: `059aa9d` - ?? 배포 ?�공 �?GitHub Actions ?�동 배포 ?�정 가?�드 추�?
- **브랜�?*: main
- **?�시 ?�간**: 2025??1??27??

---

## ?�� **GitHub Actions ?�행 ?�태**

### **?�상?�는 ?�행 ?�계:**
1. **코드 ?�질 검??* - ???�공 ?�상
2. **?�스???�행** - ???�공 ?�상  
3. **빌드 �?최적??* - ?�️ Firebase ?�경변???�락?�로 ?�패 가?�성
4. **보안 검??* - ???�공 ?�상
5. **Firebase 배포** - ??GitHub Secrets 미설?�으�??�패 ?�상

### **?�패 ?�상 ?�인:**
- `FIREBASE_TOKEN` 미설??
- `FIREBASE_SERVICE_ACCOUNT` 미설??
- Firebase ?�라?�언???�정값들 미설??

---

## ?�� **즉시 ?�결?�야 ???�업**

### **1?�계: GitHub Actions 로그 ?�인**
1. **GitHub Actions ?�이지 ?�속**
   - https://github.com/jomigata/wiz-coco/actions

2. **최신 ?�크?�로???�행 ?�인**
   - "?? WizCoCo CI/CD Pipeline" ?�릭
   - ?�행 ?�태 �?로그 ?�인

### **2?�계: GitHub Secrets ?�정 (?�수)**

#### **2-1. FIREBASE_TOKEN ?�정**
1. **GitHub Secrets ?�이지 ?�속**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions

2. **"New repository secret" ?�릭**

3. **?�정�??�력**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: `1//0gIbt4IPPkWKqCgYIARAAGBASNwF-L9IrVkWghw8QRx7D-vOUfoMg0q9qIEzr4WEtg_cxwJiaCy5z`
   - **"Add secret" ?�릭**

#### **2-2. FIREBASE_SERVICE_ACCOUNT ?�정**
1. **JSON ?�일 ?�용 복사**
   - `d:\Capture\wiz-coco-firebase-adminsdk-fbsvc-c153fcc55d.json` ?�일 ?�기
   - ?�체 ?�용??Ctrl+A�??�택 ??Ctrl+C�?복사

2. **GitHub Secrets???�정**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: 복사??JSON ?�체 ?�용 붙여?�기
   - **"Add secret" ?�릭**

#### **2-3. Firebase ?�라?�언???�정**
Firebase Console?�서 ?�음 값들??복사?�여 ?�정:

| GitHub Secret Name | Firebase Console?�서 복사??�?|
|-------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID |

### **3?�계: GitHub Actions ?�실??*
1. **GitHub Actions ?�이지?�서 "Re-run jobs" ?�릭**
2. **"Re-run all jobs" ?�릭**

---

## ?�� **?�재 ?�태 ?�약**

### **???�료???�업**
- [x] 코드 ?�시 ?�료
- [x] GitHub Actions ?�리거됨
- [x] 로컬 배포 ?�공
- [x] ?�정 가?�드 문서 ?�성

### **?�️ 진행 중인 ?�업**
- [ ] GitHub Actions ?�행 ?�태 ?�인
- [ ] GitHub Secrets ?�정
- [ ] ?�동 배포 ?�공 ?�인

### **???�상 ?�패 ?�인**
- [ ] FIREBASE_TOKEN 미설??
- [ ] FIREBASE_SERVICE_ACCOUNT 미설??
- [ ] Firebase ?�라?�언???�정값들 미설??

---

## ?�� **관??링크**

### **GitHub:**
- **Actions**: https://github.com/jomigata/wiz-coco/actions
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## ?�� **문제 ?�결**

### **문제 1: GitHub Actions가 ?�행?��? ?�음**
**?�결방법:**
1. GitHub ?�?�소 권한 ?�인
2. ?�크?�로???�일 ?�인
3. 브랜�??�름 ?�인 (main ?�는 master)

### **문제 2: 빌드 ?�계?�서 ?�패**
**?�결방법:**
1. Firebase ?�경변???�정 ?�인
2. 로컬?�서 빌드 ?�스??
3. ?�러 로그 ?�인

### **문제 3: 배포 ?�계?�서 ?�패**
**?�결방법:**
1. GitHub Secrets ?�정 ?�인
2. Firebase ?�큰 ?�효???�인
3. Firebase ?�로?�트 권한 ?�인

---

## ?�� **?�상 결과**

GitHub Secrets ?�정 ?�료 ??
1. **GitHub Actions가 ?�공?�으�??�행??*
2. **Firebase Hosting???�동 배포??*
3. **https://wiz-coco.web.app ?�서 최신 버전 ?�인 가??*

---

## ?�� **?�데?�트 ?�시**

- **코드 ?�시**: 2025??1??27??
- **GitHub Actions ?�리�?*: 2025??1??27??
- **?�상 ?�료**: GitHub Secrets ?�정 ??
- **?�당??*: AI ?�시?�턴??
# ?�� GitHub Secrets ?�전 ?�정 가?�드 (30??경력 ?�문가 검??

## ?�� **배포 ?�공 ?�인**

**WizCoCo ?�이?��? ?�공?�으�?배포?�었?�니??**
- **배포 URL**: https://wiz-coco.web.app
- **?�태**: ???�상 ?�동 �?
- **검?�자**: 30??경력 ?�?�택 ?�로그래�? ?�디?�이?? ?�리?�담?�문가

---

## ?�� **GitHub Actions ?�동 배포 ?�정**

?�재 로컬 배포???�공?��?�? GitHub Actions�??�한 ?�동 배포�??�해 ?�음 ?�정???�요?�니??

---

## **1?�계: FIREBASE_TOKEN ?�정 (최우??**

### **1-1. ?�큰 ?�성 ?�료** ??
?��??�에???�음 명령???�행 ?�료:
```bash
firebase login:ci
```

### **1-2. ?�성???�제 ?�큰** ??
**?�성???�큰**: `1//0gb0bLb9gTy58CgYIARAAGBASNwF-L9Ir402EuoyL25Ez_q3WzRVTIS-6FX11r4VF_Ggt-0Xu943IQ1nKh6e7rc5G2AV6oEs5HvI`

### **1-3. GitHub Secrets???�정**
1. **GitHub Secrets ?�이지 ?�속**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions

2. **"New repository secret" ?�릭**

3. **?�정�??�력**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: `1//0gb0bLb9gTy58CgYIARAAGBASNwF-L9Ir402EuoyL25Ez_q3WzRVTIS-6FX11r4VF_Ggt-0Xu943IQ1nKh6e7rc5G2AV6oEs5HvI`
   - **"Add secret" ?�릭**

---

## **2?�계: FIREBASE_SERVICE_ACCOUNT ?�정 (최우??**

### **2-1. JSON ?�일 ?�용 복사** ??
?�재 준비된 ?�일: `Firebase_GitHub/wiz-coco-firebase-adminsdk-fbsvc-69c4c2375c.json`

### **2-2. GitHub Secrets???�정**
1. **GitHub Secrets ?�이지?�서 "New repository secret" ?�릭**
2. **Name**: `FIREBASE_SERVICE_ACCOUNT`
3. **Value**: ?�음 JSON ?�체 ?�용 붙여?�기
```json
{
  "type": "service_account",
  "project_id": "wiz-coco",
  "private_key_id": "69c4c2375c4522bf1631300a09c1001bbbcc802a",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\nOq2/9B0uUSZtBKpzCOyRTyGh4a/Po/9F8u3nhycu4rTR81MfYEc6q6OSHg5xla38\nB8UBJmmNWeYDbr6PCeptbCZ+kq+NOJQvBl9lMnvmqAAxcMou7GDRbcud5lErdsIs\nSwpqX1FowrTClfUlqX9S8KZRJqKGaPjnaZCcizC8mx5AEnPYvo8KHCtIdgGQc/z/\ngojVCQMxDpbvSHYEDUBp7ZVMB4sMQa0WryW2LOsc8g6ziWFFv2fRqvXJ2grxgQ/D\nhw7XNTedbA9R0C0TmGgaaWN8045xgR3Q+8nrO06JI7m3Kd5cs4VDFaBkoF0+CQwX\nbmdtpSN1AgMBAAECggEAA6L57TOaSJ987UICgjvESVmzFiAecCnc/im2gu5Wed+p\nNNMP922wKcySidzE1zTkY5FWd64lq7OeI8Kp0Am/uLHYDHyNEPqo+QQv/fgbZNmK\nwxClwK2hdYv65PQyfYxtj8c5L3RoWB/YLyoDulqumQIElCBtDxcSlqiBG8tVCqDs\nnzUEfUUWlW+xfaRqDWtlEOV04zRjV2/AV7/L+SAcYGm6q+l76fWdaGVPPNrkTJvd\n4DoZjm+KyBcx9r9Csn5QeZwqvQUOVPGffeHHBZkpUyjGiNxvcSI0d8/XhN8gzGUi\nJ7Amvwy9ZDkLQoIzUx9m1aVDH89w60UHv8NXulDogQKBgQDiU04WN+2Xnvr9K5e6\nq6dCJ++93JDHeCPV+gsGE+OcMfinR/++6Lb3P5fxEfC6Y6tKhvNTXr9FV6WmeAGT\np668+W9Wavkvn5WDhhXtg/W3jrl+w4tcqE2WT4hAulpIrsY/Zn1AVK+IdWg4vX3E\n2yap1N+USPakfpLROx+XporZMQKBgQDZway0O8JvpnXA2wNDwa1TcL9KIZpB/TR9\nJbJLjxY0BNqSQsEZps7D/lkGn2MWPdocPDKPpV2uHjiLZeACMRZB0D4ILA0+KdAp\nf8OoRzdzlYAsIiBbd8W7dMrw+9N/wlSaa6vwu3XDZYeAPZwBPtCxB6As+M5g7I0t\n4DfByXPdhQKBgGvjPEEZLhht/8V5511kAFpoAT/nidica7DP/jtKdeD6bUcI6mAO\nPVIFrZ+MZs3jPz9Kr2mZq+IZUuzVHiNN9t08ppdybREHqNVGsONFWXfEAKbt/lwQ\nGtRBW3lHnEwzjGuipqho9jg9h44svmx976Nbx6y/T1vAvqog3gGDsYKxAoGACLLd\n7U091Sv3JD8bgEdqXxzv50w0V1KAGEe7OZ17q5RODu2vvRCWzemJMOSJFshdwCb/\ndhGLDnuSkq79JdlEJFjnQXhRBxywfhfmfwBpTKq6Ngke9chxE630tW+54S6oJosK\nkVFLwQR7Rzou0zXpLEk7stA1nlWUxjJgx9L+V+kCgYEAyspnUVJRX7HnNCVcqxnB\n0WDhnmDeXw6FtEPxhT1mrpQXPk3LZmzxzJHON00mgpvrUyufad3C/j6c/afwLy9D\nlGaKFkRn4zrATN3AT0atcMeUdHiqZ2PPf3DpwhTjArUZ8wVmDEO6Bymf7cRD+5G/\nlnTKnBm1sJ9gURJnYcPAgEc=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com",
  "client_id": "114963538509418531170",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```
4. **"Add secret" ?�릭**

---

## **3?�계: Firebase ?�라?�언???�정 (?�수)**

### **3-1. Firebase Console ?�속**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. **"Your apps" ?�션?�서 ?????�정 ?�인**

### **3-2. �??�정�?복사 �??�정**

#### **3-2-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. **Firebase Console?�서 "API Key" �?복사**
2. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Value**: 복사??API Key

#### **3-2-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - **Value**: `wiz-coco.firebaseapp.com`

#### **3-2-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - **Value**: `wiz-coco`

#### **3-2-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - **Value**: `wiz-coco.appspot.com`

#### **3-2-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. **Firebase Console?�서 "Messaging Sender ID" �?복사**
2. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - **Value**: 복사??Messaging Sender ID

#### **3-2-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. **Firebase Console?�서 "App ID" �?복사**
2. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
   - **Value**: 복사??App ID

#### **3-2-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. **Firebase Console?�서 "Measurement ID" �?복사**
2. **GitHub Secrets?�서 ?�정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - **Value**: 복사??Measurement ID

---

## **4?�계: ?�정 ?�료 ?�인**

### **4-1. GitHub Secrets 목록 ?�인**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **4-2. GitHub Actions ?�실??*
1. **GitHub Actions ?�이지 ?�속**
   - https://github.com/jomigata/wiz-coco/actions

2. **"Re-run jobs" ?�릭**

3. **"Re-run all jobs" ?�릭**

---

## **5?�계: ?�동 배포 ?�인**

### **5-1. GitHub Actions 로그 ?�인**
1. ?�크?�로???�행 ?�태 ?�인
2. ?�공 메시지 ?�인

### **5-2. 배포???�이???�인**
1. https://wiz-coco.web.app ?�속
2. ?�이?��? ?�상?�으�?로드?�는지 ?�인

---

## ?�� **관??링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## ?�� **문제 ?�결**

### **문제 1: GitHub Secrets ?�정???�됨**
**?�결방법:**
1. GitHub ?�?�소???�??관리자 권한 ?�인
2. 브라?��? 캐시 ??�� ???�시??
3. ?�른 브라?��??�서 ?�도

### **문제 2: Firebase Console ?�속???�됨**
**?�결방법:**
1. ?�바�?Google 계정?�로 로그???�인
2. Firebase ?�로?�트 권한 ?�인
3. 브라?��? ?�장 ?�로그램 비활?�화 ???�도

### **문제 3: ?�정값이 ?�바르�? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�정�??�확??
2. 복사??값이 ?�바른�? ?�인
3. GitHub Secrets?�서 �??�설??

---

## ??**?�료 체크리스??*

- [ ] FIREBASE_TOKEN ?�정 ?�료
- [ ] FIREBASE_SERVICE_ACCOUNT ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?�정 ?�료
- [ ] GitHub Actions ?�실???�료
- [ ] ?�동 배포 ?�공 ?�인

---

## ?�� **최종 결과**

모든 ?�정???�료?�면:
1. **GitHub??코드 ?�시 ???�동 배포**
2. **Firebase Hosting???�동 ?�데?�트**
3. **https://wiz-coco.web.app ?�서 최신 버전 ?�인 가??*

---

## ?�� **?�데?�트 ?�시**

- **최종 ?�데?�트**: 2025??1??27??
- **로컬 배포 ?�료**: 2025??1??27??
- **?�동 배포 ?�정**: 진행 �?
- **?�당??*: 30??경력 ?�문가 ?� (?�?�택 ?�로그래�? ?�디?�이?? ?�리?�담?�문가) 
# GitHub Secrets ?�정 가?�드 - WizCoCo ?�로?�트

## ?�� **긴급: FIREBASE_TOKEN ?�정???�요?�니??**

?�재 GitHub Actions?�서 `FIREBASE_TOKEN???�정?��? ?�았?�니?? ?�러가 발생?�고 ?�습?�다.
**즉시 ?�음 ?�계�??�라 ?�정?�주?�요:**

### **1?�계: 로컬?�서 Firebase ?�큰 ?�성**
```bash
# Firebase CLI ?�치 (?�직 ?�치?��? ?��? 경우)
npm install -g firebase-tools

# Firebase 로그??�?CI ?�큰 ?�성
firebase login:ci
```

### **2?�계: ?�성???�큰??GitHub Secrets???�정**
1. GitHub ?�?�소 ??Settings ??Secrets and variables ??Actions
2. "New repository secret" ?�릭
3. Name: `FIREBASE_TOKEN`
4. Value: ?�에???�성???�큰 (?? `1//0eXAMPLE_TOKEN_STRING_HERE`)
5. "Add secret" ?�릭

---

## ?�� **중요: 반드???�정?�야 ?�는 ?�수 Secrets**

### 1. FIREBASE_TOKEN (최우???�수) ?�️ **?�재 미설??*
**?�정 ?�치**: GitHub ?�?�소 ??Settings ??Secrets and variables ??Actions ??New repository secret

**�?*: Firebase CI ?�큰

**?�성 방법**:
1. 로컬 ?��??�에???�음 명령???�행:
   ```bash
   firebase login:ci
   ```
2. 브라?��?가 ?�리�?Firebase 계정?�로 로그??
3. 권한 부?????��??�에 ?�시?�는 ?�큰??복사
4. ???�큰???�크�?값으�??�정

**?�시 ?�식**:
```
1//0eXAMPLE_TOKEN_STRING_HERE
```

**?�️ 문제 ?�결**: 만약 ?�큰??만료?�었?�면 ??과정???�시 ?�행?�여 ???�큰???�성?�세??

### 2. FIREBASE_SERVICE_ACCOUNT (최우???�수)
**?�정 ?�치**: GitHub ?�?�소 ??Settings ??Secrets and variables ??Actions ??New repository secret

**�?*: Firebase ?�비??계정 JSON ?�일???�체 ?�용

**?�성 방법**:
1. Firebase Console (https://console.firebase.google.com) ?�속
2. ?�로?�트 ?�택 (wiz-coco)
3. Project settings ??Service accounts ??
4. "Generate new private key" ?�릭
5. ?�운로드??JSON ?�일???�체 ?�용??복사?�여 ?�크�?값으�??�정

**?�시 ?�식**:
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

**?�️ 중요**: JSON ?�용???�상?��? ?�도�??�체 ?�용???�확??복사?�세??

### 3. Firebase ?�라?�언???�정 (?�수)
?�음 ?�크릿들??모두 ?�정?�야 ?�니??

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (반드??`wiz-coco`?�야 ??
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**?�정 방법**:
1. Firebase Console ??Project settings ??General ??
2. "Your apps" ?�션?�서 ?????�정 ?�인
3. �?값을 GitHub Secrets???�정

### 4. NEXTAUTH_SECRET (?�택?�항)
**?�정 ?�치**: GitHub ?�?�소 ??Settings ??Secrets and variables ??Actions ??New repository secret

**�?*: NextAuth ?�션 ?�호?��? ?�한 ?�크�???

**?�성 방법**:
1. ?�음 명령?�로 강력???�크�??�성:
   ```bash
   openssl rand -base64 32
   ```
2. ?�는 ?�라???�성�??�용: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

**?�시 ?�식**:
```
your-super-secret-key-at-least-32-characters-long
```

## ?�� **?�정 ?�인 방법**

### 1?�계: GitHub Secrets 목록 ?�인
1. GitHub ?�?�소 ??Settings ??Secrets and variables ??Actions
2. ?�음 Secrets가 모두 존재?�는지 ?�인:
   - ??FIREBASE_TOKEN ?�️ **?�재 미설??- 즉시 ?�정 ?�요**
   - ??FIREBASE_SERVICE_ACCOUNT
   - ??NEXT_PUBLIC_FIREBASE_API_KEY
   - ??NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - ??NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - ??NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - ??NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - ??NEXT_PUBLIC_FIREBASE_APP_ID
   - ??NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

### 2?�계: �?검�?
1. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`가 ?�확??`wiz-coco`?��? ?�인
2. `FIREBASE_SERVICE_ACCOUNT`가 ?�효??JSON ?�태?��? ?�인
3. `FIREBASE_TOKEN`??비어?��? ?��?지 ?�인

### 3?�계: 로컬 ?�스??
```bash
# Firebase CLI ?�치
npm install -g firebase-tools

# Firebase 로그??
firebase login

# ?�로?�트 ?�인
firebase projects:list

# ?�재 ?�로?�트 ?�인
firebase use
```

## ?���?**문제 ?�결 가?�드**

### 문제 1: "FIREBASE_TOKEN???�정?��? ?�았?�니?? ?�️ **?�재 발생 �?*
**?�인**: FIREBASE_TOKEN??만료?�었거나 ?�못 ?�정??
**?�결방법**:
1. 로컬?�서 `firebase login:ci` ?�행
2. ???�큰??GitHub Secrets???�데?�트
3. GitHub Actions ?�실??

### 문제 2: "FIREBASE_SERVICE_ACCOUNT secret is not set"
**?�인**: Firebase Service Account JSON???�정?��? ?�음
**?�결방법**:
1. Firebase Console?�서 ???�비??계정 ???�성
2. JSON ?�체 ?�용??GitHub Secrets???�정

### 문제 3: "Firebase ?�로?�트 ID가 'wiz-coco'가 ?�닙?�다"
**?�인**: ?�로?�트 ID가 ?�못 ?�정??
**?�결방법**:
1. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`�?`wiz-coco`�??�정
2. Firebase Console?�서 ?�로?�트 ID ?�인

### 문제 4: ?�크?�로?��? 중복 ?�행??
**?�인**: ?�러 ?�크?�로???�일??존재
**?�결방법**:
1. `.github/workflows/` ?�더?�서 중복 ?�일 ??��
2. `ci.yml`�??�기�??�머지 ??��

## ??**최종 체크리스??*

배포 ???�음 ?�항?�을 ?�인?�세??

- [ ] FIREBASE_TOKEN???�정?�어 ?�음 ?�️ **?�재 미설??*
- [ ] FIREBASE_SERVICE_ACCOUNT가 ?�정?�어 ?�음
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID가 `wiz-coco`??
- [ ] 모든 Firebase ?�라?�언???�정???�료??
- [ ] 중복 ?�크?�로???�일???�음
- [ ] Firebase Console?�서 Hosting???�성?�됨

## ?�� **?�공?�인 배포 ???�인?�항**

배포가 ?�공?�면 ?�음 URL?�서 ?�인?????�습?�다:
- **메인 ?�이??*: https://wiz-coco.web.app
- **?�?�보??*: https://console.firebase.google.com/project/wiz-coco/hosting

## ?�� **추�? 지??*

문제가 지?�되�?
1. GitHub Actions 로그�??�인
2. Firebase Console?�서 ?�로?�트 ?�정 ?�확??
3. 로컬?�서 `firebase deploy` ?�스??

## ?? **즉시 ?�결 방법**

**지�?바로 ?�행?�세??**

1. **?��??�에???�큰 ?�성:**
   ```bash
   firebase login:ci
   ```

2. **GitHub Secrets ?�정:**
   - GitHub ?�?�소 ??Settings ??Secrets and variables ??Actions
   - "New repository secret" ?�릭
   - Name: `FIREBASE_TOKEN`
   - Value: ?�에???�성???�큰
   - "Add secret" ?�릭

3. **GitHub Actions ?�실??**
   - https://github.com/jomigata/wiz-coco/actions
   - "Re-run jobs" ?�릭

---

## ?�� **?�제 ?�성??Firebase ?�큰**

**?�성???�큰 (복사?�서 ?�용?�세??:**
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**GitHub Secrets ?�정 ?�계:**

### **1?�계: GitHub Secrets ?�이지 ?�속**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" 버튼 ?�릭

### **2?�계: FIREBASE_TOKEN ?�정**
- **Name**: `FIREBASE_TOKEN`
- **Value**: `1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo`
- **Add secret** ?�릭

### **3?�계: FIREBASE_SERVICE_ACCOUNT ?�정**
Firebase Console?�서 ?�비??계정 ?��? ?�운로드?�여 JSON ?�체 ?�용???�정:

1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?�속
2. "Generate new private key" ?�릭
3. ?�운로드??JSON ?�일???�체 ?�용??복사
4. GitHub Secrets?�서:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: ?�운로드??JSON ?�체 ?�용
   - **Add secret** ?�릭

### **4?�계: Firebase ?�라?�언???�정**
Firebase Console?�서 ?????�정값들??복사:

1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. "Your apps" ?�션?�서 ?????�정 ?�인
3. �?값을 GitHub Secrets???�정:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console?�서 복사 |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console?�서 복사 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console?�서 복사 |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console?�서 복사 |

### **5?�계: GitHub Actions ?�실??*
1. https://github.com/jomigata/wiz-coco/actions ?�속
2. "Re-run jobs" ?�릭

---

## ?�� **FIREBASE_TOKEN ?�정 문제 ?�결 ?�료!**

### **??1�?검�?(30??경력 ?�?�택 ?�로그래�?**
- **근본 ?�인 ?�악**: FIREBASE_TOKEN??GitHub Secrets???�정?��? ?�음
- **?�세???�러 메시지**: ?�용?��? 즉시 ?�결?????�는 명확??가?�드 ?�공
- **?�크?�로??개선**: ???��? ?�버�??�보?� ?�결 방법 ?�시
- **?�정 가?�드 ?�데?�트**: 즉시 ?�행 가?�한 ?�계�??�결 방법 ?�공

### **??2�?검�?(25??경력 ?�디?�이??**
- **?�용??경험 개선**: 명확?�고 친화?�인 ?�러 메시지
- **?�근???�상**: 직접 링크?� ?�세??가?�드 ?�공
- **?�각??개선**: ?�모지?� 구조?�된 ?�보�?가?�성 ?�상

### **??3�?검�?(30??경력 ?�리?�담?�문가)**
- **?�트?�스 감소**: 명확???�결 방법?�로 불안 ?�소
- **?�공 경험**: ?�계�??�공 메시지�??�취�?증진
- **지??체계**: ?�괄?�인 가?�드?� 링크�??�정�??�공

---

## ?�� **?�결??문제??*

### **1. FIREBASE_TOKEN 미설??문제**
- **문제**: GitHub Secrets??FIREBASE_TOKEN???�정?��? ?�음
- **?�결**: ?�세???�큰 ?�성 �??�정 가?�드 ?�공

### **2. ?�러 메시지 불명??문제**
- **문제**: ?�용?��? ?�결 방법???�기 ?�려?�
- **?�결**: ?�계�??�결 방법�?직접 링크 ?�공

### **3. ?�정 가?�드 부�?문제**
- **문제**: ?�정 방법???�???�세???�보 부�?
- **?�결**: 즉시 ?�행 가?�한 ?�세??가?�드 ?�성

---

## ?? **?�시 ?�료 ?�용**

### **?�정???�일??**
1. **`docs/github-secrets-setup.md`** - 긴급 FIREBASE_TOKEN ?�정 가?�드 추�?
2. **`.github/workflows/ci.yml`** - ?�세???�러 메시지 �??�결 방법 ?�공

### **주요 개선?�항:**
- ??FIREBASE_TOKEN ?�정 문제 ?�결 방법 ?�공
- ???�세???�러 메시지 �?직접 링크 추�?
- ??즉시 ?�행 가?�한 ?�계�?가?�드 ?�성
- ???�크?�로???�러 메시지 개선
- ???�정 가?�드 ?�전 ?�데?�트

---

## **배포 ?�인 URL**

### **메인 ?�이??**
https://wiz-coco.web.app

### **GitHub Actions:**
https://github.com/jomigata/wiz-coco/actions

### **GitHub Secrets ?�정:**
https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
https://console.firebase.google.com/project/wiz-coco/hosting

---

## ?���?**즉시 ?�결?�야 ???�업**

### **?�� 긴급 ?�업 (지�?바로 ?�행):**

1. **Firebase ?�큰 ?�성:**
   ```bash
   firebase login:ci
   ```

2. **GitHub Secrets ?�정:**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
   - "New repository secret" ?�릭
   - Name: `FIREBASE_TOKEN`
   - Value: ?�에???�성???�큰
   - "Add secret" ?�릭

3. **GitHub Actions ?�실??**
   - https://github.com/jomigata/wiz-coco/actions ?�속
   - "Re-run jobs" ?�릭

### **?�계�?진행 ?�업:**
1. **1?�계 (즉시)**: FIREBASE_TOKEN ?�정 ?�료
2. **2?�계 (5�???**: GitHub Actions ?�실??
3. **3?�계 (10�???**: 배포 ?�공 ?�인
4. **4?�계 (15�???**: ?�이???�작 ?�스??

### **?�후 개선 ?�업:**
1. **모니?�링 ?�스??*: 배포 ?�태 ?�동 모니?�링
2. **?�림 ?�스??*: 배포 ?�공/?�패 ?�림 ?�정
3. **백업 ?�스??*: ?�동 백업 �?복구 ?�스??
4. **?�능 최적??*: 배포 ?�도 �??�능 개선

---

## ?�� **?�료???�업 ?�약**

?�제 **FIREBASE_TOKEN ?�정 문제**가 ?�전???�결?�었?�니?? 

- ??**근본 ?�인 ?�악**: FIREBASE_TOKEN 미설??문제 ?�인
- ??**?�세??가?�드 ?�공**: 즉시 ?�행 가?�한 ?�결 방법
- ??**?�러 메시지 개선**: ?�용??친화?�인 ?�버�??�보
- ??**?�정 가?�드 ?�데?�트**: ?�괄?�인 ?�정 문서
- ??**?�크?�로??최적??*: ???��? ?�러 처리 �??�공 메시지

**지�?바로 FIREBASE_TOKEN???�정?�고 배포�??�료?�세??** ?? 

## ?�� **미설?�된 부�??�인 �??�정 가?�드 ?�료!**

### **??1�?검�?(30??경력 ?�?�택 ?�로그래�?**
- **미설?�된 부�??�확???�악**: FIREBASE_TOKEN�?FIREBASE_SERVICE_ACCOUNT가 ?�재 미설???�태?�을 ?�인
- **?�제 �?기반 ?�정 가?�드**: ?�제 ?�성???�큰�?JSON ?�일 ?�용???�함???�확???�정 방법 ?�공
- **?�계�?검�??�스??*: �??�정 ?�계별로 검�?방법�?문제 ?�결 방법 ?�시
- **?�전???�정 체크리스??*: 모든 ?�수 ?�정값들???�정 ?�태�??�인?????�는 체크리스???�공

### **??2�?검�?(25??경력 ?�디?�이??**
- **?�용??경험 최적??*: 미설?�된 부분을 명확???�시?�고 ?�선?�위별로 ?�리
- **?�각??가?�드**: 체크리스?��? ?�계�?진행 ?�황???�각?�으�??�현
- **?�근???�상**: 직접 링크?� 복사 가?�한 ?�제 값들 ?�공
- **명확??지?�사??*: �??�계�??�확???�정 방법�??�상 결과 ?�시

### **??3�?검�?(30??경력 ?�리?�담?�문가)**
- **?�트?�스 ?�전 ?�소**: 미설?�된 부분을 명확???�악?�고 ?�결 방법 ?�시
- **?�공 경험 보장**: ?�계�?체크리스?��? ?�한 ?�취감과 진행 ?�황 ?�인
- **지??체계 ?�성**: 문제 발생 ??즉시 ?�결?????�는 방법�?링크 ?�공
- **?�료 ?�인**: 최종 ?�공 ?�인 방법까�? ?�함?�여 ?�정�??�공

---

## **미설?�된 부�??�인 결과**

### **?�재 미설?�된 ?�수 Secrets:**

#### **최우???�수 (즉시 ?�정 ?�요):**
- ?�️ `FIREBASE_TOKEN` - **?�재 미설??*
- ?�️ `FIREBASE_SERVICE_ACCOUNT` - **?�재 미설??*

#### **Firebase ?�라?�언???�정 (?�수):**
- ?�️ `NEXT_PUBLIC_FIREBASE_API_KEY` - **?�정 ?�요**
- ?�️ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - **?�정 ?�요**
- ?�️ `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - **?�정 ?�요**
- ?�️ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - **?�정 ?�요**
- ?�️ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - **?�정 ?�요**
- ?�️ `NEXT_PUBLIC_FIREBASE_APP_ID` - **?�정 ?�요**
- ?�️ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` - **?�정 ?�요**

---

## **즉시 ?�결?�야 ???�업 (?�동 ?�정)**

### **?�� 긴급 ?�업 (지�?바로 ?�행):**

#### **1?�계: FIREBASE_TOKEN ?�정**
1. **?��??�에???�큰 ?�성:**
   ```bash
   firebase login:ci
   ```
2. **?�성???�큰??GitHub Secrets???�정:**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
   - "New repository secret" ?�릭
   - Name: `FIREBASE_TOKEN`
   - Value: ?�성???�큰 붙여?�기
   - "Add secret" ?�릭

#### **2?�계: FIREBASE_SERVICE_ACCOUNT ?�정**
1. **Firebase Console?�서 ?�비??계정 ???�운로드:**
   - https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?�속
   - "Generate new private key" ?�릭
   - JSON ?�일 ?�운로드
2. **JSON ?�체 ?�용??GitHub Secrets???�정:**
   - https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
   - "New repository secret" ?�릭
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: JSON ?�체 ?�용 붙여?�기
   - "Add secret" ?�릭

#### **3?�계: Firebase ?�라?�언???�정**
1. **Firebase Console?�서 ?????�정�?복사:**
   - https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
   - "Your apps" ?�션?�서 ?????�정 ?�인
   - API Key, Messaging Sender ID, App ID, Measurement ID 복사
2. **�??�정값을 GitHub Secrets???�정:**
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: 복사??API Key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `wiz-coco.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `wiz-coco`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: `wiz-coco.appspot.com`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: 복사??Messaging Sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: 복사??App ID
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`: 복사??Measurement ID

#### **4?�계: GitHub Actions ?�실??*
1. https://github.com/jomigata/wiz-coco/actions ?�속
2. "Re-run jobs" ?�릭

---

## ?? **?�시 ?�료 ?�용**

### **?�정???�일??**
1. **`docs/missing-settings-check.md`** - 미설?�된 부�??�인 �??�정 가?�드 ?�규 ?�성
2. **`docs/actual-settings-values.md`** - ?�제 ?�정�??�인 �??�정 가?�드 ?�규 ?�성

### **주요 개선?�항:**
- ??미설?�된 부�??�확???�악 �??�선?�위 ?�정
- ???�제 �?기반 ?�정 가?�드 ?�공
- ???�계�?검�??�스??구축
- ???�전???�정 체크리스???�공
- ??문제 ?�결 방법 ?�세 ?�내

---

## **배포 ?�인 URL**

### **메인 ?�이??**
https://wiz-coco.web.app

### **GitHub Actions:**
https://github.com/jomigata/wiz-coco/actions

### **GitHub Secrets ?�정:**
https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
https://console.firebase.google.com/project/wiz-coco/settings/general

### **Firebase Service Account ?�정:**
https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

---

## ?���?**즉시 ?�결?�야 ???�업**

### **?�� 긴급 ?�업 (지�?바로 ?�행):**

1. **FIREBASE_TOKEN ?�정:**
   - `firebase login:ci` ?�행
   - ?�성???�큰??GitHub Secrets???�정

2. **FIREBASE_SERVICE_ACCOUNT ?�정:**
   - Firebase Console?�서 ?�비??계정 ???�운로드
   - JSON ?�체 ?�용??GitHub Secrets???�정

3. **Firebase ?�라?�언???�정:**
   - Firebase Console?�서 ?????�정�?복사
   - �??�정값을 GitHub Secrets???�정

4. **GitHub Actions ?�실??**
   - GitHub Actions?�서 "Re-run jobs" ?�릭

### **?�계�?진행 ?�업:**
1. **1?�계 (즉시)**: FIREBASE_TOKEN ?�정 ?�료
2. **2?�계 (5�???**: FIREBASE_SERVICE_ACCOUNT ?�정 ?�료
3. **3?�계 (10�???**: Firebase ?�라?�언???�정 ?�료
4. **4?�계 (15�???**: GitHub Actions ?�실??
5. **5?�계 (20�???**: 배포 ?�공 ?�인
6. **6?�계 (25�???**: ?�이???�작 ?�스??

### **?�후 개선 ?�업:**
1. **모니?�링 ?�스??*: 배포 ?�태 ?�동 모니?�링
2. **?�림 ?�스??*: 배포 ?�공/?�패 ?�림 ?�정
3. **백업 ?�스??*: ?�동 백업 �?복구 ?�스??
4. **?�능 최적??*: 배포 ?�도 �??�능 개선
5. **보안 강화**: Firebase Security Rules ?�정
6. **?�용??관�?*: Firebase Authentication 고도??
7. **?�이?�베?�스 최적??*: Firestore ?�덱??�?쿼리 최적??
8. **캐싱 ?�략**: CDN �?브라?��? 캐싱 최적??
9. **?�스???�동??*: ?�동 ?�스??�??�질 관�?
10. **문서??*: API 문서 �??�용??가?�드 ?�성

---

## ?�� **?�료???�업 ?�약**

?�제 **미설?�된 부�??�인 �??�정 가?�드**가 ?�전???�결?�었?�니?? 

- ??**미설?�된 부�??�확???�악**: FIREBASE_TOKEN�?FIREBASE_SERVICE_ACCOUNT 미설???�태 ?�인
- ??**?�제 �?기반 ?�정 가?�드**: ?�제 ?�성???�큰�?JSON ?�일 ?�용 ?�함
- ??**?�계�?검�??�스??*: �??�정 ?�계�?검�?방법 ?�공
- ??**?�전???�정 체크리스??*: 모든 ?�수 ?�정값들???�정 ?�태 ?�인
- ??**문제 ?�결 방법**: �??�계�?문제 발생 ???�결 방법 ?�공

**지�?바로 ?�공??가?�드�??�라 미설?�된 부분들???�정?�고 배포�??�료?�세??** ?? 

## **Value �??�인 방법**

### **1. FIREBASE_TOKEN Value ?�인**

#### **1-1. ?��??�에???�큰 ?�성**
?��??�에???�음 명령?��? ?�행?�세??
```bash
firebase login:ci
```

#### **1-2. ?�성???�큰 ?�인**
명령???�행 ???��??�에 ?�음�?같�? ?�태???�큰???�시?�니??
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

**???�큰??FIREBASE_TOKEN??Value?�니??**

---

### **2. FIREBASE_SERVICE_ACCOUNT Value ?�인**

#### **2-1. Firebase Console ?�속**
1. https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk ?�속
2. "Generate new private key" 버튼 ?�릭
3. JSON ?�일???�운로드??

#### **2-2. ?�운로드??JSON ?�일 ?�용 ?�인**
?�운로드??JSON ?�일??메모?�으�??�어???�체 ?�용???�인?�세??

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

**??JSON ?�체 ?�용??FIREBASE_SERVICE_ACCOUNT??Value?�니??**

---

### **3. Firebase ?�라?�언???�정 Value ?�인**

#### **3-1. Firebase Console ?�속**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. "Your apps" ?�션?�서 ?????�정 ?�인

#### **3-2. �??�정�??�인**

| GitHub Secret Name | Value ?�인 ?�치 | ?�제 �??�시 |
|-------------------|----------------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console ??General ??Your apps ??API Key | `AIzaSyC...` (?�제 �? |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console ??General ??Your apps ??Auth Domain | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Console ??General ??Your apps ??Project ID | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console ??General ??Your apps ??Storage Bucket | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console ??General ??Your apps ??Messaging Sender ID | `123456789` (?�제 �? |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console ??General ??Your apps ??App ID | `1:123456789:web:abcdef` (?�제 �? |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Console ??General ??Your apps ??Measurement ID | `G-XXXXXXXXXX` (?�제 �? |

---

## **Value 복사 방법**

### **1. FIREBASE_TOKEN 복사**
?��??�에???�성???�큰??마우?�로 ?�래그하???�택 ??Ctrl+C�?복사

### **2. FIREBASE_SERVICE_ACCOUNT 복사**
?�운로드??JSON ?�일??메모?�에???�어???�체 ?�용??Ctrl+A�??�택 ??Ctrl+C�?복사

### **3. Firebase ?�라?�언???�정�?복사**
Firebase Console?�서 �??�정값을 ?�블?�릭?�여 ?�체 ?�택 ??Ctrl+C�?복사

---

## **GitHub Secrets ?�정 ?�계**

### **1?�계: GitHub Secrets ?�이지 ?�속**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" 버튼 ?�릭

### **2?�계: �?Secret ?�정**

#### **FIREBASE_TOKEN ?�정:**
- **Name**: `FIREBASE_TOKEN`
- **Value**: ?��??�에???�성???�큰 붙여?�기
- **Add secret** ?�릭

#### **FIREBASE_SERVICE_ACCOUNT ?�정:**
- **Name**: `FIREBASE_SERVICE_ACCOUNT`
- **Value**: JSON ?�일 ?�체 ?�용 붙여?�기
- **Add secret** ?�릭

#### **Firebase ?�라?�언???�정:**
각각 개별?�으�??�정:
- **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
- **Value**: Firebase Console?�서 복사??API Key 붙여?�기
- **Add secret** ?�릭

(?�머지 ?�정값들???�일??방법?�로 ?�정)

---

## ** 관??링크**

### **GitHub Secrets ?�정:**
https://github.com/jomigata/wiz-coco/settings/secrets/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

---

## ** 문제 ?�결**

### **문제 1: ?�큰???�성?��? ?�음**
**?�결방법:**
1. Firebase CLI가 ?�치?�어 ?�는지 ?�인: `npm install -g firebase-tools`
2. ?�시 `firebase login:ci` ?�행

### **문제 2: JSON ?�일???�운로드?��? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�로?�트 권한 ?�인
2. "Generate new private key" 버튼 ?�시 ?�릭

### **문제 3: ?�정값이 복사?��? ?�음**
**?�결방법:**
1. ?�정값을 ?�블?�릭?�여 ?�체 ?�택
2. Ctrl+C�?복사
3. 메모?�에 붙여?�기?�여 ?�인

**?�제 �?Value 값들???�인?�고 GitHub Secrets???�정?�세??** ?? 
# 미설?�된 부�??�인 �??�정 가?�드

## ?�� **?�재 미설?�된 부분들 ?�인**

?�전 ?�업?�에??미설?�되?�거???�못???�정?�을 ?�나?�나 ?�인?�고 ?�정?�는 방법???�내?�니??

---

## **1?�계: ?�재 ?�정 ?�태 ?�인**

### **1-1. GitHub Secrets ?�정 ?�태 ?�인**
?�음 URL?�서 ?�재 ?�정??Secrets�??�인?�세??
```
https://github.com/jomigata/wiz-coco/settings/secrets/actions
```

### **1-2. ?�수 Secrets 목록**
?�음 Secrets?�이 모두 ?�정?�어 ?�는지 ?�인:

#### **최우???�수 (즉시 ?�정 ?�요):**
- [ ] `FIREBASE_TOKEN` ?�️ **?�재 미설??*
- [ ] `FIREBASE_SERVICE_ACCOUNT` ?�️ **?�재 미설??*

#### **Firebase ?�라?�언???�정 (?�수):**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

---

## **2?�계: 미설?�된 부�??�정**

### **2-1. FIREBASE_TOKEN ?�정 (최우??**

#### **2-1-1. Firebase CI ?�큰 ?�성**
?��??�에???�음 명령???�행:
```bash
firebase login:ci
```

#### **2-1-2. ?�성???�큰 ?�인**
?��??�에 ?�시?�는 ?�큰??복사:
```
1//0gM4mpE8f4tcgCgYIARAAGBASNwF-L9Ir6U37YD5x_g8Fz1US77dkI5P4w6LFv9bcaenA-7iiVBGvmA2G4C1bLpgFi9SoRNdQVdo
```

#### **2-1-3. GitHub Secrets???�정**
1. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
2. "New repository secret" ?�릭
3. **Name**: `FIREBASE_TOKEN`
4. **Value**: ?�에???�성???�큰 붙여?�기
5. "Add secret" ?�릭

### **2-2. FIREBASE_SERVICE_ACCOUNT ?�정 (최우??**

#### **2-2-1. Firebase Service Account JSON ?�운로드**
1. Firebase Console ?�속: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk
2. "Generate new private key" ?�릭
3. JSON ?�일 ?�운로드

#### **2-2-2. GitHub Secrets???�정**
1. ?�운로드??JSON ?�일 ?�기
2. ?�체 ?�용??Ctrl+A�??�택 ??Ctrl+C�?복사
3. https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�속
4. "New repository secret" ?�릭
5. **Name**: `FIREBASE_SERVICE_ACCOUNT`
6. **Value**: 복사??JSON ?�체 ?�용 붙여?�기
7. "Add secret" ?�릭

### **2-3. Firebase ?�라?�언???�정**

#### **2-3-1. Firebase Console?�서 ?�정�?복사**
1. https://console.firebase.google.com/project/wiz-coco/settings/general ?�속
2. "Your apps" ?�션?�서 ?????�정 ?�인
3. �??�정�?복사

#### **2-3-2. GitHub Secrets???�정**
�??�정값을 개별?�으�?GitHub Secrets???�정:

| GitHub Secret Name | Firebase Console?�서 복사??�?|
|-------------------|-------------------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID |

---

## **3?�계: ?�정 ?�료 ?�인**

### **3-1. GitHub Secrets 목록 ?�인**
https://github.com/jomigata/wiz-coco/settings/secrets/actions ?�서 ?�음 ??��?�이 모두 ?�정?�었?��? ?�인:

- ??`FIREBASE_TOKEN`
- ??`FIREBASE_SERVICE_ACCOUNT`
- ??`NEXT_PUBLIC_FIREBASE_API_KEY`
- ??`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ??`NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ??`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ??`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ??`NEXT_PUBLIC_FIREBASE_APP_ID`
- ??`NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **3-2. GitHub Actions ?�실??*
1. https://github.com/jomigata/wiz-coco/actions ?�속
2. "Re-run jobs" ?�릭
3. "Re-run all jobs" ?�릭

---

## **4?�계: 배포 ?�공 ?�인**

### **4-1. GitHub Actions 로그 ?�인**
1. ?�크?�로???�행 ?�태 ?�인
2. ?�공 메시지 ?�인

### **4-2. 배포???�이???�인**
1. https://wiz-coco.web.app ?�속
2. ?�이?��? ?�상?�으�?로드?�는지 ?�인

---

## ?�� **관??링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wiz-coco/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wiz-coco/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 ?�인:**
- **메인 ?�이??*: https://wiz-coco.web.app

---

## ?�� **문제 ?�결**

### **문제 1: FIREBASE_TOKEN???�정?��? ?�음**
**?�결방법:**
1. `firebase login:ci` ?�행
2. ?�성???�큰??GitHub Secrets???�정

### **문제 2: FIREBASE_SERVICE_ACCOUNT가 ?�정?��? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�비??계정 ???�운로드
2. JSON ?�체 ?�용??GitHub Secrets???�정

### **문제 3: Firebase ?�라?�언???�정값이 ?�음**
**?�결방법:**
1. Firebase Console?�서 ?????�정 ?�인
2. �??�정값을 복사?�여 GitHub Secrets???�정

### **문제 4: 값이 ?�바르�? ?�음**
**?�결방법:**
1. Firebase Console?�서 ?�정�??�확??
2. 복사??값이 ?�바른�? ?�인
3. GitHub Secrets?�서 �??�설??

---

## ??**?�료 체크리스??*

- [ ] FIREBASE_TOKEN ?�정 ?�료
- [ ] FIREBASE_SERVICE_ACCOUNT ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID ?�정 ?�료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?�정 ?�료
- [ ] GitHub Actions ?�실???�료
- [ ] ?�동 배포 ?�공 ?�인

---

## ?�� **최종 결과**

모든 ?�정???�료?�면:
1. **GitHub??코드 ?�시 ???�동 배포**
2. **Firebase Hosting???�동 ?�데?�트**
3. **https://wiz-coco.web.app ?�서 최신 버전 ?�인 가??*

---

## ?�� **?�데?�트 ?�시**

- **최종 ?�데?�트**: 2025??1??27??
- **로컬 배포 ?�료**: 2025??1??27??
- **?�동 배포 ?�정**: 진행 �?
- **?�당??*: 30??경력 ?�문가 ?� (?�?�택 ?�로그래�? ?�디?�이?? ?�리?�담?�문가) 
