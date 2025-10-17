'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Heart, 
  Shield, 
  Users, 
  Target, 
  Lightbulb,
  ArrowRight, 
  CheckCircle,
  Star,
  Zap,
  ArrowLeft
} from 'lucide-react'

interface StrengthCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  questions: StrengthQuestion[]
}

interface StrengthQuestion {
  id: string
  text: string
  category: string
}

const strengthCategories: StrengthCategory[] = [
  {
    id: 'self-leadership',
    name: '자기 리더십',
    description: '자기 주도적 삶의 계획 및 실천 능력',
    icon: Target,
    color: 'bg-blue-500',
    questions: [
      { id: 'sl1', text: '나는 어려운 상황에서도 스스로를 믿고 결정을 내릴 수 있다.', category: 'self-leadership' },
      { id: 'sl2', text: '나는 나만의 목표를 설정하고 이를 달성하기 위해 노력한다.', category: 'self-leadership' },
      { id: 'sl3', text: '나는 책임감을 가지고 내 삶을 주도적으로 이끌어간다.', category: 'self-leadership' },
      { id: 'sl4', text: '나는 스트레스 상황에서도 효율적으로 자기 통제를 할 수 있다.', category: 'self-leadership' }
    ]
  },
  {
    id: 'resilience',
    name: '회복 탄력성',
    description: '위기 상황에서 다시 일어서는 힘',
    icon: Shield,
    color: 'bg-green-500',
    questions: [
      { id: 'r1', text: '나는 실패하거나 넘어져도 다시 일어서는 힘이 있다.', category: 'resilience' },
      { id: 'r2', text: '어려운 경험을 통해 더 강해진다.', category: 'resilience' },
      { id: 'r3', text: '나는 변화와 불확실성을 잘 받아들인다.', category: 'resilience' },
      { id: 'r4', text: '위기 상황에서도 긍정적인 마음을 유지할 수 있다.', category: 'resilience' }
    ]
  },
  {
    id: 'positive-relationships',
    name: '긍정적 관계',
    description: '타인과의 건강한 관계 형성 능력',
    icon: Users,
    color: 'bg-pink-500',
    questions: [
      { id: 'pr1', text: '내게는 힘들 때 기댈 수 있는 소중한 사람이 있다.', category: 'positive-relationships' },
      { id: 'pr2', text: '나는 다른 사람들의 감정을 잘 이해하고 공감한다.', category: 'positive-relationships' },
      { id: 'pr3', text: '나는 갈등 상황에서 중재 역할을 잘 한다.', category: 'positive-relationships' },
      { id: 'pr4', text: '나는 다양한 사람들과 긍정적인 관계를 맺는다.', category: 'positive-relationships' }
    ]
  },
  {
    id: 'self-care',
    name: '자기 돌봄',
    description: '자신을 돌보고 관리하는 능력',
    icon: Heart,
    color: 'bg-red-500',
    questions: [
      { id: 'sc1', text: '나는 나 자신을 돌보기 위한 나만의 방법을 알고 실천한다.', category: 'self-care' },
      { id: 'sc2', text: '나는 나의 감정과 욕구를 존중하고 표현한다.', category: 'self-care' },
      { id: 'sc3', text: '나는 건강한 생활 습관을 유지한다.', category: 'self-care' },
      { id: 'sc4', text: '나는 나 자신을 사랑하고 존중한다.', category: 'self-care' }
    ]
  },
  {
    id: 'problem-solving',
    name: '문제 해결 능력',
    description: '복잡한 문제를 해결하는 창의적 사고',
    icon: Lightbulb,
    color: 'bg-yellow-500',
    questions: [
      { id: 'ps1', text: '나는 복잡한 문제가 생겼을 때, 해결책을 찾기 위해 노력한다.', category: 'problem-solving' },
      { id: 'ps2', text: '나는 창의적으로 생각하고 새로운 아이디어를 제안한다.', category: 'problem-solving' },
      { id: 'ps3', text: '나는 비판적 사고를 통해 문제를 분석한다.', category: 'problem-solving' },
      { id: 'ps4', text: '나는 고정관념에 얽매이지 않고 유연하게 사고한다.', category: 'problem-solving' }
    ]
  },
  {
    id: 'learning-growth',
    name: '학습 및 성장',
    description: '지속적인 학습과 성장에 대한 열정',
    icon: TrendingUp,
    color: 'bg-purple-500',
    questions: [
      { id: 'lg1', text: '나는 새로운 것을 배우는 것을 즐긴다.', category: 'learning-growth' },
      { id: 'lg2', text: '나는 실수를 통해 배우고 성장한다.', category: 'learning-growth' },
      { id: 'lg3', text: '나는 피드백을 받아들이고 개선한다.', category: 'learning-growth' },
      { id: 'lg4', text: '나는 지속적으로 자기계발에 투자한다.', category: 'learning-growth' }
    ]
  },
  {
    id: 'emotional-intelligence',
    name: '감정 지능',
    description: '감정을 이해하고 관리하는 능력',
    icon: Heart,
    color: 'bg-indigo-500',
    questions: [
      { id: 'ei1', text: '나는 내 감정을 잘 인식하고 표현할 수 있다.', category: 'emotional-intelligence' },
      { id: 'ei2', text: '나는 다른 사람의 감정을 정확하게 파악한다.', category: 'emotional-intelligence' },
      { id: 'ei3', text: '나는 감정을 건강하게 조절할 수 있다.', category: 'emotional-intelligence' },
      { id: 'ei4', text: '나는 감정을 활용하여 관계를 개선한다.', category: 'emotional-intelligence' }
    ]
  },
  {
    id: 'communication-skills',
    name: '소통 기술',
    description: '효과적인 의사소통 능력',
    icon: Users,
    color: 'bg-teal-500',
    questions: [
      { id: 'cs1', text: '나는 내 의견을 명확하고 자신 있게 표현한다.', category: 'communication-skills' },
      { id: 'cs2', text: '나는 다른 사람의 말을 잘 경청한다.', category: 'communication-skills' },
      { id: 'cs3', text: '나는 비폭력적인 방식으로 의사소통한다.', category: 'communication-skills' },
      { id: 'cs4', text: '나는 오해를 줄이는 명확한 의사 표현을 한다.', category: 'communication-skills' }
    ]
  }
]

export default function StrengthDiscoveryPage() {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [strengthScores, setStrengthScores] = useState<Record<string, number>>({})

  const currentCategory = strengthCategories[currentCategoryIndex]
  const currentQuestion = currentCategory?.questions[currentQuestionIndex]
  const totalQuestions = strengthCategories.reduce((sum, cat) => sum + cat.questions.length, 0)
  const answeredQuestions = Object.keys(answers).length
  const progress = (answeredQuestions / totalQuestions) * 100

  const handleAnswer = (value: number) => {
    if (!currentQuestion) return
    
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    // 다음 질문으로 이동
    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // 현재 카테고리 완료, 다음 카테고리로
      if (currentCategoryIndex < strengthCategories.length - 1) {
        setCurrentCategoryIndex(currentCategoryIndex + 1)
        setCurrentQuestionIndex(0)
      } else {
        // 모든 카테고리 완료
        setIsCompleted(true)
        calculateStrengthScores(newAnswers)
      }
    }
  }

  const calculateStrengthScores = (answers: Record<string, number>) => {
    const scores: Record<string, number> = {}
    
    strengthCategories.forEach(category => {
      const categoryQuestions = category.questions
      const totalScore = categoryQuestions.reduce((sum, question) => {
        return sum + (answers[question.id] || 0)
      }, 0)
      
      const maxScore = categoryQuestions.length * 5
      const percentage = (totalScore / maxScore) * 100
      scores[category.id] = Math.round(percentage)
    })
    
    setStrengthScores(scores)
    setShowResults(true)
  }

  const getTopStrengths = () => {
    return Object.entries(strengthScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([categoryId, score]) => {
        const category = strengthCategories.find(cat => cat.id === categoryId)
        return { category, score }
      })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return '매우 강함'
    if (score >= 60) return '보통'
    return '개선 필요'
  }

  if (showResults) {
    const topStrengths = getTopStrengths()
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 결과 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              강점 및 자원 탐색 결과
            </h1>
            <p className="text-lg text-gray-600">
              내담자님의 내면에 숨겨진 강점과 자원을 발견했습니다
            </p>
          </motion.div>

          {/* 상위 강점 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              🌟 내담자님의 주요 강점
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topStrengths.map((strength, index) => {
                if (!strength.category) return null
                
                const IconComponent = strength.category.icon
                const rank = index + 1
                const rankColors = ['bg-yellow-500', 'bg-gray-400', 'bg-orange-500']
                const rankIcons = [Star, Star, Star]
                const RankIcon = rankIcons[index]
                
                return (
                  <div key={strength.category.id} className="text-center">
                    <div className="relative mb-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${strength.category.color} mb-4`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full ${rankColors[index]} flex items-center justify-center`}>
                        <RankIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {strength.category.name}
                    </h3>
                    
                    <div className="mb-3">
                      <span className={`text-2xl font-bold ${getScoreColor(strength.score)}`}>
                        {strength.score}점
                      </span>
                      <div className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        strength.score >= 80 ? 'bg-green-100 text-green-800' :
                        strength.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {getScoreLabel(strength.score)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      {strength.category.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* 전체 강점 분석 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              전체 강점 분석
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {strengthCategories.map((category, index) => {
                const IconComponent = category.icon
                const score = strengthScores[category.id] || 0
                
                return (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg ${category.color} mr-3`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">점수</span>
                        <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                          {score}점
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 ${
                            score >= 80 ? 'bg-green-500' :
                            score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      {category.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* 강점 활용 가이드 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-8 text-white mb-8"
          >
            <h2 className="text-2xl font-bold mb-4">
              💡 강점 활용 가이드
            </h2>
            <p className="text-purple-100 mb-6">
              발견된 강점들을 어떻게 상담 과정에서 활용할 수 있는지 알아보세요.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topStrengths.slice(0, 2).map((strength, index) => {
                if (!strength.category) return null
                
                return (
                  <div key={strength.category.id} className="bg-white bg-opacity-20 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">
                      {strength.category.name}
                    </h3>
                    <p className="text-sm text-purple-100">
                      이 강점을 활용하여 어려운 상황을 극복하고, 
                      다른 영역의 개선에도 긍정적인 영향을 미칠 수 있습니다.
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* 다음 단계 안내 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">
              다음 단계: 상담 청사진 완성
            </h2>
            <p className="text-blue-100 mb-6">
              강점 탐색을 완료하셨습니다. 이제 지금까지의 모든 결과를 종합하여 
              개인 맞춤형 상담 청사진을 만들어보겠습니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => window.location.href = '/ai-counseling-system/counseling-blueprint'}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center"
              >
                상담 청사진 만들기
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ArrowLeft 
              className="h-5 w-5 text-gray-400 mr-2 cursor-pointer"
              onClick={() => window.location.href = '/ai-counseling-system'}
            />
            <h1 className="text-3xl font-bold text-gray-900">
              강점 및 자원 탐색
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            어려움에 초점을 맞추는 것을 넘어서, 내담자님의 강점과 자원을 발견해보세요
          </p>
          
          {/* 진행률 */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <motion.div
              className="bg-green-600 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {answeredQuestions} / {totalQuestions} 문항 완료
          </p>
        </div>

        {/* 현재 카테고리 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${currentCategory?.color} mr-4`}>
                <currentCategory?.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentCategory?.name}
                </h2>
                <p className="text-sm text-gray-600">
                  {currentCategory?.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                카테고리 {currentCategoryIndex + 1} / {strengthCategories.length}
              </div>
              <div className="text-sm text-gray-500">
                문항 {currentQuestionIndex + 1} / {currentCategory?.questions.length}
              </div>
            </div>
          </div>
        </div>

        {/* 질문 카드 */}
        <motion.div
          key={`${currentCategoryIndex}-${currentQuestionIndex}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-xl shadow-sm p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion?.text}
            </h2>
            
            {/* 답변 옵션 */}
            <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleAnswer(value)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
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
            자신의 강점을 발견하는 시간입니다. 솔직하게 답변해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}
