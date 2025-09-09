"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { FaUsers, FaSearch, FaFilter, FaPlus, FaEye, FaEdit, FaPhone, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { shouldShowCounselorMenu } from '@/utils/roleUtils';
import RoleGuard from '@/components/RoleGuard';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  joinDate: string;
  lastSession: string;
  status: 'active' | 'inactive' | 'completed';
  nextAppointment?: string;
  totalSessions: number;
  mbtiType?: string;
  notes: string;
}

// 샘플 데이터
const sampleClients: Client[] = [
  {
    id: '1',
    name: '김민수',
    email: 'minsu.kim@email.com',
    phone: '010-1234-5678',
    age: 28,
    gender: '남성',
    joinDate: '2024-01-15',
    lastSession: '2024-01-20',
    status: 'active',
    nextAppointment: '2024-01-25',
    totalSessions: 8,
    mbtiType: 'INTJ',
    notes: '직장 스트레스로 인한 상담 시작. 진전이 좋음.'
  },
  {
    id: '2',
    name: '이지은',
    email: 'jieun.lee@email.com',
    phone: '010-2345-6789',
    age: 32,
    gender: '여성',
    joinDate: '2023-11-10',
    lastSession: '2024-01-18',
    status: 'active',
    nextAppointment: '2024-01-26',
    totalSessions: 12,
    mbtiType: 'ENFP',
    notes: '관계 문제로 상담 중. 커뮤니케이션 개선에 집중.'
  },
  {
    id: '3',
    name: '박준호',
    email: 'junho.park@email.com',
    phone: '010-3456-7890',
    age: 25,
    gender: '남성',
    joinDate: '2023-09-05',
    lastSession: '2024-01-10',
    status: 'completed',
    totalSessions: 15,
    mbtiType: 'ISFJ',
    notes: '목표 달성으로 상담 완료. 추후 필요시 재연결 가능.'
  },
  {
    id: '4',
    name: '최수진',
    email: 'sujin.choi@email.com',
    phone: '010-4567-8901',
    age: 29,
    gender: '여성',
    joinDate: '2024-01-08',
    lastSession: '2024-01-22',
    status: 'active',
    nextAppointment: '2024-01-28',
    totalSessions: 3,
    mbtiType: 'ESTP',
    notes: '새로운 내담자. 적응 과정 중.'
  }
];

function ClientsPageContent() {
  const [clients, setClients] = useState<Client[]>(sampleClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'lastSession'>('name');

  // 필터링 및 정렬
  const filteredClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'joinDate':
          return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
        case 'lastSession':
          return new Date(b.lastSession).getTime() - new Date(a.lastSession).getTime();
        default:
          return 0;
      }
    });

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-yellow-500 text-white';
      case 'completed':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return '활성';
      case 'inactive':
        return '비활성';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };


  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
      <Navigation />
      <div className="h-20"></div>
      
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* 페이지 헤더 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-blue-200 to-purple-300 inline-block drop-shadow-lg">
                내담자 관리
              </h1>
              <motion.div 
                className="h-1.5 w-32 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full mt-2 shadow-lg"
                initial={{ width: 0 }}
                animate={{ width: 128 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              ></motion.div>
            </div>
            <Link
              href="/counselor/clients/new"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              새 내담자 추가
            </Link>
          </div>
        </motion.div>

        {/* 검색 및 필터 */}
        <motion.div
          className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
              <input
                type="text"
                placeholder="내담자 이름이나 이메일로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all" className="bg-gray-800">전체 상태</option>
                <option value="active" className="bg-gray-800">활성</option>
                <option value="inactive" className="bg-gray-800">비활성</option>
                <option value="completed" className="bg-gray-800">완료</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name" className="bg-gray-800">이름순</option>
                <option value="joinDate" className="bg-gray-800">가입일순</option>
                <option value="lastSession" className="bg-gray-800">최근 상담순</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* 내담자 목록 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 hover:border-white/40 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{client.name}</h3>
                    <p className="text-blue-200 text-sm">{client.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                  {getStatusText(client.status)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-blue-200">
                  <FaPhone className="w-4 h-4" />
                  <span className="text-sm">{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span className="text-sm">{client.age}세, {client.gender}</span>
                </div>
                {client.mbtiType && (
                  <div className="flex items-center gap-2 text-blue-200">
                    <span className="text-sm font-medium">MBTI: {client.mbtiType}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-sm text-blue-300 mb-1">상담 정보</div>
                <div className="text-sm text-blue-200">
                  총 {client.totalSessions}회 상담 • 마지막: {new Date(client.lastSession).toLocaleDateString('ko-KR')}
                </div>
                {client.nextAppointment && (
                  <div className="text-sm text-green-300 mt-1">
                    다음 상담: {new Date(client.nextAppointment).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-sm text-blue-300 mb-1">메모</div>
                <p className="text-sm text-blue-200 line-clamp-2">{client.notes}</p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/counselor/clients/${client.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <FaEye className="w-4 h-4" />
                  상세보기
                </Link>
                <Link
                  href={`/counselor/clients/${client.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <FaEdit className="w-4 h-4" />
                  수정
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredClients.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <FaUsers className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">내담자가 없습니다</h3>
            <p className="text-blue-200 mb-4">검색 조건에 맞는 내담자가 없습니다.</p>
            <Link
              href="/counselor/clients/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              새 내담자 추가
            </Link>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function ClientsPage() {
  return (
    <RoleGuard allowedRoles={['counselor']}>
      <ClientsPageContent />
    </RoleGuard>
  );
}
