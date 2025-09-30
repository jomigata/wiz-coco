import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  isRead: boolean;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  };
}

// 메시지 전송
export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, message, messageType = 'text', metadata } = await request.json();

    if (!senderId || !receiverId || !message) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 메시지 생성
    const messageData: Omit<ChatMessage, 'id'> = {
      senderId,
      receiverId,
      message,
      messageType,
      timestamp: new Date().toISOString(),
      isRead: false,
      metadata
    };

    const docRef = await addDoc(collection(db, 'chatMessages'), messageData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...messageData
      }
    });

  } catch (error) {
    console.error('메시지 전송 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 메시지 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId1 = searchParams.get('userId1');
    const userId2 = searchParams.get('userId2');
    const limitCount = parseInt(searchParams.get('limit') || '50');

    if (!userId1 || !userId2) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 두 사용자 간의 메시지 조회
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('senderId', 'in', [userId1, userId2]),
      where('receiverId', 'in', [userId1, userId2]),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(messagesQuery);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      data: messages.reverse() // 시간순으로 정렬
    });

  } catch (error) {
    console.error('메시지 조회 오류:', error);
    return NextResponse.json(
      { success: false, error: '메시지 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
