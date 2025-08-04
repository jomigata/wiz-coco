import React from 'react';
import { formatDate } from '@/utils/dateUtils';

// 사용자 인터페이스 정의
interface User {
  id: string;
  name: string;
  email: string;
  mbti: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count?: {
    testResults: number;
    mbtiTests: number;
  };
}

interface UserTableProps {
  users: User[];
  isLoading?: boolean;
  onViewDetails: (userId: string) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading = false,
  onViewDetails,
  onEditUser,
  onDeleteUser
}) => {
  if (isLoading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
          <p className="mt-4 text-blue-200">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }
  
  if (!users || users.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg text-center">
        <p className="text-blue-200">등록된 사용자가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full bg-white/10 backdrop-blur-sm">
        <thead>
          <tr className="border-b border-white/20">
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              이름
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              이메일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              MBTI
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              가입일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              마지막 로그인
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              검사 기록
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-blue-200 uppercase tracking-wider">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-white/5">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                {user.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                {user.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {user.mbti ? (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-600/50 text-white">
                    {user.mbti}
                  </span>
                ) : (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-600/50 text-gray-300">
                    미설정
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : '로그인 기록 없음'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-600/50 text-white">
                    검사: {user._count?.testResults || 0}
                  </span>
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-600/50 text-white">
                    MBTI: {user._count?.mbtiTests || 0}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => onViewDetails(user.id)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="상세 정보"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onEditUser(user)}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    title="정보 수정"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteUser(user.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="사용자 삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable; 