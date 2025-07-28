// Firebase 기반 전환으로 인해 Prisma는 더 이상 사용하지 않음
// 빌드 오류 방지를 위한 더미 클라이언트

export const prisma = {
  user: {
    findUnique: async (params?: any) => ({ 
      id: 'dummy', 
      email: 'dummy@test.com', 
      role: 'user', 
      name: 'Dummy User',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      mbti: null,
      testResults: [],
      passwordHash: 'dummy-hash',
      salt: 'dummy-salt'
    }),
    findFirst: async (params?: any) => ({ 
      id: 'dummy', 
      email: 'dummy@test.com', 
      role: 'user', 
      name: 'Dummy User',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      mbti: null,
      testResults: [],
      passwordHash: 'dummy-hash',
      salt: 'dummy-salt'
    }),
    findMany: async (params?: any) => [],
    create: async (params?: any) => ({ 
      id: 'dummy', 
      email: 'dummy@test.com', 
      role: 'user', 
      name: 'Dummy User',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      mbti: null,
      testResults: [],
      passwordHash: 'dummy-hash',
      salt: 'dummy-salt'
    }),
    update: async (params?: any) => ({ 
      id: 'dummy', 
      email: 'dummy@test.com', 
      role: 'user', 
      name: 'Dummy User',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      mbti: null,
      testResults: [],
      passwordHash: 'dummy-hash',
      salt: 'dummy-salt'
    }),
    delete: async (params?: any) => ({ 
      id: 'dummy', 
      email: 'dummy@test.com', 
      role: 'user', 
      name: 'Dummy User',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      mbti: null,
      testResults: [],
      passwordHash: 'dummy-hash',
      salt: 'dummy-salt'
    }),
    deleteMany: async (params?: any) => ({ count: 0 }),
    count: async (params?: any) => 0
  },
  testResult: {
    findUnique: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      testType: 'mbti',
      createdAt: new Date(),
      userId: 'dummy',
      data: {},
      testData: null,
      mbtiType: null,
      clientInfo: null
    }),
    findFirst: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      testType: 'mbti',
      createdAt: new Date(),
      userId: 'dummy',
      data: {},
      testData: null,
      mbtiType: null,
      clientInfo: null
    }),
    findMany: async (params?: any) => [],
    create: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      testType: 'mbti',
      createdAt: new Date(),
      userId: 'dummy',
      data: {},
      testData: null,
      mbtiType: null,
      clientInfo: null
    }),
    update: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      testType: 'mbti',
      createdAt: new Date(),
      userId: 'dummy',
      data: {},
      testData: null,
      mbtiType: null,
      clientInfo: null
    }),
    delete: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      testType: 'mbti',
      createdAt: new Date(),
      userId: 'dummy',
      data: {},
      testData: null,
      mbtiType: null,
      clientInfo: null
    }),
    deleteMany: async (params?: any) => ({ count: 0 }),
    count: async (params?: any) => 0
  },
  verificationCode: {
    findUnique: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      email: 'dummy@test.com',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      createdAt: new Date()
    }),
    findFirst: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      email: 'dummy@test.com',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      createdAt: new Date()
    }),
    findMany: async (params?: any) => [],
    create: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      email: 'dummy@test.com',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      createdAt: new Date()
    }),
    update: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      email: 'dummy@test.com',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      createdAt: new Date()
    }),
    delete: async (params?: any) => ({ 
      id: 'dummy', 
      code: 'dummy', 
      email: 'dummy@test.com',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      createdAt: new Date()
    }),
    deleteMany: async (params?: any) => ({ count: 0 }),
    count: async (params?: any) => 0
  },
  userToken: {
    findUnique: async (params?: any) => ({ 
      id: 'dummy', 
      token: 'dummy-token', 
      userId: 'dummy',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      user: {
        id: 'dummy',
        email: 'dummy@test.com',
        role: 'user',
        name: 'Dummy User',
        passwordHash: 'dummy-hash',
        salt: 'dummy-salt'
      }
    }),
    findFirst: async (params?: any) => ({ 
      id: 'dummy', 
      token: 'dummy-token', 
      userId: 'dummy',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      user: {
        id: 'dummy',
        email: 'dummy@test.com',
        role: 'user',
        name: 'Dummy User',
        passwordHash: 'dummy-hash',
        salt: 'dummy-salt'
      }
    }),
    findMany: async (params?: any) => [],
    create: async (params?: any) => ({ 
      id: 'dummy', 
      token: 'dummy-token', 
      userId: 'dummy',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      user: {
        id: 'dummy',
        email: 'dummy@test.com',
        role: 'user',
        name: 'Dummy User',
        passwordHash: 'dummy-hash',
        salt: 'dummy-salt'
      }
    }),
    update: async (params?: any) => ({ 
      id: 'dummy', 
      token: 'dummy-token', 
      userId: 'dummy',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      user: {
        id: 'dummy',
        email: 'dummy@test.com',
        role: 'user',
        name: 'Dummy User',
        passwordHash: 'dummy-hash',
        salt: 'dummy-salt'
      }
    }),
    delete: async (params?: any) => ({ 
      id: 'dummy', 
      token: 'dummy-token', 
      userId: 'dummy',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후
      user: {
        id: 'dummy',
        email: 'dummy@test.com',
        role: 'user',
        name: 'Dummy User',
        passwordHash: 'dummy-hash',
        salt: 'dummy-salt'
      }
    }),
    deleteMany: async (params?: any) => ({ count: 0 }),
    count: async (params?: any) => 0
  },
  mbtiRelationship: {
    findUnique: async (params?: any) => ({ 
      id: 'dummy', 
      resultCode: 'dummy', 
      person1Id: 'dummy',
      person2Id: 'dummy',
      person1Name: 'Dummy Person 1',
      person2Name: 'Dummy Person 2',
      compatibility: 85,
      createdAt: new Date()
    }),
    findFirst: async (params?: any) => ({ 
      id: 'dummy', 
      resultCode: 'dummy', 
      person1Id: 'dummy',
      person2Id: 'dummy',
      person1Name: 'Dummy Person 1',
      person2Name: 'Dummy Person 2',
      compatibility: 85,
      createdAt: new Date()
    }),
    findMany: async (params?: any) => [],
    create: async (params?: any) => ({ 
      id: 'dummy', 
      resultCode: 'dummy', 
      person1Id: 'dummy',
      person2Id: 'dummy',
      person1Name: 'Dummy Person 1',
      person2Name: 'Dummy Person 2',
      compatibility: 85,
      createdAt: new Date()
    }),
    update: async (params?: any) => ({ 
      id: 'dummy', 
      resultCode: 'dummy', 
      person1Id: 'dummy',
      person2Id: 'dummy',
      person1Name: 'Dummy Person 1',
      person2Name: 'Dummy Person 2',
      compatibility: 85,
      createdAt: new Date()
    }),
    delete: async (params?: any) => ({ 
      id: 'dummy', 
      resultCode: 'dummy', 
      person1Id: 'dummy',
      person2Id: 'dummy',
      person1Name: 'Dummy Person 1',
      person2Name: 'Dummy Person 2',
      compatibility: 85,
      createdAt: new Date()
    }),
    deleteMany: async (params?: any) => ({ count: 0 }),
    count: async (params?: any) => 0
  },
  $transaction: async (callback: any) => {
    console.warn('[Prisma] 더미 트랜잭션 실행됨');
    return [];
  },
  $queryRaw: async (query?: any) => {
    console.warn('[Prisma] 더미 쿼리 실행됨');
    return [{ result: 2 }];
  },
  $connect: async () => {
    console.warn('[Prisma] 더미 연결 실행됨');
  },
  $disconnect: async () => {
    console.warn('[Prisma] 더미 연결 해제 실행됨');
  }
};

// 더미 PrismaClient 클래스
export class PrismaClient {
  constructor() {
    console.warn('[Prisma] 더미 PrismaClient 생성됨');
  }
  
  user = prisma.user;
  testResult = prisma.testResult;
  verificationCode = prisma.verificationCode;
  userToken = prisma.userToken;
  mbtiRelationship = prisma.mbtiRelationship;
  $transaction = prisma.$transaction;
  $queryRaw = prisma.$queryRaw;
  $connect = prisma.$connect;
  $disconnect = prisma.$disconnect;
}

// 더미 Prisma 네임스페이스
export const Prisma = {
  LogLevel: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    QUERY: 'query'
  }
}; 