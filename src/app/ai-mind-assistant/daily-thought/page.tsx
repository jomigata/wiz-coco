"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface ThoughtEntry {
  id: string;
  thought: string;
  timestamp: Date;
  mood: number;
  tags: string[];
}

export default function DailyThoughtPage() {
  const [thought, setThought] = useState('');
  const [mood, setMood] = useState(3);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [thoughts, setThoughts] = useState<ThoughtEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    '기쁨', '감사', '사랑', '희망', '열정', '평온', '슬픔', '걱정', '화남', '스트레스',
    '피로', '에너지', '동기부여', '성장', '도전', '성공', '실패', '학습', '관계', '자기계발'
  ];

  const moodLabels = ['매우 나쁨', '나쁨', '보통', '좋음', '매우 좋음'];

  useEffect(() => {
    // 로컬 스토리지에서 기존 생각들 불러오기
    const savedThoughts = localStorage.getItem('daily-thoughts');
    if (savedThoughts) {
      try {
        const parsed = JSON.parse(savedThoughts);
        setThoughts(parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp)
        })));
      } catch (error) {
        console.error('저장된 생각 불러오기 실패:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thought.trim()) return;

    setIsSubmitting(true);

    try {
      const newThought: ThoughtEntry = {
        id: Date.now().toString(),
        thought: thought.trim(),
        timestamp: new Date(),
        mood,
        tags: selectedTags
      };

      const updatedThoughts = [newThought, ...thoughts];
      setThoughts(updatedThoughts);
      
      // 로컬 스토리지에 저장
      localStorage.setItem('daily-thoughts', JSON.stringify(updatedThoughts));

      // 폼 초기화
      setThought('');
      setMood(3);
      setSelectedTags([]);

      // 성공 메시지 표시
      alert('오늘의 생각이 기록되었습니다! 💭');
    } catch (error) {
      console.error('생각 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Navigation />
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-6">
          <Link href="/ai-mind-assistant" className="inline-flex items-center text-blue-100 hover:text-white mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            AI 마음 비서로 돌아가기
          </Link>
          <h1 className="text-4xl font-bold mb-2">💭 한 줄 생각 남기기</h1>
          <p className="text-xl text-blue-100">
            오늘 하루 당신의 마음을 한 줄로 표현해보세요
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 입력 폼 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">오늘의 생각 기록하기</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 생각 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  오늘의 생각을 자유롭게 적어주세요
                </label>
                <textarea
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="예: 오늘은 새로운 도전을 시작하는 날이었다. 조금은 긴장되지만 설렌다."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={200}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {thought.length}/200
                </div>
              </div>

              {/* 기분 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  오늘의 기분은 어떠신가요?
                </label>
                <div className="flex items-center gap-4">
                  {[1, 2, 3, 4, 5].map((moodLevel) => (
                    <button
                      key={moodLevel}
                      type="button"
                      onClick={() => setMood(moodLevel)}
                      className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 ${
                        mood === moodLevel
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {moodLevel === 1 ? '😢' : 
                         moodLevel === 2 ? '😔' : 
                         moodLevel === 3 ? '😐' : 
                         moodLevel === 4 ? '😊' : '😄'}
                      </div>
                      <span className="text-xs font-medium">{moodLabels[moodLevel - 1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 태그 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  관련된 감정이나 상황을 선택해주세요 (선택사항)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={!thought.trim() || isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                {isSubmitting ? '저장 중...' : '💭 생각 기록하기'}
              </button>
            </form>
          </div>

          {/* 기록된 생각들 */}
          {thoughts.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">기록된 생각들</h3>
              <div className="space-y-4">
                {thoughts.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {entry.mood === 1 ? '😢' : 
                           entry.mood === 2 ? '😔' : 
                           entry.mood === 3 ? '😐' : 
                           entry.mood === 4 ? '😊' : '😄'}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(entry.timestamp)}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {entry.mood}/5
                      </div>
                    </div>
                    
                    <p className="text-gray-800 text-lg leading-relaxed mb-3">
                      {entry.thought}
                    </p>
                    
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 분석 제안 */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🤖 AI 분석 제안</h3>
            <p className="text-gray-600 mb-4">
              기록된 생각들을 AI가 분석하여 감정 변화 패턴과 인사이트를 제공해드립니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/ai-mind-assistant/emotion-diary" className="bg-white p-4 rounded-xl border border-indigo-200 hover:border-indigo-300 transition-colors">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-gray-800 mb-1">감정 변화 분석</h4>
                <p className="text-sm text-gray-600">기록된 생각들의 감정 패턴 분석</p>
              </Link>
              <Link href="/ai-mind-assistant/emotion-report" className="bg-white p-4 rounded-xl border border-indigo-200 hover:border-indigo-300 transition-colors">
                <div className="text-2xl mb-2">📋</div>
                <h4 className="font-semibold text-gray-800 mb-1">AI 감정 리포트</h4>
                <p className="text-sm text-gray-600">종합적인 감정 분석 결과</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
