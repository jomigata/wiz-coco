'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { generateTestCode } from '@/utils/testCodeGenerator';

const mbtiTypes = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
];

export default function GroupMbtiPage() {
  const router = useRouter();
  const [members, setMembers] = useState([
    { id: 1, name: '', mbti: '' }
  ]);
  const [groupName, setGroupName] = useState('');

  const addMember = () => {
    const newId = members.length + 1;
    setMembers([...members, { id: newId, name: '', mbti: '' }]);
  };

  const removeMember = (id: number) => {
    if (members.length > 1) {
      setMembers(members.filter(member => member.id !== id));
    }
  };

  const updateMember = (id: number, field: 'name' | 'mbti', value: string) => {
    setMembers(members.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 폼 유효성 검사
    if (!groupName.trim()) {
      alert('그룹명을 입력해주세요.');
      return;
    }

    const validMembers = members.filter(member => member.name.trim() && member.mbti);
    if (validMembers.length < 2) {
      alert('최소 2명 이상의 팀원 정보를 입력해주세요.');
      return;
    }

    // 테스트 코드 생성
    const testCode = generateTestCode('GROUP');
    
    // 결과 데이터 구성
    const testData = {
      testType: '그룹형 MBTI 검사',
      code: testCode,
      timestamp: new Date().toISOString(),
      groupName: groupName,
      members: validMembers,
      userData: {
        name: '게스트 사용자',
        email: 'guest@example.com',
        testType: '그룹형 MBTI 검사'
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

    // 결과 페이지로 이동 (임시로 메인 페이지로 이동)
    alert('그룹형 MBTI 분석이 완료되었습니다. 마이페이지에서 결과를 확인하세요.');
    router.push('/mypage?tab=records');
  };

  return (
    <>
      <Navigation />
      
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                그룹형 MBTI 분석
              </h1>
              <p className="text-lg text-gray-200">
                팀원들의 MBTI 유형을 분석하여 팀 내 소통과 협업을 향상시키세요
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 그룹명 입력 */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    그룹명 *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="예: 개발팀, 마케팅팀, 스터디그룹"
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                {/* 팀원 정보 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-white font-medium">
                      팀원 정보 *
                    </label>
                    <button
                      type="button"
                      onClick={addMember}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      + 팀원 추가
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div key={member.id} className="flex gap-4 items-center p-4 bg-white/10 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                            placeholder={`팀원 ${index + 1} 이름`}
                            className="w-full px-3 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div className="flex-1">
                          <select
                            value={member.mbti}
                            onChange={(e) => updateMember(member.id, 'mbti', e.target.value)}
                            className="w-full px-3 py-2 rounded bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="">MBTI 선택</option>
                            {mbtiTypes.map(type => (
                              <option key={type} value={type} className="text-gray-800">
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(member.id)}
                            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 분석 시작 버튼 */}
                <div className="text-center pt-6">
                  <button
                    type="submit"
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
                  >
                    그룹 분석 시작하기
                  </button>
                </div>
              </form>
            </div>

            {/* 안내 정보 */}
            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">분석 결과에서 확인할 수 있는 내용</h3>
              <div className="grid md:grid-cols-2 gap-4 text-gray-200">
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">팀 역학 분석</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 팀 내 성격 유형 분포</li>
                    <li>• 잠재적 갈등 지점</li>
                    <li>• 협업 시너지 포인트</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">소통 개선 방안</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 각 유형별 소통 스타일</li>
                    <li>• 효과적인 회의 진행법</li>
                    <li>• 갈등 해결 전략</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}