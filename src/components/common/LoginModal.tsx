import React from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginClick: () => void;
  onSignupClick: () => void;
  onClose: () => void;
  themeColor: 'emerald' | 'blue' | 'purple' | 'orange';
  testName: string;
}

const themeConfig = {
  emerald: {
    gradient: 'from-emerald-900 to-green-900',
    iconBg: 'bg-emerald-600/30',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-200',
    primaryBtn: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-400',
    secondaryBtn: 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300',
    loader: 'border-emerald-500/30 border-t-emerald-600'
  },
  blue: {
    gradient: 'from-blue-900 to-indigo-900',
    iconBg: 'bg-blue-600/30',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-200',
    primaryBtn: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-400',
    secondaryBtn: 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-300',
    loader: 'border-blue-500/30 border-t-blue-600'
  },
  purple: {
    gradient: 'from-purple-900 to-indigo-900',
    iconBg: 'bg-purple-600/30',
    iconColor: 'text-purple-400',
    textColor: 'text-purple-200',
    primaryBtn: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-400',
    secondaryBtn: 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300',
    loader: 'border-purple-500/30 border-t-purple-600'
  },
  orange: {
    gradient: 'from-orange-900 to-red-900',
    iconBg: 'bg-orange-600/30',
    iconColor: 'text-orange-400',
    textColor: 'text-orange-200',
    primaryBtn: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400',
    secondaryBtn: 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-300',
    loader: 'border-orange-500/30 border-t-orange-600'
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginClick,
  onSignupClick,
  onClose,
  themeColor,
  testName
}) => {
  const theme = themeConfig[themeColor];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">로그인</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-300 mb-6">
            {testName} 검사를 이용하려면 로그인이 필요합니다.
          </p>

          <form 
            onSubmit={(e) => { e.preventDefault(); onLoginClick(); }} 
            className="space-y-4" 
            autoComplete="off" 
            noValidate 
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">이메일</label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이메일 주소 입력"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">비밀번호</label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-blue-400 hover:text-blue-300">비밀번호를 잊으셨나요?</a>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">계정이 없으신가요?</p>
            <button
              onClick={onSignupClick}
              className="mt-2 text-blue-400 hover:text-blue-300 font-medium"
            >
              회원가입
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 