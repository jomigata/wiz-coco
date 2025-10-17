'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Users, 
  Heart, 
  Briefcase, 
  Globe, 
  Shield, 
  Target, 
  BarChart3,
  UserCheck,
  AlertTriangle,
  FileText,
  Calendar,
  MessageCircle,
  Settings,
  TrendingUp
} from 'lucide-react'

interface MenuItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  color: string
  path: string
  category: 'assessment' | 'counseling' | 'management' | 'analytics'
}

const menuItems: MenuItem[] = [
  // 4단계 심리검사 프로그램
  {
    id: 'holistic-self-check',
    title: '통합 자기 점검',
    description: '5개 대분류 영역 전반적인 삶의 상태 스크리닝',
    icon: Brain,
    color: 'bg-blue-500',
    path: '/ai-counseling-system/holistic-self-check',
    category: 'assessment'
  },
  {
    id: 'focused-exploration',
    title: '집중 탐색 모듈',
    description: '선택된 핵심 영역에 대한 심층 분석',
    icon: Target,
    color: 'bg-green-500',
    path: '/ai-counseling-system/focused-exploration',
    category: 'assessment'
  },
  {
    id: 'strength-discovery',
    title: '강점 및 자원 탐색',
    description: '내담자의 잠재력과 강점 발견',
    icon: TrendingUp,
    color: 'bg-purple-500',
    path: '/ai-counseling-system/strength-discovery',
    category: 'assessment'
  },
  {
    id: 'counseling-blueprint',
    title: '상담 청사진',
    description: '통합 보고서 및 상담 목표 설정',
    icon: FileText,
    color: 'bg-orange-500',
    path: '/ai-counseling-system/counseling-blueprint',
    category: 'assessment'
  },

  // 대분류별 상세 검사
  {
    id: 'personal-psychology',
    title: '개인 심리 및 성장',
    description: '성격, 자아정체감, 잠재력, 삶의 의미',
    icon: Brain,
    color: 'bg-indigo-500',
    path: '/ai-counseling-system/personal-psychology',
    category: 'assessment'
  },
  {
    id: 'interpersonal-relations',
    title: '대인관계 및 사회적응',
    description: '가족, 연인, 친구, 사회적 기술',
    icon: Users,
    color: 'bg-pink-500',
    path: '/ai-counseling-system/interpersonal-relations',
    category: 'assessment'
  },
  {
    id: 'emotional-mental-health',
    title: '정서 문제 및 정신 건강',
    description: '우울, 불안, 외상, 중독 문제',
    icon: Heart,
    color: 'bg-red-500',
    path: '/ai-counseling-system/emotional-mental-health',
    category: 'assessment'
  },
  {
    id: 'reality-life-management',
    title: '현실 문제 및 생활 관리',
    description: '진로, 경제, 건강, 일상생활',
    icon: Briefcase,
    color: 'bg-yellow-500',
    path: '/ai-counseling-system/reality-life-management',
    category: 'assessment'
  },
  {
    id: 'cultural-environmental',
    title: '문화 및 환경 적응',
    description: '다문화, 디지털 환경, 생애주기별 적응',
    icon: Globe,
    color: 'bg-teal-500',
    path: '/ai-counseling-system/cultural-environmental',
    category: 'assessment'
  },

  // 상담사 관리 시스템
  {
    id: 'counselor-dashboard',
    title: '상담사 대시보드',
    description: '내담자 현황 및 상담 진행 상황 관리',
    icon: BarChart3,
    color: 'bg-cyan-500',
    path: '/ai-counseling-system/counselor-dashboard',
    category: 'management'
  },
  {
    id: 'client-management',
    title: '내담자 관리',
    description: '내담자 프로필 및 상담 기록 관리',
    icon: UserCheck,
    color: 'bg-emerald-500',
    path: '/ai-counseling-system/client-management',
    category: 'management'
  },
  {
    id: 'risk-monitoring',
    title: '위험신호 모니터링',
    description: 'AI 기반 위험신호 감지 및 개입',
    icon: AlertTriangle,
    color: 'bg-rose-500',
    path: '/ai-counseling-system/risk-monitoring',
    category: 'management'
  },
  {
    id: 'session-scheduling',
    title: '상담 일정 관리',
    description: '상담 일정 예약 및 관리',
    icon: Calendar,
    color: 'bg-violet-500',
    path: '/ai-counseling-system/session-scheduling',
    category: 'management'
  },
  {
    id: 'ai-chat-counseling',
    title: 'AI 채팅 상담',
    description: 'AI 상담사와의 실시간 채팅 상담',
    icon: MessageCircle,
    color: 'bg-sky-500',
    path: '/ai-counseling-system/ai-chat-counseling',
    category: 'counseling'
  },
  {
    id: 'progress-analytics',
    title: '진행 상황 분석',
    description: '상담 진행 상황 및 효과 분석',
    icon: BarChart3,
    color: 'bg-lime-500',
    path: '/ai-counseling-system/progress-analytics',
    category: 'analytics'
  },
  {
    id: 'system-settings',
    title: '시스템 설정',
    description: 'AI 모델 및 시스템 설정 관리',
    icon: Settings,
    color: 'bg-gray-500',
    path: '/ai-counseling-system/system-settings',
    category: 'management'
  }
]

const categoryColors = {
  assessment: 'bg-blue-50 border-blue-200',
  counseling: 'bg-green-50 border-green-200',
  management: 'bg-purple-50 border-purple-200',
  analytics: 'bg-orange-50 border-orange-200'
}

const categoryLabels = {
  assessment: '심리검사',
  counseling: 'AI 상담',
  management: '관리 시스템',
  analytics: '분석 및 보고'
}

export default function AICounselingSystemPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categories = Array.from(new Set(menuItems.map(item => item.category)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI 심리상담 시스템
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                4단계 심리검사 프로그램 기반 통합 상담 플랫폼
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                보안 인증됨
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="기능 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item, index) => {
            const IconComponent = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 ${categoryColors[item.category]}`}
                onClick={() => window.location.href = item.path}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {categoryLabels[item.category as keyof typeof categoryLabels]}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    시작하기
                    <svg className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* 결과 없음 */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.591" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-gray-600">
              다른 검색어나 필터를 시도해보세요.
            </p>
          </div>
        )}
      </div>

      {/* 푸터 정보 */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                시스템 특징
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 4단계 체계적 심리검사</li>
                <li>• AI 기반 위험신호 감지</li>
                <li>• 실시간 상담 진행 관리</li>
                <li>• 통합 보고서 생성</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                보안 및 개인정보
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• HIPAA 준수 암호화</li>
                <li>• 개인정보 보호법 준수</li>
                <li>• 안전한 데이터 저장</li>
                <li>• 접근 권한 관리</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                지원 및 문의
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 24시간 기술 지원</li>
                <li>• 상담사 교육 프로그램</li>
                <li>• 시스템 업데이트 알림</li>
                <li>• 사용자 매뉴얼 제공</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
