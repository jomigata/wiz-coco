'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'MBTI 검사',
      type: 'test',
      date: '2024-01-15',
      time: '14:00',
      duration: 30,
      description: 'MBTI 성격 유형 검사 진행',
      completed: true
    },
    {
      id: 2,
      title: '상담 예약',
      type: 'counseling',
      date: '2024-01-20',
      time: '10:00',
      duration: 60,
      description: '전문가와의 1:1 상담',
      completed: false
    },
    {
      id: 3,
      title: '스트레스 관리 강의',
      type: 'learning',
      date: '2024-01-25',
      time: '19:00',
      duration: 45,
      description: '온라인 스트레스 관리 강의',
      completed: false
    }
  ]);

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'test',
    date: '',
    time: '',
    duration: 30,
    description: ''
  });

  const eventTypes = [
    { id: 'test', name: '심리검사', icon: '🧠', color: 'blue' },
    { id: 'counseling', name: '상담', icon: '💬', color: 'green' },
    { id: 'learning', name: '학습', icon: '📚', color: 'purple' },
    { id: 'goal', name: '목표', icon: '🎯', color: 'orange' },
    { id: 'reminder', name: '알림', icon: '⏰', color: 'red' }
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const addEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      const event = {
        id: Date.now(),
        ...newEvent,
        completed: false
      };
      setEvents([...events, event]);
      setNewEvent({ title: '', type: 'test', date: '', time: '', duration: 30, description: '' });
      setShowAddEvent(false);
    }
  };

  const toggleEventComplete = (eventId: number) => {
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, completed: !event.completed } : event
    ));
  };

  const deleteEvent = (eventId: number) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const days = [];
  
  // 이전 달의 마지막 날들
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  
  // 현재 달의 날들
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getEventTypeColor = (type: string) => {
    const eventType = eventTypes.find(et => et.id === type);
    return eventType?.color || 'gray';
  };

  const getEventTypeIcon = (type: string) => {
    const eventType = eventTypes.find(et => et.id === type);
    return eventType?.icon || '📋';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50"><div className="container mx-auto px-4 py-8 pt-20">
        {/* 헤더 */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📅 일정 관리
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            심리검사, 상담, 학습 등 모든 일정을 체계적으로 관리하세요.
            정기적인 점검과 계획을 통해 건강한 마음을 유지할 수 있습니다.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 캘린더 */}
          <motion.div 
            className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* 캘린더 헤더 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ←
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                →
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center py-2 text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="h-24 bg-gray-50 rounded-lg"></div>;
                }

                const dateString = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                const dayEvents = getEventsForDate(dateString);
                const isSelected = selectedDate.toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                return (
                  <div
                    key={index}
                    className={`h-24 p-1 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected ? 'bg-blue-100 border-blue-300' :
                      isToday ? 'bg-yellow-50 border-yellow-300' :
                      'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                  >
                    <div className={`text-sm font-medium ${
                      isSelected ? 'text-blue-700' :
                      isToday ? 'text-yellow-700' :
                      'text-gray-900'
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${
                            event.completed ? 'bg-green-100 text-green-800' :
                            `bg-${getEventTypeColor(event.type)}-100 text-${getEventTypeColor(event.type)}-800`
                          }`}
                        >
                          {getEventTypeIcon(event.type)} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 2}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* 사이드바 */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* 새 일정 추가 버튼 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <button
                onClick={() => setShowAddEvent(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300"
              >
                ✨ 새 일정 추가
              </button>
            </div>

            {/* 선택된 날짜의 일정 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📅 {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </h3>
              
              <div className="space-y-3">
                {getEventsForDate(formatDate(selectedDate)).map(event => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      event.completed ? 'bg-green-50 border-green-400' :
                      `bg-${getEventTypeColor(event.type)}-50 border-${getEventTypeColor(event.type)}-400`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={event.completed}
                          onChange={() => toggleEventComplete(event.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className={`font-medium ${event.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {event.title}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        삭제
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      ⏰ {event.time} ({event.duration}분)
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {event.description}
                    </div>
                  </div>
                ))}
                
                {getEventsForDate(formatDate(selectedDate)).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    이 날 예정된 일정이 없습니다.
                  </p>
                )}
              </div>
            </div>

            {/* 이번 주 통계 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📊 이번 주 통계
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">총 일정</span>
                  <span className="font-bold text-blue-600">{events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">완료된 일정</span>
                  <span className="font-bold text-green-600">{events.filter(e => e.completed).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">남은 일정</span>
                  <span className="font-bold text-orange-600">{events.filter(e => !e.completed).length}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 일정 추가 모달 */}
        {showAddEvent && (
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">새 일정 추가</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일정 제목
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="일정을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    일정 유형
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                    className="select-theme-light w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      날짜
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시간
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    소요 시간 (분)
                  </label>
                  <input
                    type="number"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({...newEvent, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="15"
                    step="15"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="일정에 대한 설명을 입력하세요"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={addEvent}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  추가
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 