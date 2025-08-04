'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ChartPieIcon,
  CalendarDaysIcon,
  AdjustmentsHorizontalIcon,
  MapIcon
} from '@heroicons/react/24/outline';

// MBTI 타입 분포 데이터
const mbtiDistribution = [
  { name: 'ISTJ', value: 32 },
  { name: 'ISFJ', value: 28 },
  { name: 'INFJ', value: 15 },
  { name: 'INTJ', value: 12 },
  { name: 'ISTP', value: 18 },
  { name: 'ISFP', value: 20 },
  { name: 'INFP', value: 22 },
  { name: 'INTP', value: 17 },
  { name: 'ESTP', value: 14 },
  { name: 'ESFP', value: 19 },
  { name: 'ENFP', value: 23 },
  { name: 'ENTP', value: 16 },
  { name: 'ESTJ', value: 21 },
  { name: 'ESFJ', value: 24 },
  { name: 'ENFJ', value: 18 },
  { name: 'ENTJ', value: 13 }
];

// 검사 트렌드 데이터
const testTrendData = [
  { name: '1월', mbti: 65, enneagram: 42, egoOk: 35 },
  { name: '2월', mbti: 78, enneagram: 48, egoOk: 40 },
  { name: '3월', mbti: 82, enneagram: 52, egoOk: 45 },
  { name: '4월', mbti: 70, enneagram: 60, egoOk: 50 },
  { name: '5월', mbti: 85, enneagram: 55, egoOk: 55 },
  { name: '6월', mbti: 90, enneagram: 62, egoOk: 60 },
  { name: '7월', mbti: 95, enneagram: 68, egoOk: 65 },
  { name: '8월', mbti: 102, enneagram: 72, egoOk: 70 },
  { name: '9월', mbti: 110, enneagram: 80, egoOk: 75 },
  { name: '10월', mbti: 125, enneagram: 85, egoOk: 82 },
  { name: '11월', mbti: 132, enneagram: 90, egoOk: 86 },
  { name: '12월', mbti: 150, enneagram: 95, egoOk: 90 }
];

// 연령대별 검사 분포
const ageDistribution = [
  { name: '10대', value: 15 },
  { name: '20대', value: 35 },
  { name: '30대', value: 25 },
  { name: '40대', value: 15 },
  { name: '50대 이상', value: 10 }
];

// 사용 환경 분포
const deviceDistribution = [
  { name: '데스크톱', value: 40 },
  { name: '모바일', value: 55 },
  { name: '태블릿', value: 5 }
];

// 검사 완료 시간 분포
const completionTimeData = [
  { name: '5분 이하', count: 22 },
  { name: '5-10분', count: 38 },
  { name: '10-15분', count: 28 },
  { name: '15-20분', count: 18 },
  { name: '20분 이상', count: 12 }
];

// 차트 색상
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
  '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090',
  '#58508d', '#003f5c', '#665191', '#a05195', '#d45087',
  '#f95d6a', '#ff7c43', '#ffa600'
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('analytics');
  const [activeTimeframe, setActiveTimeframe] = useState('month');
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // 애니메이션 설정
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  // 필터 변경 핸들러
  const handleTimeframeChange = (timeframe: string) => {
    setActiveTimeframe(timeframe);
    // 여기서 실제로는 API 호출해서 데이터를 갱신할 수 있음
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    // 여기서 실제로는 API 호출해서 데이터를 갱신할 수 있음
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* 타이틀 섹션 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300">
            데이터 분석
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            검사 데이터 분석 및 다양한 통계 정보를 확인할 수 있습니다.
          </p>
        </motion.div>
        
        {/* 필터 섹션 */}
        <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/10">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="timeframe" className="block text-sm font-medium text-gray-300 mb-1">
                기간 선택
              </label>
              <select
                id="timeframe"
                value={activeTimeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="bg-blue-600/40 border border-blue-400/30 rounded px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: '#1d4ed8'
                }}
              >
                <option value="week" style={{backgroundColor: '#1e40af', color: 'white'}}>주간</option>
                <option value="month" style={{backgroundColor: '#1e40af', color: 'white'}}>월간</option>
                <option value="quarter" style={{backgroundColor: '#1e40af', color: 'white'}}>분기</option>
                <option value="year" style={{backgroundColor: '#1e40af', color: 'white'}}>연간</option>
                <option value="all" style={{backgroundColor: '#1e40af', color: 'white'}}>전체 기간</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="testType" className="block text-sm font-medium text-gray-300 mb-1">
                검사 유형
              </label>
              <select
                id="testType"
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="bg-blue-600/40 border border-blue-400/30 rounded px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: '#1d4ed8'
                }}
              >
                <option value="all" style={{backgroundColor: '#1e40af', color: 'white'}}>모든 검사</option>
                <option value="mbti" style={{backgroundColor: '#1e40af', color: 'white'}}>MBTI 검사</option>
                <option value="enneagram" style={{backgroundColor: '#1e40af', color: 'white'}}>애니어그램 검사</option>
                <option value="ego" style={{backgroundColor: '#1e40af', color: 'white'}}>이고-오케이 검사</option>
              </select>
            </div>
            
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center mt-6"
              onClick={() => {}}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              필터 적용
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
              <p className="mt-4 text-blue-200">데이터 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 주요 차트 섹션 - 검사 트렌드 */}
            <motion.div 
              variants={itemVariants}
              className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5 mb-8"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-blue-300" />
                검사 트렌드 (월별)
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={testTrendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <Line type="monotone" dataKey="mbti" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} name="MBTI 검사" />
                    <Line type="monotone" dataKey="enneagram" stroke="#82ca9d" strokeWidth={2} name="애니어그램 검사" />
                    <Line type="monotone" dataKey="egoOk" stroke="#ffc658" strokeWidth={2} name="이고-오케이 검사" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
            
            {/* MBTI 유형 분포 및 완료 시간 차트 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <motion.div 
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <MapIcon className="h-6 w-6 mr-2 text-blue-300" />
                  MBTI 유형 분포
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mbtiDistribution}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis type="number" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis dataKey="name" type="category" stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Bar dataKey="value" name="검사 수" radius={[0, 4, 4, 0]}>
                        {mbtiDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-300" />
                  검사 완료 시간 분포
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={completionTimeData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255, 255, 255, 0.5)" />
                      <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                      <Bar dataKey="count" name="응답자 수" fill="#8884d8">
                        {completionTimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
            
            {/* 연령대 및 기기 분포 (파이 차트) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div 
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ChartPieIcon className="h-6 w-6 mr-2 text-blue-300" />
                  연령대별 검사 분포
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ageDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {ageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value, name) => [`${value}명`, name]}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
              
              <motion.div 
                variants={itemVariants}
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
              >
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <ChartBarIcon className="h-6 w-6 mr-2 text-blue-300" />
                  기기별 검사 분포
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value, name) => [`${value}%`, name]}
                      />
                      <Legend wrapperStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 