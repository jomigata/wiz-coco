'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Users, 
  Heart, 
  Briefcase, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target
} from 'lucide-react'

interface CategoryScore {
  id: string
  name: string
  score: number
  maxScore: number
  description: string
  icon: React.ComponentType<any>
  color: string
}

interface Question {
  id: string
  text: string
  category: string
  reverse?: boolean
}

const categories = [
  {
    id: 'personal-psychology',
    name: '개인 심리 및 성장',
    description: '성격, 자아정체감, 잠재력, 삶의 의미',
    icon: Brain,
    color: 'bg-indigo-500'
  },
  {
    id: 'interpersonal-relations',
    name: '대인관계 및 사회적응',
    description: '가족, 연인, 친구, 사회적 기술',
    icon: Users,
    color: 'bg-pink-500'
  },
  {
    id: 'emotional-mental-health',
    name: '정서 문제 및 정신 건강',
    description: '우울, 불안, 외상, 중독 문제',
    icon: Heart,
    color: 'bg-red-500'
  },
  {
    id: 'reality-life-management',
    name: '현실 문제 및 생활 관리',
    description: '진로, 경제, 건강, 일상생활',
    icon: Briefcase,
    color: 'bg-yellow-500'
  },
  {
    id: 'cultural-environmental',
    name: '문화 및 환경 적응',
    description: '다문화, 디지털 환경, 생애주기별 적응',
    icon: Globe,
    color: 'bg-teal-500'
  }
]

const questions: Question[] = [
  // 개인 심리 및 성장
  { id: 'p1', text: '나는 나 자신에 대해 대체로 만족하는 편이다.', category: 'personal-psychology' },
  { id: 'p2', text: '내가 가진 강점과 잠재력을 잘 알고 있다.', category: 'personal-psychology' },
  { id: 'p3', text: '나는 명확한 목표와 방향성을 가지고 있다.', category: 'personal-psychology' },
  { id: 'p4', text: '어려운 상황에서도 스스로를 믿고 극복할 수 있다.', category: 'personal-psychology' },
  { id: 'p5', text: '내 삶에 의미와 목적을 느낀다.', category: 'personal-psychology' },
  
  // 대인관계 및 사회적응
  { id: 'i1', text: '나는 주변 사람들과 원만한 관계를 맺고 있다고 느낀다.', category: 'interpersonal-relations' },
  { id: 'i2', text: '가족과의 관계에서 만족감을 느낀다.', category: 'interpersonal-relations' },
  { id: 'i3', text: '친구나 동료들과 잘 소통할 수 있다.', category: 'interpersonal-relations' },
  { id: 'i4', text: '사회적 상황에서 편안함을 느낀다.', category: 'interpersonal-relations' },
  { id: 'i5', text: '갈등 상황을 잘 해결할 수 있다.', category: 'interpersonal-relations' },
  
  // 정서 문제 및 정신 건강
  { id: 'e1', text: '최근 감정 기복이나 스트레스로 인해 어려움을 겪고 있다.', category: 'emotional-mental-health', reverse: true },
  { id: 'e2', text: '우울하거나 무기력한 기분이 자주 든다.', category: 'emotional-mental-health', reverse: true },
  { id: 'e3', text: '불안하거나 걱정이 많아서 일상생활에 지장이 있다.', category: 'emotional-mental-health', reverse: true },
  { id: 'e4', text: '과거의 어려운 경험이 현재에도 영향을 미치고 있다.', category: 'emotional-mental-health', reverse: true },
  { id: 'e5', text: '중독성 있는 행동이나 습관이 있다.', category: 'emotional-mental-health', reverse: true },
  
  // 현실 문제 및 생활 관리
  { id: 'r1', text: '나의 진로, 경제, 건강 등 현실적인 문제들이 잘 관리되고 있다.', category: 'reality-life-management' },
  { id: 'r2', text: '일과 삶의 균형을 잘 맞추고 있다.', category: 'reality-life-management' },
  { id: 'r3', text: '시간 관리와 자기 관리를 잘 하고 있다.', category: 'reality-life-management' },
  { id: 'r4', text: '현재의 직업이나 활동에 만족한다.', category: 'reality-life-management' },
  { id: 'r5', text: '경제적으로 안정감을 느낀다.', category: 'reality-life-management' },
  
  // 문화 및 환경 적응
  { id: 'c1', text: '나는 현재 내가 속한 환경(가정, 직장, 사회)에 잘 적응하고 있다.', category: 'cultural-environmental' },
  { id: 'c2', text: '새로운 환경이나 변화에 잘 적응한다.', category: 'cultural-environmental' },
  { id: 'c3', text: '디지털 환경과 기술 변화에 잘 적응한다.', category: 'cultural-environmental' },
  { id: 'c4', text: '다양한 문화와 사람들을 이해하고 수용한다.', category: 'cultural-environmental' },
  { id: 'c5', text: '현재의 생애 단계에 적절히 적응하고 있다.', category: 'cultural-environmental' }
]

export default function HolisticSelfCheckPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [scores, setScores] = useState<CategoryScore[]>([])
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswer = (value: number) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setIsCompleted(true)
      calculateScores(newAnswers)
    }
  }

  const calculateScores = (answers: Record<string, number>) => {
    const categoryScores = categories.map(category => {
      const categoryQuestions = questions.filter(q => q.category === category.id)
      let totalScore = 0
      
      categoryQuestions.forEach(question => {
        const answer = answers[question.id] || 0
        const score = question.reverse ? (6 - answer) : answer
        totalScore += score
      })
      
      const maxScore = categoryQuestions.length * 5
      const percentage = (totalScore / maxScore) * 100
      
      return {
        id: category.id,
        name: category.name,
        score: Math.round(percentage),
        maxScore: 100,
        description: category.description,
        icon: category.icon,
        color: category.color
      }
    })
    
    setScores(categoryScores)
    setShowResults(true)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '양호'
    if (score >= 60) return '보통'
    return '주의 필요'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle
    if (score >= 60) return AlertCircle
    return AlertCircle
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 결과 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              통합 자기 점검 결과
            </h1>
            <p className="text-lg text-gray-600">
              현재 삶의 전반적인 상태를 확인해보세요
            </p>
          </motion.div>

          {/* 점수 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {scores.map((category, index) => {
              const IconComponent = category.icon
              const ScoreIcon = getScoreIcon(category.score)
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <ScoreIcon className={`h-6 w-6 ${getScoreColor(category.score)}`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">점수</span>
                      <span className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                        {category.score}점
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          category.score >= 80 ? 'bg-green-500' :
                          category.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {category.description}
                  </p>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    category.score >= 80 ? 'bg-green-100 text-green-800' :
                    category.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {getScoreLabel(category.score)}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* 종합 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              종합 분석 및 권장사항
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 가장 낮은 점수 영역 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="h-5 w-5 text-red-500 mr-2" />
                  집중 관심 영역
                </h3>
                {(() => {
                  const lowestScore = Math.min(...scores.map(s => s.score))
                  const lowestCategory = scores.find(s => s.score === lowestScore)
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">
                        {lowestCategory?.name}
                      </h4>
                      <p className="text-red-700 text-sm">
                        이 영역에서 {lowestScore}점으로 가장 낮은 점수를 받았습니다. 
                        이 부분에 대한 심층적인 탐색과 개선이 필요할 것 같습니다.
                      </p>
                    </div>
                  )
                })()}
              </div>

              {/* 가장 높은 점수 영역 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  강점 영역
                </h3>
                {(() => {
                  const highestScore = Math.max(...scores.map(s => s.score))
                  const highestCategory = scores.find(s => s.score === highestScore)
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">
                        {highestCategory?.name}
                      </h4>
                      <p className="text-green-700 text-sm">
                        이 영역에서 {highestScore}점으로 가장 높은 점수를 받았습니다. 
                        이 강점을 다른 영역의 개선에도 활용할 수 있습니다.
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          </motion.div>

          {/* 다음 단계 안내 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">
              다음 단계: 집중 탐색 모듈
            </h2>
            <p className="text-blue-100 mb-6">
              통합 자기 점검을 완료하셨습니다. 이제 가장 관심 있는 영역을 선택하여 
              더 깊이 있는 탐색을 진행할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => window.location.href = '/ai-counseling-system/focused-exploration'}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center"
              >
                집중 탐색 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => window.location.href = '/ai-counseling-system'}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                메인으로 돌아가기
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            통합 자기 점검
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            5개 대분류 영역에 대한 전반적인 삶의 상태를 확인해보세요
          </p>
          
          {/* 진행률 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-blue-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {currentQuestionIndex + 1} / {questions.length} 문항
          </p>
        </div>

        {/* 질문 카드 */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.text}
            </h2>
            
            {/* 답변 옵션 */}
            <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="text-2xl font-bold text-gray-700 mb-1">
                    {value}
                  </div>
                  <div className="text-xs text-gray-500">
                    {value === 1 ? '전혀 아니다' : 
                     value === 2 ? '아니다' : 
                     value === 3 ? '보통이다' : 
                     value === 4 ? '그렇다' : '매우 그렇다'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 안내 문구 */}
        <div className="text-center text-sm text-gray-600">
          <p>
            솔직하게 답변해주세요. 정확한 결과를 위해 성의 있게 응답해주시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  )
}
