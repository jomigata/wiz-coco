/**
 * 로컬 스토리지 관리를 위한 유틸리티 함수들
 * 
 * DB 우선 정책:
 * - 회원가입, 로그인, 검사결과 등 중요 데이터는 DB 우선 저장
 * - 로컬스토리지는 임시 저장, 캐시, 세션 데이터만 사용
 * - 만료시간이 있는 임시 데이터만 로컬스토리지에 저장
 * - 영구 저장이 필요한 데이터는 DB 사용을 강제
 */

// 앱 네임스페이스 - 키 충돌 방지
const APP_PREFIX = 'oktest-';

// 중요 데이터 키 패턴 (DB 저장을 권장하는 데이터)
const CRITICAL_DATA_PATTERNS = [
  'user-profile',
  'test-result',
  'payment',
  'subscription',
  'medical-data',
  'personal-info'
];

// 키에 앱 접두어 추가
function prefixKey(key: string): string {
  if (key.startsWith(APP_PREFIX)) return key;
  return `${APP_PREFIX}${key}`;
}

/**
 * 중요 데이터 저장 시도 감지 및 경고
 */
function checkCriticalData(key: string, value: any): boolean {
  const isCritical = CRITICAL_DATA_PATTERNS.some(pattern => 
    key.toLowerCase().includes(pattern) || 
    (typeof value === 'object' && JSON.stringify(value).toLowerCase().includes(pattern))
  );
  
  if (isCritical) {
    console.warn(`[LocalStorage] 중요 데이터 감지: ${key}. DB 저장을 권장합니다.`);
    console.warn(`[LocalStorage] 이 데이터는 서버 API를 통해 저장하는 것이 안전합니다.`);
    return true;
  }
  return false;
}

/**
 * 만료 시간이 있는 항목을 로컬 스토리지에 저장
 * @param key 키
 * @param value 저장할 값
 * @param ttl 만료 시간 (밀리초)
 */
export function setWithExpiry(key: string, value: any, ttl: number): void {
  const prefixedKey = prefixKey(key);
  
  // 중요 데이터 감지
  checkCriticalData(key, value);
  
  const item = {
    value: value,
    expiry: Date.now() + ttl,
    created: Date.now(),
    type: 'temp'
  };
  
  try {
    localStorage.setItem(prefixedKey, JSON.stringify(item));
  } catch (error) {
    console.error(`로컬 스토리지에 저장 실패 (${prefixedKey}):`, error);
  }
}

/**
 * 로컬 스토리지에서 항목을 가져오고 만료 여부 확인
 * @param key 키
 * @returns 만료되지 않은 경우 값, 만료된 경우 null
 */
export function getWithExpiry<T>(key: string): T | null {
  const prefixedKey = prefixKey(key);
  try {
    const itemStr = localStorage.getItem(prefixedKey);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    // 만료 시간 확인
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(prefixedKey);
      return null;
    }
    
    return item.value as T;
  } catch (error) {
    console.error(`로컬 스토리지에서 불러오기 실패 (${prefixedKey}):`, error);
    return null;
  }
}

/**
 * @deprecated 영구 저장은 DB를 사용하세요. 임시 데이터는 setTempData를 사용하세요.
 */
export function setItem(key: string, value: any): void {
  const prefixedKey = prefixKey(key);
  
  // 중요 데이터 감지 및 경고
  if (checkCriticalData(key, value)) {
    console.error(`[LocalStorage] 중요 데이터의 영구 저장은 금지됩니다: ${key}`);
    console.error(`[LocalStorage] 대신 서버 API를 사용하여 DB에 저장하세요.`);
  }
  
  console.warn(`[LocalStorage] setItem 사용은 권장되지 않습니다. setTempData, setCacheData, setSessionData 중 하나를 사용하세요.`);
  
  try {
    // 임시적으로 24시간 만료 시간을 설정하여 저장
    const item = {
      value: value,
      expiry: Date.now() + (24 * 60 * 60 * 1000), // 24시간 후 만료
      created: Date.now(),
      type: 'deprecated',
      warning: 'This item will expire in 24 hours. Use DB for permanent storage.'
    };
    localStorage.setItem(prefixedKey, JSON.stringify(item));
  } catch (error) {
    console.error(`로컬 스토리지에 저장 실패 (${prefixedKey}):`, error);
  }
}

/**
 * 일반 항목 불러오기
 * @param key 키
 * @returns 저장된 값 또는 null
 */
export function getItem<T>(key: string): T | null {
  const prefixedKey = prefixKey(key);
  try {
    const itemStr = localStorage.getItem(prefixedKey);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    
    // 만료 시간이 있는 경우 확인
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(prefixedKey);
      return null;
    }
    
    // deprecated 경고
    if (item.type === 'deprecated') {
      console.warn(`[LocalStorage] Deprecated 데이터 접근: ${key}. DB 마이그레이션을 고려하세요.`);
    }
    
    return item.value as T;
  } catch (error) {
    console.error(`로컬 스토리지에서 불러오기 실패 (${prefixedKey}):`, error);
    return null;
  }
}

/**
 * 항목 삭제
 * @param key 키
 */
export function removeItem(key: string): void {
  const prefixedKey = prefixKey(key);
  try {
    localStorage.removeItem(prefixedKey);
  } catch (error) {
    console.error(`로컬 스토리지에서 삭제 실패 (${prefixedKey}):`, error);
  }
}

/**
 * 특정 패턴의 로컬 스토리지 항목들 일괄 삭제
 * @param pattern 키 패턴 (시작 문자열)
 */
export function removeItemsByPattern(pattern: string): void {
  const prefixedPattern = prefixKey(pattern);
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefixedPattern)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error(`패턴 ${prefixedPattern}으로 항목 삭제 실패:`, error);
  }
}

/**
 * 모든 만료된 항목 정리 (페이지 로드 시 호출)
 * @param patterns 정리할 키 패턴 배열 (기본값: temp-, cache-, session-)
 */
export function cleanupExpiredItems(patterns: string[] = ['temp-', 'cache-', 'session-', 'deprecated-']): void {
  try {
    Object.keys(localStorage).forEach(key => {
      // 앱 접두어로 시작하는 키만 처리
      if (!key.startsWith(APP_PREFIX)) return;
      
      // 지정된 패턴으로 시작하는 키만 확인
      const needsCheck = patterns.some(pattern => 
        key.startsWith(prefixKey(pattern))
      );
      
      if (needsCheck) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '{}');
          if (item.expiry && Date.now() > item.expiry) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // 파싱 오류 시 항목 삭제
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.error('만료된 항목 정리 중 오류:', error);
  }
}

/**
 * 로컬 스토리지 사용량 확인
 * @returns 사용 중인 바이트 수
 */
export function getStorageUsage(): number {
  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += (localStorage[key].length + key.length) * 2; // UTF-16 characters = 2 bytes
      }
    }
    return totalSize;
  } catch (error) {
    console.error('로컬 스토리지 사용량 확인 중 오류:', error);
    return 0;
  }
}

/**
 * 앱 관련 모든 로컬 스토리지 항목 삭제
 */
export function clearAppStorage(): void {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(APP_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('앱 스토리지 초기화 중 오류:', error);
  }
}

/**
 * 임시 데이터 저장 (기본 1시간, 최대 24시간)
 * 폼 입력 중 데이터, 임시 세션 정보 등에 사용
 */
export function setTempData(key: string, value: any, minutes: number = 60): void {
  // 최대 24시간으로 제한
  const maxMinutes = 24 * 60; // 24시간
  const actualMinutes = Math.min(minutes, maxMinutes);
  
  if (minutes > maxMinutes) {
    console.warn(`[LocalStorage] 임시 데이터 저장 시간이 24시간을 초과합니다. ${maxMinutes}분으로 제한됩니다.`);
  }
  
  const ttl = actualMinutes * 60 * 1000; // 분을 밀리초로 변환
  setWithExpiry(`temp-${key}`, value, ttl);
}

/**
 * 임시 데이터 불러오기
 */
export function getTempData<T>(key: string): T | null {
  return getWithExpiry<T>(`temp-${key}`);
}

/**
 * 캐시 데이터 저장 (기본 24시간, 최대 7일)
 * API 응답 캐시, 정적 데이터 캐시 등에 사용
 */
export function setCacheData(key: string, value: any, hours: number = 24): void {
  // 최대 7일로 제한
  const maxHours = 7 * 24; // 7일
  const actualHours = Math.min(hours, maxHours);
  
  if (hours > maxHours) {
    console.warn(`[LocalStorage] 캐시 데이터 저장 시간이 7일을 초과합니다. ${maxHours}시간으로 제한됩니다.`);
  }
  
  const ttl = actualHours * 60 * 60 * 1000; // 시간을 밀리초로 변환
  setWithExpiry(`cache-${key}`, value, ttl);
}

/**
 * 캐시 데이터 불러오기
 */
export function getCacheData<T>(key: string): T | null {
  return getWithExpiry<T>(`cache-${key}`);
}

/**
 * 세션 데이터 저장 (기본 12시간, 최대 24시간)
 * UI 상태, 현재 진행 상황 등에 사용
 */
export function setSessionData(key: string, value: any, hours: number = 12): void {
  // 최대 24시간으로 제한
  const maxHours = 24;
  const actualHours = Math.min(hours, maxHours);
  
  if (hours > maxHours) {
    console.warn(`[LocalStorage] 세션 데이터 저장 시간이 24시간을 초과합니다. ${maxHours}시간으로 제한됩니다.`);
  }
  
  const ttl = actualHours * 60 * 60 * 1000; // 시간을 밀리초로 변환
  setWithExpiry(`session-${key}`, value, ttl);
}

/**
 * 세션 데이터 불러오기
 */
export function getSessionData<T>(key: string): T | null {
  return getWithExpiry<T>(`session-${key}`);
}

/**
 * 사용자 인증 상태만 임시 저장 (보안상 중요하지 않은 상태 정보)
 * 실제 토큰과 중요 정보는 DB에서 검증
 * 최대 24시간 후 자동 만료
 */
export function setAuthState(isLoggedIn: boolean, userBasicInfo?: any): void {
  if (isLoggedIn && userBasicInfo) {
    // 24시간 후 만료되는 임시 인증 상태 저장
    const ttl = 24 * 60 * 60 * 1000; // 24시간
    const authData = {
      isLoggedIn: true,
      lastCheck: Date.now(),
      // 중요하지 않은 기본 정보만 저장 (이메일, 이름 등)
      userBasicInfo: {
        email: userBasicInfo.email,
        name: userBasicInfo.name,
        id: userBasicInfo.id,
        role: userBasicInfo.role // 관리자 권한 확인을 위해 role 정보 추가
      }
    };
    setWithExpiry('auth-state', authData, ttl);
  } else {
    removeItem('auth-state');
  }
}

/**
 * 인증 상태 불러오기
 */
export function getAuthState(): { isLoggedIn: boolean; userBasicInfo?: any } | null {
  return getWithExpiry<any>('auth-state');
}

/**
 * 앱 시작 시 정리 작업
 * 만료된 임시 데이터와 불필요한 캐시 정리
 */
export function initializeLocalStorage(): void {
  console.log('[LocalStorage] 초기화 및 정리 작업 시작');
  
  // 만료된 임시 데이터 정리
  cleanupExpiredItems(['temp-', 'cache-', 'session-', 'deprecated-']);
  
  // 오래된 데이터 정리 (7일 이상된 데이터)
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  try {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(APP_PREFIX)) return;
      
      try {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        
        // 생성 시간이 있고 7일이 지났으면 삭제
        if (item.created && item.created < weekAgo) {
          localStorage.removeItem(key);
          console.log(`[LocalStorage] 오래된 데이터 삭제: ${key}`);
        }
        
        // 값에 타임스탬프가 있고 7일이 지났으면 삭제
        if (item.value && item.value.timestamp) {
          const itemTime = new Date(item.value.timestamp).getTime();
          if (itemTime < weekAgo) {
            localStorage.removeItem(key);
            console.log(`[LocalStorage] 오래된 타임스탬프 데이터 삭제: ${key}`);
          }
        }
      } catch (e) {
        // 파싱 오류나 잘못된 형식의 데이터는 삭제
        localStorage.removeItem(key);
        console.log(`[LocalStorage] 손상된 데이터 삭제: ${key}`);
      }
    });
  } catch (error) {
    console.error('로컬스토리지 초기화 중 오류:', error);
  }
  
  console.log('[LocalStorage] 초기화 및 정리 작업 완료');
}

/**
 * DB 저장을 위한 헬퍼 함수들
 */

/**
 * 사용자 데이터를 DB에 저장하는 함수 (예시)
 * @param userData 사용자 데이터
 * @returns Promise<boolean> 저장 성공 여부
 */
export async function saveUserDataToDB(userData: any): Promise<boolean> {
  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    return response.ok;
  } catch (error) {
    console.error('DB 저장 실패:', error);
    return false;
  }
}

/**
 * 검사 결과를 DB에 저장하는 함수 (예시)
 * @param testResult 검사 결과 데이터
 * @returns Promise<boolean> 저장 성공 여부
 */
export async function saveTestResultToDB(testResult: any): Promise<boolean> {
  try {
    const response = await fetch('/api/test-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testResult),
    });
    
    return response.ok;
  } catch (error) {
    console.error('검사 결과 DB 저장 실패:', error);
    return false;
  }
}

/**
 * 기존 방식의 영구 저장 사용을 방지하는 경고 함수
 * @deprecated DB 우선 정책에 따라 중요 데이터는 DB에 저장하세요
 */
export function setPermanentData(key: string, value: any): void {
  console.error(`[LocalStorage] 영구 데이터 저장은 금지됩니다: ${key}`);
  console.error(`[LocalStorage] 중요 데이터는 DB에 저장하고, 임시 데이터는 setTempData를 사용하세요.`);
  
  // 강제로 임시 데이터로 저장 (24시간 후 만료)
  setTempData(`deprecated-${key}`, value, 24 * 60); // 24시간
}

/**
 * 로컬스토리지 사용 가이드라인 출력
 */
export function printStorageGuidelines(): void {
  console.log(`
=== 로컬스토리지 사용 가이드라인 ===

✅ 권장 사용법:
- setTempData(): 임시 데이터 (최대 24시간)
- setCacheData(): 캐시 데이터 (최대 7일)  
- setSessionData(): 세션 데이터 (최대 24시간)
- setAuthState(): 인증 상태 (24시간 자동 만료)

❌ 금지 사용법:
- setItem(): 영구 저장 (deprecated)
- setPermanentData(): 영구 저장 (금지)

🔒 DB 저장 필수 데이터:
- 회원가입 정보
- 로그인 정보  
- 검사 결과
- 결제 정보
- 개인정보

📞 도움말:
- saveUserDataToDB(): 사용자 데이터 DB 저장
- saveTestResultToDB(): 검사 결과 DB 저장
- initializeLocalStorage(): 앱 시작시 정리 작업
  `);
}

/**
 * @deprecated authSessionLifecycle(browserCleanup)에서 처리합니다.
 */
export function setupBrowserCloseHandler(): void {
  // BrowserCleanupProvider → initBrowserCleanup → initAuthSessionLifecycle 에서 통합 처리
}

/**
 * 완전 로그아웃 함수 (수동 로그아웃 시 사용)
 */
export function performCompleteLogout(): void {
  console.log('[LocalStorage] 완전 로그아웃 시작');
  
  try {
    // 모든 인증 관련 정보 삭제
    localStorage.removeItem('oktest-auth-state');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('userToken');
    
    // 임시 데이터 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('temp-') || 
          key.startsWith('login-') ||
          key.startsWith('auth-')) {
        localStorage.removeItem(key);
      }
    });
    
    // 개인정보 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mbti-user-test-records-') || 
          key.includes('clientInfo') ||
          key.includes('personal')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('[LocalStorage] 완전 로그아웃 완료');
  } catch (error) {
    console.error('[LocalStorage] 완전 로그아웃 오류:', error);
  }
} 