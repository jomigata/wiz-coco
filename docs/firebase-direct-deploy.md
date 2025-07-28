# Firebase 직접 배포 가이드

## 🚀 **Firebase 직접 배포 방법**

GitHub Actions 없이 Firebase CLI를 사용하여 직접 배포하는 방법을 안내합니다.

---

## **1단계: Firebase CLI 설치 및 설정**

### **1-1. Firebase CLI 설치**
```bash
npm install -g firebase-tools
```

### **1-2. Firebase 로그인**
```bash
firebase login
```

### **1-3. 프로젝트 확인**
```bash
firebase projects:list
firebase use wiz-coco
```

---

## **2단계: 배포 방법**

### **2-1. 기본 배포 명령어**
```bash
# 빌드 후 배포
npm run build
firebase deploy --only hosting
```

### **2-2. package.json 스크립트 사용**
```bash
# Firebase Hosting만 배포
npm run deploy:firebase

# 강제 배포 (캐시 무시)
npm run deploy:quick
```

### **2-3. 배치 파일 사용 (Windows)**
```bash
# deploy-firebase.bat 실행
deploy-firebase.bat
```

---

## **3단계: 배포 전 확인사항**

### **3-1. 환경 변수 설정**
`.env.local` 파일에 Firebase 설정 확인:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wiz-coco.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wiz-coco
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wiz-coco.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

### **3-2. Firebase 설정 확인**
`firebase.json` 파일 확인:
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

## **4단계: 배포 과정**

### **4-1. 빌드**
```bash
npm run build
```

### **4-2. 배포**
```bash
firebase deploy --only hosting
```

### **4-3. 배포 확인**
- **배포 URL**: https://wiz-coco.web.app
- **Firebase Console**: https://console.firebase.google.com/project/wiz-coco/hosting

---

## **5단계: 로컬 테스트**

### **5-1. 로컬 서버 실행**
```bash
firebase serve
```

### **5-2. 빌드된 파일 로컬 테스트**
```bash
npm run build
firebase serve --only hosting
```

---

## **🎯 장점**

### **1. 단순성**
- 복잡한 CI/CD 설정 불필요
- 즉시 배포 가능
- 학습 곡선 낮음

### **2. 빠른 배포**
- CI/CD 오버헤드 없음
- 직접 제어 가능
- 즉시 반영

### **3. 비용 효율성**
- Firebase Hosting 무료 플랜
- GitHub Actions 사용량 제한 없음
- 예측 가능한 비용

### **4. 개발 편의성**
- 로컬 테스트 용이
- 환경 변수 관리 간단
- 디버깅 쉬움

---

## **⚠️ 단점**

### **1. 자동화 부족**
- 수동 배포 필요
- 자동 테스트 없음
- 롤백 복잡

### **2. 협업 제한**
- 버전 관리 어려움
- 배포 이력 추적 어려움
- 코드 리뷰 부재

### **3. 안정성 문제**
- 인적 오류 가능성
- 환경 차이로 인한 문제
- 백업 시스템 부족

### **4. 확장성 제한**
- 대규모 팀 부적합
- 복잡한 워크플로우 어려움
- 모니터링 부족

---

## **🔄 권장 사용 시나리오**

### **개발 단계**
- 빠른 프로토타이핑
- 개인 프로젝트
- 소규모 팀

### **프로덕션 환경**
- GitHub Actions 유지 권장
- 안정성과 자동화 중요
- 팀 협업 필요

---

## **📋 배포 체크리스트**

### **배포 전**
- [ ] 코드 테스트 완료
- [ ] 환경 변수 설정 확인
- [ ] 빌드 성공 확인
- [ ] 로컬 테스트 완료

### **배포 중**
- [ ] 빌드 과정 모니터링
- [ ] 배포 로그 확인
- [ ] 오류 메시지 확인

### **배포 후**
- [ ] 사이트 접속 확인
- [ ] 주요 기능 테스트
- [ ] 성능 확인
- [ ] 오류 로그 확인

---

## **🔗 관련 링크**

### **Firebase Console:**
- **Hosting**: https://console.firebase.google.com/project/wiz-coco/hosting
- **General Settings**: https://console.firebase.google.com/project/wiz-coco/settings/general

### **배포 확인:**
- **메인 사이트**: https://wiz-coco.web.app

---

## **📞 문제 해결**

### **문제 1: Firebase CLI 로그인 실패**
**해결방법:**
1. `firebase logout` 실행
2. `firebase login` 다시 실행
3. 브라우저에서 권한 확인

### **문제 2: 빌드 실패**
**해결방법:**
1. `npm install` 실행
2. 환경 변수 확인
3. `npm run build` 로컬 테스트

### **문제 3: 배포 실패**
**해결방법:**
1. Firebase 프로젝트 확인: `firebase use wiz-coco`
2. 권한 확인: Firebase Console에서 권한 확인
3. 캐시 클리어: `firebase deploy --force`

---

## **✅ 완료 확인**

배포가 성공하면:
1. **Firebase Console에서 배포 상태 확인**
2. **https://wiz-coco.web.app 접속 확인**
3. **주요 기능 테스트 완료**

**축하합니다! Firebase 직접 배포가 완료되었습니다!** 🎉 