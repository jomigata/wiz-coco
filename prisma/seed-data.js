// 샘플 데이터 생성 스크립트
const { PrismaClient } = require('../prisma/generated/client');
const crypto = require('crypto');

// 비밀번호 해시 생성 함수
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

async function seedDatabase() {
  console.log('샘플 데이터 생성 시작...');
  
  // Prisma 클라이언트 인스턴스 생성
  const prisma = new PrismaClient();
  
  try {
    // 데이터베이스 연결
    await prisma.$connect();
    console.log('데이터베이스 연결 성공');
    
    // 테이블 존재 여부 확인
    try {
      const tables = await prisma.$queryRaw`
        SELECT tablename FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
      `;
      
      console.log('현재 데이터베이스 테이블:');
      tables.forEach(table => {
        console.log(`- ${table.tablename}`);
      });
    } catch (error) {
      console.warn('테이블 목록 조회 실패:', error.message);
    }
    
    // 만약 User 테이블이 비어있다면 샘플 사용자 생성
    const userCount = await prisma.user.count();
    console.log(`현재 사용자 수: ${userCount}`);
    
    if (userCount === 0) {
      console.log('샘플 사용자 생성 중...');
      
      // 관리자 사용자를 위한 비밀번호 해시 생성
      const adminSalt = crypto.randomBytes(16).toString('hex');
      const { hash: adminHash } = hashPassword('admin123', adminSalt);
      
      // 관리자 사용자 생성
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: '관리자',
          passwordHash: adminHash,
          salt: adminSalt,
          role: 'admin'
        }
      });
      console.log('관리자 사용자 생성됨:', adminUser.id);
      
      // 일반 사용자를 위한 비밀번호 해시 생성
      const userSalt = crypto.randomBytes(16).toString('hex');
      const { hash: userHash } = hashPassword('user123', userSalt);
      
      // 일반 사용자 생성
      const regularUser = await prisma.user.create({
        data: {
          email: 'user@example.com',
          name: '일반 사용자',
          passwordHash: userHash,
          salt: userSalt,
          role: 'user'
        }
      });
      console.log('일반 사용자 생성됨:', regularUser.id);
      
      console.log('샘플 사용자 생성 완료');
    } else {
      console.log(`이미 ${userCount}명의 사용자가 존재합니다. 샘플 추가 생략`);
    }
    
    console.log('샘플 데이터 생성 완료');
  } catch (error) {
    console.error('샘플 데이터 생성 중 오류:', error);
    throw error;
  } finally {
    // 데이터베이스 연결 종료
    await prisma.$disconnect();
  }
}

// 스크립트가 직접 실행될 때만 함수 호출
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('성공적으로 샘플 데이터가 생성되었습니다.');
      process.exit(0);
    })
    .catch(error => {
      console.error('샘플 데이터 생성 실패:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase }; 