'use client';

import { useRouter } from 'next/navigation';
import MBTITest from '@/components/tests/MBTITest';

type Variant = 'mbti' | 'inside-mbti';

const COPY: Record<Variant, { title: string; subtitle: string; shell: string }> = {
  mbti: {
    title: '개인용 MBTI 검사',
    subtitle: '로컬 테스트 모드 — 메뉴에서 바로 시작',
    shell: 'bg-emerald-950 min-h-screen',
  },
  'inside-mbti': {
    title: 'Inside MBTI 검사',
    subtitle: '로컬 테스트 모드 — 관계·유형 탐색 (개인용 MBTI 문항)',
    shell: 'bg-[#070b14] min-h-screen',
  },
};

export default function StandaloneMbtiMenuTest({ variant }: { variant: Variant }) {
  const router = useRouter();
  const copy = COPY[variant];

  return (
    <div className={copy.shell}>
      <div className="mx-auto max-w-3xl px-3 py-4">
        <p className="mb-2 text-center text-xs text-amber-200/90">
          로컬 전용: 결과는 저장되지 않습니다.
        </p>
        <MBTITest
          theme={variant === 'inside-mbti' ? 'portal' : 'emerald'}
          title={copy.title}
          subtitle={copy.subtitle}
          onBack={() => router.push('/tests')}
          onComplete={() => {
            window.alert('로컬 테스트 모드: 검사가 완료되었습니다.');
            router.push('/tests');
          }}
        />
      </div>
    </div>
  );
}
