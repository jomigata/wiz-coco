// AI 심리상담 시스템 테스트 파일

import { testConnection, AssessmentService, ClientService, RiskSignalService, SessionService, GoalService } from '@/lib/database/ai-counseling-db';
import ReportGenerator from '@/lib/reporting/integrated-report-generator';

// 데이터베이스 연결 테스트
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const isConnected = await testConnection();
    console.log('Database connection test:', isConnected ? 'PASSED' : 'FAILED');
    return isConnected;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// 심리검사 프로그램 테스트
export async function testAssessmentProgram(): Promise<boolean> {
  try {
    // 테스트용 프로그램 생성
    const testProgram = await AssessmentService.createAssessmentProgram({
      client_id: 1,
      program_type: 'holistic-self-check'
    });
    
    console.log('Assessment program creation test:', testProgram ? 'PASSED' : 'FAILED');
    
    // 프로그램 조회 테스트
    const retrievedProgram = await AssessmentService.getAssessmentProgram(testProgram.id);
    console.log('Assessment program retrieval test:', retrievedProgram ? 'PASSED' : 'FAILED');
    
    return testProgram && retrievedProgram;
  } catch (error) {
    console.error('Assessment program test failed:', error);
    return false;
  }
}

// 위험신호 감지 테스트
export async function testRiskSignalDetection(): Promise<boolean> {
  try {
    // 테스트용 위험신호 생성
    const testSignal = await RiskSignalService.createRiskSignal({
      client_id: 1,
      signal_type: 'depression',
      severity: 'medium',
      confidence: 75,
      message: '테스트용 우울감 신호',
      evidence: { test: true },
      source: 'ai-analysis'
    });
    
    console.log('Risk signal creation test:', testSignal ? 'PASSED' : 'FAILED');
    
    // 위험신호 조회 테스트
    const signals = await RiskSignalService.getRiskSignals({ client_id: 1 });
    console.log('Risk signal retrieval test:', signals.length > 0 ? 'PASSED' : 'FAILED');
    
    return testSignal && signals.length > 0;
  } catch (error) {
    console.error('Risk signal detection test failed:', error);
    return false;
  }
}

// 상담 세션 테스트
export async function testCounselingSession(): Promise<boolean> {
  try {
    // 테스트용 상담 세션 생성
    const testSession = await SessionService.createSession({
      client_id: 1,
      counselor_id: 1,
      session_date: new Date(),
      session_time: '14:00',
      duration_minutes: 50,
      session_type: 'individual',
      modality: 'in-person'
    });
    
    console.log('Counseling session creation test:', testSession ? 'PASSED' : 'FAILED');
    
    // 세션 조회 테스트
    const sessions = await SessionService.getSessions({ client_id: 1 });
    console.log('Counseling session retrieval test:', sessions.length > 0 ? 'PASSED' : 'FAILED');
    
    return testSession && sessions.length > 0;
  } catch (error) {
    console.error('Counseling session test failed:', error);
    return false;
  }
}

// 상담 목표 테스트
export async function testCounselingGoals(): Promise<boolean> {
  try {
    // 테스트용 상담 목표 생성
    const testGoal = await GoalService.createGoal({
      client_id: 1,
      counselor_id: 1,
      title: '테스트 목표',
      description: '테스트용 상담 목표입니다.',
      priority: 'high',
      success_criteria: ['테스트 완료']
    });
    
    console.log('Counseling goal creation test:', testGoal ? 'PASSED' : 'FAILED');
    
    // 목표 조회 테스트
    const goals = await GoalService.getGoalsByClient(1);
    console.log('Counseling goal retrieval test:', goals.length > 0 ? 'PASSED' : 'FAILED');
    
    return testGoal && goals.length > 0;
  } catch (error) {
    console.error('Counseling goals test failed:', error);
    return false;
  }
}

// 통합 보고서 생성 테스트
export async function testIntegratedReport(): Promise<boolean> {
  try {
    // 테스트용 통합 보고서 생성
    const testReport = await ReportGenerator.generateIntegratedReport(1);
    
    console.log('Integrated report generation test:', testReport ? 'PASSED' : 'FAILED');
    
    // 보고서 JSON 내보내기 테스트
    const jsonExport = await ReportGenerator.exportToJSON(testReport);
    console.log('Report JSON export test:', jsonExport ? 'PASSED' : 'FAILED');
    
    return testReport && jsonExport;
  } catch (error) {
    console.error('Integrated report test failed:', error);
    return false;
  }
}

// 전체 시스템 테스트 실행
export async function runAllTests(): Promise<{ passed: number; failed: number; results: Record<string, boolean> }> {
  console.log('🚀 AI 심리상담 시스템 테스트 시작...\n');
  
  const tests = [
    { name: 'Database Connection', test: testDatabaseConnection },
    { name: 'Assessment Program', test: testAssessmentProgram },
    { name: 'Risk Signal Detection', test: testRiskSignalDetection },
    { name: 'Counseling Session', test: testCounselingSession },
    { name: 'Counseling Goals', test: testCounselingGoals },
    { name: 'Integrated Report', test: testIntegratedReport }
  ];
  
  const results: Record<string, boolean> = {};
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      console.log(`\n📋 ${name} 테스트 실행 중...`);
      const result = await test();
      results[name] = result;
      
      if (result) {
        passed++;
        console.log(`✅ ${name} 테스트 통과`);
      } else {
        failed++;
        console.log(`❌ ${name} 테스트 실패`);
      }
    } catch (error) {
      failed++;
      results[name] = false;
      console.log(`❌ ${name} 테스트 실패:`, error);
    }
  }
  
  console.log(`\n📊 테스트 결과 요약:`);
  console.log(`✅ 통과: ${passed}`);
  console.log(`❌ 실패: ${failed}`);
  console.log(`📈 성공률: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  return { passed, failed, results };
}

// API 엔드포인트 테스트
export async function testApiEndpoints(): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    // 심리검사 API 테스트
    const assessmentResponse = await fetch(`${baseUrl}/api/ai-counseling/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_assessment_program',
        client_id: 1,
        program_type: 'holistic-self-check'
      })
    });
    
    console.log('Assessment API test:', assessmentResponse.ok ? 'PASSED' : 'FAILED');
    
    // 위험신호 API 테스트
    const riskResponse = await fetch(`${baseUrl}/api/ai-counseling/risk-signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_risk_signal',
        client_id: 1,
        signal_type: 'depression',
        severity: 'medium',
        confidence: 75,
        message: 'API 테스트용 신호',
        evidence: { test: true },
        source: 'ai-analysis'
      })
    });
    
    console.log('Risk Signal API test:', riskResponse.ok ? 'PASSED' : 'FAILED');
    
    // 대시보드 API 테스트
    const dashboardResponse = await fetch(`${baseUrl}/api/ai-counseling/dashboard?action=overview`);
    console.log('Dashboard API test:', dashboardResponse.ok ? 'PASSED' : 'FAILED');
    
    return assessmentResponse.ok && riskResponse.ok && dashboardResponse.ok;
  } catch (error) {
    console.error('API endpoints test failed:', error);
    return false;
  }
}

// 성능 테스트
export async function testPerformance(): Promise<{ avgResponseTime: number; maxResponseTime: number }> {
  const responseTimes: number[] = [];
  const testCount = 10;
  
  console.log(`\n⚡ 성능 테스트 실행 중... (${testCount}회)`);
  
  for (let i = 0; i < testCount; i++) {
    const startTime = Date.now();
    
    try {
      await testDatabaseConnection();
      const endTime = Date.now();
      responseTimes.push(endTime - startTime);
    } catch (error) {
      console.error(`Performance test ${i + 1} failed:`, error);
    }
  }
  
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const maxResponseTime = Math.max(...responseTimes);
  
  console.log(`📊 평균 응답 시간: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`📊 최대 응답 시간: ${maxResponseTime}ms`);
  
  return { avgResponseTime, maxResponseTime };
}

export default {
  testDatabaseConnection,
  testAssessmentProgram,
  testRiskSignalDetection,
  testCounselingSession,
  testCounselingGoals,
  testIntegratedReport,
  testApiEndpoints,
  testPerformance,
  runAllTests
};
