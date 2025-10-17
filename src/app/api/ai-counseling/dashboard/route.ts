// 상담사 대시보드 API

import { NextRequest, NextResponse } from 'next/server';
import { DashboardService, ClientService, SessionService, GoalService, RiskSignalService } from '@/lib/database/ai-counseling-db';
import { ClientSearchFilters, SessionFilters } from '@/types/ai-counseling';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const counselorId = searchParams.get('counselor_id');

    switch (action) {
      case 'overview':
        const overview = await DashboardService.getOverview();
        return NextResponse.json({ success: true, data: overview });

      case 'counselor_dashboard':
        if (!counselorId) return NextResponse.json({ error: 'Counselor ID required' }, { status: 400 });
        const dashboard = await DashboardService.getCounselorDashboard(parseInt(counselorId));
        return NextResponse.json({ success: true, data: dashboard });

      case 'clients':
        if (!counselorId) return NextResponse.json({ error: 'Counselor ID required' }, { status: 400 });
        
        const clientFilters: ClientSearchFilters = {};
        if (searchParams.get('status')) clientFilters.status = searchParams.get('status') as any;
        if (searchParams.get('risk_level')) clientFilters.risk_level = searchParams.get('risk_level') as any;
        if (searchParams.get('search')) clientFilters.search_term = searchParams.get('search');

        const clients = await ClientService.getClientsByCounselor(parseInt(counselorId), clientFilters);
        return NextResponse.json({ success: true, data: clients });

      case 'sessions':
        const sessionFilters: SessionFilters = {};
        if (searchParams.get('status')) sessionFilters.status = searchParams.get('status') as any;
        if (searchParams.get('client_id')) sessionFilters.client_id = parseInt(searchParams.get('client_id')!);
        if (searchParams.get('date_from')) sessionFilters.date_from = new Date(searchParams.get('date_from')!);
        if (searchParams.get('date_to')) sessionFilters.date_to = new Date(searchParams.get('date_to')!);
        
        if (counselorId) sessionFilters.counselor_id = parseInt(counselorId);

        const sessions = await SessionService.getSessions(sessionFilters);
        return NextResponse.json({ success: true, data: sessions });

      case 'risk_signals':
        const riskSignals = await RiskSignalService.getRiskSignals({
          severity: searchParams.get('severity') as any,
          status: searchParams.get('status') as any
        });
        return NextResponse.json({ success: true, data: riskSignals });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'update_session_status':
        const session = await SessionService.updateSessionStatus(data.sessionId, data.status, data.notes);
        return NextResponse.json({ success: true, data: session });

      case 'create_session':
        const newSession = await SessionService.createSession(data);
        return NextResponse.json({ success: true, data: newSession });

      case 'create_goal':
        const goal = await GoalService.createGoal(data);
        return NextResponse.json({ success: true, data: goal });

      case 'update_goal_progress':
        const updatedGoal = await GoalService.updateGoalProgress(data.goalId, data.completedSessions, data.progressNotes);
        return NextResponse.json({ success: true, data: updatedGoal });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
