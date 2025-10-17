// 위험신호 모니터링 API

import { NextRequest, NextResponse } from 'next/server';
import { RiskSignalService, NotificationService } from '@/lib/database/ai-counseling-db';
import { CreateRiskSignalRequest, RiskSignalFilters } from '@/types/ai-counseling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_risk_signal':
        const signal = await RiskSignalService.createRiskSignal(data as CreateRiskSignalRequest);
        
        // 긴급 알림 생성
        if (data.severity === 'critical' || data.severity === 'high') {
          await NotificationService.createNotification(
            data.counselorId || 1, // 기본 상담사 ID
            'risk_alert',
            `긴급 위험신호: ${data.signal_type}`,
            data.message,
            data.severity === 'critical' ? 'urgent' : 'high',
            'risk_signals',
            signal.id
          );
        }
        
        return NextResponse.json({ success: true, data: signal });

      case 'acknowledge_signal':
        const acknowledgedSignal = await RiskSignalService.acknowledgeRiskSignal(data.signalId, data.counselorId);
        return NextResponse.json({ success: true, data: acknowledgedSignal });

      case 'resolve_signal':
        const resolvedSignal = await RiskSignalService.resolveRiskSignal(data.signalId, data.resolutionNotes);
        return NextResponse.json({ success: true, data: resolvedSignal });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Risk Signal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // 필터 파라미터 파싱
    const filters: RiskSignalFilters = {};
    if (searchParams.get('severity')) filters.severity = searchParams.get('severity') as any;
    if (searchParams.get('status')) filters.status = searchParams.get('status') as any;
    if (searchParams.get('signal_type')) filters.signal_type = searchParams.get('signal_type') as any;
    if (searchParams.get('client_id')) filters.client_id = parseInt(searchParams.get('client_id')!);

    switch (action) {
      case 'get_signals':
        const signals = await RiskSignalService.getRiskSignals(filters);
        return NextResponse.json({ success: true, data: signals });

      case 'get_critical_signals':
        const criticalSignals = await RiskSignalService.getRiskSignals({ 
          ...filters, 
          severity: 'critical', 
          status: 'active' 
        });
        return NextResponse.json({ success: true, data: criticalSignals });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Risk Signal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
