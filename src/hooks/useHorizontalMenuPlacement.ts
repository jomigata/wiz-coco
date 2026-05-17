import { useState, useCallback, useEffect, type RefObject } from 'react';
import {
  getDropdownHorizontalClass,
  getHorizontalPlacement,
  type HorizontalPlacement,
} from '@/utils/menuPlacement';

type DropdownAlign = 'left-0' | 'right-0';

export function useHorizontalMenuPlacement(
  isOpen: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  anchorRef: RefObject<HTMLElement | null>,
  subPanelRef: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  const [subPanelSide, setSubPanelSide] = useState<HorizontalPlacement>('right');
  const [dropdownAlign, setDropdownAlign] = useState<DropdownAlign>('left-0');

  const updatePlacement = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelWidth = panelRef.current?.offsetWidth ?? triggerRect.width;
    setDropdownAlign(getDropdownHorizontalClass(triggerRect, panelWidth));

    const anchor = anchorRef.current ?? trigger;
    const subPanel = subPanelRef.current;
    if (subPanel) {
      const subWidth = subPanel.offsetWidth;
      if (subWidth > 0) {
        setSubPanelSide(getHorizontalPlacement(anchor.getBoundingClientRect(), subWidth));
      }
    }
  }, [triggerRef, panelRef, anchorRef, subPanelRef]);

  useEffect(() => {
    if (!isOpen) {
      setSubPanelSide('right');
      setDropdownAlign('left-0');
      return;
    }

    const run = () => updatePlacement();
    run();
    const frameId = requestAnimationFrame(run);
    window.addEventListener('resize', run);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', run);
    };
  }, [isOpen, updatePlacement, ...deps]);

  return { subPanelSide, dropdownAlign, updatePlacement };
}
