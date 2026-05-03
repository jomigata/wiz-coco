import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmColor?: 'red' | 'green' | 'blue' | 'indigo' | 'purple';
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  confirmColor = 'blue',
  icon,
  loading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 배경 블러 */}
          <div className="absolute inset-0 bg-slate-950" />
          {/* 모달 카드 */}
          <motion.div
            className="relative max-w-md w-full rounded-2xl shadow-2xl border border-slate-700 bg-slate-900 p-8 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* 아이콘 */}
            <div className="flex justify-center mb-4">
              {icon || (
                <svg className="w-12 h-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              )}
            </div>
            {/* 타이틀 */}
            <h2 className="text-2xl font-extrabold text-white text-center mb-2">
              {title}
            </h2>
            {/* 설명 */}
            <p className="text-lg text-slate-200 text-center mb-8 whitespace-pre-line">
              {description}
            </p>
            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2 rounded-lg font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-600 shadow"
                disabled={loading}
                type="button"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`px-5 py-2 rounded-lg font-semibold shadow-lg transition-all flex items-center
                  ${
                    confirmColor === 'red'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : confirmColor === 'green'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }
                `}
                disabled={loading}
                type="button"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중...
                  </span>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 