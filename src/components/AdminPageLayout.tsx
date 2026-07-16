import React from 'react';
import CounselorPageSection from '@/components/counselor/CounselorPageSection';

interface AdminPageLayoutProps {
  /** @deprecated 레이아웃 상단 제목과 중복 — sectionTitle 사용 권장 */
  title?: string;
  /** 중분류 띠 제목 */
  sectionTitle?: string;
  description?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  noBodyPadding?: boolean;
}

/** 상담관리 하위 페이지 — CounselorPageSection 래퍼 (페이지 h1은 counselor layout이 담당) */
export default function AdminPageLayout({
  title,
  sectionTitle,
  description,
  toolbar,
  children,
  className,
  bodyClassName,
  noBodyPadding,
}: AdminPageLayoutProps) {
  const bandTitle = sectionTitle ?? title ?? '콘텐츠';

  return (
    <CounselorPageSection
      className={className}
      title={bandTitle}
      description={description}
      toolbar={toolbar}
      bodyClassName={bodyClassName}
      noBodyPadding={noBodyPadding}
    >
      {children}
    </CounselorPageSection>
  );
}
