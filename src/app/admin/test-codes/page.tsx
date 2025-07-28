'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface TestRecord {
  code: string;
  timestamp: string;
  testType: string;
  userData?: {
    birthYear?: number;
    gender?: string;
    name?: string;
    phone?: string;
    testDate?: string;
  };
}

interface YearMonthData {
  lastCode: string;
  records: TestRecord[];
}

interface CodeStorage {
  [yearMonth: string]: YearMonthData;
}

interface userData {
  name?: string; 
  birthYear?: number;
  gender?: string;
  testDate?: string;
}

export default function TestCodesPage() {
  const router = useRouter();
  const [codeData, setCodeData] = useState<CodeStorage>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYearMonth, setSelectedYearMonth] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });

  // 데이터 로드
  useEffect(() => {
    const fetchCodeData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/generate-test-code');
        
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setCodeData(data);
        
        // 기본적으로 첫 번째 항목 선택
        if (Object.keys(data).length > 0 && !selectedYearMonth) {
          setSelectedYearMonth(Object.keys(data)[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('데이터 로드 오류:', error);
        setError('코드 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    fetchCodeData();
  }, []);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // 검색된 레코드 필터링
  const getFilteredRecords = () => {
    if (!selectedYearMonth || !codeData[selectedYearMonth]) return [];
    
    const records = codeData[selectedYearMonth].records;
    
    if (!searchTerm) return records;
    
    return records.filter(record => {
      const searchFields = [
        record.code,
        record.testType,
        record.userData?.name || '',
        record.userData?.phone || '',
        record.userData?.gender || '',
        record.userData?.birthYear?.toString() || ''
      ];
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      return searchFields.some(field => field.toLowerCase().includes(lowerSearchTerm));
    });
  };

  // 년월 선택기 렌더링
  const renderYearMonthSelector = () => {
    return (
      <div className="flex mb-6 overflow-x-auto py-2">
        {Object.keys(codeData).map(yearMonth => (
          <button
            key={yearMonth}
            onClick={() => setSelectedYearMonth(yearMonth)}
            className={`px-4 py-2 rounded-lg mr-2 whitespace-nowrap ${
              selectedYearMonth === yearMonth
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {yearMonth} ({codeData[yearMonth]?.records?.length || 0}건)
          </button>
        ))}
      </div>
    );
  };

  // 레코드 목록 렌더링
  const renderRecords = () => {
    const filteredRecords = getFilteredRecords();
    
    if (filteredRecords.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? '검색 결과가 없습니다.' : '해당 기간에 생성된 코드가 없습니다.'}
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                코드
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                생성일시
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                검사유형
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이름
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                출생연도/성별
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                연락처
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record, index) => (
              <tr key={record.code + index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.code}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(record.timestamp)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.testType}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.userData?.name || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.userData?.birthYear ? `${record.userData.birthYear}년` : '-'}
                  {record.userData?.gender ? ` / ${record.userData.gender}` : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {record.userData?.phone || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
            검사 결과 코드 관리
          </h1>
          <motion.div 
            className="h-1 w-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mt-2"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          ></motion.div>
          <p className="mt-4 text-blue-100 max-w-2xl">
            생성된 검사 결과 코드를 관리하고 필요한 경우 삭제할 수 있습니다.
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
            {/* 검색 */}
            <div className="mb-6">
              <div className="relative rounded-md shadow-sm max-w-md">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full py-3 px-4 bg-white/10 border border-white/20 rounded-md text-white placeholder-blue-300/70 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="코드, 이름, 전화번호로 검색..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 년월 선택기 */}
            {renderYearMonthSelector()}
            
            {/* 현재 선택된 년월의 통계 */}
            {selectedYearMonth && codeData[selectedYearMonth] && (
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg shadow mb-6 border border-white/10">
                <div className="flex flex-wrap justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{selectedYearMonth} 기간 통계</h2>
                    <p className="text-blue-200">마지막 생성 코드: <span className="font-mono font-medium text-white">{codeData[selectedYearMonth].lastCode}</span></p>
                  </div>
                  <div className="text-blue-200">
                    총 <span className="font-semibold text-white">{codeData[selectedYearMonth].records.length}</span>개의 코드 생성됨
                  </div>
                </div>
              </div>
            )}
            
            {/* 레코드 목록 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow overflow-hidden border border-white/10">
              {renderRecords()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}