import LocalStorageCleaner from '@/components/LocalStorageCleaner';

export default function CleanStoragePage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-center mb-8">테스트 기록 초기화</h1>
      <LocalStorageCleaner />
      <div className="mt-6 text-center">
        <a 
          href="/" 
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
} 