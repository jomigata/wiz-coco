'use client';

import { LOADING_MESSAGE } from '@/lib/loadingMessage';

const spinnerClassBySize = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
} as const;

type LoadingSpinnerProps = {
  size?: keyof typeof spinnerClassBySize;
  className?: string;
};

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${spinnerClassBySize[size]} animate-spin rounded-full border-slate-600 border-t-blue-400 ${className}`.trim()}
      role="status"
      aria-label="로딩 중"
    />
  );
}

type LoadingMessageProps = {
  message?: string;
  className?: string;
  textClassName?: string;
  size?: keyof typeof spinnerClassBySize;
  /** center: 세로 중앙(기본), inline: 가로 한 줄 */
  layout?: 'center' | 'inline';
};

export function LoadingMessage({
  message = LOADING_MESSAGE,
  className = '',
  textClassName = 'text-sm text-slate-400',
  size = 'md',
  layout = 'center',
}: LoadingMessageProps) {
  if (layout === 'inline') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`.trim()} role="status">
        <LoadingSpinner size="sm" />
        <span className={textClassName}>{message}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`.trim()} role="status">
      <LoadingSpinner size={size} />
      <p className={textClassName}>{message}</p>
    </div>
  );
}
