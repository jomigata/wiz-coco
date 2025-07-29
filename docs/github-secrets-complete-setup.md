# 🔧 GitHub Secrets 완전 설정 가이드 (30년 경력 전문가 검토)

## 🎉 **배포 성공 확인**

**WizCoCo 사이트가 성공적으로 배포되었습니다!**
- **배포 URL**: https://wiz-coco.web.app
- **상태**: ✅ 정상 작동 중
- **검토자**: 30년 경력 풀스택 프로그래머, 웹디자이너, 심리상담전문가

---

## 🚨 **GitHub Actions 자동 배포 설정**

현재 로컬 배포는 성공했지만, GitHub Actions를 통한 자동 배포를 위해 다음 설정이 필요합니다.

---

## **1단계: FIREBASE_TOKEN 설정 (최우선)**

### **1-1. 토큰 생성**
터미널에서 다음 명령어 실행:
```bash
firebase login:ci
```

### **1-2. GitHub Secrets에 설정**
1. **GitHub Secrets 페이지 접속**
   - https://github.com/jomigata/wizcoco_2025/settings/secrets/actions

2. **"New repository secret" 클릭**

3. **설정값 입력**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: 생성된 토큰 붙여넣기
   - **"Add secret" 클릭**

---

## **2단계: FIREBASE_SERVICE_ACCOUNT 설정 (최우선)**

### **2-1. JSON 파일 내용 복사**
현재 준비된 파일: `Firebase_GitHub/wiz-coco-firebase-adminsdk-fbsvc-69c4c2375c.json`

### **2-2. GitHub Secrets에 설정**
1. **GitHub Secrets 페이지에서 "New repository secret" 클릭**
2. **Name**: `FIREBASE_SERVICE_ACCOUNT`
3. **Value**: JSON 파일 전체 내용 붙여넣기
4. **"Add secret" 클릭**

---

## **3단계: Firebase 클라이언트 설정 (필수)**

### **3-1. Firebase Console 접속**
1. https://console.firebase.google.com/project/wiz-coco/settings/general 접속
2. **"Your apps" 섹션에서 웹 앱 설정 확인**

### **3-2. 각 설정값 복사 및 설정**

#### **3-2-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. **Firebase Console에서 "API Key" 값 복사**
2. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Value**: 복사한 API Key

#### **3-2-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - **Value**: `wiz-coco.firebaseapp.com`

#### **3-2-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - **Value**: `wiz-coco`

#### **3-2-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - **Value**: `wiz-coco.appspot.com`

#### **3-2-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. **Firebase Console에서 "Messaging Sender ID" 값 복사**
2. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - **Value**: 복사한 Messaging Sender ID

#### **3-2-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. **Firebase Console에서 "App ID" 값 복사**
2. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
   - **Value**: 복사한 App ID

#### **3-2-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. **Firebase Console에서 "Measurement ID" 값 복사**
2. **GitHub Secrets에서 설정**
   - **Name**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - **Value**: 복사한 Measurement ID

---

## **4단계: 설정 완료 확인**

### **4-1. GitHub Secrets 목록 확인**
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

### **4-2. GitHub Actions 재실행**
1. **GitHub Actions 페이지 접속**
   - https://github.com/jomigata/wizcoco_2025/actions

2. **"Re-run jobs" 클릭**

3. **"Re-run all jobs" 클릭**

---

## **5단계: 자동 배포 확인**

### **5-1. GitHub Actions 로그 확인**
1. 워크플로우 실행 상태 확인
2. 성공 메시지 확인

### **5-2. 배포된 사이트 확인**
1. https://wiz-coco.web.app 접속
2. 사이트가 정상적으로 로드되는지 확인

---

## 🔗 **관련 링크**

### **GitHub:**
- **Secrets Settings**: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
- **Actions**: https://github.com/jomigata/wizcoco_2025/actions

### **Firebase Console:**
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **Service Account**: https://console.firebase.google.com/project/wiz-coco/settings/serviceaccounts/adminsdk

### **배포 확인:**
- **메인 사이트**: https://wiz-coco.web.app

---

## 📞 **문제 해결**

### **문제 1: GitHub Secrets 설정이 안됨**
**해결방법:**
1. GitHub 저장소에 대한 관리자 권한 확인
2. 브라우저 캐시 삭제 후 재시도
3. 다른 브라우저에서 시도

### **문제 2: Firebase Console 접속이 안됨**
**해결방법:**
1. 올바른 Google 계정으로 로그인 확인
2. Firebase 프로젝트 권한 확인
3. 브라우저 확장 프로그램 비활성화 후 시도

### **문제 3: 설정값이 올바르지 않음**
**해결방법:**
1. Firebase Console에서 설정값 재확인
2. 복사한 값이 올바른지 확인
3. GitHub Secrets에서 값 재설정

---

## ✅ **완료 체크리스트**

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
- [ ] 자동 배포 성공 확인

---

## 🎯 **최종 결과**

모든 설정이 완료되면:
1. **GitHub에 코드 푸시 시 자동 배포**
2. **Firebase Hosting에 자동 업데이트**
3. **https://wiz-coco.web.app 에서 최신 버전 확인 가능**

---

## 📅 **업데이트 일시**

- **최종 업데이트**: 2025년 1월 27일
- **로컬 배포 완료**: 2025년 1월 27일
- **자동 배포 설정**: 진행 중
- **담당자**: 30년 경력 전문가 팀 (풀스택 프로그래머, 웹디자이너, 심리상담전문가) 