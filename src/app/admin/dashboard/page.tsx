'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PrefixData {
  code: string;
  name: string;
  description: string;
  count: number;
  lastGenerated: string | null;
  active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [prefixes, setPrefixes] = useState<PrefixData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCodes, setTotalCodes] = useState(0);
  const [activePrefixes, setActivePrefixes] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  
  // 애니메이션 변수
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
  
  // 접두사 데이터 로드
  useEffect(() => {
    const loadPrefixData = async () => {
      try {
        setLoading(true);
        // API 호출
        const response = await fetch('/api/test-prefix');
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.prefixes && Array.isArray(data.prefixes)) {
            setPrefixes(data.prefixes);
            
            // 통계 계산
            const totalCount = data.prefixes.reduce((sum: number, prefix: PrefixData) => sum + (prefix.count || 0), 0);
            const activeCount = data.prefixes.filter((prefix: PrefixData) => prefix.active).length;
            
            setTotalCodes(totalCount);
            setActivePrefixes(activeCount);
            setLastUpdate(data.lastUpdated || null);
          }
        } else {
          // API 오류 처리
          setError('접두사 데이터를 불러오는데 실패했습니다.');
          
          // 개발용 기본 데이터
          setPrefixes([
            { code: 'MP', name: '전문가용 MBTI 검사', description: '전문가용', count: 245, lastGenerated: new Date().toISOString(), active: true },
            { code: 'MA', name: '개인용 MBTI 검사', description: '개인용', count: 612, lastGenerated: new Date().toISOString(), active: true },
            { code: 'MG', name: '그룹형 MBTI 검사', description: '그룹용', count: 183, lastGenerated: new Date().toISOString(), active: true },
            { code: 'EP', name: '전문가용 이고-오케이 검사', description: '전문가용', count: 97, lastGenerated: new Date().toISOString(), active: true },
            { code: 'EA', name: '개인용 이고-오케이 검사', description: '개인용', count: 128, lastGenerated: new Date().toISOString(), active: true },
            { code: 'EG', name: '그룹형 이고-오케이 검사', description: '그룹용', count: 46, lastGenerated: new Date().toISOString(), active: true },
            { code: 'AP', name: '전문가용 애니어그램 검사', description: '전문가용', count: 76, lastGenerated: new Date().toISOString(), active: true },
            { code: 'AA', name: '개인용 애니어그램 검사', description: '개인용', count: 134, lastGenerated: new Date().toISOString(), active: true },
            { code: 'AG', name: '그룹형 애니어그램 검사', description: '그룹용', count: 51, lastGenerated: new Date().toISOString(), active: true },
          ]);
          
          // 기본 데이터로 통계 계산
          setTotalCodes(1572);
          setActivePrefixes(9);
          setLastUpdate(new Date().toISOString());
        }
      } catch (error) {
        console.error('접두사 데이터 로드 오류:', error);
        setError('데이터 로드 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPrefixData();
  }, []);

  // 바 차트 데이터 생성
  const barChartData = {
    labels: prefixes.map(prefix => prefix.code),
    datasets: [
      {
        label: '코드 생성 수',
        data: prefixes.map(prefix => prefix.count || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // 검사 유형별 분포 (MBTI, 이고-오케이, 애니어그램)
  const testTypeData = {
    // M: MBTI, E: 이고-오케이, A: 애니어그램
    labels: ['MBTI 검사', '이고-오케이 검사', '애니어그램 검사'],
    datasets: [
      {
        label: '검사 유형별 코드 생성 수',
        data: [
          prefixes.filter(p => p.code.startsWith('M')).reduce((sum, prefix) => sum + (prefix.count || 0), 0),
          prefixes.filter(p => p.code.startsWith('E')).reduce((sum, prefix) => sum + (prefix.count || 0), 0),
          prefixes.filter(p => p.code.startsWith('A')).reduce((sum, prefix) => sum + (prefix.count || 0), 0),
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* 배경 장식 요소 */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-40 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 right-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        
        {/* 타이틀 섹션 */}
        <motion.div 
          className="mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-purple-300">
            통계 대시보드
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            코드 접두사 사용 통계 및 시스템 데이터를 시각화하여 볼 수 있습니다.
          </p>
        </motion.div>
        
        {loading ? (
          <motion.div 
            className="flex items-center justify-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-white/20">
              <div className="w-16 h-16 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xl text-blue-200">데이터를 불러오는 중입니다...</p>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div 
            className="py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-8 text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 text-red-300 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl text-red-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600/70 hover:bg-blue-600/90 text-white rounded-lg font-medium transition-all"
              >
                다시 시도
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* 통계 요약 카드 */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-blue-200 mb-2">총 생성 코드 수</h3>
                <p className="text-3xl font-bold text-white">{totalCodes.toLocaleString()}</p>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-blue-200 mb-2">접두사 유형 수</h3>
                <p className="text-3xl font-bold text-white">{prefixes.length}</p>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-blue-200 mb-2">활성 접두사 수</h3>
                <p className="text-3xl font-bold text-white">{activePrefixes}</p>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6"
                variants={itemVariants}
              >
                <h3 className="text-lg font-semibold text-blue-200 mb-2">마지막 업데이트</h3>
                <p className="text-lg font-medium text-white">{formatDate(lastUpdate)}</p>
              </motion.div>
            </motion.div>
            
            {/* 차트 섹션 - 기존 차트 컴포넌트는 유지하고 컨테이너만 수정 */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">접두사별 코드 생성 수</h3>
                <div className="bg-white/5 rounded-lg p-4" style={{ height: '300px' }}>
                  <Bar 
                    data={barChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const index = context.dataIndex;
                              const prefix = prefixes[index];
                              return `${prefix.name}: ${prefix.count || 0}개`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">검사 유형별 분포</h3>
                <div className="bg-white/5 rounded-lg p-4 flex items-center justify-center" style={{ height: '300px' }}>
                  <Pie 
                    data={testTypeData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const value = context.raw as number;
                              const percentage = (value / totalCodes * 100).toFixed(1);
                              return `${context.label}: ${value}개 (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </motion.div>
            
            {/* 테이블 섹션 */}
            <motion.div 
              className="bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">접두사 상세 통계</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">코드</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">이름</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">생성 수</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-blue-300 uppercase tracking-wider">마지막 생성</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-blue-300 uppercase tracking-wider">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {prefixes.map((prefix, index) => (
                      <motion.tr 
                        key={prefix.code}
                        className="hover:bg-blue-800/20 transition-all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.2 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">{prefix.code}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">{prefix.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200 text-right font-mono">{prefix.count.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200 text-center">{formatDate(prefix.lastGenerated)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            prefix.active 
                              ? 'bg-green-900/30 text-green-300 border border-green-500/30' 
                              : 'bg-red-900/30 text-red-300 border border-red-500/30'
                          }`}>
                            {prefix.active ? '활성' : '비활성'}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            
            {/* 액션 버튼 */}
            <motion.div 
              className="flex justify-end mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/admin/test-prefix"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-700/30 hover:shadow-blue-700/50 transition-all flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                접두사 관리로 이동
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
} 