'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useCounselorConnection } from '@/hooks/useCounselorConnection';
import { ChatMessage } from '@/app/api/chat/route';

export default function ChatPage() {
  const { user, loading } = useFirebaseAuth();
  const { connection: counselorConnection, loading: counselorLoading } = useCounselorConnection();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 목록 조회
  const fetchMessages = async () => {
    if (!user?.uid || !counselorConnection.counselorId) return;

    try {
      const response = await fetch(
        `/api/chat?userId1=${user.uid}&userId2=${counselorConnection.counselorId}&limit=100`
      );
      const result = await response.json();
      
      if (result.success) {
        setMessages(result.data);
      } else {
        setError(result.error || '메시지 조회에 실패했습니다.');
      }
    } catch (err) {
      console.error('메시지 조회 오류:', err);
      setError('메시지 조회 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 전송
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user?.uid || !counselorConnection.counselorId) return;

    setIsSending(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.uid,
          receiverId: counselorConnection.counselorId,
          message: newMessage.trim(),
          messageType: 'text'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages(prev => [...prev, result.data]);
        setNewMessage('');
        scrollToBottom();
      } else {
        setError(result.error || '메시지 전송에 실패했습니다.');
      }
    } catch (err) {
      console.error('메시지 전송 오류:', err);
      setError('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (user && counselorConnection.isConnected) {
      fetchMessages();
    }
  }, [user, counselorConnection.isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading || counselorLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-300 text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  if (!counselorConnection.isConnected) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="pt-16 p-6">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-400 mb-2">상담사와 연결이 필요합니다</h1>
              <p className="text-gray-300 mb-4">
                채팅을 이용하려면 먼저 상담사와 연결해야 합니다.
              </p>
              <a
                href="/mypage/connect-counselor"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
              >
                상담사 연결하기
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      <div className="pt-16 h-screen flex flex-col">
        {/* 채팅 헤더 */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold">
                  {counselorConnection.counselorInfo?.name || '상담사'}
                </h2>
                <p className="text-gray-400 text-sm">온라인</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="text-gray-400 hover:text-white p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button className="text-gray-400 hover:text-white p-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">메시지를 불러오는 중...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">채팅을 시작해보세요</h3>
                <p className="text-gray-400">상담사와의 첫 메시지를 보내보세요.</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user.uid}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex items-center space-x-3">
            <button
              type="button"
              className="text-gray-400 hover:text-white p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isSending}
            />
            
            <motion.button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white p-3 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}

// 메시지 버블 컴포넌트
function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn 
          ? 'bg-emerald-600 text-white' 
          : 'bg-gray-700 text-white'
      }`}>
        <p className="text-sm">{message.message}</p>
        <p className={`text-xs mt-1 ${
          isOwn ? 'text-emerald-100' : 'text-gray-400'
        }`}>
          {formatTime(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
