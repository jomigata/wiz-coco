'use client';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 데스크톱 메가 메뉴 열림 시 본문 위 반투명 스크림 */
export default function NavMegaMenuBackdrop({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-16 bottom-0 z-30 hidden bg-[#050810]/55 transition-opacity duration-200 md:block"
      aria-hidden
      onClick={onClose}
    />
  );
}
