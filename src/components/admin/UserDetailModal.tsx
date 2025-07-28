import React from 'react';
import { formatDate } from '@/utils/dateUtils';

// 테스트 결과 인터페이스
interface TestResult {
  id: string;
  code: string;
  testType: string;
  testDate: string;
  mbtiType: string | null;
}

// MBTI 테스트 인터페이스
interface MbtiTest {
  id: string;
  result: string;
  testedAt: string;
  testType: string;
}

// 사용자 상세 정보 인터페이스
interface UserDetail {
  id: string;
  name: string;
  email: string;
  mbti: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  testResults: TestResult[];
  mbtiTests: MbtiTest[];
}

interface UserDetailModalProps {
  user: UserDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-gradient-to-br from-gray-800 to-blue-900 rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden border border-white/10">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            사용자 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* 사용자 기본 정보 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/20 pb-2">
              기본 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-blue-200 text-sm">이름</p>
                <p className="text-white">{user.name}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">이메일</p>
                <p className="text-white">{user.email}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">MBTI</p>
                <p className="text-white">{user.mbti || '미설정'}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">가입일</p>
                <p className="text-white">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">마지막 로그인</p>
                <p className="text-white">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : '로그인 기록 없음'}
                </p>
              </div>
            </div>
          </div>

          {/* MBTI 테스트 결과 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/20 pb-2">
              MBTI 검사 기록
            </h3>
            {user.mbtiTests && user.mbtiTests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-blue-200 text-sm">
                      <th className="pb-2">검사 유형</th>
                      <th className="pb-2">MBTI 결과</th>
                      <th className="pb-2">검사일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {user.mbtiTests.map((test) => (
                      <tr key={test.id} className="text-white">
                        <td className="py-2">{test.testType}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 text-xs rounded-full bg-indigo-600/50">
                            {test.result}
                          </span>
                        </td>
                        <td className="py-2">{formatDate(test.testedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-blue-200">MBTI 검사 기록이 없습니다.</p>
            )}
          </div>

          {/* 전체 테스트 결과 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-4 border-b border-white/20 pb-2">
              검사 결과
            </h3>
            {user.testResults && user.testResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-blue-200 text-sm">
                      <th className="pb-2">검사 코드</th>
                      <th className="pb-2">검사 유형</th>
                      <th className="pb-2">MBTI 결과</th>
                      <th className="pb-2">검사일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {user.testResults.map((result) => (
                      <tr key={result.id} className="text-white">
                        <td className="py-2">{result.code}</td>
                        <td className="py-2">{result.testType}</td>
                        <td className="py-2">
                          {result.mbtiType ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-600/50">
                              {result.mbtiType}
                            </span>
                          ) : (
                            <span className="text-gray-400">결과 없음</span>
                          )}
                        </td>
                        <td className="py-2">{formatDate(result.testDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-blue-200">검사 결과가 없습니다.</p>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="bg-white/5 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal; 