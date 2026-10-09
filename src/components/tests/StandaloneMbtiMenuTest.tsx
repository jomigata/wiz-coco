'use client';

import { useRouter } from 'next/navigation';
import MBTITest from '@/components/tests/MBTITest';
import { localArchiveListHref, saveLocalPsychTestArchive } from '@/lib/localPsychTestArchive';

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
          로컬 전용: 완료 시 브라우저 보관함에 임시 저장됩니다.
        </p>
        <MBTITest
          theme={variant === 'inside-mbti' ? 'portal' : 'emerald'}
          title={copy.title}
          subtitle={copy.subtitle}
          onBack={() => router.push('/tests')}
          onComplete={(results) => {
            const summaryLine = `응답 ${Object.keys(results).length}문항`;
            const archiveId =
              variant === 'inside-mbti'
                ? saveLocalPsychTestArchive({
                    kind: 'inside-mbti',
                    title: copy.title,
                    payload: { answers: results, summaryLine },
                  })
                : saveLocalPsychTestArchive({
                    kind: 'mbti',
                    title: copy.title,
                    payload: { answers: results, summaryLine },
                  });
            router.push(archiveId ? localArchiveListHref(archiveId) : '/tests/local-archive?localDirect=1');
          }}
        />
      </div>
    </div>
  );
}
