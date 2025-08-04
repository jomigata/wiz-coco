#!/usr/bin/env node

/**
 * Firebase 기반 데이터베이스 초기화 및 환경 설정 스크립트
 * Firebase Firestore 사용
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

console.log('===== Firebase 데이터베이스 설정 초기화 =====');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`작업 디렉토리: ${process.cwd()}`);

// Firebase 환경 확인
const isFirebase = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? true : false;
console.log(`Firebase 환경: ${isFirebase ? '예' : '아니오'}`);

// 데이터 디렉토리 설정 (로컬 개발용)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
console.log(`데이터 디렉토리: ${DATA_DIR}`);

// 데이터 디렉토리 확인 및 생성
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`데이터 디렉토리 생성됨: ${DATA_DIR}`);
}

// Firebase 환경 변수 설정
async function setupFirebaseConfig() {
  if (isFirebase) {
    console.log('Firebase 환경 변수 확인 중...');
    
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️  누락된 Firebase 환경 변수:', missingVars);
      console.log('Firebase 콘솔에서 환경 변수를 설정해주세요.');
      return false;
    }
    
    console.log('✅ Firebase 환경 변수 설정 완료');
    return true;
  } else {
    console.log('개발 환경: Firebase 환경 변수가 설정되지 않았습니다.');
    console.log('Firebase 기능을 사용하려면 .env 파일에 Firebase 설정을 추가하세요.');
    return false;
  }
}

// .env 파일 업데이트
function updateEnvFile(key, value) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  // 기존 .env 파일 읽기
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // 환경 변수 업데이트 또는 추가
  const lines = envContent.split('\n');
  let found = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }
  
  if (!found) {
    lines.push(`${key}=${value}`);
  }
  
  // .env 파일 쓰기
  fs.writeFileSync(envPath, lines.join('\n'));
  console.log(`✅ .env 파일 업데이트: ${key}=${key.includes('KEY') || key.includes('SECRET') ? '***' : value}`);
}

// Firebase 설정 파일 생성
function createFirebaseConfig() {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase.json');
  
  if (!fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = {
      "hosting": {
        "public": "out",
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
    };
    
    fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2));
    console.log('✅ firebase.json 파일 생성됨');
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('\n===== Firebase 설정 시작 =====');
    
    // Firebase 환경 변수 설정
    const firebaseConfigured = await setupFirebaseConfig();
    
    if (firebaseConfigured) {
      // Firebase 설정 파일 생성
      createFirebaseConfig();
      
      console.log('\n✅ Firebase 설정 완료');
      console.log('Firebase Hosting으로 배포할 준비가 되었습니다.');
    } else {
      console.log('\n⚠️  Firebase 설정이 완료되지 않았습니다.');
      console.log('개발 환경에서는 계속 진행할 수 있습니다.');
    }
    
    console.log('\n===== 설정 완료 =====');
    
  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
} 