import React from 'react';

interface ReconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string;
  status: string;
}

const ReconnectModal: React.FC<ReconnectModalProps> = ({ isOpen, onClose, logs, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-xl w-full max-h-[80vh] flex flex-col dark:bg-gray-800 dark:text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">서버 재연결 상태</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <div className="font-medium mb-2">상태: <span className="text-emerald-600 dark:text-emerald-400">{status}</span></div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-md overflow-y-auto flex-grow dark:bg-gray-700">
          <pre className="text-sm whitespace-pre-wrap">
            {logs}
          </pre>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReconnectModal; 