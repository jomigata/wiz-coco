import AdminPageLayout from '@/components/AdminPageLayout';

export default function SessionsPage() {
  return (
    <AdminPageLayout
      sectionTitle="상담 세션 기록"
      description="상담 세션별 기록을 관리합니다. (기능 준비 중)"
    >
      <p className="text-sm text-slate-400">세션 노트·시간·내담자 연결이 이 영역에 표시됩니다.</p>
    </AdminPageLayout>
  );
}
