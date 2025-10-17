'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Shield, 
  Bell, 
  Eye, 
  MessageCircle,
  Phone,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Brain,
  Zap,
  Target,
  Star
} from 'lucide-react'

interface RiskSignal {
  id: string
  clientId: string
  clientName: string
  type: 'suicidal' | 'self-harm' | 'depression' | 'anxiety' | 'substance' | 'isolation' | 'aggression'
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  message: string
  timestamp: string
  source: 'ai-analysis' | 'manual-report' | 'pattern-detection'
  status: 'active' | 'investigating' | 'resolved' | 'false-positive'
  evidence: string[]
  recommendedActions: string[]
}

interface ClientRiskProfile {
  clientId: string
  clientName: string
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: string[]
  protectiveFactors: string[]
  lastAssessment: string
  trend: 'improving' | 'stable' | 'worsening'
  riskScore: number
}

interface InterventionAction {
  id: string
  type: 'immediate' | 'short-term' | 'long-term'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  requiredResources: string[]
  successCriteria: string[]
}

// 가상의 데이터
const mockRiskSignals: RiskSignal[] = [
  {
    id: '1',
    clientId: '2',
    clientName: '이영희',
    type: 'depression',
    severity: 'high',
    confidence: 87,
    message: '우울감 지수가 위험 수준에 도달했습니다. 자해 위험이 높습니다.',
    timestamp: '2024-01-16 14:30:00',
    source: 'ai-analysis',
    status: 'active',
    evidence: [
      'PHQ-9 점수 20점 (심각한 우울)',
      '최근 3일간 수면 패턴 급격한 변화',
      '식욕 저하 및 체중 감소',
      '사회적 활동 완전 중단'
    ],
    recommendedActions: [
      '즉시 안전 계획 수립',
      '가족/지지체계 연락',
      '응급 상담 일정 조정',
      '의료진 협의 필요'
    ]
  },
  {
    id: '2',
    clientId: '3',
    clientName: '박철수',
    type: 'anxiety',
    severity: 'medium',
    confidence: 72,
    message: '불안 수준이 평소보다 높게 측정되었습니다.',
    timestamp: '2024-01-16 10:15:00',
    source: 'pattern-detection',
    status: 'investigating',
    evidence: [
      'GAD-7 점수 15점 (중등도 불안)',
      '심박수 변동성 증가',
      '수면 질 저하',
      '집중력 저하'
    ],
    recommendedActions: [
      '이완 기법 교육',
      '호흡 운동 실시',
      '다음 상담 일정 앞당기기',
      '일상 스트레스 요인 점검'
    ]
  },
  {
    id: '3',
    clientId: '1',
    clientName: '김민수',
    type: 'isolation',
    severity: 'medium',
    confidence: 68,
    message: '사회적 고립 패턴이 감지되었습니다.',
    timestamp: '2024-01-15 16:45:00',
    source: 'ai-analysis',
    status: 'resolved',
    evidence: [
      'SNS 활동 급격한 감소',
      '외출 빈도 감소',
      '가족과의 연락 빈도 감소',
      '취미 활동 중단'
    ],
    recommendedActions: [
      '사회적 연결 활동 계획',
      '지지체계 강화',
      '단계적 사회 활동 복귀',
      '고립감 완화 전략 수립'
    ]
  }
]

const mockClientProfiles: ClientRiskProfile[] = [
  {
    clientId: '2',
    clientName: '이영희',
    overallRisk: 'high',
    riskFactors: ['우울증', '자해 사고', '사회적 고립', '수면 장애'],
    protectiveFactors: ['가족 지지', '과거 회복 경험', '치료 동기'],
    lastAssessment: '2024-01-16',
    trend: 'worsening',
    riskScore: 78
  },
  {
    clientId: '3',
    clientName: '박철수',
    overallRisk: 'medium',
    riskFactors: ['불안 장애', '직장 스트레스', '완벽주의'],
    protectiveFactors: ['직장 내 지지', '운동 습관', '가족 관계'],
    lastAssessment: '2024-01-16',
    trend: 'stable',
    riskScore: 45
  },
  {
    clientId: '1',
    clientName: '김민수',
    overallRisk: 'low',
    riskFactors: ['가벼운 우울감', '관계 갈등'],
    protectiveFactors: ['강한 의지력', '사회적 지지', '건강한 취미'],
    lastAssessment: '2024-01-15',
    trend: 'improving',
    riskScore: 25
  }
]

const interventionActions: InterventionAction[] = [
  {
    id: '1',
    type: 'immediate',
    title: '안전 계획 수립',
    description: '자해 위험이 높은 내담자와 함께 안전 계획을 수립합니다.',
    priority: 'high',
    estimatedTime: '30분',
    requiredResources: ['상담사', '안전 계획서', '응급 연락처'],
    successCriteria: ['안전 계획서 작성 완료', '응급 연락처 확인', '위기 상황 대응 방법 숙지']
  },
  {
    id: '2',
    type: 'immediate',
    title: '응급 상담 일정 조정',
    description: '위험 신호가 감지된 내담자의 상담 일정을 즉시 조정합니다.',
    priority: 'high',
    estimatedTime: '15분',
    requiredResources: ['상담사', '일정 관리 시스템'],
    successCriteria: ['24시간 내 상담 일정 확정', '내담자에게 연락 완료']
  },
  {
    id: '3',
    type: 'short-term',
    title: '가족/지지체계 연락',
    description: '내담자의 가족이나 지지체계에 상황을 알리고 협력을 요청합니다.',
    priority: 'medium',
    estimatedTime: '45분',
    requiredResources: ['상담사', '연락처 정보', '동의서'],
    successCriteria: ['가족과 연락 완료', '지지 계획 수립', '정기적 체크인 일정 확정']
  },
  {
    id: '4',
    type: 'long-term',
    title: '치료 계획 수정',
    description: '위험 신호를 반영하여 기존 치료 계획을 수정합니다.',
    priority: 'medium',
    estimatedTime: '60분',
    requiredResources: ['상담사', '기존 치료 계획', '위험 평가 결과'],
    successCriteria: ['수정된 치료 계획 완성', '내담자와 계획 공유', '실행 일정 확정']
  }
]

export default function RiskMonitoringPage() {
  const [riskSignals, setRiskSignals] = useState<RiskSignal[]>(mockRiskSignals)
  const [clientProfiles, setClientProfiles] = useState<ClientRiskProfile[]>(mockClientProfiles)
  const [selectedSignal, setSelectedSignal] = useState<RiskSignal | null>(null)
  const [selectedTab, setSelectedTab] = useState<'signals' | 'profiles' | 'interventions'>('signals')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredSignals = riskSignals.filter(signal => {
    const matchesSeverity = filterSeverity === 'all' || signal.severity === filterSeverity
    const matchesStatus = filterStatus === 'all' || signal.status === filterStatus
    return matchesSeverity && matchesStatus
  })

  const activeSignals = riskSignals.filter(signal => signal.status === 'active')
  const criticalSignals = riskSignals.filter(signal => signal.severity === 'critical')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'false-positive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return TrendingUp
      case 'stable': return Activity
      case 'worsening': return TrendingDown
      default: return Activity
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'stable': return 'text-blue-600'
      case 'worsening': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const updateSignalStatus = (signalId: string, newStatus: string) => {
    setRiskSignals(prev => 
      prev.map(signal => 
        signal.id === signalId 
          ? { ...signal, status: newStatus as any }
          : signal
      )
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'suicidal': return Heart
      case 'self-harm': return AlertTriangle
      case 'depression': return Brain
      case 'anxiety': return Zap
      case 'substance': return Shield
      case 'isolation': return User
      case 'aggression': return Target
      default: return AlertTriangle
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI 위험신호 모니터링
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                실시간 위험신호 감지 및 개입 시스템
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-red-600" />
                {activeSignals.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeSignals.length}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">AI 모니터링 시스템</div>
                <div className="text-xs text-gray-500">실시간 감시 중</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 긴급 알림 */}
        {criticalSignals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-300 rounded-xl p-6 mb-8"
          >
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-red-900">
                🚨 긴급 개입 필요
              </h2>
            </div>
            <div className="space-y-3">
              {criticalSignals.map(signal => (
                <div key={signal.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-red-900">{signal.clientName}</h3>
                      <p className="text-red-700 text-sm">{signal.message}</p>
                      <p className="text-red-600 text-xs">{signal.timestamp}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedSignal(signal)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        상세 보기
                      </button>
                      <button
                        onClick={() => updateSignalStatus(signal.id, 'investigating')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        조사 시작
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'signals', label: '위험 신호', icon: AlertTriangle },
                { id: 'profiles', label: '위험 프로필', icon: User },
                { id: 'interventions', label: '개입 가이드', icon: Shield }
              ].map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      selectedTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mr-2" />
                    {tab.label}
                    {tab.id === 'signals' && activeSignals.length > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {activeSignals.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 위험 신호 탭 */}
        {selectedTab === 'signals' && (
          <div className="space-y-6">
            {/* 필터 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">전체 심각도</option>
                  <option value="critical">긴급</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">전체 상태</option>
                  <option value="active">활성</option>
                  <option value="investigating">조사 중</option>
                  <option value="resolved">해결됨</option>
                  <option value="false-positive">오탐</option>
                </select>
              </div>
            </div>

            {/* 위험 신호 목록 */}
            <div className="space-y-4">
              {filteredSignals.map((signal, index) => {
                const TypeIcon = getTypeIcon(signal.type)
                return (
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg bg-red-100`}>
                          <TypeIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{signal.clientName}</h3>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(signal.severity)}`}>
                              {signal.severity === 'low' ? '낮음' :
                               signal.severity === 'medium' ? '보통' :
                               signal.severity === 'high' ? '높음' : '긴급'}
                            </span>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(signal.status)}`}>
                              {signal.status === 'active' ? '활성' :
                               signal.status === 'investigating' ? '조사 중' :
                               signal.status === 'resolved' ? '해결됨' : '오탐'}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{signal.message}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>신뢰도: {signal.confidence}%</span>
                            <span>•</span>
                            <span>{signal.timestamp}</span>
                            <span>•</span>
                            <span>{signal.source === 'ai-analysis' ? 'AI 분석' : 
                                   signal.source === 'manual-report' ? '수동 신고' : '패턴 감지'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedSignal(signal)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          상세
                        </button>
                        {signal.status === 'active' && (
                          <button
                            onClick={() => updateSignalStatus(signal.id, 'investigating')}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
                          >
                            조사
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* 위험 프로필 탭 */}
        {selectedTab === 'profiles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {clientProfiles.map((profile, index) => {
                const TrendIcon = getTrendIcon(profile.trend)
                return (
                  <motion.div
                    key={profile.clientId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{profile.clientName}</h3>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskColor(profile.overallRisk)}`}>
                        {profile.overallRisk === 'low' ? '낮음' :
                         profile.overallRisk === 'medium' ? '보통' :
                         profile.overallRisk === 'high' ? '높음' : '긴급'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">위험 점수</span>
                        <span className="text-lg font-bold text-gray-900">{profile.riskScore}점</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            profile.riskScore >= 70 ? 'bg-red-500' :
                            profile.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${profile.riskScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <TrendIcon className={`h-4 w-4 mr-2 ${getTrendColor(profile.trend)}`} />
                        <span className={`text-sm font-medium ${getTrendColor(profile.trend)}`}>
                          {profile.trend === 'improving' ? '개선 중' :
                           profile.trend === 'stable' ? '안정' : '악화 중'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">위험 요인</h4>
                        <div className="flex flex-wrap gap-1">
                          {profile.riskFactors.map((factor, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">보호 요인</h4>
                        <div className="flex flex-wrap gap-1">
                          {profile.protectiveFactors.map((factor, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        마지막 평가: {profile.lastAssessment}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* 개입 가이드 탭 */}
        {selectedTab === 'interventions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {interventionActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      action.priority === 'high' ? 'bg-red-100 text-red-800' :
                      action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {action.priority === 'high' ? '높음' :
                       action.priority === 'medium' ? '보통' : '낮음'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{action.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">소요 시간</h4>
                      <p className="text-sm text-gray-600">{action.estimatedTime}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">필요 자원</h4>
                      <div className="flex flex-wrap gap-1">
                        {action.requiredResources.map((resource, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {resource}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">성공 기준</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {action.successCriteria.map((criteria, idx) => (
                          <li key={idx} className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      개입 실행
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 상세 모달 */}
        {selectedSignal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">위험 신호 상세 정보</h2>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">내담자:</span> {selectedSignal.clientName}</p>
                      <p><span className="font-medium">유형:</span> {selectedSignal.type}</p>
                      <p><span className="font-medium">심각도:</span> {selectedSignal.severity}</p>
                      <p><span className="font-medium">신뢰도:</span> {selectedSignal.confidence}%</p>
                      <p><span className="font-medium">발생 시간:</span> {selectedSignal.timestamp}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">증거</h3>
                    <ul className="space-y-1">
                      {selectedSignal.evidence.map((evidence, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {evidence}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">권장 조치</h3>
                  <ul className="space-y-2">
                    {selectedSignal.recommendedActions.map((action, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm text-gray-600">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => updateSignalStatus(selectedSignal.id, 'investigating')}
                    className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                  >
                    조사 시작
                  </button>
                  <button
                    onClick={() => updateSignalStatus(selectedSignal.id, 'resolved')}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    해결 완료
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
