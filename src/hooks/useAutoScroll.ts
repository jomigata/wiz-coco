import { useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  scrollSpeed?: number;
  scrollZoneHeight?: number;
  maxSpeed?: number;
  minSpeed?: number;
}

export const useAutoScroll = (options: UseAutoScrollOptions = {}) => {
  const { scrollSpeed = 5, scrollZoneHeight = 150, maxSpeed = 2, minSpeed = 0.1 } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScroll = useCallback((direction: 'up' | 'down', mouseY: number, containerHeight: number) => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    scrollIntervalRef.current = setInterval(() => {
      if (scrollRef.current) {
        const currentScrollTop = scrollRef.current.scrollTop;
        
        // 가속도 계산: 상단/하단으로 갈수록 빠르게
        let speedMultiplier = 1;
        if (direction === 'up') {
          // 상단 150px 영역에서 0px에 가까울수록 빠르게 (0.1x ~ 2x)
          const distanceFromTop = mouseY;
          speedMultiplier = minSpeed + (maxSpeed - minSpeed) * (1 - distanceFromTop / scrollZoneHeight);
        } else {
          // 하단 150px 영역에서 0px에 가까울수록 빠르게 (0.1x ~ 2x)
          const distanceFromBottom = containerHeight - mouseY;
          speedMultiplier = minSpeed + (maxSpeed - minSpeed) * (1 - distanceFromBottom / scrollZoneHeight);
        }
        
        const actualSpeed = scrollSpeed * speedMultiplier;
        const newScrollTop = direction === 'up' 
          ? Math.max(0, currentScrollTop - actualSpeed)
          : currentScrollTop + actualSpeed;
        
        scrollRef.current.scrollTop = newScrollTop;
      }
    }, 16); // 60fps
  }, [scrollSpeed, maxSpeed, minSpeed, scrollZoneHeight]);

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

    // 상단 150px 영역에서 위로 스크롤 (가속도 적용)
    if (mouseY <= scrollZoneHeight) {
      startScroll('up', mouseY, containerHeight);
    }
    // 하단 150px 영역에서 아래로 스크롤 (가속도 적용)
    else if (mouseY >= containerHeight - scrollZoneHeight) {
      startScroll('down', mouseY, containerHeight);
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
