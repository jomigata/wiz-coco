import type { ReactNode } from 'react';
import {
  homeSectionDividerBottom,
  homeSectionDividerTop,
  homeSectionTones,
  type HomeSectionTone,
} from '@/components/home/homeSectionStyles';

type Props = {
  tone: HomeSectionTone;
  children: ReactNode;
  className?: string;
  showTopDivider?: boolean;
  showBottomDivider?: boolean;
  showBottomFade?: boolean;
};

export default function HomeSectionShell({
  tone,
  children,
  className = '',
  showTopDivider = true,
  showBottomDivider = true,
  showBottomFade = false,
}: Props) {
  const t = homeSectionTones[tone];

  return (
    <section className={`relative overflow-hidden ${t.section} ${className}`}>
      {showTopDivider && <div className={homeSectionDividerTop} aria-hidden />}
      {'glow' in t && t.glow && (
        <div className={`pointer-events-none absolute inset-0 ${t.glow}`} aria-hidden />
      )}
      {'glowSecondary' in t && t.glowSecondary && (
        <div className={`pointer-events-none absolute inset-0 ${t.glowSecondary}`} aria-hidden />
      )}
      {showBottomFade && 'bottomFade' in t && t.bottomFade && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-gradient-to-b ${t.bottomFade}`}
          aria-hidden
        />
      )}
      {showBottomDivider && <div className={homeSectionDividerBottom} aria-hidden />}
      <div className="relative z-[2]">{children}</div>
    </section>
  );
}
