# Firebase 커스텀 도메인 설정 가이드

## 🔧 wizcoco.com 도메인 연결 문제 해결

### **현재 문제점:**
1. `wizcoco.com`이 Firebase Hosting이 아닌 다른 IP(`199.36.158.100`)로 연결됨
2. `www.wizcoco.com` 서브도메인이 존재하지 않음
3. Firebase 프로젝트에 커스텀 도메인이 등록되지 않음
4. 도메인 파킹 서비스가 활성화되어 Firebase 연결과 충돌

### **해결 단계:**

#### **1단계: Firebase 콘솔에서 커스텀 도메인 추가**

1. **Firebase 콘솔 접속**
   - https://console.firebase.google.com/ 접속
   - `wiz-coco` 프로젝트 선택

2. **Hosting 섹션 이동**
   - 왼쪽 메뉴에서 "Build" → "Hosting" 클릭

3. **커스텀 도메인 추가**
   - "Custom domains" 섹션에서 "Add custom domain" 클릭
   - 도메인 입력: `wizcoco.com`
   - "Continue" 클릭

4. **DNS 검증**
   - Firebase가 제공하는 A 레코드 및 TXT 레코드 정보 확인
   - 일반적으로 다음과 같은 레코드가 필요:
     ```
     A 레코드: 199.36.153.89
     A 레코드: 199.36.153.90
     TXT 레코드: firebase=wiz-coco
     ```

#### **2단계: Dotname DNS 설정 수정**

**중요: 도메인 파킹 서비스 해제 필요**

1. **도메인 파킹 서비스 해제**
   - Dotname 관리 페이지에서 "도메인 파킹" 메뉴로 이동
   - `wizcoco.com`의 파킹 서비스 "해제" 버튼 클릭

2. **A 레코드 설정**
   - "DNS 레코드 설정" 메뉴로 이동
   - 기존 A 레코드 `199.36.158.100` 삭제
   - 새로운 A 레코드 추가:
     ```
     호스트: @ (또는 공란)
     IP: 199.36.153.89
     ```
   - 두 번째 A 레코드 추가:
     ```
     호스트: @ (또는 공란)
     IP: 199.36.153.90
     ```

3. **CNAME 레코드 설정**
   - CNAME 레코드 섹션에서:
     ```
     서브도메인: www
     연결할 도메인: wiz-coco.web.app
     ```

4. **TXT 레코드 설정 (Firebase 요구시)**
   - Firebase가 제공하는 TXT 레코드 추가
   - 기존 `hosting-site=wiz-coco` 레코드는 유지

#### **3단계: DNS 전파 대기**

- DNS 변경 후 전파 시간: 12-48시간
- 전파 확인 명령어:
  ```bash
  nslookup wizcoco.com
  nslookup www.wizcoco.com
  ```

#### **4단계: SSL 인증서 발급 대기**

- Firebase가 자동으로 SSL 인증서 발급
- 발급 시간: DNS 전파 후 24-48시간

### **예상 결과:**
- `wizcoco.com` → Firebase Hosting 연결
- `www.wizcoco.com` → Firebase Hosting 연결
- HTTPS 자동 적용
- 모든 MBTI 검사 페이지 정상 접근 가능

### **문제 해결 확인:**
1. `https://wizcoco.com` 접속 테스트
2. `https://www.wizcoco.com` 접속 테스트
3. MBTI 검사 페이지 접속 테스트:
   - `https://wizcoco.com/tests/mbti`
   - `https://wizcoco.com/tests/mbti_pro`
   - `https://wizcoco.com/tests/group_mbti`
   - `https://wizcoco.com/tests/inside-mbti`