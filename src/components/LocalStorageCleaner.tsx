'use client';

import React, { useState } from 'react';

const LocalStorageCleaner = () => {
  const [message, setMessage] = useState<string>('');

  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      setMessage('로컬 스토리지가 초기화되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('로컬 스토리지 초기화 중 오류 발생:', error);
      setMessage('로컬 스토리지 초기화 중 오류가 발생했습니다.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <button 
        onClick={clearLocalStorage}
        className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        임시 데이터 초기화
      </button>
      {message && (
        <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default LocalStorageCleaner; 