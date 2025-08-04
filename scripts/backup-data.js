// Firebase 기반 데이터 백업 스크립트 (로컬 개발용)
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 환경 변수 로드
try {
  dotenv.config();
  console.log('환경 변수 파일 로드됨');
} catch (err) {
  console.log('환경 변수 파일 로드 실패:', err.message);
}

// Firebase 환경 확인
const isFirebase = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? true : false;
console.log(`Firebase 환경: ${isFirebase ? '예' : '아니오'}`);

// 데이터 디렉토리 설정 (로컬 개발용)
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// 백업 함수
async function backupData() {
  console.log(`===== 로컬 데이터 백업 시작 =====`);
  
  // Firebase 환경에서는 로컬 백업이 필요하지 않음
  if (isFirebase) {
    console.log('Firebase 환경에서는 로컬 데이터 백업이 필요하지 않습니다.');
    console.log('Firestore 데이터는 Firebase 콘솔에서 관리됩니다.');
    return;
  }
  
  console.log(`소스 디렉토리: ${DATA_DIR}`);
  console.log(`백업 디렉토리: ${BACKUP_DIR}`);
  
  // 백업 디렉토리 확인
  if (!fs.existsSync(BACKUP_DIR)) {
    try {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log(`백업 디렉토리 생성됨: ${BACKUP_DIR}`);
    } catch (error) {
      console.error(`백업 디렉토리 생성 실패: ${error.message}`);
      return;
    }
  }
  
  // 타임스탬프 생성
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);
  
  // 백업 디렉토리 생성
  try {
    fs.mkdirSync(backupPath, { recursive: true });
    console.log(`백업 경로 생성됨: ${backupPath}`);
  } catch (error) {
    console.error(`백업 경로 생성 실패: ${error.message}`);
    return;
  }
  
  // 데이터 디렉토리가 없으면 종료
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`로컬 데이터 디렉토리가 존재하지 않음: ${DATA_DIR}`);
    return;
  }
  
  // 파일 복사
  try {
    const files = fs.readdirSync(DATA_DIR);
    console.log(`복사할 파일 수: ${files.length}`);
    
    for (const file of files) {
      const sourcePath = path.join(DATA_DIR, file);
      const destPath = path.join(backupPath, file);
      
      // 디렉토리면 재귀적으로 복사하지 않고 스킵
      if (fs.statSync(sourcePath).isDirectory()) {
        console.log(`디렉토리 스킵: ${sourcePath}`);
        continue;
      }
      
      // 파일 복사
      fs.copyFileSync(sourcePath, destPath);
      console.log(`파일 백업 완료: ${file}`);
    }
    
    console.log(`===== 로컬 데이터 백업 완료 =====`);
    console.log(`백업 위치: ${backupPath}`);
    console.log(`백업 시간: ${new Date().toISOString()}`);
    
    // 최신 백업 경로 저장
    try {
      fs.writeFileSync(path.join(BACKUP_DIR, 'latest.txt'), backupPath, 'utf8');
      console.log(`최신 백업 경로 저장됨: ${path.join(BACKUP_DIR, 'latest.txt')}`);
    } catch (error) {
      console.warn(`최신 백업 표시 생성 실패: ${error.message}`);
    }
    
  } catch (error) {
    console.error(`백업 과정에서 오류 발생: ${error.message}`);
  }
}

// 오래된 백업 삭제 (30일 이상된 백업)
function cleanupOldBackups() {
  console.log(`===== 오래된 백업 정리 시작 =====`);
  
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log(`백업 디렉토리가 존재하지 않음: ${BACKUP_DIR}`);
    return;
  }
  
  try {
    const now = new Date();
    const dirs = fs.readdirSync(BACKUP_DIR);
    
    for (const dir of dirs) {
      // latest.txt 파일은 스킵
      if (dir === 'latest.txt') continue;
      
      const backupPath = path.join(BACKUP_DIR, dir);
      
      // 디렉토리만 처리
      if (!fs.statSync(backupPath).isDirectory()) continue;
      
      // 백업 날짜 추출 시도
      if (dir.startsWith('backup-')) {
        try {
          const dateStr = dir.replace('backup-', '').slice(0, 10); // YYYY-MM-DD 부분만 추출
          const backupDate = new Date(dateStr);
          
          // 30일 이상 지난 백업 삭제
          const daysDiff = (now - backupDate) / (1000 * 60 * 60 * 24);
          if (daysDiff > 30) {
            // 디렉토리 내 파일 삭제
            const files = fs.readdirSync(backupPath);
            for (const file of files) {
              fs.unlinkSync(path.join(backupPath, file));
            }
            
            // 디렉토리 삭제
            fs.rmdirSync(backupPath);
            console.log(`오래된 백업 삭제됨 (${Math.floor(daysDiff)}일): ${dir}`);
          }
        } catch (parseError) {
          console.warn(`백업 날짜 파싱 실패: ${dir}`);
        }
      }
    }
    
    console.log(`===== 오래된 백업 정리 완료 =====`);
  } catch (error) {
    console.error(`백업 정리 중 오류 발생: ${error.message}`);
  }
}

// 메인 함수
async function main() {
  console.log(`===== 백업 프로세스 시작 =====`);
  console.log(`시작 시간: ${new Date().toISOString()}`);
  
  // 데이터 백업
  await backupData();
  
  // 오래된 백업 정리
  cleanupOldBackups();
  
  console.log(`===== 백업 프로세스 완료 =====`);
  console.log(`완료 시간: ${new Date().toISOString()}`);
}

// 스크립트 실행
main().catch(error => {
  console.error(`백업 실패: ${error.message}`);
  process.exit(1);
}); 