"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';

const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

const relationshipTypes = [
  { id: 'couple', label: '연인 관계' },
  { id: 'friend', label: '친구 관계' },
  { id: 'family', label: '가족 관계' },
  { id: 'colleague', label: '직장 동료' },
  { id: 'team', label: '팀 관계' }
];

export default function InsideMbtiPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    person1: {
      name: '',
      mbti: ''
    },
    person2: {
      name: '',
      mbti: ''
    },
    relationshipType: ''
  });

  // 로그인 체크 제거 - 모든 사용자가 검사 가능하도록 수정

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!form.person1.name || !form.person1.mbti || !form.person2.name || !form.person2.mbti || !form.relationshipType) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    // 테스트 코드 생성
    const testCode = generateTestCode('INSIDE_MBTI');
    
    // 결과 데이터 구성
    const testData = {
      testType: 'Inside MBTI 검사',
      code: testCode,
      timestamp: new Date().toISOString(),
      form: form,
      userData: {
        name: '게스트 사용자',
        email: 'guest@example.com',
        testType: 'Inside MBTI 검사'
      }
    };

    // 로컬 스토리지에 결과 저장
    if (typeof window !== 'undefined') {
      // 기존 테스트 기록 가져오기
      const existingRecords = localStorage.getItem('test_records');
      let records = existingRecords ? JSON.parse(existingRecords) : [];
      
      // 새 기록 추가
      records.push(testData);
      
      // 최대 50개까지만 유지
      if (records.length > 50) {
        records = records.slice(-50);
      }
      
      // 저장
      localStorage.setItem('test_records', JSON.stringify(records));
      localStorage.setItem(`test-result-${testCode}`, JSON.stringify(testData));
    }

    // 결과 페이지로 이동
    const resultPath = `/tests/inside-mbti/result?code=${encodeURIComponent(testCode)}`;
    router.push(resultPath);
  };

  return (
    <>
      <Navigation />
      
      <div className="bg-blue-950 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 text-center">
              Inside MBTI 검사
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 첫 번째 사람 정보 */}
              <div className="bg-blue-900/30 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">첫 번째 사람</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-200 mb-2">이름</label>
                    <input
                      type="text"
                      value={form.person1.name}
                      onChange={(e) => setForm({...form, person1: {...form.person1, name: e.target.value}})}
                      className="w-full p-3 bg-blue-800/50 border border-blue-600 rounded-lg text-white placeholder-blue-300"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 mb-2">MBTI</label>
                    <select
                      value={form.person1.mbti}
                      onChange={(e) => setForm({...form, person1: {...form.person1, mbti: e.target.value}})}
                      className="w-full p-3 bg-blue-800/50 border border-blue-600 rounded-lg text-white"
                    >
                      <option value="">MBTI 선택</option>
                      {mbtiTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 두 번째 사람 정보 */}
              <div className="bg-blue-900/30 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">두 번째 사람</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-200 mb-2">이름</label>
                    <input
                      type="text"
                      value={form.person2.name}
                      onChange={(e) => setForm({...form, person2: {...form.person2, name: e.target.value}})}
                      className="w-full p-3 bg-blue-800/50 border border-blue-600 rounded-lg text-white placeholder-blue-300"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 mb-2">MBTI</label>
                    <select
                      value={form.person2.mbti}
                      onChange={(e) => setForm({...form, person2: {...form.person2, mbti: e.target.value}})}
                      className="w-full p-3 bg-blue-800/50 border border-blue-600 rounded-lg text-white"
                    >
                      <option value="">MBTI 선택</option>
                      {mbtiTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 관계 유형 */}
              <div className="bg-blue-900/30 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">관계 유형</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {relationshipTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm({...form, relationshipType: type.id})}
                      className={`p-3 rounded-lg border transition-colors ${
                        form.relationshipType === type.id
                          ? 'bg-blue-600 border-blue-400 text-white'
                          : 'bg-blue-800/50 border-blue-600 text-blue-200 hover:bg-blue-800/70'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="text-center">
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  관계 분석 시작
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
} 