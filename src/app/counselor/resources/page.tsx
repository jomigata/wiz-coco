import AdminPageLayout from '@/components/AdminPageLayout';

export default function ResourcesPage() {
  return (
    <AdminPageLayout
      sectionTitle="상담 자료"
      description="상담에 활용할 자료를 관리합니다. (기능 준비 중)"
    >
      <p className="text-sm text-slate-400">자료 업로드·분류가 이 영역에 표시됩니다.</p>
    </AdminPageLayout>
  );
}
