import type { ReactNode } from 'react';
import { homeSectionDivider, homeSectionTopShade, homeSectionTones, type HomeSectionTone } from '@/components/home/homeSectionStyles';

type Props = {
  tone: HomeSectionTone;
  children: ReactNode;
  className?: string;
  showTopDivider?: boolean;
  showTopShade?: boolean;
  showBottomFade?: boolean;
};

export default function HomeSectionShell({
  tone,
  children,
  className = '',
  showTopDivider = true,
  showTopShade = true,
  showBottomFade = true,
}: Props) {
  const t = homeSectionTones[tone];

  return (
    <section className={`relative overflow-hidden ${t.section} ${className}`}>
      {showTopShade && tone !== 'hero' && <div className={homeSectionTopShade} aria-hidden />}
      {showTopDivider && tone !== 'hero' && <div className={homeSectionDivider} aria-hidden />}
      {'topBlend' in t && t.topBlend && (
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-20 ${t.topBlend}`} aria-hidden />
      )}
      {'glow' in t && t.glow && (
        <div className={`pointer-events-none absolute inset-0 ${t.glow}`} aria-hidden />
      )}
      {'glowSecondary' in t && t.glowSecondary && (
        <div className={`pointer-events-none absolute inset-0 ${t.glowSecondary}`} aria-hidden />
      )}
      {showBottomFade && 'bottomFade' in t && t.bottomFade && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-gradient-to-b ${t.bottomFade}`}
          aria-hidden
        />
      )}
      <div className="relative z-[2]">{children}</div>
    </section>
  );
}
