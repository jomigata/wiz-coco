import AdminPageLayout from '@/components/AdminPageLayout';

export default function NotesPage() {
  return (
    <AdminPageLayout
      sectionTitle="상담 노트"
      description="상담 내용과 메모를 기록합니다. (기능 준비 중)"
    >
      <p className="text-sm text-slate-400">노트 작성·검색이 이 영역에 표시됩니다.</p>
    </AdminPageLayout>
  );
}
