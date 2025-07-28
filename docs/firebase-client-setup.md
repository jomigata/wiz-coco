# Firebase 클라이언트 설정 가이드

## 🚨 **Firebase 클라이언트 설정이 필요합니다!**

GitHub Actions에서 Firebase 클라이언트 설정값들이 필요합니다.

## **1단계: Firebase Console 접속**

1. https://console.firebase.google.com/project/wiz-coco/settings/general 접속
2. Firebase 프로젝트 `wiz-coco` 선택

## **2단계: 웹 앱 설정 확인**

1. **"General" 탭에서 "Your apps" 섹션 확인**
2. **웹 앱이 없다면 "Add app" → "Web" 클릭**
3. **앱 등록 후 설정값들 확인**

## **3단계: 설정값들 복사**

웹 앱 설정에서 다음 값들을 복사:

### **필수 설정값들:**

| GitHub Secret Name | Firebase Console에서 복사할 값 | 예시 |
|-------------------|-------------------------------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key | `AIzaSyC...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth Domain | `wiz-coco.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | `wiz-coco` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage Bucket | `wiz-coco.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123456789:web:abcdef` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Measurement ID | `G-XXXXXXXXXX` |

## **4단계: GitHub Secrets에 설정**

각 설정값을 개별적으로 GitHub Secrets에 설정:

### **4-1. NEXT_PUBLIC_FIREBASE_API_KEY**
1. GitHub Secrets 페이지 접속: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
2. "New repository secret" 클릭
3. **Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
4. **Value**: Firebase Console에서 복사한 API Key
5. "Add secret" 클릭

### **4-2. NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
1. "New repository secret" 클릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. **Value**: `wiz-coco.firebaseapp.com`
4. "Add secret" 클릭

### **4-3. NEXT_PUBLIC_FIREBASE_PROJECT_ID**
1. "New repository secret" 클릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. **Value**: `wiz-coco`
4. "Add secret" 클릭

### **4-4. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
1. "New repository secret" 클릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
3. **Value**: `wiz-coco.appspot.com`
4. "Add secret" 클릭

### **4-5. NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
1. "New repository secret" 클릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
3. **Value**: Firebase Console에서 복사한 Messaging Sender ID
4. "Add secret" 클릭

### **4-6. NEXT_PUBLIC_FIREBASE_APP_ID**
1. "New repository secret" 클릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
3. **Value**: Firebase Console에서 복사한 App ID
4. "Add secret" 클릭

### **4-7. NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
1. "New repository secret" 클릭
2. **Name**: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Value**: Firebase Console에서 복사한 Measurement ID
4. "Add secret" 클릭

## **5단계: 설정 확인**

GitHub Secrets 목록에서 다음 항목들이 모두 설정되었는지 확인:

- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## **6단계: Firebase 서비스 활성화**

Firebase Console에서 다음 서비스들이 활성화되어 있는지 확인:

1. **Authentication**: https://console.firebase.google.com/project/wiz-coco/authentication
2. **Firestore Database**: https://console.firebase.google.com/project/wiz-coco/firestore
3. **Storage**: https://console.firebase.google.com/project/wiz-coco/storage
4. **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting

## **🔗 관련 링크**

- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/settings/general
- **GitHub Secrets**: https://github.com/jomigata/wizcoco_2025/settings/secrets/actions
- **GitHub Actions**: https://github.com/jomigata/wizcoco_2025/actions

## **📞 문제 해결**

만약 문제가 발생하면:
1. Firebase Console에서 웹 앱이 올바르게 등록되었는지 확인
2. 모든 설정값이 올바르게 복사되었는지 확인
3. GitHub Secrets에 값이 올바르게 설정되었는지 확인
4. Firebase 프로젝트 ID가 `wiz-coco`인지 확인 