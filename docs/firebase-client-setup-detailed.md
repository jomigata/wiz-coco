# Firebase 클라이언트 설정 상세 가이드

## 🚨 **Firebase 클라이언트 설정 완전 가이드**

GitHub Actions에서 Firebase 배포를 위해 웹 앱 설정값들을 복사하여 GitHub Secrets에 설정하는 방법을 단계별로 상세히 안내합니다.

---

## **1단계: Firebase Console 접속**

### **1-1. 브라우저에서 Firebase Console 열기**
1. **브라우저 주소창에 다음 URL 입력:**
   ```
   https://console.firebase.google.com/project/wiz-coco/settings/general
   ```
2. **Enter 키를 눌러 접속**

### **1-2. Firebase 계정 로그인**
1. **Google 계정으로 로그인** (wiz-coco 프로젝트에 접근 권한이 있는 계정)
2. **프로젝트 선택**: `wiz-coco` 프로젝트가 선택되어 있는지 확인

---

## **2단계: 웹 앱 설정 확인**

### **2-1. General 탭 확인**
1. **왼쪽 메뉴에서 "Project settings" 클릭** (톱니바퀴 아이콘)
2. **"General" 탭이 선택되어 있는지 확인**

### **2-2. Your apps 섹션 확인**
1. **"Your apps" 섹션을 찾기** (페이지 중간 부분)
2. **웹 앱이 있는지 확인**

### **2-3. 웹 앱이 없는 경우 등록**
만약 웹 앱이 없다면:
1. **"Add app" 버튼 클릭**
2. **"Web" 아이콘 클릭** (</> 아이콘)
3. **앱 닉네임 입력**: `wizcoco-web`
4. **"Register app" 클릭**
5. **"Continue to console" 클릭**

---

## **3단계: 웹 앱 설정값 복사**

### **3-1. 웹 앱 설정 열기**
1. **"Your apps" 섹션에서 웹 앱 클릭**
2. **"Project settings" 페이지에서 웹 앱 설정 확인**

### **3-2. 설정값들 복사**
웹 앱 설정에서 다음 값들을 하나씩 복사:

#### **3-2-1. API Key 복사**
1. **"API Key" 섹션 찾기**
2. **API Key 값 복사** (예: `AIzaSyC...`로 시작하는 긴 문자열)
3. **메모장에 임시 저장**

#### **3-2-2. Auth Domain 확인**
1. **"Auth Domain" 섹션 찾기**
2. **값 확인**: `wiz-coco.firebaseapp.com`
3. **메모장에 저장**

#### **3-2-3. Project ID 확인**
1. **"Project ID" 섹션 찾기**
2. **값 확인**: `wiz-coco`
3. **메모장에 저장**

#### **3-2-4. Storage Bucket 확인**
1. **"Storage Bucket" 섹션 찾기**
2. **값 확인**: `wiz-coco.appspot.com`
3. **메모장에 저장**

#### **3-2-5. Messaging Sender ID 복사**
1. **"Messaging Sender ID" 섹션 찾기**
2. **숫자 값 복사** (예: `123456789`)
3. **메모장에 저장**

#### **3-2-6. App ID 복사**
1. **"App ID" 섹션 찾기**
2. **App ID 값 복사** (예: `1:123456789:web:abcdef`)
3. **메모장에 저장**

#### **3-2-7. Measurement ID 복사**
1. **"Measurement ID" 섹션 찾기**
2. **Measurement ID 값 복사** (예: `G-XXXXXXXXXX`)
3. **메모장에 저장**

---

## **4단계: GitHub Secrets 설정**

### **4-1. GitHub Secrets 페이지 접속**
1. **새 브라우저 탭 열기**
2. **다음 URL 입력:**
   ```
   https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
   ```
3. **Enter 키를 눌러 접속**

### **4-2. FIREBASE_API_KEY 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_API_KEY`
3. **Value 입력**: 메모장에서 복사한 API Key 붙여넣기
4. **"Add secret" 클릭**

### **4-3. FIREBASE_AUTH_DOMAIN 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value 입력**: `wiz-coco.firebaseapp.com`
4. **"Add secret" 클릭**

### **4-4. FIREBASE_PROJECT_ID 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value 입력**: `wiz-coco`
4. **"Add secret" 클릭**

### **4-5. FIREBASE_STORAGE_BUCKET 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value 입력**: `wiz-coco.appspot.com`
4. **"Add secret" 클릭**

### **4-6. FIREBASE_MESSAGING_SENDER_ID 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value 입력**: 메모장에서 복사한 Messaging Sender ID 붙여넣기
4. **"Add secret" 클릭**

### **4-7. FIREBASE_APP_ID 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value 입력**: 메모장에서 복사한 App ID 붙여넣기
4. **"Add secret" 클릭**

### **4-8. FIREBASE_MEASUREMENT_ID 설정**
1. **"New repository secret" 버튼 클릭**
2. **Name 입력**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value 입력**: 메모장에서 복사한 Measurement ID 붙여넣기
4. **"Add secret" 클릭**

---

## **5단계: 설정 확인**

### **5-1. GitHub Secrets 목록 확인**
GitHub Secrets 페이지에서 다음 항목들이 모두 설정되었는지 확인:

- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### **5-2. 값 검증**
각 설정값이 올바른지 확인:
- **API Key**: `AIzaSyC...`로 시작하는 긴 문자열
- **Auth Domain**: `wiz-coco.firebaseapp.com`
- **Project ID**: `wiz-coco`
- **Storage Bucket**: `wiz-coco.appspot.com`
- **Messaging Sender ID**: 숫자만으로 구성
- **App ID**: `1:숫자:web:문자열` 형식
- **Measurement ID**: `G-`로 시작하는 문자열

---

## **6단계: GitHub Actions 재실행**

### **6-1. GitHub Actions 페이지 접속**
1. **새 브라우저 탭 열기**
2. **다음 URL 입력:**
   ```
   https://github.com/jomigata/wizcoco_2025/actions
   ```
3. **Enter 키를 눌러 접속**

### **6-2. 워크플로우 재실행**
1. **최신 워크플로우 실행 확인**
2. **"Re-run jobs" 버튼 클릭**
3. **"Re-run all jobs" 클릭**

---

## **🔗 관련 링크**

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
- **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
- **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wizcoco_2025/actions

### **배포 확인:**
- **메인 사이트**: https://wiz-coco.web.app

---

## **📞 문제 해결**

### **문제 1: 웹 앱이 보이지 않음**
**해결방법:**
1. Firebase Console에서 "Add app" → "Web" 클릭
2. 앱 등록 후 설정값들 확인

### **문제 2: 설정값이 복사되지 않음**
**해결방법:**
1. 설정값을 더블클릭하여 전체 선택
2. Ctrl+C로 복사
3. 메모장에 붙여넣기

### **문제 3: GitHub Secrets에 설정이 안됨**
**해결방법:**
1. GitHub 저장소에 접근 권한 확인
2. Settings → Secrets and variables → Actions 접근 권한 확인
3. 다시 시도

### **문제 4: 값이 올바르지 않음**
**해결방법:**
1. Firebase Console에서 설정값 재확인
2. 복사한 값이 올바른지 확인
3. GitHub Secrets에서 값 재설정

---

## **✅ 완료 체크리스트**

- [ ] Firebase Console 접속 완료
- [ ] 웹 앱 설정 확인 완료
- [ ] API Key 복사 완료
- [ ] Auth Domain 확인 완료
- [ ] Project ID 확인 완료
- [ ] Storage Bucket 확인 완료
- [ ] Messaging Sender ID 복사 완료
- [ ] App ID 복사 완료
- [ ] Measurement ID 복사 완료
- [ ] GitHub Secrets 페이지 접속 완료
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID 설정 완료
- [ ] NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID 설정 완료
- [ ] GitHub Actions 재실행 완료

---

## **🎯 성공 확인**

모든 설정이 완료되면:
1. **GitHub Actions에서 성공 메시지 확인**
2. **배포 완료 후 https://wiz-coco.web.app 접속**
3. **사이트가 정상적으로 로드되는지 확인**

**축하합니다! Firebase 클라이언트 설정이 완료되었습니다!** 🎉 