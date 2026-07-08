'use client';

type Props = {
  open: boolean;
  onClose: () => void;
};

/** 데스크톱 메가 메뉴 열림 시 본문 위 어두운 스크림 (blur 없음 — 네비 선명도 유지) */
export default function NavMegaMenuBackdrop({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 top-16 bottom-0 z-40 hidden bg-[#04060e]/80 transition-opacity duration-200 md:block"
      aria-hidden
      onClick={onClose}
    />
  );
}
