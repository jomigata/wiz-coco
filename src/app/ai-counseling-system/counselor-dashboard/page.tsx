'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  FileText, 
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
  Bell,
  Shield,
  Heart,
  Brain,
  Briefcase,
  Globe,
  Target,
  Star,
  Zap
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'at-risk' | 'completed'
  lastSession: string
  nextSession: string
  totalSessions: number
  riskLevel: 'low' | 'medium' | 'high'
  currentGoals: string[]
  progress: number
  avatar?: string
}

interface RiskAlert {
  id: string
  clientId: string
  clientName: string
  type: 'suicidal' | 'self-harm' | 'depression' | 'anxiety' | 'substance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  acknowledged: boolean
}

interface Session {
  id: string
  clientId: string
  clientName: string
  date: string
  time: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  notes?: string
  goals?: string[]
}

// 가상의 데이터
const mockClients: Client[] = [
  {
    id: '1',
    name: '김민수',
    email: 'minsu@example.com',
    phone: '010-1234-5678',
    status: 'active',
    lastSession: '2024-01-15',
    nextSession: '2024-01-22',
    totalSessions: 8,
    riskLevel: 'low',
    currentGoals: ['소통 기술 향상', '갈등 해결'],
    progress: 65
  },
  {
    id: '2',
    name: '이영희',
    email: 'younghee@example.com',
    phone: '010-2345-6789',
    status: 'at-risk',
    lastSession: '2024-01-10',
    nextSession: '2024-01-17',
    totalSessions: 12,
    riskLevel: 'high',
    currentGoals: ['우울감 완화', '자존감 향상'],
    progress: 45
  },
  {
    id: '3',
    name: '박철수',
    email: 'chulsoo@example.com',
    phone: '010-3456-7890',
    status: 'active',
    lastSession: '2024-01-14',
    nextSession: '2024-01-21',
    totalSessions: 5,
    riskLevel: 'medium',
    currentGoals: ['스트레스 관리', '직장 적응'],
    progress: 30
  },
  {
    id: '4',
    name: '정수진',
    email: 'sujin@example.com',
    phone: '010-4567-8901',
    status: 'completed',
    lastSession: '2024-01-08',
    nextSession: '',
    totalSessions: 20,
    riskLevel: 'low',
    currentGoals: ['완료'],
    progress: 100
  }
]

const mockRiskAlerts: RiskAlert[] = [
  {
    id: '1',
    clientId: '2',
    clientName: '이영희',
    type: 'depression',
    severity: 'high',
    message: '우울감 지수가 위험 수준에 도달했습니다. 즉시 개입이 필요합니다.',
    timestamp: '2024-01-16 14:30',
    acknowledged: false
  },
  {
    id: '2',
    clientId: '3',
    clientName: '박철수',
    type: 'anxiety',
    severity: 'medium',
    message: '불안 수준이 평소보다 높게 측정되었습니다.',
    timestamp: '2024-01-16 10:15',
    acknowledged: true
  }
]

const mockSessions: Session[] = [
  {
    id: '1',
    clientId: '1',
    clientName: '김민수',
    date: '2024-01-22',
    time: '14:00',
    duration: 50,
    status: 'scheduled'
  },
  {
    id: '2',
    clientId: '2',
    clientName: '이영희',
    date: '2024-01-17',
    time: '16:00',
    duration: 50,
    status: 'scheduled'
  },
  {
    id: '3',
    clientId: '3',
    clientName: '박철수',
    date: '2024-01-21',
    time: '10:00',
    duration: 50,
    status: 'scheduled'
  }
]

export default function CounselorDashboardPage() {
  const [clients, setClients] = useState<Client[]>(mockClients)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>(mockRiskAlerts)
  const [sessions, setSessions] = useState<Session[]>(mockSessions)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clients' | 'alerts' | 'sessions'>('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const unacknowledgedAlerts = riskAlerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = riskAlerts.filter(alert => alert.severity === 'critical')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'at-risk': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      case 'critical': return 'bg-red-200 text-red-900'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const acknowledgeAlert = (alertId: string) => {
    setRiskAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Clock
      case 'completed': return CheckCircle
      case 'cancelled': return XCircle
      case 'no-show': return XCircle
      default: return Clock
    }
  }

  const getStatusColorForSession = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no-show': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                상담사 대시보드
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                내담자 관리 및 상담 진행 상황 모니터링
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                {unacknowledgedAlerts.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unacknowledgedAlerts.length}
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">김상담사</div>
                <div className="text-xs text-gray-500">상담심리사</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: '개요', icon: TrendingUp },
                { id: 'clients', label: '내담자 관리', icon: Users },
                { id: 'alerts', label: '위험 신호', icon: AlertTriangle },
                { id: 'sessions', label: '상담 일정', icon: Calendar }
              ].map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      selectedTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="h-5 w-5 mr-2" />
                    {tab.label}
                    {tab.id === 'alerts' && unacknowledgedAlerts.length > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unacknowledgedAlerts.length}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* 개요 탭 */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-500">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">총 내담자</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">활성 내담자</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter(c => c.status === 'active').length}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-red-500">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">위험 신호</p>
                    <p className="text-2xl font-bold text-gray-900">{unacknowledgedAlerts.length}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">오늘 상담</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessions.filter(s => s.date === '2024-01-16').length}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 위험 신호 알림 */}
            {criticalAlerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-red-50 border border-red-200 rounded-xl p-6"
              >
                <div className="flex items-center mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-semibold text-red-900">
                    긴급 개입 필요
                  </h3>
                </div>
                <div className="space-y-3">
                  {criticalAlerts.map(alert => (
                    <div key={alert.id} className="bg-white rounded-lg p-4 border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-red-900">{alert.clientName}</h4>
                          <p className="text-red-700 text-sm">{alert.message}</p>
                          <p className="text-red-600 text-xs">{alert.timestamp}</p>
                        </div>
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 최근 활동 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                최근 활동
              </h3>
              <div className="space-y-4">
                {sessions.slice(0, 3).map(session => {
                  const StatusIcon = getStatusIcon(session.status)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <StatusIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{session.clientName}</p>
                          <p className="text-sm text-gray-600">{session.date} {session.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorForSession(session.status)}`}>
                        {session.status === 'scheduled' ? '예정' : 
                         session.status === 'completed' ? '완료' : 
                         session.status === 'cancelled' ? '취소' : '무단결석'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}

        {/* 내담자 관리 탭 */}
        {selectedTab === 'clients' && (
          <div className="space-y-6">
            {/* 필터 및 검색 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="내담자 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="at-risk">위험</option>
                  <option value="completed">완료</option>
                </select>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  새 내담자
                </button>
              </div>
            </div>

            {/* 내담자 목록 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        내담자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        위험도
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        진행률
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        다음 상담
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client, index) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {client.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                            {client.status === 'active' ? '활성' :
                             client.status === 'inactive' ? '비활성' :
                             client.status === 'at-risk' ? '위험' : '완료'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(client.riskLevel)}`}>
                            {client.riskLevel === 'low' ? '낮음' :
                             client.riskLevel === 'medium' ? '보통' : '높음'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${client.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{client.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.nextSession || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 위험 신호 탭 */}
        {selectedTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                위험 신호 모니터링
              </h3>
              <div className="space-y-4">
                {riskAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`border rounded-lg p-4 ${
                      alert.acknowledged ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-semibold text-gray-900 mr-3">{alert.clientName}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                            {alert.severity === 'low' ? '낮음' :
                             alert.severity === 'medium' ? '보통' :
                             alert.severity === 'high' ? '높음' : '긴급'}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{alert.message}</p>
                        <p className="text-sm text-gray-500">{alert.timestamp}</p>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          확인
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 상담 일정 탭 */}
        {selectedTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  상담 일정 관리
                </h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  새 일정
                </button>
              </div>
              <div className="space-y-4">
                {sessions.map((session, index) => {
                  const StatusIcon = getStatusIcon(session.status)
                  return (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <StatusIcon className="h-5 w-5 text-gray-600 mr-3" />
                          <div>
                            <h4 className="font-semibold text-gray-900">{session.clientName}</h4>
                            <p className="text-sm text-gray-600">{session.date} {session.time} ({session.duration}분)</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColorForSession(session.status)}`}>
                            {session.status === 'scheduled' ? '예정' : 
                             session.status === 'completed' ? '완료' : 
                             session.status === 'cancelled' ? '취소' : '무단결석'}
                          </span>
                          <button className="text-blue-600 hover:text-blue-900">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
