# 검사결과 저장 및 로드 방식 분석 문서

## 📋 현재 프로젝트의 검사결과 저장 방식

### 1. 현재 구현 상태

#### ✅ Firebase DB 연동 준비 상태
- **Firebase 초기화**: `src/lib/firebase.ts`에서 Firebase 서비스 초기화 완료
- **Firestore 유틸리티**: `src/utils/firebaseFirestore.ts`에 Firestore CRUD 함수 구현됨
- **통합 유틸리티**: `src/utils/firebaseIntegration.ts`에 테스트 결과 저장/조회 함수 구현됨

#### ⚠️ 실제 사용 현황
현재 프로젝트는 **하이브리드 방식**을 사용하고 있습니다:

1. **LocalStorage 우선 사용** (현재 기본 방식)
   - 검사 결과가 주로 `localStorage`에 저장됨
   - 키: `test_records`, `mbti-user-test-records`, `test-result-{code}` 등
   - 검사기록 페이지에서 `localStorage`에서 직접 로드

2. **Firebase DB 저장 시도** (부분적 구현)
   - `MbtiProResult.tsx`에서 `saveTestResultToServer` 함수로 Firestore 저장 시도
   - 실패 시 동기화 큐에 추가하는 로직 존재
   - 하지만 대부분의 검사 완료 로직에서는 Firebase 저장이 호출되지 않음

---

## 🔍 상세 분석

### 현재 검사 완료 시 저장 흐름

#### 전문가용 MBTI 검사 (`MbtiProTest.tsx`)

```typescript
// 1. LocalStorage에 저장 (주요 저장 방식)
localStorage.setItem('mbti-user-test-records-{email}', JSON.stringify(records));
localStorage.setItem('test_records', JSON.stringify(globalRecords));

// 2. Firebase 저장은 호출되지 않음 ❌
```

#### 검사 결과 페이지 (`MbtiProResult.tsx`)

```typescript
// Firebase 저장 함수는 존재하지만 조건부로만 호출됨
const saveTestResultToServer = async (testResult: any) => {
  // 1. LocalStorage에 먼저 저장
  setItem(`test-result-${testResult.code}`, testResult);
  
  // 2. Firestore에 저장 시도
  await setDoc(doc(db, 'test_results', testResult.code), {
    ...testResult,
    savedAt: new Date(),
  });
  
  // 3. 실패 시 동기화 큐에 추가
  addToSyncTestResult(testResult.code);
};
```

**문제점**: 이 함수는 `useEffect`에서 호출되지만, 검사 완료 직후가 아닌 결과 페이지 로드 시점에 호출됨

---

### 현재 검사 기록 로드 흐름

#### 검사기록 페이지 (`test-records/page.tsx`)

```typescript
// 1. Firebase DB에서 로드 시도 (API 호출)
const fetchTestRecordsFromDB = async (userId: string, token: string) => {
  const response = await fetch('/api/user-tests', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  // ...
};

// 2. 실패 시 LocalStorage에서 로드 (폴백)
const fetchLocalTestRecords = () => {
  const mbtiRecordsStr = localStorage.getItem('mbti-user-test-records');
  const savedRecordsStr = localStorage.getItem('test_records');
  // ...
};
```

**현재 동작**: 
- Firebase API 호출 시도 → 실패 시 LocalStorage 사용
- 대부분의 경우 LocalStorage에서 로드됨

---

## 📊 비교 분석: 현재 vs 목표

### 현재 방식 (하이브리드 - LocalStorage 우선)

| 항목 | 현재 구현 | 문제점 |
|------|----------|--------|
| **저장 위치** | LocalStorage (주) + Firebase (부) | Firebase 저장이 일관되지 않음 |
| **로드 우선순위** | LocalStorage → Firebase | Firebase가 폴백으로만 사용됨 |
| **데이터 동기화** | 없음 | 기기 간 동기화 불가능 |
| **데이터 영구성** | 브라우저 캐시에 의존 | 브라우저 삭제 시 데이터 손실 |
| **오프라인 지원** | LocalStorage로 가능 | 하지만 동기화 없음 |

### 목표 방식 (Firebase 우선)

| 항목 | 목표 구현 | 장점 |
|------|----------|------|
| **저장 위치** | Firebase DB (주) + LocalStorage (캐시) | 모든 데이터가 클라우드에 저장 |
| **로드 우선순위** | Firebase → LocalStorage (캐시) | 항상 최신 데이터 보장 |
| **데이터 동기화** | 실시간 동기화 | 모든 기기에서 동일한 데이터 |
| **데이터 영구성** | Firebase에 영구 저장 | 브라우저 삭제해도 데이터 유지 |
| **오프라인 지원** | LocalStorage 캐시 + 동기화 큐 | 오프라인에서도 작업 가능 |

---

## 🔧 구현된 Firebase 함수들

### 1. `src/utils/firebaseIntegration.ts`

```typescript
export const testResults = {
  // 테스트 결과 저장
  async saveTestResult(testData: any) {
    const testRef = await addDoc(collection(db, 'test_results'), {
      ...testData,
      createdAt: new Date()
    });
    return testRef.id;
  },

  // 사용자의 테스트 결과 조회
  async getUserTestResults(userId: string) {
    const q = query(
      collection(db, 'test_results'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    // ...
  },

  // 테스트 코드로 결과 조회
  async getTestResultByCode(testCode: string) {
    const q = query(
      collection(db, 'test_results'),
      where('code', '==', testCode),
      limit(1)
    );
    // ...
  }
};
```

### 2. `src/utils/firebaseFirestore.ts`

```typescript
export const testResultUtils = {
  async saveTestResult(testResult: any): Promise<string> {
    return addDocument('test_results', {
      ...testResult,
      testDate: Timestamp.now()
    });
  },

  async getUserTestResults(userId: string): Promise<DocumentData[]> {
    return queryDocuments('test_results', [
      { field: 'userId', operator: '==', value: userId }
    ], 'testDate', 'desc');
  },

  async getTestResultByCode(testCode: string): Promise<DocumentData | null> {
    const results = await queryDocuments('test_results', [
      { field: 'code', operator: '==', value: testCode }
    ]);
    return results.length > 0 ? results[0] : null;
  }
};
```

**상태**: 함수는 구현되어 있으나 실제로는 거의 사용되지 않음

---

## 📝 LocalStorage 사용 현황

### 주요 LocalStorage 키

1. **`test_records`**: 모든 검사 기록 (전역)
2. **`mbti-user-test-records`**: MBTI 검사 기록 (전역)
3. **`mbti-user-test-records-{email}`**: 사용자별 MBTI 검사 기록
4. **`test-result-{code}`**: 개별 검사 결과
5. **`mbti-test-data-code-{code}`**: MBTI 검사 데이터
6. **`deleted_test_records`**: 삭제된 검사 기록

### 사용 위치

- `src/components/tests/MbtiProTest.tsx`: 검사 완료 시 저장
- `src/components/tests/MbtiProResult.tsx`: 결과 로드 시 사용
- `src/app/mypage/test-records/page.tsx`: 검사기록 목록 로드
- `src/app/mypage/deleted-codes/components.tsx`: 삭제된 기록 관리

---

## 🎯 개선 필요 사항

### 1. 검사 완료 시 Firebase 저장 필수화
- 현재: LocalStorage에만 저장
- 개선: Firebase DB에 먼저 저장, 성공 후 LocalStorage 캐시

### 2. 검사 기록 로드 우선순위 변경
- 현재: LocalStorage → Firebase (폴백)
- 개선: Firebase → LocalStorage (캐시)

### 3. 모든 검사 유형에 Firebase 저장 적용
- 현재: 전문가용 MBTI만 부분적 구현
- 개선: 모든 검사 유형 (MBTI, 애니어그램, 이고-오케이 등)에 적용

### 4. 실시간 동기화 구현
- 현재: 없음
- 개선: Firestore 실시간 리스너로 동기화

### 5. 오프라인 동기화 큐 강화
- 현재: 기본적인 동기화 큐만 존재
- 개선: 오프라인 작업을 큐에 저장하고 온라인 시 자동 동기화

---

## 📌 다음 단계 작업 목록

1. **검사 완료 로직 수정**
   - 모든 검사 완료 시 Firebase DB에 먼저 저장
   - 성공 후 LocalStorage에 캐시 저장

2. **검사 기록 로드 로직 수정**
   - Firebase DB에서 먼저 조회
   - 실패 시 LocalStorage 캐시 사용
   - Firebase 데이터를 LocalStorage에 캐시 업데이트

3. **검사 결과 조회 로직 수정**
   - 검사 결과 페이지에서 Firebase DB에서 먼저 조회
   - 코드 파라미터로 Firebase에서 직접 로드

4. **실시간 동기화 구현**
   - Firestore `onSnapshot` 사용
   - 검사기록 페이지에 실시간 업데이트 적용

5. **오프라인 지원 강화**
   - IndexedDB 또는 LocalStorage에 오프라인 큐 구현
   - 온라인 복귀 시 자동 동기화

---

## 🔗 관련 파일 링크

- **Firebase 초기화**: `src/lib/firebase.ts`
- **Firebase 통합 유틸리티**: `src/utils/firebaseIntegration.ts`
- **Firestore 유틸리티**: `src/utils/firebaseFirestore.ts`
- **전문가용 MBTI 검사**: `src/components/tests/MbtiProTest.tsx`
- **검사 결과 페이지**: `src/components/tests/MbtiProResult.tsx`
- **검사기록 페이지**: `src/app/mypage/test-records/page.tsx`

---

**작성일**: 2025-11-12  
**작성자**: 개발팀  
**상태**: 분석 완료, 개선 작업 대기 중

