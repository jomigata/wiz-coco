// Firebase Analytics 유틸리티
// 사용자 행동 분석 및 이벤트 추적 기능 제공

import { analytics } from '@/lib/firebase';
import { 
  logEvent, 
  setUserId, 
  setUserProperties, 
  setCurrentScreen,
  Analytics
} from 'firebase/analytics';

/**
 * 페이지 뷰 이벤트 로깅
 * @param screenName - 화면 이름
 * @param screenClass - 화면 클래스
 */
export function logPageView(screenName: string, screenClass?: string) {
  if (analytics) {
    logEvent(analytics as Analytics, 'page_view', {
      page_title: screenName,
      page_location: window.location.href,
      page_path: window.location.pathname
    });
    
    if (screenClass) {
      setCurrentScreen(analytics as Analytics, screenClass);
    }
  }
}

/**
 * 사용자 로그인 이벤트 로깅
 * @param method - 로그인 방법 (email, google, kakao 등)
 */
export function logLogin(method: string) {
  if (analytics) {
    logEvent(analytics, 'login', {
      method: method
    });
  }
}

/**
 * 사용자 회원가입 이벤트 로깅
 * @param method - 회원가입 방법
 */
export function logSignUp(method: string) {
  if (analytics) {
    logEvent(analytics, 'sign_up', {
      method: method
    });
  }
}

/**
 * 테스트 시작 이벤트 로깅
 * @param testType - 테스트 유형 (MBTI, Enneagram 등)
 */
export function logTestStart(testType: string) {
  if (analytics) {
    logEvent(analytics, 'test_start', {
      test_type: testType
    });
  }
}

/**
 * 테스트 완료 이벤트 로깅
 * @param testType - 테스트 유형
 * @param result - 테스트 결과
 * @param duration - 테스트 소요 시간 (초)
 */
export function logTestComplete(testType: string, result: string, duration: number) {
  if (analytics) {
    logEvent(analytics, 'test_complete', {
      test_type: testType,
      result: result,
      duration: duration
    });
  }
}

/**
 * 테스트 결과 공유 이벤트 로깅
 * @param testType - 테스트 유형
 * @param result - 테스트 결과
 * @param method - 공유 방법 (email, social, link 등)
 */
export function logTestShare(testType: string, result: string, method: string) {
  if (analytics) {
    logEvent(analytics, 'test_share', {
      test_type: testType,
      result: result,
      method: method
    });
  }
}

/**
 * 사용자 ID 설정
 * @param userId - 사용자 ID
 */
export function setAnalyticsUserId(userId: string) {
  if (analytics) {
    setUserId(analytics, userId);
  }
}

/**
 * 사용자 속성 설정
 * @param properties - 사용자 속성 객체
 */
export function setAnalyticsUserProperties(properties: Record<string, string>) {
  if (analytics) {
    setUserProperties(analytics, properties);
  }
}

/**
 * 버튼 클릭 이벤트 로깅
 * @param buttonName - 버튼 이름
 * @param location - 버튼 위치
 */
export function logButtonClick(buttonName: string, location: string) {
  if (analytics) {
    logEvent(analytics, 'button_click', {
      button_name: buttonName,
      location: location
    });
  }
}

/**
 * 링크 클릭 이벤트 로깅
 * @param linkName - 링크 이름
 * @param linkUrl - 링크 URL
 */
export function logLinkClick(linkName: string, linkUrl: string) {
  if (analytics) {
    logEvent(analytics, 'link_click', {
      link_name: linkName,
      link_url: linkUrl
    });
  }
}

/**
 * 검색 이벤트 로깅
 * @param searchTerm - 검색어
 * @param searchType - 검색 유형
 */
export function logSearch(searchTerm: string, searchType: string) {
  if (analytics) {
    logEvent(analytics, 'search', {
      search_term: searchTerm,
      search_type: searchType
    });
  }
}

/**
 * 오류 이벤트 로깅
 * @param errorCode - 오류 코드
 * @param errorMessage - 오류 메시지
 * @param location - 오류 발생 위치
 */
export function logError(errorCode: string, errorMessage: string, location: string) {
  if (analytics) {
    logEvent(analytics, 'error', {
      error_code: errorCode,
      error_message: errorMessage,
      location: location
    });
  }
}

/**
 * 사용자 세션 시작 로깅
 */
export function logSessionStart() {
  if (analytics) {
    logEvent(analytics, 'session_start');
  }
}

/**
 * 사용자 세션 종료 로깅
 * @param sessionDuration - 세션 지속 시간 (초)
 */
export function logSessionEnd(sessionDuration: number) {
  if (analytics) {
    logEvent(analytics, 'session_end', {
      session_duration: sessionDuration
    });
  }
} 