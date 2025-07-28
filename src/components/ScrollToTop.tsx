'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // 스크롤 위치에 따라 버튼 표시 여부 결정
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // hide-global-scroll-button 클래스 확인하여 버튼 비활성화
    const checkDisabled = () => {
      setIsDisabled(document.documentElement.classList.contains('hide-global-scroll-button'));
    };

    // 초기 상태 확인
    checkDisabled();

    // MutationObserver를 사용하여 클래스 변경 감지
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          checkDisabled();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    window.addEventListener('scroll', toggleVisibility);
    
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      observer.disconnect();
    };
  }, []);

  // 최상단으로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 버튼이 비활성화 상태이면 아무것도 렌더링하지 않음
  if (isDisabled) {
    return null;
  }

  return (
    <div 
      className={`fixed right-8 bottom-8 z-50 transition-all duration-500 global-scroll-button ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={scrollToTop}
          className="w-12 h-12 bg-white/95 backdrop-blur rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 border border-gray-200 group ring-1 ring-gray-900/5"
          aria-label="맨 위로 스크롤"
        >
          <ChevronUp 
            className="w-5 h-5 text-gray-700 transition-transform group-hover:-translate-y-0.5" 
            strokeWidth={2.5} 
          />
        </button>
        <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-gray-700 border border-gray-200 whitespace-nowrap shadow-lg ring-1 ring-gray-900/5">
          맨 위로 이동
        </span>
      </div>
    </div>
  );
};

export default ScrollToTop; 