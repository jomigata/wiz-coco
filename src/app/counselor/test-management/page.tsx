'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Student {
  id: string;
  name: string;
  studentId: string;
  major: string;
  year: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  lastTestDate?: string;
  assignedTests: string[];
}

interface TestAssignment {
  id: string;
  studentId: string;
  testType: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export default function CounselorTestManagementPage() {
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: '김민수',
      studentId: '2024001',
      major: '컴퓨터공학과',
      year: '2024',
      email: 'minsu@university.edu',
      status: 'active',
      lastTestDate: '2024-01-15',
      assignedTests: ['ai-profiling', 'integrated-assessment']
    },
    {
      id: '2',
      name: '이지은',
      studentId: '2024002',
      major: '심리학과',
      year: '2024',
      email: 'jieun@university.edu',
      status: 'active',
      lastTestDate: '2024-01-10',
      assignedTests: ['ai-profiling']
    },
    {
      id: '3',
      name: '박준호',
      studentId: '2024003',
      major: '경영학과',
      year: '2024',
      email: 'junho@university.edu',
      status: 'pending',
      assignedTests: []
    }
  ]);

  const [testAssignments, setTestAssignments] = useState<TestAssignment[]>([
    {
      id: '1',
      studentId: '1',
      testType: 'ai-profiling',
      assignedDate: '2024-01-15',
      dueDate: '2024-01-25',
      status: 'completed',
      priority: 'high',
      notes: '신입생 적응 지원을 위한 기본 프로파일링'
    },
    {
      id: '2',
      studentId: '1',
      testType: 'integrated-assessment',
      assignedDate: '2024-01-15',
      dueDate: '2024-01-30',
      status: 'in_progress',
      priority: 'medium',
      notes: '전공 적합성 및 학습 스타일 분석'
    },
    {
      id: '3',
      studentId: '2',
      testType: 'ai-profiling',
      assignedDate: '2024-01-10',
      dueDate: '2024-01-20',
      status: 'completed',
      priority: 'high',
      notes: '기본 성격 분석 완료'
    }
  ]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    testType: '',
    dueDate: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    notes: ''
  });

  const testTypes = [
    { id: 'ai-profiling', name: 'AI 프로파일링', description: '캠퍼스 라이프 시크릿 리포트', duration: '15-20분' },
    { id: 'integrated-assessment', name: '통합 심리검사', description: '신입생 통합 심리검사', duration: '30-40분' },
    { id: 'personality-analysis', name: '성격 분석', description: 'MBTI 및 성격 5요인', duration: '20-25분' },
    { id: 'learning-style', name: '학습 스타일', description: '학습 방법 및 적성 분석', duration: '15-20분' },
    { id: 'stress-assessment', name: '스트레스 평가', description: '스트레스 관리 및 적응력', duration: '10-15분' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'inactive': return 'text-red-400 bg-red-400/20';
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleAssignTest = () => {
    if (!selectedStudent || !newAssignment.testType || !newAssignment.dueDate) return;

    const assignment: TestAssignment = {
      id: Date.now().toString(),
      studentId: selectedStudent.id,
      testType: newAssignment.testType,
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate: newAssignment.dueDate,
      status: 'pending',
      priority: newAssignment.priority,
      notes: newAssignment.notes
    };

    setTestAssignments(prev => [...prev, assignment]);
    
    // 학생의 할당된 검사 목록 업데이트
    setStudents(prev => prev.map(student => 
      student.id === selectedStudent.id 
        ? { ...student, assignedTests: [...student.assignedTests, newAssignment.testType] }
        : student
    ));

    setNewAssignment({ testType: '', dueDate: '', priority: 'medium', notes: '' });
    setShowAssignModal(false);
  };

  const getStudentAssignments = (studentId: string) => {
    return testAssignments.filter(assignment => assignment.studentId === studentId);
  };

  const getTestName = (testType: string) => {
    return testTypes.find(test => test.id === testType)?.name || testType;
  };

  return (
    <div className="bg-[#f8fafc] p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-3xl">
              👨‍⚕️
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">신입생 검사 관리 시스템</h1>
              <p className="text-slate-600 text-lg mt-2">2000명 신입생 통합 심리검사 관리</p>
            </div>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 text-xl">👥</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm">총 신입생</p>
                <p className="text-white text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xl">✅</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm">검사 완료</p>
                <p className="text-white text-2xl font-bold">
                  {testAssignments.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-yellow-400 text-xl">⏳</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm">진행 중</p>
                <p className="text-white text-2xl font-bold">
                  {testAssignments.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-xl">📋</span>
              </div>
              <div>
                <p className="text-slate-600 text-sm">대기 중</p>
                <p className="text-white text-2xl font-bold">
                  {testAssignments.filter(t => t.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 학생 목록 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">신입생 목록</h2>
            <div className="flex gap-3">
              <select className="px-4 py-2 bg-white/10 border border-slate-200 rounded-lg text-white">
                <option value="all">전체</option>
                <option value="active">활성</option>
                <option value="pending">대기</option>
                <option value="inactive">비활성</option>
              </select>
              <select className="px-4 py-2 bg-white/10 border border-slate-200 rounded-lg text-white">
                <option value="all">전공별</option>
                <option value="computer">컴퓨터공학과</option>
                <option value="psychology">심리학과</option>
                <option value="business">경영학과</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-gray-300 py-3 px-4">이름</th>
                  <th className="text-left text-gray-300 py-3 px-4">학번</th>
                  <th className="text-left text-gray-300 py-3 px-4">전공</th>
                  <th className="text-left text-gray-300 py-3 px-4">상태</th>
                  <th className="text-left text-gray-300 py-3 px-4">할당된 검사</th>
                  <th className="text-left text-gray-300 py-3 px-4">마지막 검사</th>
                  <th className="text-left text-gray-300 py-3 px-4">작업</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{student.studentId}</td>
                    <td className="py-4 px-4 text-gray-300">{student.major}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                        {student.status === 'active' ? '활성' : student.status === 'pending' ? '대기' : '비활성'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {student.assignedTests.map((testId, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {getTestName(testId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-300">{student.lastTestDate || '-'}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded hover:bg-cyan-500/30 transition-colors"
                        >
                          검사 할당
                        </button>
                        <button className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded hover:bg-blue-500/30 transition-colors">
                          결과 보기
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 검사 할당 모달 */}
        {showAssignModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">검사 할당</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-300 mb-2">학생: <span className="text-white font-semibold">{selectedStudent.name}</span></p>
                <p className="text-gray-300">학번: <span className="text-white">{selectedStudent.studentId}</span></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-sm mb-2">검사 유형</label>
                  <select
                    value={newAssignment.testType}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, testType: e.target.value }))}
                    className="w-full p-3 bg-white/10 border border-slate-200 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">검사를 선택하세요</option>
                    {testTypes.map((test) => (
                      <option key={test.id} value={test.id} className="bg-gray-800">
                        {test.name} - {test.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-sm mb-2">마감일</label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full p-3 bg-white/10 border border-slate-200 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-sm mb-2">우선순위</label>
                  <select
                    value={newAssignment.priority}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                    className="w-full p-3 bg-white/10 border border-slate-200 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="high" className="bg-gray-800">높음</option>
                    <option value="medium" className="bg-gray-800">보통</option>
                    <option value="low" className="bg-gray-800">낮음</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-sm mb-2">메모</label>
                  <textarea
                    value={newAssignment.notes}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="검사 할당 관련 메모를 입력하세요"
                    className="w-full p-3 bg-white/10 border border-slate-200 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAssignTest}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all"
                >
                  할당하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 검사 할당 버튼 */}
        {selectedStudent && !showAssignModal && (
          <div className="text-center">
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all duration-300"
            >
              {selectedStudent.name}에게 검사 할당하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
