import React from 'react';
import { formatDate } from '@/utils/dateUtils';

// 인증 코드 인터페이스
interface VerificationCode {
  id: string;
  email: string;
  code: string;
  expires: string;
  createdAt: string;
}

interface VerificationCodeTableProps {
  codes: VerificationCode[];
  onDelete: (codeId: string) => void;
  isExpired: (expiresDate: string) => boolean;
}

const VerificationCodeTable: React.FC<VerificationCodeTableProps> = ({
  codes,
  onDelete,
  isExpired
}) => {
  if (!codes || codes.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-lg text-center">
        <p className="text-blue-200">등록된 인증 코드가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full bg-white/10 backdrop-blur-sm">
        <thead>
          <tr className="border-b border-white/20">
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              이메일
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              인증 코드
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              만료 시간
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              생성 시간
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
              상태
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-blue-200 uppercase tracking-wider">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {codes.map((code) => (
            <tr key={code.id} className="hover:bg-white/5">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                {code.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-600/50 text-white">
                  {code.code}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                {formatDate(code.expires)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                {formatDate(code.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {isExpired(code.expires) ? (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-600/50 text-white">
                    만료됨
                  </span>
                ) : (
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-600/50 text-white">
                    유효함
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <button
                  onClick={() => onDelete(code.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="인증 코드 삭제"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VerificationCodeTable; 