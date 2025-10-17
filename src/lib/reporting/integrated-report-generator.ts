// 통합 보고서 생성 시스템

import { AssessmentService, ClientService, SessionService, GoalService, RiskSignalService } from '@/lib/database/ai-counseling-db';
import { AssessmentResult, CounselingGoal, RiskSignal, CounselingSession, Client } from '@/types/ai-counseling';

export interface IntegratedReport {
  clientId: number;
  clientName: string;
  reportDate: Date;
  executiveSummary: string;
  assessmentResults: {
    holisticSelfCheck?: AssessmentResult[];
    focusedExploration?: AssessmentResult[];
    strengthDiscovery?: AssessmentResult[];
    counselingBlueprint?: AssessmentResult[];
  };
  riskAnalysis: {
    currentRiskLevel: string;
    riskSignals: RiskSignal[];
    riskTrend: 'improving' | 'stable' | 'worsening';
    protectiveFactors: string[];
    riskFactors: string[];
  };
  counselingProgress: {
    totalSessions: number;
    completedSessions: number;
    activeGoals: CounselingGoal[];
    completedGoals: CounselingGoal[];
    progressMetrics: Record<string, number>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  nextSteps: string[];
}

export class ReportGenerator {
  static async generateIntegratedReport(clientId: number): Promise<IntegratedReport> {
    // 클라이언트 정보 가져오기
    const client = await ClientService.getClientById(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // 모든 심리검사 결과 가져오기
    const assessmentResults = await this.getAssessmentResults(clientId);
    
    // 위험 분석 수행
    const riskAnalysis = await this.performRiskAnalysis(clientId);
    
    // 상담 진행 상황 분석
    const counselingProgress = await this.analyzeCounselingProgress(clientId);
    
    // 권장사항 생성
    const recommendations = await this.generateRecommendations(assessmentResults, riskAnalysis, counselingProgress);
    
    // 다음 단계 제안
    const nextSteps = await this.generateNextSteps(assessmentResults, riskAnalysis, counselingProgress);

    // 실행 요약 생성
    const executiveSummary = this.generateExecutiveSummary(assessmentResults, riskAnalysis, counselingProgress);

    return {
      clientId,
      clientName: client.user?.name || 'Unknown',
      reportDate: new Date(),
      executiveSummary,
      assessmentResults,
      riskAnalysis,
      counselingProgress,
      recommendations,
      nextSteps
    };
  }

  private static async getAssessmentResults(clientId: number) {
    // 모든 완료된 심리검사 프로그램의 결과를 가져옴
    const programs = await AssessmentService.getAssessmentProgram(clientId);
    const results: any = {};

    if (programs) {
      const holisticResults = await AssessmentService.getAssessmentResults(programs.id);
      results.holisticSelfCheck = holisticResults;
    }

    return results;
  }

  private static async performRiskAnalysis(clientId: number) {
    const riskSignals = await RiskSignalService.getRiskSignals({ client_id: clientId });
    const client = await ClientService.getClientById(clientId);
    
    // 위험 신호 분석
    const activeSignals = riskSignals.filter(signal => signal.status === 'active');
    const criticalSignals = activeSignals.filter(signal => signal.severity === 'critical');
    const highSignals = activeSignals.filter(signal => signal.severity === 'high');
    
    // 위험도 결정
    let currentRiskLevel = 'low';
    if (criticalSignals.length > 0) {
      currentRiskLevel = 'critical';
    } else if (highSignals.length > 0) {
      currentRiskLevel = 'high';
    } else if (activeSignals.length > 0) {
      currentRiskLevel = 'medium';
    }

    // 위험 트렌드 분석 (최근 30일 기준)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSignals = riskSignals.filter(signal => 
      new Date(signal.created_at) >= thirtyDaysAgo
    );
    
    let riskTrend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (recentSignals.length > 0) {
      const severityScores: number[] = recentSignals.map(signal => {
        switch (signal.severity) {
          case 'critical': return 4;
          case 'high': return 3;
          case 'medium': return 2;
          case 'low': return 1;
          default: return 0;
        }
      });
      
      const avgSeverity = severityScores.length > 0 
        ? severityScores.reduce((a: number, b: number) => a + b, 0) / severityScores.length 
        : 0;
      if (avgSeverity > 2.5) {
        riskTrend = 'worsening';
      } else if (avgSeverity < 1.5) {
        riskTrend = 'improving';
      }
    }

    // 위험 요인 및 보호 요인 추출
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];
    
    activeSignals.forEach(signal => {
      switch (signal.signal_type) {
        case 'suicidal':
          riskFactors.push('자살 사고');
          break;
        case 'self-harm':
          riskFactors.push('자해 행동');
          break;
        case 'depression':
          riskFactors.push('우울 증상');
          break;
        case 'anxiety':
          riskFactors.push('불안 증상');
          break;
        case 'substance':
          riskFactors.push('물질 사용');
          break;
        case 'isolation':
          riskFactors.push('사회적 고립');
          break;
        case 'aggression':
          riskFactors.push('공격성');
          break;
      }
    });

    // 보호 요인은 클라이언트의 긍정적 특성에서 추출
    protectiveFactors.push('치료 동기', '지지 체계', '과거 회복 경험');

    return {
      currentRiskLevel,
      riskSignals: activeSignals,
      riskTrend,
      protectiveFactors,
      riskFactors
    };
  }

  private static async analyzeCounselingProgress(clientId: number) {
    const sessions = await SessionService.getSessions({ client_id: clientId });
    const goals = await GoalService.getGoalsByClient(clientId);
    
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(session => session.status === 'completed').length;
    
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    
    // 진행 지표 계산
    const progressMetrics: Record<string, number> = {
      sessionCompletionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      goalCompletionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
      averageSessionDuration: completedSessions > 0 ? 
        sessions.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.duration_minutes, 0) / completedSessions : 0
    };

    return {
      totalSessions,
      completedSessions,
      activeGoals,
      completedGoals,
      progressMetrics
    };
  }

  private static async generateRecommendations(
    assessmentResults: any,
    riskAnalysis: any,
    counselingProgress: any
  ) {
    const recommendations = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    };

    // 위험도 기반 즉시 권장사항
    if (riskAnalysis.currentRiskLevel === 'critical') {
      recommendations.immediate.push('즉시 안전 계획 수립');
      recommendations.immediate.push('응급 상담 일정 조정');
      recommendations.immediate.push('가족/지지체계 연락');
    } else if (riskAnalysis.currentRiskLevel === 'high') {
      recommendations.immediate.push('위험신호 모니터링 강화');
      recommendations.immediate.push('상담 빈도 증가');
    }

    // 심리검사 결과 기반 권장사항
    if (assessmentResults.holisticSelfCheck) {
      const lowScores = assessmentResults.holisticSelfCheck.filter((result: any) => result.percentage < 60);
      lowScores.forEach((result: any) => {
        switch (result.category) {
          case 'interpersonal-relations':
            recommendations.shortTerm.push('대인관계 기술 향상 프로그램');
            break;
          case 'emotional-mental-health':
            recommendations.shortTerm.push('감정 조절 기술 훈련');
            break;
          case 'reality-life-management':
            recommendations.shortTerm.push('생활 관리 기술 향상');
            break;
        }
      });
    }

    // 상담 진행 상황 기반 권장사항
    if (counselingProgress.progressMetrics.sessionCompletionRate < 70) {
      recommendations.shortTerm.push('상담 참여도 향상 방안 모색');
    }

    if (counselingProgress.progressMetrics.goalCompletionRate < 50) {
      recommendations.longTerm.push('상담 목표 재설정 및 세분화');
    }

    // 장기적 권장사항
    recommendations.longTerm.push('자기 돌봄 기술 습득');
    recommendations.longTerm.push('사회적 지지 체계 강화');
    recommendations.longTerm.push('지속적인 심리적 성장');

    return recommendations;
  }

  private static async generateNextSteps(
    assessmentResults: any,
    riskAnalysis: any,
    counselingProgress: any
  ) {
    const nextSteps: string[] = [];

    // 위험도 기반 다음 단계
    if (riskAnalysis.currentRiskLevel === 'critical') {
      nextSteps.push('24시간 내 안전 계획 수립 완료');
      nextSteps.push('응급 상담 일정 확정');
      nextSteps.push('가족/지지체계와 연락 완료');
    } else if (riskAnalysis.currentRiskLevel === 'high') {
      nextSteps.push('위험신호 모니터링 시스템 설정');
      nextSteps.push('상담 빈도 조정');
    }

    // 상담 목표 기반 다음 단계
    counselingProgress.activeGoals.forEach((goal: any) => {
      nextSteps.push(`${goal.title} 목표 달성을 위한 구체적 계획 수립`);
    });

    // 일반적인 다음 단계
    nextSteps.push('다음 상담 일정 확정');
    nextSteps.push('과제 및 활동 계획 수립');
    nextSteps.push('진행 상황 모니터링 계획');

    return nextSteps;
  }

  private static generateExecutiveSummary(
    assessmentResults: any,
    riskAnalysis: any,
    counselingProgress: any
  ): string {
    let summary = `현재 위험도는 ${riskAnalysis.currentRiskLevel} 수준이며, `;
    
    if (riskAnalysis.riskTrend === 'improving') {
      summary += '전반적으로 개선되고 있는 추세입니다. ';
    } else if (riskAnalysis.riskTrend === 'worsening') {
      summary += '악화되고 있는 추세로 주의가 필요합니다. ';
    } else {
      summary += '안정적인 상태를 유지하고 있습니다. ';
    }

    summary += `총 ${counselingProgress.totalSessions}회의 상담 중 ${counselingProgress.completedSessions}회가 완료되었으며, `;
    summary += `활성 목표 ${counselingProgress.activeGoals.length}개와 완료된 목표 ${counselingProgress.completedGoals.length}개가 있습니다. `;

    if (riskAnalysis.currentRiskLevel === 'critical' || riskAnalysis.currentRiskLevel === 'high') {
      summary += '즉시 개입이 필요한 상황으로 판단됩니다.';
    } else {
      summary += '지속적인 모니터링과 지원이 필요한 상황입니다.';
    }

    return summary;
  }

  // 보고서를 PDF로 내보내기 (실제 구현에서는 PDF 생성 라이브러리 사용)
  static async exportToPDF(report: IntegratedReport): Promise<Buffer> {
    // 실제 구현에서는 jsPDF, Puppeteer 등을 사용하여 PDF 생성
    const reportContent = `
      AI 심리상담 시스템 통합 보고서
      
      클라이언트: ${report.clientName}
      보고서 생성일: ${report.reportDate.toLocaleDateString()}
      
      실행 요약:
      ${report.executiveSummary}
      
      위험 분석:
      - 현재 위험도: ${report.riskAnalysis.currentRiskLevel}
      - 위험 트렌드: ${report.riskAnalysis.riskTrend}
      - 활성 위험신호: ${report.riskAnalysis.riskSignals.length}개
      
      상담 진행 상황:
      - 총 상담 세션: ${report.counselingProgress.totalSessions}회
      - 완료된 세션: ${report.counselingProgress.completedSessions}회
      - 활성 목표: ${report.counselingProgress.activeGoals.length}개
      
      권장사항:
      즉시 조치: ${report.recommendations.immediate.join(', ')}
      단기 목표: ${report.recommendations.shortTerm.join(', ')}
      장기 목표: ${report.recommendations.longTerm.join(', ')}
      
      다음 단계:
      ${report.nextSteps.map(step => `- ${step}`).join('\n')}
    `;

    // 실제로는 PDF 생성 라이브러리를 사용
    return Buffer.from(reportContent, 'utf-8');
  }

  // 보고서를 JSON으로 내보내기
  static async exportToJSON(report: IntegratedReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }
}

export default ReportGenerator;
