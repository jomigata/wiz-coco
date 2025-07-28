import React from 'react';

interface LoadingScreenProps {
  themeColor: 'emerald' | 'blue' | 'purple' | 'orange';
  message?: string;
}

const themeConfig = {
  emerald: {
    gradient: 'from-emerald-900 to-green-900',
    loader: 'border-emerald-500/30 border-t-emerald-600',
    textColor: 'text-emerald-200'
  },
  blue: {
    gradient: 'from-blue-900 to-indigo-900',
    loader: 'border-blue-500/30 border-t-blue-600',
    textColor: 'text-blue-200'
  },
  purple: {
    gradient: 'from-purple-900 to-indigo-900',
    loader: 'border-purple-500/30 border-t-purple-600',
    textColor: 'text-purple-200'
  },
  orange: {
    gradient: 'from-orange-900 to-red-900',
    loader: 'border-orange-500/30 border-t-orange-600',
    textColor: 'text-orange-200'
  }
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  themeColor,
  message = '검사 페이지를 준비하고 있습니다...'
}) => {
  const theme = themeConfig[themeColor];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
      <div className="text-center">
        <div className={`w-16 h-16 border-4 ${theme.loader} rounded-full animate-spin mx-auto mb-4`}></div>
        <p className={`${theme.textColor} text-lg`}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen; 