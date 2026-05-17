export type HorizontalPlacement = 'left' | 'right';

const DEFAULT_PADDING = 16;

/** 트리거 기준으로 패널을 왼쪽/오른쪽 중 여유 공간이 더 넓은 쪽으로 연다 */
export function getHorizontalPlacement(
  anchorRect: DOMRect,
  panelWidth: number,
  padding = DEFAULT_PADDING
): HorizontalPlacement {
  const viewportWidth = window.innerWidth;
  const spaceRight = viewportWidth - anchorRect.right - padding;
  const spaceLeft = anchorRect.left - padding;

  if (spaceRight >= panelWidth && spaceRight >= spaceLeft) return 'right';
  if (spaceLeft >= panelWidth && spaceLeft > spaceRight) return 'left';
  return spaceRight >= spaceLeft ? 'right' : 'left';
}

/** 드롭다운 전체를 트리거 왼쪽(left-0) 또는 오른쪽(right-0)에 맞출지 결정 */
export function getDropdownHorizontalClass(
  triggerRect: DOMRect,
  dropdownWidth: number,
  padding = DEFAULT_PADDING
): 'left-0' | 'right-0' {
  const spaceWhenLeftAligned = window.innerWidth - triggerRect.left - padding;
  const spaceWhenRightAligned = triggerRect.right - padding;

  if (dropdownWidth <= spaceWhenLeftAligned && spaceWhenLeftAligned >= spaceWhenRightAligned) {
    return 'left-0';
  }
  if (dropdownWidth <= spaceWhenRightAligned && spaceWhenRightAligned > spaceWhenLeftAligned) {
    return 'right-0';
  }
  return spaceWhenLeftAligned >= spaceWhenRightAligned ? 'left-0' : 'right-0';
}
