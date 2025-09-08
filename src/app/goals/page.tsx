'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

export default function GoalsPage() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: '자기 이해 향상',
      description: 'MBTI를 통해 나의 성격 유형을 더 깊이 이해하고 수용하기',
      category: 'self-understanding',
      progress: 75,
      deadline: '2024-12-31',
      status: 'in-progress',
      tasks: [
        { id: 1, title: 'MBTI 검사 완료', completed: true },
        { id: 2, title: '성격 유형 분석 읽기', completed: true },
        { id: 3, title: '일일 성찰 일기 쓰기', completed: false },
        { id: 4, title: '전문가 상담 받기', completed: false }
      ]
    },
    {
      id: 2,
      title: '스트레스 관리 능력 향상',
      description: '일상적인 스트레스를 효과적으로 관리하는 방법 습득',
      category: 'stress-management',
      progress: 45,
      deadline: '2024-11-30',
      status: 'in-progress',
      tasks: [
        { id: 1, title: '스트레스 관리 강의 수강', completed: true },
        { id: 2, title: '명상 습관 만들기', completed: false },
        { id: 3, title: '운동 루틴 확립', completed: false },
        { id: 4, title: '호흡법 연습', completed: false }
      ]
    },
    {
      id: 3,
      title: '대인관계 개선',
      description: '가족, 친구, 동료와의 관계를 더 건강하게 발전시키기',
      category: 'relationships',
      progress: 30,
      deadline: '2025-02-28',
      status: 'in-progress',
      tasks: [
        { id: 1, title: '의사소통 기법 학습', completed: false },
        { id: 2, title: '공감 능력 향상 훈련', completed: false },
        { id: 3, title: '갈등 해결 방법 연습', completed: false },
        { id: 4, title: '정기적인 관계 점검', completed: false }
      ]
    }
  ]);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'self-understanding',
    deadline: ''
  });

  const categories = [
    { id: 'self-understanding', name: '자기 이해', icon: '🧠', color: 'blue' },
    { id: 'stress-management', name: '스트레스 관리', icon: '😌', color: 'green' },
    { id: 'relationships', name: '대인관계', icon: '🤝', color: 'purple' },
    { id: 'career', name: '직업/진로', icon: '💼', color: 'orange' },
    { id: 'health', name: '건강', icon: '🏃‍♀️', color: 'red' },
    { id: 'learning', name: '학습/성장', icon: '📚', color: 'indigo' }
  ];

  const addGoal = () => {
    if (newGoal.title && newGoal.description && newGoal.deadline) {
      const goal = {
        id: Date.now(),
        ...newGoal,
        progress: 0,
        status: 'in-progress',
        tasks: []
      };
      setGoals([...goals, goal]);
      setNewGoal({ title: '', description: '', category: 'self-understanding', deadline: '' });
      setShowAddGoal(false);
    }
  };

  const updateProgress = (goalId: number, taskId: number, completed: boolean) => {
    setGoals(goals.map(goal => {
      if (goal.id === goalId) {
        const updatedTasks = goal.tasks.map(task => 
          task.id === taskId ? { ...task, completed } : task
        );
        const completedTasks = updatedTasks.filter(task => task.completed).length;
        const progress = updatedTasks.length > 0 ? Math.round((completedTasks / updatedTasks.length) * 100) : 0;
        return { ...goal, tasks: updatedTasks, progress };
      }
      return goal;
    }));
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || 'gray';
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.icon || '📋';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || '기타';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* 헤더 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 목표 설정
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            개인적인 성장과 발전을 위한 목표를 설정하고 관리하세요.
            체계적인 계획과 추적을 통해 목표 달성을 도와드립니다.
          </p>
        </motion.div>

        {/* 전체 진행률 */}
        <motion.div 
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 전체 목표 진행률
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {goals.length}
              </div>
              <div className="text-gray-600">총 목표</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {goals.filter(g => g.progress === 100).length}
              </div>
              <div className="text-gray-600">완료된 목표</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {goals.filter(g => g.progress > 0 && g.progress < 100).length}
              </div>
              <div className="text-gray-600">진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(goals.reduce((acc, goal) => acc + goal.progress, 0) / goals.length)}%
              </div>
              <div className="text-gray-600">평균 진행률</div>
            </div>
          </div>
        </motion.div>

        {/* 목표 추가 버튼 */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button
            onClick={() => setShowAddGoal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 shadow-lg"
          >
            ✨ 새 목표 추가하기
          </button>
        </motion.div>

        {/* 목표 추가 모달 */}
        {showAddGoal && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">새 목표 추가</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    목표 제목
                  </label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="목표를 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    목표 설명
                  </label>
                  <textarea
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="목표에 대한 자세한 설명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    목표 기한
                  </label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={addGoal}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 목표 목록 */}
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {goals.map((goal, index) => (
            <motion.div
              key={goal.id}
              className="bg-white rounded-xl shadow-lg p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-${getCategoryColor(goal.category)}-100`}>
                    {getCategoryIcon(goal.category)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{goal.title}</h3>
                    <p className="text-gray-600">{goal.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{getCategoryName(goal.category)}</span>
                      <span>•</span>
                      <span>기한: {goal.deadline}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{goal.progress}%</div>
                  <div className="text-sm text-gray-500">진행률</div>
                </div>
              </div>

              {/* 진행률 바 */}
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`bg-gradient-to-r from-${getCategoryColor(goal.category)}-500 to-${getCategoryColor(goal.category)}-600 h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* 세부 작업 목록 */}
              {goal.tasks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">세부 작업</h4>
                  <div className="space-y-2">
                    {goal.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => updateProgress(goal.id, task.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3 mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  세부 작업 추가
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  목표 수정
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  삭제
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 목표 달성 팁 */}
        <motion.div 
          className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-4">
            💡 목표 달성을 위한 팁
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-2">SMART 원칙</h3>
              <ul className="text-sm space-y-1 text-green-100">
                <li>• Specific (구체적)</li>
                <li>• Measurable (측정 가능)</li>
                <li>• Achievable (달성 가능)</li>
                <li>• Relevant (관련성)</li>
                <li>• Time-bound (시간 제한)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2">성공 전략</h3>
              <ul className="text-sm space-y-1 text-green-100">
                <li>• 작은 단계로 나누기</li>
                <li>• 정기적인 점검</li>
                <li>• 성취감 기록하기</li>
                <li>• 필요시 목표 조정</li>
                <li>• 지지 체계 활용</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 