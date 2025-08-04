import { Server } from 'socket.io';
import { verifyToken } from './auth';

// 웹소켓 서버 인스턴스
let io;

/**
 * 웹소켓 서버 초기화
 * @param {Object} server - HTTP 서버 인스턴스
 * @returns {Object} - Socket.IO 서버 인스턴스
 */
export function initWebSocketServer(server) {
  if (io) {
    console.log('웹소켓 서버가 이미 초기화되어 있습니다.');
    return io;
  }
  
  // Socket.IO 서버 인스턴스 생성
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socket',
  });
  
  // 연결 이벤트 처리
  io.on('connection', async (socket) => {
    console.log(`새로운 클라이언트 연결됨: ${socket.id}`);
    
    try {
      // 인증 처리
      const token = socket.handshake.auth.token;
      
      if (token) {
        try {
          // 토큰 검증
          const payload = await verifyToken(token);
          
          // 인증된 사용자 정보 소켓에 저장
          socket.user = {
            id: payload.userId,
            email: payload.email,
            role: payload.role,
          };
          
          // 인증된 사용자 룸에 조인
          socket.join(`user:${payload.userId}`);
          
          // 역할 기반 룸에 조인 (예: 'admin', 'user' 등)
          if (payload.role) {
            socket.join(`role:${payload.role}`);
          }
          
          console.log(`인증된 사용자 연결됨: ${payload.email} (${payload.userId})`);
        } catch (error) {
          console.error('웹소켓 인증 오류:', error);
          socket.emit('auth_error', { message: '인증 토큰이 유효하지 않습니다.' });
        }
      } else {
        // 익명 사용자는 public 룸에 조인
        socket.join('public');
      }
      
      // 클라이언트로부터 메시지 수신
      socket.on('message', (data) => {
        console.log(`메시지 수신: ${JSON.stringify(data)}`);
        
        // 메시지 유효성 검사
        if (!data || !data.type) {
          socket.emit('error', { message: '유효하지 않은 메시지 형식입니다.' });
          return;
        }
        
        // 권한 확인이 필요한 메시지 유형 처리
        if (['admin_broadcast', 'system_update'].includes(data.type) && 
            (!socket.user || socket.user.role !== 'admin')) {
          socket.emit('error', { message: '이 작업을 수행할 권한이 없습니다.' });
          return;
        }
        
        // 메시지 유형에 따른 처리
        switch (data.type) {
          case 'test_update':
            // 테스트 데이터 업데이트 이벤트
            if (data.testId) {
              io.to(`test:${data.testId}`).emit('test_updated', {
                testId: data.testId,
                data: data.data,
              });
            }
            break;
            
          case 'admin_broadcast':
            // 관리자 전체 메시지 브로드캐스트
            io.emit('admin_message', {
              message: data.message,
              timestamp: new Date().toISOString(),
            });
            break;
            
          case 'join_test_room':
            // 특정 테스트 룸에 참여
            if (data.testId) {
              socket.join(`test:${data.testId}`);
              socket.emit('room_joined', { room: `test:${data.testId}` });
            }
            break;
            
          default:
            // 알 수 없는 메시지 유형
            socket.emit('error', { message: '지원되지 않는 메시지 유형입니다.' });
        }
      });
      
      // 연결 종료 이벤트 처리
      socket.on('disconnect', () => {
        console.log(`클라이언트 연결 종료: ${socket.id}`);
      });
      
    } catch (error) {
      console.error('웹소켓 연결 처리 중 오류:', error);
    }
  });
  
  console.log('웹소켓 서버가 초기화되었습니다.');
  return io;
}

/**
 * 웹소켓 서버 인스턴스 가져오기
 * @returns {Object|null} - Socket.IO 서버 인스턴스 또는 null
 */
export function getWebSocketServer() {
  return io || null;
}

/**
 * 특정 사용자에게 메시지 전송
 * @param {string} userId - 사용자 ID
 * @param {string} event - 이벤트 이름
 * @param {Object} data - 전송할 데이터
 */
export function sendToUser(userId, event, data) {
  if (!io) {
    console.error('웹소켓 서버가 초기화되지 않았습니다.');
    return;
  }
  
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * 특정 역할을 가진 모든 사용자에게 메시지 전송
 * @param {string} role - 역할 (예: 'admin', 'user')
 * @param {string} event - 이벤트 이름
 * @param {Object} data - 전송할 데이터
 */
export function sendToRole(role, event, data) {
  if (!io) {
    console.error('웹소켓 서버가 초기화되지 않았습니다.');
    return;
  }
  
  io.to(`role:${role}`).emit(event, data);
}

/**
 * 특정 테스트 룸에 메시지 전송
 * @param {string} testId - 테스트 ID
 * @param {string} event - 이벤트 이름
 * @param {Object} data - 전송할 데이터
 */
export function sendToTestRoom(testId, event, data) {
  if (!io) {
    console.error('웹소켓 서버가 초기화되지 않았습니다.');
    return;
  }
  
  io.to(`test:${testId}`).emit(event, data);
}

/**
 * 모든 연결된 클라이언트에 메시지 전송
 * @param {string} event - 이벤트 이름
 * @param {Object} data - 전송할 데이터
 */
export function broadcastToAll(event, data) {
  if (!io) {
    console.error('웹소켓 서버가 초기화되지 않았습니다.');
    return;
  }
  
  io.emit(event, data);
} 