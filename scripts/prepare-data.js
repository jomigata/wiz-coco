// Firebase 기반 배포 환경을 위한 데이터 초기화 스크립트
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { execSync } = require('child_process');
const crypto = require('crypto');

// 환경 변수 로드
try {
  dotenv.config();
  console.log('환경 변수 파일 로드됨');
} catch (err) {
  console.log('환경 변수 파일 로드 실패:', err.message);
}

// 데이터 디렉토리 설정 (로컬 개발용)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
console.log(`데이터 디렉토리 설정: ${DATA_DIR}`);

// Firebase 환경 확인
const isFirebase = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? true : false;
console.log(`Firebase 환경: ${isFirebase ? '예' : '아니오'}`);

// 필요한 파일 목록 (로컬 개발용)
const requiredFiles = [
  {
    path: path.join(DATA_DIR, 'users.json'),
    defaultContent: '[]',
    description: '사용자 정보 파일 (로컬 개발용)'
  },
  // 필요한 다른 데이터 파일들 추가 가능
];

// 데이터 디렉토리 초기화 (로컬 개발용)
function initDataDirectory() {
  console.log('===== 로컬 데이터 디렉토리 초기화 시작 =====');
  
  // Firebase 환경에서는 로컬 데이터 디렉토리가 필요하지 않음
  if (isFirebase) {
    console.log('Firebase 환경에서는 로컬 데이터 디렉토리가 필요하지 않습니다.');
    console.log('Firestore를 사용하여 데이터를 관리합니다.');
    return;
  }
  
  // 데이터 디렉토리 생성 (로컬 개발용)
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`로컬 데이터 디렉토리 생성됨: ${DATA_DIR}`);
    } catch (error) {
      console.error(`로컬 데이터 디렉토리 생성 실패: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`로컬 데이터 디렉토리 이미 존재함: ${DATA_DIR}`);
  }
  
  // 필요한 파일들 초기화 (로컬 개발용)
  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      try {
        fs.writeFileSync(file.path, file.defaultContent, 'utf8');
        console.log(`${file.description} 생성됨: ${file.path}`);
      } catch (error) {
        console.error(`${file.description} 생성 실패: ${error.message}`);
      }
    } else {
      console.log(`${file.description} 이미 존재함: ${file.path}`);
      
      // 파일 내용 유효성 확인
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        JSON.parse(content); // JSON 형식 확인
        console.log(`${file.description} 내용 유효함`);
      } catch (error) {
        console.warn(`${file.description} 내용이 유효하지 않아 재설정함`);
        fs.writeFileSync(file.path, file.defaultContent, 'utf8');
      }
    }
  }
  
  console.log('===== 로컬 데이터 디렉토리 초기화 완료 =====');
}

// 환경 변수 파일 생성 (.env.local)
function createEnvFile() {
  console.log('===== 환경 변수 파일 생성 =====');
  
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = `# 자동 생성된 환경 변수 파일 (${new Date().toISOString()})
PORT=3000
NODE_ENV=production
DATA_DIR=${DATA_DIR}
API_KEY=admin-secret-key
FIREBASE_ENABLED=${isFirebase}
NEXT_PUBLIC_FIREBASE_API_KEY=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}
NEXT_PUBLIC_FIREBASE_APP_ID=${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''}
`;

  try {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`환경 변수 파일 생성됨: ${envPath}`);
  } catch (error) {
    console.error(`환경 변수 파일 생성 실패: ${error.message}`);
  }
  
  console.log('===== 환경 변수 파일 생성 완료 =====');
}

async function prepareData() {
  console.log('🔄 배포 환경 데이터베이스 준비 시작...');
  
  // 데이터 디렉토리 확인 및 생성
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  
  if (!fs.existsSync(dataDir)) {
    console.log(`📂 데이터 디렉토리 생성됨: ${dataDir}`);
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // 데이터베이스 파일 경로 업데이트 (환경 변수 또는 .env 파일)
  const envPath = path.join(process.cwd(), '.env');
  let envContent = `DATABASE_URL="file:${path.join(dataDir, 'main.db')}"\n`;
  envContent += `DATA_DIR="${dataDir}"\n`;
  
  // 관리자 계정 정보 추가
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  envContent += `ADMIN_EMAIL="${adminEmail}"\n`;
  envContent += `ADMIN_PASSWORD="${adminPassword}"\n`;
  
  fs.writeFileSync(envPath, envContent);
  console.log(`📄 환경 변수 파일 생성됨: ${envPath}`);
  console.log(envContent);
  
  try {
    // Prisma 데이터베이스 생성 및 마이그레이션
    console.log('🔄 Prisma 마이그레이션 실행...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    // Prisma 클라이언트 생성
    console.log('🔄 Prisma 클라이언트 생성...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // 데이터베이스 초기화 (사용자 생성 등)
    // Firebase 환경에서는 데이터베이스 초기화가 필요하지 않음
    if (!isFirebase) {
      const prisma = new PrismaClient();
      
      try {
        // 사용자 테이블 확인
        const userCount = await prisma.user.count();
        console.log(`👥 현재 사용자 수: ${userCount}`);
        
        // 초기 사용자 없으면 생성
        if (userCount === 0) {
          console.log('�� 초기 사용자 생성 중...');
          
          // 비밀번호 해시 생성
          const salt = crypto.randomBytes(16).toString('hex');
          const passwordHash = crypto.pbkdf2Sync(adminPassword, salt, 1000, 64, 'sha512').toString('hex');
          
          // 관리자 계정 생성
          const admin = await prisma.user.create({
            data: {
              email: adminEmail,
              name: '시스템 관리자',
              passwordHash,
              salt,
              role: 'admin',
              createdAt: new Date(),
              lastLoginAt: new Date()
            }
          });
          
          console.log(`✅ 관리자 계정 생성됨: ${admin.email}`);
          
          // 테스트 계정 생성
          const testUser = await prisma.user.create({
            data: {
              email: 'user@test.com',
              name: '테스트 사용자',
              passwordHash,
              salt,
              role: 'user',
              createdAt: new Date()
            }
          });
          
          console.log(`✅ 테스트 계정 생성됨: ${testUser.email}`);
        }
      } catch (dbError) {
        console.error('❌ 데이터베이스 초기화 중 오류:', dbError);
      } finally {
        await prisma.$disconnect();
      }
    } else {
      console.log('Firebase 환경에서는 데이터베이스 초기화가 필요하지 않습니다.');
    }
    
    // 디렉토리 권한 설정 (리눅스 환경)
    if (process.platform !== 'win32') {
      console.log(`🔐 데이터 디렉토리 권한 설정 중: ${dataDir}`);
      execSync(`chmod -R 777 ${dataDir}`, { stdio: 'inherit' });
      console.log(`🔐 데이터 디렉토리 권한 설정 완료: ${dataDir}`);
    }
    
    // 초기 사용자 목록 파일 생성
    if (!fs.existsSync(path.join(dataDir, 'users.json'))) {
      fs.writeFileSync(path.join(dataDir, 'users.json'), '[]');
      console.log(`📄 초기 사용자 파일 생성됨: ${path.join(dataDir, 'users.json')}`);
    }
    
    console.log('✅ 데이터 준비 완료');
    
  } catch (error) {
    console.error('❌ 데이터 준비 중 오류 발생:', error);
    process.exit(1);
  }
}

// 메인 실행 함수
function main() {
  console.log('===== 배포 준비 스크립트 시작 =====');
  console.log(`현재 작업 디렉토리: ${process.cwd()}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  
  // 데이터 디렉토리 초기화
  initDataDirectory();
  
  // 환경 변수 파일 생성
  createEnvFile();
  
  // 데이터베이스 준비
  prepareData();
  
  console.log('===== 배포 준비 스크립트 완료 =====');
}

// 스크립트 실행
main(); 