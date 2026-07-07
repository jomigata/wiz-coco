/** 데스크톱 상단 메뉴 그룹 구분선 (단일) */
export default function NavMenuSeparator() {
  return (
    <div
      className="mx-1 hidden h-7 w-px shrink-0 bg-gradient-to-b from-transparent via-white/25 to-transparent md:block lg:mx-2"
      aria-hidden
    />
  );
}
