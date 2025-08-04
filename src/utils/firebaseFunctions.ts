// Firebase Cloud Functions 유틸리티
// 서버리스 함수 호출 및 관리 기능 제공

import { httpsCallable, getFunctions } from 'firebase/functions';
import { initializeApp, getApps, getApp } from 'firebase/app';

// Firebase 앱 초기화 (중복 방지)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Functions 초기화
const functions = getFunctions(app);

/**
 * Cloud Function 호출
 * @param functionName - 함수 이름
 * @param data - 전달할 데이터
 * @returns Promise<any> - 함수 실행 결과
 */
export async function callCloudFunction<T = any>(functionName: string, data?: any): Promise<T> {
  try {
    const callFunction = httpsCallable(functions, functionName);
    const result = await callFunction(data);
    return result.data as T;
  } catch (error) {
    console.error(`Cloud Function 호출 실패 (${functionName}):`, error);
    throw new Error(`서버 함수 호출에 실패했습니다: ${functionName}`);
  }
}

/**
 * 테스트 결과 처리 Cloud Function
 * @param testData - 테스트 데이터
 * @returns Promise<any> - 처리 결과
 */
export async function processTestResult(testData: any): Promise<any> {
  return callCloudFunction('processTestResult', testData);
}

/**
 * 사용자 통계 업데이트 Cloud Function
 * @param userId - 사용자 ID
 * @param statsData - 통계 데이터
 * @returns Promise<any> - 업데이트 결과
 */
export async function updateUserStats(userId: string, statsData: any): Promise<any> {
  return callCloudFunction('updateUserStats', { userId, statsData });
}

/**
 * 이메일 발송 Cloud Function
 * @param emailData - 이메일 데이터
 * @returns Promise<any> - 발송 결과
 */
export async function sendEmail(emailData: {
  to: string;
  subject: string;
  body: string;
  template?: string;
}): Promise<any> {
  return callCloudFunction('sendEmail', emailData);
}

/**
 * 데이터 백업 Cloud Function
 * @param backupData - 백업 데이터
 * @returns Promise<any> - 백업 결과
 */
export async function backupData(backupData: any): Promise<any> {
  return callCloudFunction('backupData', backupData);
}

/**
 * 데이터 동기화 Cloud Function
 * @param syncData - 동기화 데이터
 * @returns Promise<any> - 동기화 결과
 */
export async function syncData(syncData: any): Promise<any> {
  return callCloudFunction('syncData', syncData);
}

/**
 * 관리자 알림 발송 Cloud Function
 * @param notificationData - 알림 데이터
 * @returns Promise<any> - 발송 결과
 */
export async function sendAdminNotification(notificationData: {
  type: string;
  message: string;
  data?: any;
}): Promise<any> {
  return callCloudFunction('sendAdminNotification', notificationData);
}

/**
 * 사용자 활동 로그 Cloud Function
 * @param activityData - 활동 데이터
 * @returns Promise<any> - 로그 저장 결과
 */
export async function logUserActivity(activityData: {
  userId: string;
  action: string;
  details?: any;
  timestamp?: Date;
}): Promise<any> {
  return callCloudFunction('logUserActivity', activityData);
}

/**
 * 데이터 정리 Cloud Function
 * @param cleanupData - 정리 데이터
 * @returns Promise<any> - 정리 결과
 */
export async function cleanupData(cleanupData: {
  type: string;
  criteria: any;
}): Promise<any> {
  return callCloudFunction('cleanupData', cleanupData);
} 