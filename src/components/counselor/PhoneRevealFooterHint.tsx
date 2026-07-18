/** 발송·검사 현황 / 삭제 목록 하단 휴대폰 마스킹 안내 */
export default function PhoneRevealFooterHint({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-slate-500 ${className}`}>
      휴대폰 번호는 개인정보 보호를 위해 일부가 가려져 표시됩니다. 번호를 클릭하면 전체 번호를
      확인할 수 있으며, 화면 다른 곳을 클릭하면 다시 가려집니다.
    </p>
  );
}
