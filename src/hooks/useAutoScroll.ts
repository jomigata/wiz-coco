import { useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  scrollSpeed?: number;
  scrollZoneHeight?: number;
}

export const useAutoScroll = (options: UseAutoScrollOptions = {}) => {
  const { scrollSpeed = 5, scrollZoneHeight = 50 } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScroll = useCallback((direction: 'up' | 'down') => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    scrollIntervalRef.current = setInterval(() => {
      if (scrollRef.current) {
        const currentScrollTop = scrollRef.current.scrollTop;
        const newScrollTop = direction === 'up' 
          ? Math.max(0, currentScrollTop - scrollSpeed)
          : currentScrollTop + scrollSpeed;
        
        scrollRef.current.scrollTop = newScrollTop;
      }
    }, 16); // 60fps
  }, [scrollSpeed]);

  const stopScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;

    const rect = scrollRef.current.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    const containerHeight = rect.height;

    // 상단 50px 영역에서 위로 스크롤
    if (mouseY <= scrollZoneHeight) {
      startScroll('up');
    }
    // 하단 50px 영역에서 아래로 스크롤
    else if (mouseY >= containerHeight - scrollZoneHeight) {
      startScroll('down');
    }
    // 중간 영역에서는 스크롤 중지
    else {
      stopScroll();
    }
  }, [startScroll, stopScroll, scrollZoneHeight]);

  const handleMouseLeave = useCallback(() => {
    stopScroll();
  }, [stopScroll]);

  return {
    scrollRef,
    handleMouseMove,
    handleMouseLeave,
    stopScroll
  };
};
