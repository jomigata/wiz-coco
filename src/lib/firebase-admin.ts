// Firebase Admin SDK 설정
// 서버 사이드에서 Firebase 서비스를 사용하기 위한 설정

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as path from 'path';
import * as fs from 'fs';

// 환경 변수에서 Firebase Admin SDK 설정 로드
const getFirebaseAdminConfig = () => {
  // 정적 배포 환경에서는 기본 설정 사용
  if (process.env.NODE_ENV === 'production' && process.env.SKIP_DB_INIT === 'true') {
    console.warn('⚠️ 정적 배포 환경에서 기본 Firebase Admin 설정을 사용합니다.');
    return {
      type: 'service_account',
      project_id: 'wiz-coco',
      private_key_id: '69c4c2375c4522bf1631300a09c1001bbbcc802a',
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\nOq2/9B0uUSZtBKpzCOyRTyGh4a/Po/9F8u3nhycu4rTR81MfYEc6q6OSHg5xla38\nB8UBJmmNWeYDbr6PCeptbCZ+kq+NOJQvBl9lMnvmqAAxcMou7GDRbcud5lErdsIs\nSwpqX1FowrTClfUlqX9S8KZRJqKGaPjnaZCcizC8mx5AEnPYvo8KHCtIdgGQc/z/\ngojVCQMxDpbvSHYEDUBp7ZVMB4sMQa0WryW2LOsc8g6ziWFFv2fRqvXJ2grxgQ/D\nhw7XNTedbA9R0C0TmGgaaWN8045xgR3Q+8nrO06JI7m3Kd5cs4VDFaBkoF0+CQwX\nbmdtpSN1AgMBAAECggEAA6L57TOaSJ987UICgjvESVmzFiAecCnc/im2gu5Wed+p\nNNMP922wKcySidzE1zTkY5FWd64lq7OeI8Kp0Am/uLHYDHyNEPqo+QQv/fgbZNmK\nwxClwK2hdYv65PQyfYxtj8c5L3RoWB/YLyoDulqumQIElCBtDxcSlqiBG8tVCqDs\nnzUEfUUWlW+xfaRqDWtlEOV04zRjV2/AV7/L+SAcYGm6q+l76fWdaGVPPNrkTJvd\n4DoZjm+KyBcx9r9Csn5QeZwqvQUOVPGffeHHBZkpUyjGiNxvcSI0d8/XhN8gzGUi\nJ7Amvwy9ZDkLQoIzUx9m1aVDH89w60UHv8NXulDogQKBgQDiU04WN+2Xnvr9K5e6\nq6dCJ++93JDHeCPV+gsGE+OcMfinR/++6Lb3P5fxEfC6Y6tKhvNTXr9FV6WmeAGT\np668+W9Wavkvn5WDhhXtg/W3jrl+w4tcqE2WT4hAulpIrsY/Zn1AVK+IdWg4vX3E\n2yap1N+USPakfpLROx+XporZMQKBgQDZway0O8JvpnXA2wNDwa1TcL9KIZpB/TR9\nJbJLjxY0BNqSQsEZps7D/lkGn2MWPdocPDKPpV2uHjiLZeACMRZB0D4ILA0+KdAp\nf8OoRzdzlYAsIiBbd8W7dMrw+9N/wlSaa6vwu3XDZYeAPZwBPtCxB6As+M5g7I0t\n4DfByXPdhQKBgGvjPEEZLhht/8V5511kAFpoAT/nidica7DP/jtKdeD6bUcI6mAO\nPVIFrZ+MZs3jPz9Kr2mZq+IZUuzVHiNN9t08ppdybREHqNVGsONFWXfEAKbt/lwQ\nGtRBW3lHnEwzjGuipqho9jg9h44svmx976Nbx6y/T1vAvqog3gGDsYKxAoGACLLd\n7U091Sv3JD8bgEdqXxzv50w0V1KAGEe7OZ17q5RODu2vvRCWzemJMOSJFshdwCb/\ndhGLDnuSkq79JdlEJFjnQXhRBxywfhfmfwBpTKq6Ngke9chxE630tW+54S6oJosK\nkVFLwQR7Rzou0zXpLEk7stA1nlWUxjJgx9L+V+kCgYEAyspnUVJRX7HnNCVcqxnB\n0WDhnmDeXw6FtEPxhT1mrpQXPk3LZmzxzJHON00mgpvrUyufad3C/j6c/afwLy9D\nlGaKFkRn4zrATN3AT0atcMeUdHiqZ2PPf3DpwhTjArUZ8wVmDEO6Bymf7cRD+5G/\nlnTKnBm1sJ9gURJnYcPAgEc=\n-----END PRIVATE KEY-----\n',
      client_email: 'firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com',
      client_id: '114963538509418531170',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com',
      universe_domain: 'googleapis.com'
    };
  }

  // 환경 변수가 설정되어 있으면 사용
  if (process.env.FIREBASE_ADMIN_PROJECT_ID) {
    return {
      type: 'service_account',
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
      private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
      auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
      universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN || 'googleapis.com'
    };
  }
  
  // 개발 환경에서 서비스 계정 파일 사용
  if (process.env.NODE_ENV === 'development') {
    try {
      const serviceAccountPath = path.join(process.cwd(), 'Firebase_GitHub', 'wiz-coco-firebase-adminsdk-fbsvc-69c4c2375c.json');
      console.log('🔧 개발 환경에서 서비스 계정 파일 사용:', serviceAccountPath);
      
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        console.log('✅ 서비스 계정 파일 로드 성공');
        return serviceAccount;
      } else {
        console.warn('⚠️ 서비스 계정 파일을 찾을 수 없어 기본 설정을 사용합니다.');
        return {
          type: 'service_account',
          project_id: 'wiz-coco',
          private_key_id: '69c4c2375c4522bf1631300a09c1001bbbcc802a',
          private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDAg9auBAd9rZs+\nOq2/9B0uUSZtBKpzCOyRTyGh4a/Po/9F8u3nhycu4rTR81MfYEc6q6OSHg5xla38\nB8UBJmmNWeYDbr6PCeptbCZ+kq+NOJQvBl9lMnvmqAAxcMou7GDRbcud5lErdsIs\nSwpqX1FowrTClfUlqX9S8KZRJqKGaPjnaZCcizC8mx5AEnPYvo8KHCtIdgGQc/z/\ngojVCQMxDpbvSHYEDUBp7ZVMB4sMQa0WryW2LOsc8g6ziWFFv2fRqvXJ2grxgQ/D\nhw7XNTedbA9R0C0TmGgaaWN8045xgR3Q+8nrO06JI7m3Kd5cs4VDFaBkoF0+CQwX\nbmdtpSN1AgMBAAECggEAA6L57TOaSJ987UICgjvESVmzFiAecCnc/im2gu5Wed+p\nNNMP922wKcySidzE1zTkY5FWd64lq7OeI8Kp0Am/uLHYDHyNEPqo+QQv/fgbZNmK\nwxClwK2hdYv65PQyfYxtj8c5L3RoWB/YLyoDulqumQIElCBtDxcSlqiBG8tVCqDs\nnzUEfUUWlW+xfaRqDWtlEOV04zRjV2/AV7/L+SAcYGm6q+l76fWdaGVPPNrkTJvd\n4DoZjm+KyBcx9r9Csn5QeZwqvQUOVPGffeHHBZkpUyjGiNxvcSI0d8/XhN8gzGUi\nJ7Amvwy9ZDkLQoIzUx9m1aVDH89w60UHv8NXulDogQKBgQDiU04WN+2Xnvr9K5e6\nq6dCJ++93JDHeCPV+gsGE+OcMfinR/++6Lb3P5fxEfC6Y6tKhvNTXr9FV6WmeAGT\np668+W9Wavkvn5WDhhXtg/W3jrl+w4tcqE2WT4hAulpIrsY/Zn1AVK+IdWg4vX3E\n2yap1N+USPakfpLROx+XporZMQKBgQDZway0O8JvpnXA2wNDwa1TcL9KIZpB/TR9\nJbJLjxY0BNqSQsEZps7D/lkGn2MWPdocPDKPpV2uHjiLZeACMRZB0D4ILA0+KdAp\nf8OoRzdzlYAsIiBbd8W7dMrw+9N/wlSaa6vwu3XDZYeAPZwBPtCxB6As+M5g7I0t\n4DfByXPdhQKBgGvjPEEZLhht/8V5511kAFpoAT/nidica7DP/jtKdeD6bUcI6mAO\nPVIFrZ+MZs3jPz9Kr2mZq+IZUuzVHiNN9t08ppdybREHqNVGsONFWXfEAKbt/lwQ\nGtRBW3lHnEwzjGuipqho9jg9h44svmx976Nbx6y/T1vAvqog3gGDsYKxAoGACLLd\n7U091Sv3JD8bgEdqXxzv50w0V1KAGEe7OZ17q5RODu2vvRCWzemJMOSJFshdwCb/\ndhGLDnuSkq79JdlEJFjnQXhRBxywfhfmfwBpTKq6Ngke9chxE630tW+54S6oJosK\nkVFLwQR7Rzou0zXpLEk7stA1nlWUxjJgx9L+V+kCgYEAyspnUVJRX7HnNCVcqxnB\n0WDhnmDeXw6FtEPxhT1mrpQXPk3LZmzxzJHON00mgpvrUyufad3C/j6c/afwLy9D\nlGaKFkRn4zrATN3AT0atcMeUdHiqZ2PPf3DpwhTjArUZ8wVmDEO6Bymf7cRD+5G/\nlnTKnBm1sJ9gURJnYcPAgEc=\n-----END PRIVATE KEY-----\n',
          client_email: 'firebase-adminsdk-fbsvc@wiz-coco.iam.gserviceaccount.com',
          client_id: '114963538509418531170',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40wiz-coco.iam.gserviceaccount.com',
          universe_domain: 'googleapis.com'
        };
      }
    } catch (error) {
      console.error('❌ 서비스 계정 파일 로드 실패:', error);
      throw new Error('Firebase Admin SDK 설정을 로드할 수 없습니다.');
    }
  }
  
  throw new Error('Firebase Admin SDK 설정이 필요합니다. 환경 변수를 설정하거나 개발 환경에서 실행하세요.');
};

// Firebase Admin 앱 초기화 (중복 방지)
let adminApp;
try {
  const firebaseAdminConfig = getFirebaseAdminConfig();
  adminApp = !getApps().length 
    ? initializeApp({
        credential: cert(firebaseAdminConfig as any),
        storageBucket: 'wiz-coco.firebasestorage.app',
      })
    : getApps()[0];
  console.log('✅ Firebase Admin SDK 초기화 성공');
} catch (error) {
  console.error('❌ Firebase Admin SDK 초기화 실패:', error);
  // 모든 환경에서 null로 설정하여 앱이 계속 작동하도록 함
  adminApp = null;
}

// Firebase Admin 서비스 인스턴스 (안전한 접근)
export const adminAuth = adminApp ? getAuth(adminApp) : null;
export const adminDb = adminApp ? getFirestore(adminApp) : null;
export const adminStorage = adminApp ? getStorage(adminApp) : null;

export default adminApp; 