// AI 심리상담 시스템 API 라우트들

import { NextRequest, NextResponse } from 'next/server';
import { AssessmentService, ClientService, RiskSignalService, SessionService, GoalService, AiChatService, DashboardService, SystemService, NotificationService } from '@/lib/database/ai-counseling-db';
import { CreateAssessmentProgramRequest, SubmitAssessmentAnswerRequest, CreateRiskSignalRequest, CreateCounselingGoalRequest, CreateCounselingSessionRequest, SendAiChatMessageRequest } from '@/types/ai-counseling';

// 심리검사 프로그램 API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_assessment_program':
        const program = await AssessmentService.createAssessmentProgram(data as CreateAssessmentProgramRequest);
        return NextResponse.json({ success: true, data: program });

      case 'submit_answer':
        const answer = await AssessmentService.submitAnswer(data as SubmitAssessmentAnswerRequest);
        return NextResponse.json({ success: true, data: answer });

      case 'calculate_results':
        await AssessmentService.calculateAssessmentResults(data.programId);
        const results = await AssessmentService.getAssessmentResults(data.programId);
        return NextResponse.json({ success: true, data: results });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assessment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    switch (action) {
      case 'get_program':
        if (!id) return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
        const program = await AssessmentService.getAssessmentProgram(parseInt(id));
        return NextResponse.json({ success: true, data: program });

      case 'get_questions':
        if (!id) return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
        const questions = await AssessmentService.getAssessmentQuestions(parseInt(id));
        return NextResponse.json({ success: true, data: questions });

      case 'get_results':
        if (!id) return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
        const results = await AssessmentService.getAssessmentResults(parseInt(id));
        return NextResponse.json({ success: true, data: results });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Assessment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
