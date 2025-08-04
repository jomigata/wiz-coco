'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// 차트 색상
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
  '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090'
];

// MBTI 성격 유형 설명
const mbtiDescriptions = {
  ISTJ: "신중하고 조용하며 집중력이 강하고 매우 책임감이 강합니다.",
  ISFJ: "조용하고 친근하며 책임감이 강하고 양심적입니다.",
  INFJ: "창의적이고 통찰력이 뛰어나며 이상주의적입니다.",
  INTJ: "독창적인 사고를 가지고 내부적인 비전을 실현시키는 전략가입니다.",
  ISTP: "논리적이고 분석적이며 실용적으로 문제를 해결합니다.",
  ISFP: "온화하고 민감하며 겸손하고 헌신적입니다.",
  INFP: "이상주의적이고 충실하며 적응력이 뛰어납니다.",
  INTP: "논리적이고 독창적이며 이론적인 아이디어에 관심이 많습니다.",
  ESTP: "활동적이고 사교적이며 실용적인 문제 해결사입니다.",
  ESFP: "열정적이고 친절하며 사교적이고 즉흥적입니다.",
  ENFP: "따뜻하고 열정적이며 창의적이고 가능성을 중요시합니다.",
  ENTP: "재빠르고 독창적이며 다재다능하고 논쟁을 즐깁니다.",
  ESTJ: "실용적이고 현실적이며 사실적이고 조직적입니다.",
  ESFJ: "마음이 따뜻하고 양심적이며 조화를 중요시합니다.",
  ENFJ: "따뜻하고 적극적이며 책임감이 강하고 사교성이 높습니다.",
  ENTJ: "솔직하고 결단력이 있으며 리더십이 있고 계획적입니다."
};

// MBTI 유형 분포 데이터
const mbtiDistribution = [
  { name: 'ISTJ', value: 32, ratio: 11.6 },
  { name: 'ISFJ', value: 28, ratio: 13.8 },
  { name: 'INFJ', value: 15, ratio: 1.5 },
  { name: 'INTJ', value: 12, ratio: 2.1 },
  { name: 'ISTP', value: 18, ratio: 5.4 },
  { name: 'ISFP', value: 20, ratio: 8.8 },
  { name: 'INFP', value: 22, ratio: 4.4 },
  { name: 'INTP', value: 17, ratio: 3.3 },
  { name: 'ESTP', value: 14, ratio: 4.3 },
  { name: 'ESFP', value: 19, ratio: 8.5 },
  { name: 'ENFP', value: 23, ratio: 8.1 },
  { name: 'ENTP', value: 16, ratio: 3.2 },
  { name: 'ESTJ', value: 21, ratio: 8.7 },
  { name: 'ESFJ', value: 24, ratio: 12.3 },
  { name: 'ENFJ', value: 18, ratio: 2.5 },
  { name: 'ENTJ', value: 13, ratio: 1.8 }
];

// MBTI 유형 특성 데이터
const mbtiTraits = [
  { subject: '외향성(E)', A: 55, B: 45 },
  { subject: '감각(S)', A: 73, B: 27 },
  { subject: '사고(T)', A: 40, B: 60 },
  { subject: '판단(J)', A: 55, B: 45 }
];

// MBTI 유형 추세 데이터
const mbtiTrends = [
  { month: '1월', ISTJ: 28, ISFJ: 25, INFJ: 12, INTJ: 10, ISTP: 15 },
  { month: '2월', ISTJ: 30, ISFJ: 27, INFJ: 14, INTJ: 11, ISTP: 16 },
  { month: '3월', ISTJ: 32, ISFJ: 28, INFJ: 15, INTJ: 12, ISTP: 18 },
  { month: '4월', ISTJ: 35, ISFJ: 30, INFJ: 16, INTJ: 14, ISTP: 20 },
  { month: '5월', ISTJ: 33, ISFJ: 29, INFJ: 14, INTJ: 13, ISTP: 19 },
  { month: '6월', ISTJ: 31, ISFJ: 27, INFJ: 13, INTJ: 11, ISTP: 17 }
];

// 척도별 분석 데이터
const dimensionScores = [
  { name: '외향성(E)', score: 45, fullmark: 100 },
  { name: '감각(S)', score: 73, fullmark: 100 },
  { name: '사고(T)', score: 40, fullmark: 100 },
  { name: '판단(J)', score: 55, fullmark: 100 },
  { name: '내향성(I)', score: 55, fullmark: 100 },
  { name: '직관(N)', score: 27, fullmark: 100 },
  { name: '감정(F)', score: 60, fullmark: 100 },
  { name: '인식(P)', score: 45, fullmark: 100 }
];

export default function MbtiAnalysisPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('mbti-analysis');
  const [selectedMbti, setSelectedMbti] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  
  // MBTI 유형 선택 처리
  const handleMbtiChange = (mbti: string) => {
    setSelectedMbti(mbti);
    
    if (mbti !== 'all') {
      // 선택한 MBTI에 대한 상세 데이터 로드 (실제 구현에서는 API 호출)
      setIsLoading(true);
      setTimeout(() => {
        setDetailData({
          type: mbti,
          description: mbtiDescriptions[mbti as keyof typeof mbtiDescriptions],
          count: mbtiDistribution.find(item => item.name === mbti)?.value || 0,
          ratio: mbtiDistribution.find(item => item.name === mbti)?.ratio || 0,
          characteristics: [
            "분석적 사고", "논리적 판단", "체계적 접근", "독립적 성향", "객관적 시각"
          ],
          strengths: [
            "문제 해결 능력", "논리적 사고", "전략적 계획", "분석적 통찰", "독립적 업무 수행"
          ],
          weaknesses: [
            "감정 표현 어려움", "변화에 대한 저항", "지나친 완벽주의", "사회적 상호작용 부족", "융통성 부족"
          ]
        });
        setIsLoading(false);
      }, 500);
    } else {
      setDetailData(null);
    }
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
            MBTI 분석
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            MBTI 검사 결과에 대한 상세 분석 정보를 확인할 수 있습니다.
          </p>
        </motion.div>
        
        {/* 필터 섹션 */}
        <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/10">
          <div className="flex items-center">
            <div>
              <label htmlFor="mbtiType" className="block text-sm font-medium text-gray-300 mb-1">
                MBTI 유형 선택
              </label>
              <select
                id="mbtiType"
                value={selectedMbti}
                onChange={(e) => handleMbtiChange(e.target.value)}
                className="bg-blue-600/40 border border-blue-400/30 rounded px-3 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  backgroundColor: '#1d4ed8'
                }}
              >
                <option value="all" style={{backgroundColor: '#1e40af', color: 'white'}}>모든 유형</option>
                {mbtiDistribution.map(item => (
                  <option key={item.name} value={item.name} style={{backgroundColor: '#1e40af', color: 'white'}}>{item.name}</option>
                ))}
              </select>
            </div>
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
            {/* MBTI 유형별 분포 차트 */}
            {!detailData && (
              <>
                <motion.div
                  variants={itemVariants}
                  className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5 mb-8"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">MBTI 유형별 분포</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mbtiDistribution}
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
                        <Bar dataKey="value" name="검사 수" fill="#8884d8">
                          {mbtiDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* MBTI 특성 분포 차트 */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
                  >
                    <h2 className="text-xl font-semibold text-white mb-4">MBTI 특성 분포</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={mbtiTraits}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis dataKey="subject" stroke="rgba(255, 255, 255, 0.5)" />
                          <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ color: '#fff' }} />
                          <Bar dataKey="A" name="유형 A (%)" fill="#8884d8" />
                          <Bar dataKey="B" name="유형 B (%)" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                  
                  {/* 주요 유형 추세 차트 */}
                  <motion.div
                    variants={itemVariants}
                    className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
                  >
                    <h2 className="text-xl font-semibold text-white mb-4">주요 유형 추세</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mbtiTrends}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                          <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ color: '#fff' }} />
                          <Line type="monotone" dataKey="ISTJ" stroke="#8884d8" strokeWidth={2} />
                          <Line type="monotone" dataKey="ISFJ" stroke="#82ca9d" strokeWidth={2} />
                          <Line type="monotone" dataKey="INFJ" stroke="#ffc658" strokeWidth={2} />
                          <Line type="monotone" dataKey="INTJ" stroke="#ff8042" strokeWidth={2} />
                          <Line type="monotone" dataKey="ISTP" stroke="#a4de6c" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                </div>
                
                {/* 척도별 분석 차트 (레이더 차트) */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5"
                >
                  <h2 className="text-xl font-semibold text-white mb-4">MBTI 특성 척도 분포</h2>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={150} width={730} height={350} data={dimensionScores}>
                        <PolarGrid stroke="rgba(255, 255, 255, 0.3)" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(255, 255, 255, 0.8)' }} />
                        <PolarRadiusAxis stroke="rgba(255, 255, 255, 0.3)" />
                        <Radar name="검사 결과 비율" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </>
            )}
            
            {/* 특정 MBTI 유형 선택 시 상세 정보 */}
            {detailData && (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                {/* 유형 설명 카드 */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5">
                  <h2 className="text-2xl font-bold text-white mb-2">{detailData.type} 유형</h2>
                  <p className="text-blue-200 mb-4">전체 검사 중 {detailData.ratio}% 차지 ({detailData.count}명)</p>
                  <div className="text-white mb-6">
                    <p className="mb-4">{detailData.description}</p>
                    
                    <h3 className="text-lg font-semibold text-blue-300 mt-4 mb-2">주요 특성</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {detailData.characteristics.map((item: string, index: number) => (
                        <li key={index} className="text-gray-200">{item}</li>
                      ))}
                    </ul>
                    
                    <h3 className="text-lg font-semibold text-blue-300 mt-4 mb-2">강점</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {detailData.strengths.map((item: string, index: number) => (
                        <li key={index} className="text-gray-200">{item}</li>
                      ))}
                    </ul>
                    
                    <h3 className="text-lg font-semibold text-blue-300 mt-4 mb-2">약점</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {detailData.weaknesses.map((item: string, index: number) => (
                        <li key={index} className="text-gray-200">{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* 월별 추세 차트 */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-5">
                  <h2 className="text-xl font-semibold text-white mb-4">{detailData.type} 유형 월별 추세</h2>
                  <div className="h-72 mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mbtiTrends}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                        <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ color: '#fff' }} />
                        <Line 
                          type="monotone" 
                          dataKey={detailData.type} 
                          stroke="#8884d8" 
                          strokeWidth={3}
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* 추가 분석 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-300 mb-2">검사 평균 시간</h3>
                      <p className="text-2xl font-bold text-white">12분 35초</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-300 mb-2">평균 연령</h3>
                      <p className="text-2xl font-bold text-white">28.5세</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-300 mb-2">성별 비율</h3>
                      <p className="text-2xl font-bold text-white">남성 45% / 여성 55%</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-300 mb-2">검사 완료율</h3>
                      <p className="text-2xl font-bold text-white">93.2%</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
} 