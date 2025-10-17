// AI 채팅 상담 API

import { NextRequest, NextResponse } from 'next/server';
import { AiChatService, RiskSignalService, NotificationService } from '@/lib/database/ai-counseling-db';
import { SendAiChatMessageRequest } from '@/types/ai-counseling';

// AI 응답 생성 함수 (실제로는 AI 모델 API 호출)
async function generateAiResponse(message: string, clientId: number, sessionType: string): Promise<string> {
  // 실제 구현에서는 OpenAI, Claude, 또는 다른 AI 모델 API를 호출
  // 여기서는 간단한 규칙 기반 응답을 생성
  
  const lowerMessage = message.toLowerCase();
  
  // 위험 신호 감지
  if (lowerMessage.includes('자살') || lowerMessage.includes('죽고 싶') || lowerMessage.includes('끝내고 싶')) {
    // 긴급 위험신호 생성
    await RiskSignalService.createRiskSignal({
      client_id: clientId,
      signal_type: 'suicidal',
      severity: 'critical',
      confidence: 90,
      message: '자살 관련 언급이 감지되었습니다.',
      evidence: { message: message, keywords: ['자살', '죽고 싶', '끝내고 싶'] },
      source: 'ai-analysis'
    });
    
    return "지금 말씀하신 내용이 걱정됩니다. 혼자서 견디기 어려운 상황이시군요. 전문가의 도움이 필요할 것 같습니다. 즉시 상담사에게 연락하시거나 응급실을 방문하시는 것을 권합니다. 당신은 혼자가 아닙니다.";
  }
  
  if (lowerMessage.includes('우울') || lowerMessage.includes('힘들') || lowerMessage.includes('무기력')) {
    return "우울한 기분을 느끼고 계시는군요. 이런 감정은 누구나 경험할 수 있는 자연스러운 반응입니다. 혹시 최근에 특별히 스트레스를 받는 일이 있었나요? 구체적으로 어떤 부분이 가장 힘드신지 말씀해 주시면 더 도움을 드릴 수 있을 것 같습니다.";
  }
  
  if (lowerMessage.includes('불안') || lowerMessage.includes('걱정') || lowerMessage.includes('초조')) {
    return "불안한 마음이 드시는군요. 불안감은 미래에 대한 걱정에서 오는 경우가 많습니다. 현재 이 순간에 집중해보시는 것은 어떨까요? 깊게 숨을 들이마시고 천천히 내쉬어보세요. 어떤 상황이 가장 걱정되시는지 구체적으로 말씀해 주시면 함께 해결 방법을 찾아보겠습니다.";
  }
  
  if (lowerMessage.includes('관계') || lowerMessage.includes('사람') || lowerMessage.includes('친구')) {
    return "인간관계로 인한 어려움을 겪고 계시는군요. 관계는 우리 삶에서 중요한 부분이지만 때로는 복잡하고 어려울 수 있습니다. 어떤 관계에서 어려움을 겪고 계신지, 그리고 그 관계가 당신에게 어떤 영향을 미치고 있는지 말씀해 주시면 더 구체적인 조언을 드릴 수 있습니다.";
  }
  
  // 일반적인 응답
  const responses = [
    "말씀해 주신 내용을 잘 듣고 있습니다. 더 자세히 설명해 주시면 더 나은 도움을 드릴 수 있을 것 같습니다.",
    "지금의 감정을 표현해 주셔서 감사합니다. 어떤 부분이 가장 힘드신지 구체적으로 말씀해 주시겠어요?",
    "당신의 이야기를 듣고 있습니다. 혹시 이런 상황이 얼마나 오래 지속되었는지 알려주시겠어요?",
    "지금의 상황이 쉽지 않으시겠지만, 용기를 내어 말씀해 주셔서 감사합니다. 어떤 도움이 필요하신지 말씀해 주세요."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_session':
        const session = await AiChatService.createChatSession(data.clientId, data.sessionType);
        return NextResponse.json({ success: true, data: session });

      case 'send_message':
        const messageData = data as SendAiChatMessageRequest;
        
        // 클라이언트 메시지 저장
        const clientMessage = await AiChatService.sendMessage(messageData);
        
        // AI 응답 생성
        const chatMessages = await AiChatService.getChatMessages(messageData.session_id);
        const lastMessage = chatMessages[chatMessages.length - 1];
        
        if (lastMessage && lastMessage.sender_type === 'client') {
          const aiResponse = await generateAiResponse(
            lastMessage.message_text, 
            data.clientId, 
            data.sessionType || 'general'
          );
          
          // AI 응답 저장
          const aiMessage = await AiChatService.sendMessage({
            session_id: messageData.session_id,
            sender_type: 'ai',
            message_text: aiResponse,
            message_type: 'text'
          });
          
          return NextResponse.json({ 
            success: true, 
            data: { 
              clientMessage, 
              aiMessage 
            } 
          });
        }
        
        return NextResponse.json({ success: true, data: clientMessage });

      case 'get_messages':
        const messages = await AiChatService.getChatMessages(data.sessionId);
        return NextResponse.json({ success: true, data: messages });

      case 'escalate_session':
        // 세션을 상담사에게 에스컬레이션
        const escalatedSession = await AiChatService.createChatSession(data.clientId, 'escalated');
        
        // 상담사에게 알림 생성
        await NotificationService.createNotification(
          data.counselorId,
          'risk_alert',
          'AI 채팅 세션 에스컬레이션',
          `클라이언트 ${data.clientId}의 AI 채팅 세션이 상담사 개입이 필요합니다.`,
          'high',
          'ai_chat_sessions',
          escalatedSession.id
        );
        
        return NextResponse.json({ success: true, data: escalatedSession });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const sessionId = searchParams.get('session_id');

    switch (action) {
      case 'get_messages':
        if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        const messages = await AiChatService.getChatMessages(parseInt(sessionId));
        return NextResponse.json({ success: true, data: messages });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
