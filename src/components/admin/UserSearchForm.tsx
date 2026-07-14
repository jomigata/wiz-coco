import React, { useState } from 'react';

interface UserSearchFormProps {
  onSearch: (searchTerm: string) => void;
}

const UserSearchForm: React.FC<UserSearchFormProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md">
      <div className="relative flex-grow">
        <input
          type="text"
          className="w-full pl-10 pr-4 py-2 rounded-l-lg bg-blue-500/20 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="이름, 이메일 또는 MBTI로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg 
            className="w-5 h-5 text-gray-400" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        검색
      </button>
    </form>
  );
};

export default UserSearchForm; 