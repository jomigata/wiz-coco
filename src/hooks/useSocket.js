import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * 웹소켓 연결을 관리하는 React hook
 * @param {Object} options - 소켓 연결 옵션
 * @returns {Object} - 소켓 인스턴스 및 유틸리티 함수
 */
export function useSocket(options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [socketError, setSocketError] = useState(null);
  const socketRef = useRef(null);
  
  // 소켓 이벤트 리스너를 위한 콜백 맵
  const listenersRef = useRef(new Map());
  
  // 웹소켓 초기화 및 연결
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 환경 변수에서 API URL 가져오기
    const host = process.env.NEXT_PUBLIC_API_URL || '';
    
    // 인증 토큰 가져오기
    const token = localStorage.getItem('auth_token');
    
    // 소켓 옵션 설정
    const socketOptions = {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...options,
    };
    
    // 소켓 인스턴스 생성
    socketRef.current = io(host, socketOptions);
    
    // 소켓 기본 이벤트 핸들러 등록
    socketRef.current.on('connect', () => {
      console.log(`웹소켓 연결됨: ${socketRef.current.id}`);
      setIsConnected(true);
      setSocketError(null);
    });
    
    socketRef.current.on('disconnect', (reason) => {
      console.log(`웹소켓 연결 해제: ${reason}`);
      setIsConnected(false);
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('웹소켓 연결 오류:', error);
      setSocketError(error.message);
    });
    
    socketRef.current.on('auth_error', (error) => {
      console.error('웹소켓 인증 오류:', error);
      setSocketError(error.message);
    });
    
    socketRef.current.on('error', (error) => {
      console.error('웹소켓 오류:', error);
      setSocketError(error.message);
    });
    
    // 모든 메시지를 lastMessage 상태에 저장
    socketRef.current.onAny((event, ...args) => {
      setLastMessage({ event, data: args[0], timestamp: new Date() });
      
      // 등록된 이벤트 리스너 호출
      if (listenersRef.current.has(event)) {
        listenersRef.current.get(event).forEach(callback => {
          callback(...args);
        });
      }
    });
    
    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      if (socketRef.current) {
        console.log('웹소켓 연결 정리 중...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // 의존성 배열 비움 - 컴포넌트 마운트 시 한 번만 실행
  
  // 메시지 전송 함수
  const sendMessage = useCallback((type, data) => {
    if (!socketRef.current || !isConnected) {
      console.error('웹소켓이 연결되지 않았습니다.');
      return false;
    }
    
    socketRef.current.emit('message', { type, ...data });
    return true;
  }, [isConnected]);
  
  // 특정 이벤트에 대한 리스너 등록
  const addEventListener = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);
    
    // 정리 함수 반환
    return () => {
      if (listenersRef.current.has(event)) {
        listenersRef.current.get(event).delete(callback);
      }
    };
  }, []);
  
  // 특정 이벤트에 대한 모든 리스너 제거
  const removeAllEventListeners = useCallback((event) => {
    if (listenersRef.current.has(event)) {
      listenersRef.current.delete(event);
    }
  }, []);
  
  // 특정 룸 참여
  const joinRoom = useCallback((roomId) => {
    if (!socketRef.current || !isConnected) {
      console.error('웹소켓이 연결되지 않았습니다.');
      return false;
    }
    
    sendMessage('join_room', { roomId });
    return true;
  }, [isConnected, sendMessage]);
  
  // 특정 테스트 룸 참여
  const joinTestRoom = useCallback((testId) => {
    if (!socketRef.current || !isConnected) {
      console.error('웹소켓이 연결되지 않았습니다.');
      return false;
    }
    
    sendMessage('join_test_room', { testId });
    return true;
  }, [isConnected, sendMessage]);
  
  // 소켓 수동 연결/재연결
  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);
  
  // 소켓 수동 연결 해제
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);
  
  // 반환값: 소켓 상태와 유틸리티 함수
  return {
    socket: socketRef.current,
    isConnected,
    lastMessage,
    error: socketError,
    sendMessage,
    addEventListener,
    removeAllEventListeners,
    joinRoom,
    joinTestRoom,
    connect,
    disconnect,
  };
}

export default useSocket; 