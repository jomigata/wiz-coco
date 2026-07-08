/** 상단 메뉴 그룹 구분 — 단일 세로 그라데이션 선 */
export default function NavMenuDivider() {
  return (
    <div
      className="mx-1.5 hidden h-7 w-px shrink-0 bg-gradient-to-b from-transparent via-white/30 to-transparent sm:mx-2 sm:block lg:h-8"
      aria-hidden
    />
  );
}
