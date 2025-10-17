'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Target, 
  TrendingUp, 
  CheckCircle,
  ArrowRight, 
  Download,
  Share2,
  Calendar,
  Users,
  Heart,
  Brain,
  Briefcase,
  Globe,
  ArrowLeft,
  Star,
  Zap,
  Shield
} from 'lucide-react'

interface CounselingGoal {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimatedSessions: number
  category: string
  icon: React.ComponentType<any>
  color: string
}

interface StrengthResource {
  id: string
  name: string
  score: number
  description: string
  icon: React.ComponentType<any>
  color: string
}

interface ProblemArea {
  id: string
  name: string
  score: number
  description: string
  icon: React.ComponentType<any>
  color: string
}

// 가상의 데이터 (실제로는 이전 단계들의 결과를 받아와야 함)
const mockData = {
  holisticScores: {
    'personal-psychology': 65,
    'interpersonal-relations': 45,
    'emotional-mental-health': 40,
    'reality-life-management': 70,
    'cultural-environmental': 75
  },
  focusedExploration: {
    category: 'interpersonal-relations',
    subCategory: 'romantic-relations',
    score: 35,
    details: [
      { question: '파트너와의 갈등을 건설적으로 해결한다.', answer: 2 },
      { question: '파트너와 효과적으로 소통한다.', answer: 1 },
      { question: '파트너와의 친밀감에 만족한다.', answer: 2 },
      { question: '파트너를 신뢰하고 신뢰받는다.', answer: 3 }
    ]
  },
  strengths: [
    { id: 'self-leadership', name: '자기 리더십', score: 85, description: '자기 주도적 삶의 계획 및 실천 능력', icon: Target, color: 'bg-blue-500' },
    { id: 'resilience', name: '회복 탄력성', score: 80, description: '위기 상황에서 다시 일어서는 힘', icon: Shield, color: 'bg-green-500' },
    { id: 'problem-solving', name: '문제 해결 능력', score: 75, description: '복잡한 문제를 해결하는 창의적 사고', icon: Brain, color: 'bg-yellow-500' }
  ]
}

const suggestedGoals: CounselingGoal[] = [
  {
    id: 'communication-skills',
    title: '효과적인 의사소통 기술 습득',
    description: '파트너와의 갈등 상황에서 비폭력적이고 건설적인 소통 방법을 익힙니다.',
    priority: 'high',
    estimatedSessions: 6,
    category: 'interpersonal-relations',
    icon: Users,
    color: 'bg-pink-500'
  },
  {
    id: 'conflict-resolution',
    title: '갈등 해결 전략 개발',
    description: '관계에서 발생하는 갈등을 해결하는 구체적인 전략과 기술을 개발합니다.',
    priority: 'high',
    estimatedSessions: 4,
    category: 'interpersonal-relations',
    icon: Shield,
    color: 'bg-red-500'
  },
  {
    id: 'trust-building',
    title: '신뢰 회복 및 강화',
    description: '파트너와의 신뢰 관계를 회복하고 더욱 강화하는 방법을 탐색합니다.',
    priority: 'medium',
    estimatedSessions: 8,
    category: 'interpersonal-relations',
    icon: Heart,
    color: 'bg-purple-500'
  },
  {
    id: 'intimacy-enhancement',
    title: '친밀감 향상',
    description: '정서적, 신체적 친밀감을 향상시키는 방법을 함께 찾아봅니다.',
    priority: 'medium',
    estimatedSessions: 5,
    category: 'interpersonal-relations',
    icon: Heart,
    color: 'bg-rose-500'
  }
]

export default function CounselingBlueprintPage() {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoals, setCustomGoals] = useState<string[]>([])
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [newCustomGoal, setNewCustomGoal] = useState('')

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const addCustomGoal = () => {
    if (newCustomGoal.trim()) {
      setCustomGoals(prev => [...prev, newCustomGoal.trim()])
      setNewCustomGoal('')
    }
  }

  const removeCustomGoal = (index: number) => {
    setCustomGoals(prev => prev.filter((_, i) => i !== index))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return '높음'
      case 'medium': return '보통'
      case 'low': return '낮음'
      default: return '미정'
    }
  }

  const selectedGoalsData = suggestedGoals.filter(goal => selectedGoals.includes(goal.id))
  const totalEstimatedSessions = selectedGoalsData.reduce((sum, goal) => sum + goal.estimatedSessions, 0)

  if (showFinalReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 최종 보고서 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              상담 청사진 완성
            </h1>
            <p className="text-lg text-gray-600">
              내담자님을 위한 맞춤형 상담 계획서
            </p>
          </motion.div>

          {/* 통합 분석 요약 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 통합 분석 요약
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 문제 영역 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 text-red-500 mr-2" />
                  주요 관심 영역
                </h3>
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">
                      대인관계 및 사회적응 (45점)
                    </h4>
                    <p className="text-red-700 text-sm">
                      특히 연인 관계에서 소통과 갈등 해결에 어려움을 겪고 있습니다.
                    </p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      정서 문제 및 정신 건강 (40점)
                    </h4>
                    <p className="text-orange-700 text-sm">
                      감정 조절과 스트레스 관리에 도움이 필요합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 강점 자원 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Star className="h-5 w-5 text-green-500 mr-2" />
                  주요 강점 자원
                </h3>
                <div className="space-y-3">
                  {mockData.strengths.map((strength, index) => {
                    const IconComponent = strength.icon
                    return (
                      <div key={strength.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className={`p-2 rounded-lg ${strength.color} mr-3`}>
                            <IconComponent className="h-4 w-4 text-white" />
                          </div>
                          <h4 className="font-semibold text-green-900">
                            {strength.name} ({strength.score}점)
                          </h4>
                        </div>
                        <p className="text-green-700 text-sm">
                          {strength.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* 상담 목표 및 계획 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🎯 상담 목표 및 계획
            </h2>
            
            <div className="space-y-6">
              {selectedGoalsData.map((goal, index) => {
                const IconComponent = goal.icon
                return (
                  <div key={goal.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-lg ${goal.color} mr-4`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {goal.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {goal.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${getPriorityColor(goal.priority)}`}>
                          우선순위: {getPriorityLabel(goal.priority)}
                        </div>
                        <div className="text-sm text-gray-600">
                          예상 회기: {goal.estimatedSessions}회
                        </div>
                      </div>
                    </div>
                    
                    {/* 단계별 계획 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        단계별 실행 계획
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          1-2회기: 현재 상황 분석 및 목표 설정
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          3-4회기: 구체적 기술 습득 및 연습
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          5-6회기: 실제 적용 및 피드백
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 추가 목표 */}
            {customGoals.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  추가 목표
                </h3>
                <div className="space-y-2">
                  {customGoals.map((goal, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-blue-900">{goal}</p>
                        <button
                          onClick={() => removeCustomGoal(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* 상담 일정 및 예상 결과 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white mb-8"
          >
            <h2 className="text-2xl font-bold mb-6">
              📅 상담 일정 및 예상 결과
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <Calendar className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">총 상담 회기</h3>
                <p className="text-2xl font-bold">{totalEstimatedSessions}회</p>
                <p className="text-sm text-blue-100">주 1회 기준 약 {Math.ceil(totalEstimatedSessions / 4)}개월</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <TrendingUp className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">예상 개선 영역</h3>
                <p className="text-2xl font-bold">대인관계</p>
                <p className="text-sm text-blue-100">소통 및 갈등 해결 능력 향상</p>
              </div>
              
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <Zap className="h-8 w-8 mb-3" />
                <h3 className="font-semibold mb-2">활용 강점</h3>
                <p className="text-2xl font-bold">자기 리더십</p>
                <p className="text-sm text-blue-100">높은 자기 주도성을 관계 개선에 활용</p>
              </div>
            </div>
          </motion.div>

          {/* 액션 버튼 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
              <Download className="mr-2 h-5 w-5" />
              보고서 다운로드
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center">
              <Share2 className="mr-2 h-5 w-5" />
              상담사와 공유
            </button>
            <button 
              onClick={() => window.location.href = '/ai-counseling-system'}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ArrowLeft 
              className="h-5 w-5 text-gray-400 mr-2 cursor-pointer"
              onClick={() => window.location.href = '/ai-counseling-system'}
            />
            <h1 className="text-3xl font-bold text-gray-900">
              상담 청사진 만들기
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            지금까지의 분석 결과를 바탕으로 개인 맞춤형 상담 목표를 설정하세요
          </p>
        </div>

        {/* 현재 상황 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📋 현재 상황 요약
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 주요 문제 영역 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-red-500 mr-2" />
                주요 관심 영역
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">
                  연인 및 부부 관계 (35점)
                </h4>
                <p className="text-red-700 text-sm mb-3">
                  파트너와의 소통과 갈등 해결에 어려움을 겪고 있습니다.
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-red-600">
                    • 파트너와의 갈등 해결: 어려움
                  </div>
                  <div className="text-xs text-red-600">
                    • 효과적인 소통: 매우 어려움
                  </div>
                  <div className="text-xs text-red-600">
                    • 친밀감: 어려움
                  </div>
                  <div className="text-xs text-red-600">
                    • 신뢰 관계: 보통
                  </div>
                </div>
              </div>
            </div>

            {/* 주요 강점 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 text-green-500 mr-2" />
                활용 가능한 강점
              </h3>
              <div className="space-y-3">
                {mockData.strengths.map((strength, index) => {
                  const IconComponent = strength.icon
                  return (
                    <div key={strength.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${strength.color} mr-3`}>
                          <IconComponent className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-green-900 text-sm">
                            {strength.name} ({strength.score}점)
                          </h4>
                          <p className="text-green-700 text-xs">
                            {strength.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 상담 목표 제안 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎯 추천 상담 목표
          </h2>
          <p className="text-gray-600 mb-6">
            분석 결과를 바탕으로 추천하는 상담 목표입니다. 원하는 목표를 선택하거나 추가 목표를 설정할 수 있습니다.
          </p>
          
          <div className="space-y-4">
            {suggestedGoals.map((goal, index) => {
              const IconComponent = goal.icon
              const isSelected = selectedGoals.includes(goal.id)
              
              return (
                <div
                  key={goal.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleGoal(goal.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className={`p-3 rounded-lg ${goal.color} mr-4`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 mr-3">
                            {goal.title}
                          </h3>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">
                          {goal.description}
                        </p>
                        <div className="flex items-center space-x-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(goal.priority)}`}>
                            우선순위: {getPriorityLabel(goal.priority)}
                          </div>
                          <div className="text-sm text-gray-600">
                            예상 회기: {goal.estimatedSessions}회
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* 추가 목표 설정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ✏️ 추가 목표 설정
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={newCustomGoal}
              onChange={(e) => setNewCustomGoal(e.target.value)}
              placeholder="추가하고 싶은 상담 목표를 입력하세요..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addCustomGoal()}
            />
            <button
              onClick={addCustomGoal}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              추가
            </button>
          </div>
          
          {customGoals.length > 0 && (
            <div className="space-y-2">
              {customGoals.map((goal, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                  <p className="text-blue-900">{goal}</p>
                  <button
                    onClick={() => removeCustomGoal(index)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 선택된 목표 요약 */}
        {selectedGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-8 mb-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">
              선택된 상담 목표 요약
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">선택된 목표</h3>
                <p className="text-2xl font-bold">{selectedGoals.length}개</p>
                <p className="text-sm text-green-100">추천 목표 중 선택</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">추가 목표</h3>
                <p className="text-2xl font-bold">{customGoals.length}개</p>
                <p className="text-sm text-green-100">직접 설정한 목표</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">예상 회기</h3>
                <p className="text-2xl font-bold">{totalEstimatedSessions}회</p>
                <p className="text-sm text-green-100">주 1회 기준</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 완성 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={() => setShowFinalReport(true)}
            disabled={selectedGoals.length === 0 && customGoals.length === 0}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center mx-auto ${
              selectedGoals.length === 0 && customGoals.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            상담 청사진 완성하기
            <ArrowRight className="ml-2 h-6 w-6" />
          </button>
          
          {(selectedGoals.length === 0 && customGoals.length === 0) && (
            <p className="text-sm text-gray-500 mt-2">
              최소 하나의 상담 목표를 선택하거나 추가해주세요.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
