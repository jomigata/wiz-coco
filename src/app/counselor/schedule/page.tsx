import AdminPageLayout from '@/components/AdminPageLayout';

export default function SchedulePage() {
  return (
    <AdminPageLayout
      sectionTitle="일정 관리"
      description="상담 일정을 등록하고 조회합니다. (기능 준비 중)"
    >
      <p className="text-sm text-slate-400">상담 일정 캘린더·예약 연동이 이 영역에 표시됩니다.</p>
    </AdminPageLayout>
  );
}
