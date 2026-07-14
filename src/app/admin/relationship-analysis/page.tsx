'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, Scatter, ScatterChart, ZAxis
} from 'recharts';
import { ChartPieIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// 차트 색상
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
  '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090'
];

// MBTI 호환성 데이터
const mbtiCompatibilityData = [
  { mbti1: 'ISTJ', mbti2: 'ESFP', compatibility: 85, count: 32 },
  { mbti1: 'ISFJ', mbti2: 'ENTP', compatibility: 75, count: 28 },
  { mbti1: 'INFJ', mbti2: 'ENFP', compatibility: 95, count: 45 },
  { mbti1: 'INTJ', mbti2: 'ENFP', compatibility: 90, count: 38 },
  { mbti1: 'ISTP', mbti2: 'ESFJ', compatibility: 80, count: 30 },
  { mbti1: 'ISFP', mbti2: 'ENTJ', compatibility: 70, count: 25 },
  { mbti1: 'INFP', mbti2: 'ENFJ', compatibility: 92, count: 42 },
  { mbti1: 'INTP', mbti2: 'ENTJ', compatibility: 88, count: 35 },
  { mbti1: 'ESTP', mbti2: 'ISFJ', compatibility: 78, count: 27 },
  { mbti1: 'ESFP', mbti2: 'ISTJ', compatibility: 85, count: 32 }
];

// 관계 유형 분포
const relationshipTypeData = [
  { name: '친구', value: 45 },
  { name: '연인', value: 30 },
  { name: '가족', value: 15 },
  { name: '직장동료', value: 10 }
];

// MBTI 조합 분포 (산점도용)
const mbtiPairDistribution = mbtiCompatibilityData.map(item => ({
  x: item.count,
  y: item.compatibility,
  z: 10,
  name: `${item.mbti1}-${item.mbti2}`
}));

// 호환성 범주별 분포
const compatibilityRangeData = [
  { name: '매우 높음 (90-100%)', value: 15 },
  { name: '높음 (80-89%)', value: 25 },
  { name: '보통 (70-79%)', value: 35 },
  { name: '낮음 (60-69%)', value: 15 },
  { name: '매우 낮음 (0-59%)', value: 10 }
];

export default function RelationshipAnalysisPage() {
  const router = useRouter();
  const [selectedRelationship, setSelectedRelationship] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  
  // 관계 유형 선택 처리
  const handleRelationshipChange = (relationship: string) => {
    setSelectedRelationship(prevSelected => 
      prevSelected === relationship ? 'all' : relationship
    );
  };

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

  // 호환성 데이터 필터링 (관계 유형 선택 시)
  const filteredData = selectedRelationship === 'all'
    ? mbtiCompatibilityData
    : mbtiCompatibilityData.filter((_, index) => index < 5);

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
            관계성 분석
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            MBTI 유형 간의 관계성 및 호환성 분석 정보를 확인할 수 있습니다.
          </p>
        </motion.div>
        
        {/* 관계 유형 분포 및 필터 */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 bg-white/10 backdrop-blur-md rounded-xl p-5 shadow-lg border border-white/10"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2 text-blue-300" />
            관계 유형 분포
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={relationshipTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {relationshipTypeData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          opacity={selectedRelationship === entry.name ? 1 : selectedRelationship === 'all' ? 0.5 : 1}
                          onClick={() => handleRelationshipChange(entry.name)}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value, name) => [`${value}%`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-gray-300 text-sm">
                  관계 유형을 클릭하여 해당 데이터만 필터링할 수 있습니다.
                  {selectedRelationship !== 'all' && (
                    <span className="block mt-2 text-blue-300">
                      선택된 관계: <span className="font-medium">{selectedRelationship}</span>
                      <button 
                        className="ml-2 px-2 py-1 bg-blue-600/50 rounded-md text-xs"
                        onClick={() => handleRelationshipChange('all')}
                      >
                        초기화
                      </button>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="mbti1" 
                      name="MBTI 1" 
                      stroke="rgba(255, 255, 255, 0.5)"
                      tickFormatter={(value) => `${value}-${filteredData.find(item => item.mbti1 === value)?.mbti2}`}
                    />
                    <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value, name, props) => {
                        return [
                          name === 'compatibility' 
                            ? `${value}%` 
                            : value,
                          name === 'compatibility' 
                            ? '호환성' 
                            : '분석 수'
                        ];
                      }}
                      labelFormatter={(value) => {
                        const item = filteredData.find(item => item.mbti1 === value);
                        return `${item?.mbti1}-${item?.mbti2}`;
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#fff' }} />
                    <Bar dataKey="compatibility" name="호환성 (%)" fill="#8884d8">
                      {filteredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="count" name="분석 수" fill="#82ca9d">
                      {filteredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 