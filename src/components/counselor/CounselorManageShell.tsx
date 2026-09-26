'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AuthLink from '@/components/auth/AuthLink';
import { counselorMenuCategories, getCounselorCategoryEntryHref, COUNSELOR_DISPATCH_MGMT_SLUG, COUNSELOR_ASSESSMENT_CODE_SLUG, COUNSELOR_TEST_MGMT_SLUG } from '@/data/counselorMenu';
import {
  getAssessmentListContextNestedItems,
  getAssessmentsParentSubmenuItems,
  getClientsListContextNestedItems,
  getClientsParentSubmenuItems,
  nestedNavItemsAfter,
  PERMANENTLY_DELETED_ASSESSMENTS_HREF,
  rememberCounselorAssessmentContext,
  resolveActiveNestedNavItem,
} from '@/lib/counselorNestedNav';
import { clearAssessmentListSearch } from '@/lib/counselorAssessmentListSearch';
import { getAppRoleSync, isAdmin } from '@/utils/roleUtils';
import {
  isMenuItemActive,
  resolveCounselorCategorySlugForPath,
} from '@/lib/counselorManageShell';
import { counselorHubClasses } from '@/components/layout/appChromeTheme';

type Props = {
  children: React.ReactNode;
};

/** 좌측 메뉴 — 중분류는 대분류 아이콘·타이틀 시작선보다 2ch 왼쪽 */
const MENU_MIDDLE_ALIGN = 'pl-[calc(1.75rem+1.25rem+0.75rem-2ch)]';
const MENU_NESTED_ALIGN = 'pl-[calc(1.75rem+1.25rem+0.75rem+2ch-2ch)]';

const SUBMENU_HOVER_CLOSE_MS = 2000;
/** 대분류 전환 직후 레이아웃 보정으로 인한 잘못된 mouseleave 무시 */
const SUBMENU_HOVER_SWITCH_GRACE_MS = 180;
/** 테두리만 남긴 뒤 프레임 접힘 시작 전 대기 (예: (1)에서 (3) 정지 후) */
const SUBMENU_BORDER_ONLY_COLLAPSE_DELAY_MS = 2000;

function findCategorySlugForNode(
  node: Node | null,
  boxes: Record<string, HTMLDivElement | null>,
): string | null {
  if (!(node instanceof Element)) return null;
  let el: Element | null = node;
  while (el) {
    for (const [slug, box] of Object.entries(boxes)) {
      if (box === el) return slug;
    }
    el = el.parentElement;
  }
  return null;
}

/** 접힘 시 테두리·서브메뉴를 함께 줄일지 — 기본 false */
function measureCategoryHeaderHeight(box: HTMLDivElement): number {
  const header = box.querySelector(':scope > .counselor-sidebar-category-header-row');
  const h = header?.getBoundingClientRect().height;
  return h && h > 0 ? h : 48;
}

function CounselorSidebarSubmenuPanel({
  visible,
  onMouseEnter,
  children,
}: {
  visible: boolean;
  onMouseEnter?: () => void;
  children: React.ReactNode;
}) {
  if (!visible) return null;

  return (
    <div className="mt-0.5 space-y-1" onMouseEnter={onMouseEnter}>
      {children}
    </div>
  );
}

export default function CounselorManageShell({ children }: Props) {
  const pathname = usePathname() || '';
  const searchParams = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const activeCategorySlug = resolveCounselorCategorySlugForPath(pathname, search);
  const activeNested = resolveActiveNestedNavItem(pathname, search);
  const adminUser = isAdmin(getAppRoleSync());

  const [expandedSlug, setExpandedSlug] = useState<string>(() =>
    activeCategorySlug || COUNSELOR_ASSESSMENT_CODE_SLUG,
  );
  /** 호버로 잠시 펼친 대분류 — 마우스 아웃 시 접힘 애니메이션 */
  const [hoverExpandedSlug, setHoverExpandedSlug] = useState<string | null>(null);
  const [hoverClosingSlugs, setHoverClosingSlugs] = useState<Set<string>>(() => new Set());
  /** 서브메뉴는 닫히고 테두리 프레임만 유지 */
  const [borderOnlySlugs, setBorderOnlySlugs] = useState<Set<string>>(() => new Set());
  const hoverCloseAnimationTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const borderFrameCollapseTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const hoverExpandedSlugRef = useRef<string | null>(null);
  const hoverClosingSlugRef = useRef<Set<string>>(hoverClosingSlugs);
  const sidebarNavRef = useRef<HTMLElement | null>(null);
  const sidebarAsideRef = useRef<HTMLElement | null>(null);
  const lastHoverSwitchRef = useRef<{ slug: string; at: number } | null>(null);
  const categoryBoxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /** 호버 접힘 중 아래 대분류가 밀리지 않도록 닫히는 블록 높이 유지 */
  const [closingLayoutMinHeights, setClosingLayoutMinHeights] = useState<Record<string, number>>(
    {},
  );
  const [hoveredMenuHref, setHoveredMenuHref] = useState<string | null>(null);

  const sidebarCategories = useMemo(() => counselorMenuCategories, []);
  const categorySlugOrder = useMemo(
    () => sidebarCategories.map((category) => category.slug),
    [sidebarCategories],
  );

  const expandedSlugRef = useRef(expandedSlug);
  expandedSlugRef.current = expandedSlug;
  hoverExpandedSlugRef.current = hoverExpandedSlug;
  hoverClosingSlugRef.current = hoverClosingSlugs;
  const closingLayoutMinHeightsRef = useRef(closingLayoutMinHeights);
  closingLayoutMinHeightsRef.current = closingLayoutMinHeights;
  const borderOnlySlugsRef = useRef(borderOnlySlugs);
  borderOnlySlugsRef.current = borderOnlySlugs;

  const applyClosingLayoutMinHeightSync = useCallback((slug: string) => {
    const el = categoryBoxRefs.current[slug];
    if (!el) return;
    const height = el.getBoundingClientRect().height;
    if (height <= 0) return;
    el.style.minHeight = `${height}px`;
    setClosingLayoutMinHeights({ [slug]: height });
  }, []);

  const clearClosingLayoutMinHeight = useCallback((slug: string) => {
    const el = categoryBoxRefs.current[slug];
    if (el) {
      el.style.minHeight = '';
    }
    setClosingLayoutMinHeights((prev) => {
      if (!(slug in prev)) return prev;
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }, []);

  const cancelBorderFrameCollapse = useCallback((slug?: string) => {
    if (slug != null) {
      const timer = borderFrameCollapseTimersRef.current.get(slug);
      if (timer) {
        clearTimeout(timer);
        borderFrameCollapseTimersRef.current.delete(slug);
      }
      return;
    }
    borderFrameCollapseTimersRef.current.forEach((timer) => clearTimeout(timer));
    borderFrameCollapseTimersRef.current.clear();
  }, []);

  const cancelHoverClose = useCallback(
    (slug?: string) => {
      cancelBorderFrameCollapse(slug);
      if (slug != null) {
        const anim = hoverCloseAnimationTimersRef.current.get(slug);
        if (anim) {
          clearTimeout(anim);
          hoverCloseAnimationTimersRef.current.delete(slug);
        }
        setHoverClosingSlugs((prev) => {
          if (!prev.has(slug)) return prev;
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
        setBorderOnlySlugs((prev) => {
          if (!prev.has(slug)) return prev;
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
        clearClosingLayoutMinHeight(slug);
        return;
      }
      hoverCloseAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
      hoverCloseAnimationTimersRef.current.clear();
      cancelBorderFrameCollapse();
      setHoverClosingSlugs(new Set());
      setBorderOnlySlugs(new Set());
    },
    [cancelBorderFrameCollapse, clearClosingLayoutMinHeight],
  );

  const runBorderFrameCollapse = useCallback(
    (slug: string, options?: { clearBorderOnly?: boolean }) => {
      const clearBorderOnly = options?.clearBorderOnly !== false;
      if (expandedSlugRef.current === slug) return;
      const el = categoryBoxRefs.current[slug];
      if (!el) return;
      const targetH = measureCategoryHeaderHeight(el);
      const currentH = el.getBoundingClientRect().height;
      el.style.minHeight = `${currentH}px`;
      el.style.transition = `min-height ${SUBMENU_HOVER_CLOSE_MS}ms ease`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.minHeight = `${targetH}px`;
        });
      });
      const existingAnim = hoverCloseAnimationTimersRef.current.get(slug);
      if (existingAnim) {
        clearTimeout(existingAnim);
      }
      hoverCloseAnimationTimersRef.current.set(
        slug,
        setTimeout(() => {
          hoverCloseAnimationTimersRef.current.delete(slug);
          if (clearBorderOnly) {
            setBorderOnlySlugs((prev) => {
              const next = new Set(prev);
              next.delete(slug);
              return next;
            });
          }
          setHoverClosingSlugs((prev) => {
            const next = new Set(prev);
            next.delete(slug);
            return next;
          });
          clearClosingLayoutMinHeight(slug);
          el.style.transition = '';
          el.style.minHeight = '';
        }, SUBMENU_HOVER_CLOSE_MS),
      );
    },
    [clearClosingLayoutMinHeight],
  );

  const startHoverClose = useCallback(
    (slug: string) => {
      if (expandedSlug === slug) {
        setHoverExpandedSlug((prev) => (prev === slug ? null : prev));
        return;
      }
      cancelBorderFrameCollapse(slug);
      setBorderOnlySlugs((prev) => {
        if (!prev.has(slug)) return prev;
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      applyClosingLayoutMinHeightSync(slug);
      setHoverExpandedSlug((prev) => (prev === slug ? null : prev));
      setHoverClosingSlugs((prev) => {
        const next = new Set(prev);
        next.add(slug);
        return next;
      });
      requestAnimationFrame(() => {
        runBorderFrameCollapse(slug, { clearBorderOnly: false });
      });
    },
    [
      applyClosingLayoutMinHeightSync,
      cancelBorderFrameCollapse,
      expandedSlug,
      runBorderFrameCollapse,
    ],
  );

  const scheduleBorderFrameCollapse = useCallback(
    (slug: string, delayMs: number = SUBMENU_BORDER_ONLY_COLLAPSE_DELAY_MS) => {
      if (expandedSlugRef.current === slug) return;
      cancelBorderFrameCollapse(slug);

      const runCollapseWhenReady = () => {
        if (expandedSlugRef.current === slug) return;
        if (borderOnlySlugsRef.current.has(slug)) {
          runBorderFrameCollapse(slug);
        }
      };

      borderFrameCollapseTimersRef.current.set(
        slug,
        setTimeout(runCollapseWhenReady, delayMs),
      );
    },
    [cancelBorderFrameCollapse, runBorderFrameCollapse],
  );

  const submenuCloseKeepBorder = useCallback(
    (slug: string) => {
      if (expandedSlugRef.current === slug) return;
      cancelBorderFrameCollapse(slug);
      applyClosingLayoutMinHeightSync(slug);
      setHoverExpandedSlug((prev) => (prev === slug ? null : prev));
      setHoverClosingSlugs((prev) => {
        if (!prev.has(slug)) return prev;
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      setBorderOnlySlugs((prev) => {
        const next = new Set(prev);
        next.add(slug);
        return next;
      });
    },
    [applyClosingLayoutMinHeightSync, cancelBorderFrameCollapse],
  );

  const fullCloseCategory = useCallback(
    (slug: string) => {
      if (expandedSlugRef.current === slug) return;
      cancelBorderFrameCollapse(slug);
      startHoverClose(slug);
    },
    [cancelBorderFrameCollapse, startHoverClose],
  );

  /** 위쪽으로 이동할 때 — 서브메뉴·테두리 즉시 접힘 */
  const instantCloseHoverCategory = useCallback(
    (slug: string) => {
      if (expandedSlugRef.current === slug) {
        setHoverExpandedSlug((prev) => (prev === slug ? null : prev));
        return;
      }
      cancelBorderFrameCollapse(slug);
      const anim = hoverCloseAnimationTimersRef.current.get(slug);
      if (anim) {
        clearTimeout(anim);
        hoverCloseAnimationTimersRef.current.delete(slug);
      }
      setHoverClosingSlugs((prev) => {
        if (!prev.has(slug)) return prev;
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      setBorderOnlySlugs((prev) => {
        if (!prev.has(slug)) return prev;
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
      setHoverExpandedSlug((prev) => (prev === slug ? null : prev));
      clearClosingLayoutMinHeight(slug);
      const el = categoryBoxRefs.current[slug];
      if (el) {
        el.style.transition = '';
        el.style.minHeight = '';
      }
    },
    [cancelBorderFrameCollapse, clearClosingLayoutMinHeight],
  );

  const isHoverOpenCategory = useCallback((slug: string) => {
    return (
      hoverExpandedSlugRef.current === slug ||
      hoverClosingSlugRef.current.has(slug) ||
      borderOnlySlugsRef.current.has(slug)
    );
  }, []);

  const processCategoryEnter = useCallback(
    (slug: string, prevHover: string | null) => {
      const pinned = expandedSlugRef.current;
      const pinnedIdx = categorySlugOrder.indexOf(pinned);
      const enteredIdx = categorySlugOrder.indexOf(slug);
      if (enteredIdx < 0) return;

      if (pinnedIdx >= 0 && enteredIdx === pinnedIdx + 1) {
        for (let i = 0; i < pinnedIdx; i++) {
          fullCloseCategory(categorySlugOrder[i]);
        }
      }

      if (prevHover && prevHover !== slug && prevHover !== pinned) {
        const prevIdx = categorySlugOrder.indexOf(prevHover);
        if (prevIdx >= 0 && enteredIdx > prevIdx) {
          if (enteredIdx - prevIdx === 1) {
            submenuCloseKeepBorder(prevHover);
          } else {
            fullCloseCategory(prevHover);
          }
        } else if (prevIdx >= 0 && enteredIdx < prevIdx) {
          instantCloseHoverCategory(prevHover);
        }
      }

      const instantClosedBorderOnlySlugs = new Set<string>();
      for (const offset of [2, 3]) {
        const targetIdx = enteredIdx - offset;
        if (targetIdx < 0) continue;
        const targetSlug = categorySlugOrder[targetIdx];
        if (targetSlug === pinned) continue;
        if (borderOnlySlugsRef.current.has(targetSlug)) {
          instantClosedBorderOnlySlugs.add(targetSlug);
          instantCloseHoverCategory(targetSlug);
        }
      }

      if (enteredIdx >= 2) {
        for (let i = 0; i <= enteredIdx - 2; i++) {
          const targetSlug = categorySlugOrder[i];
          if (targetSlug === pinned) continue;
          if (instantClosedBorderOnlySlugs.has(targetSlug)) continue;
          if (!isHoverOpenCategory(targetSlug)) continue;
          if (!borderOnlySlugsRef.current.has(targetSlug)) {
            submenuCloseKeepBorder(targetSlug);
          }
          scheduleBorderFrameCollapse(targetSlug, SUBMENU_BORDER_ONLY_COLLAPSE_DELAY_MS);
        }
      }
    },
    [
      categorySlugOrder,
      fullCloseCategory,
      instantCloseHoverCategory,
      isHoverOpenCategory,
      scheduleBorderFrameCollapse,
      submenuCloseKeepBorder,
    ],
  );

  const closeHoverOpenCategory = useCallback(
    (slug: string) => {
      if (expandedSlugRef.current === slug) return;
      if (!isHoverOpenCategory(slug)) return;
      fullCloseCategory(slug);
    },
    [fullCloseCategory, isHoverOpenCategory],
  );

  const handleCategoryMouseEnter = useCallback(
    (slug: string) => {
      cancelBorderFrameCollapse(slug);

      if (borderOnlySlugs.has(slug)) {
        const anim = hoverCloseAnimationTimersRef.current.get(slug);
        if (anim) {
          clearTimeout(anim);
          hoverCloseAnimationTimersRef.current.delete(slug);
        }
        setBorderOnlySlugs((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
        setHoverClosingSlugs((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      } else if (hoverClosingSlugs.has(slug)) {
        cancelHoverClose(slug);
      }

      lastHoverSwitchRef.current = { slug, at: Date.now() };

      const enteredIdx = categorySlugOrder.indexOf(slug);
      const hovering = hoverExpandedSlugRef.current;
      if (
        hovering &&
        hovering !== slug &&
        expandedSlug !== hovering &&
        enteredIdx >= 0
      ) {
        const hoverIdx = categorySlugOrder.indexOf(hovering);
        if (hoverIdx > enteredIdx) {
          instantCloseHoverCategory(hovering);
        }
      }

      setHoverExpandedSlug((prevHover) => {
        processCategoryEnter(slug, prevHover);
        return slug;
      });
    },
    [
      borderOnlySlugs,
      cancelBorderFrameCollapse,
      cancelHoverClose,
      categorySlugOrder,
      expandedSlug,
      fullCloseCategory,
      hoverClosingSlugs,
      instantCloseHoverCategory,
      processCategoryEnter,
    ],
  );

  const handleCategoryMouseLeave = useCallback(
    (slug: string, e: React.MouseEvent) => {
      if (expandedSlug === slug) {
        setHoverExpandedSlug((prev) => (prev === slug ? null : prev));
        return;
      }

      const nav = sidebarNavRef.current;
      const related = e.relatedTarget;
      if (related instanceof Node && nav?.contains(related)) {
        const targetSlug = findCategorySlugForNode(related, categoryBoxRefs.current);
        if (targetSlug && targetSlug !== slug) {
          const fromIdx = categorySlugOrder.indexOf(slug);
          const toIdx = categorySlugOrder.indexOf(targetSlug);
          if (fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx) {
            if (
              hoverClosingSlugRef.current.has(targetSlug) &&
              hoverExpandedSlugRef.current === slug
            ) {
              const switchAt = lastHoverSwitchRef.current;
              if (
                switchAt?.slug === slug &&
                Date.now() - switchAt.at < SUBMENU_HOVER_SWITCH_GRACE_MS
              ) {
                return;
              }
            }
            instantCloseHoverCategory(slug);
          }
        }
        return;
      }

      const switchAt = lastHoverSwitchRef.current;
      if (
        switchAt?.slug === slug &&
        Date.now() - switchAt.at < SUBMENU_HOVER_SWITCH_GRACE_MS
      ) {
        return;
      }

      const { clientX, clientY } = e;
      requestAnimationFrame(() => {
        const box = categoryBoxRefs.current[slug];
        if (!box) return;

        const hit = document.elementFromPoint(clientX, clientY);
        if (hit && box.contains(hit)) return;

        closeHoverOpenCategory(slug);
      });
    },
    [categorySlugOrder, closeHoverOpenCategory, expandedSlug, instantCloseHoverCategory],
  );

  const handleSidebarMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      const aside = sidebarAsideRef.current;
      const related = e.relatedTarget;
      if (related instanceof Node && aside?.contains(related)) {
        return;
      }

      const pinned = expandedSlugRef.current;
      const slugsToClose = new Set<string>();

      const hovering = hoverExpandedSlugRef.current;
      if (hovering != null) {
        if (hovering === pinned) {
          setHoverExpandedSlug(null);
        } else {
          slugsToClose.add(hovering);
        }
      }

      hoverClosingSlugRef.current.forEach((s: string) => {
        if (s !== pinned) slugsToClose.add(s);
      });
      borderOnlySlugsRef.current.forEach((s: string) => {
        if (s !== pinned) slugsToClose.add(s);
      });

      for (const slug of Object.keys(closingLayoutMinHeightsRef.current)) {
        if (slug !== pinned) {
          slugsToClose.add(slug);
        }
      }

      cancelBorderFrameCollapse();
      slugsToClose.forEach((slug) => {
        fullCloseCategory(slug);
      });
    },
    [cancelBorderFrameCollapse, fullCloseCategory],
  );

  useEffect(() => {
    return () => {
      hoverCloseAnimationTimersRef.current.forEach((timer) => clearTimeout(timer));
      hoverCloseAnimationTimersRef.current.clear();
      borderFrameCollapseTimersRef.current.forEach((timer) => clearTimeout(timer));
      borderFrameCollapseTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (activeCategorySlug) {
      setExpandedSlug(activeCategorySlug);
    }
  }, [activeCategorySlug]);

  const toggleCategory = (slug: string) => {
    setHoverExpandedSlug((prevHover) => {
      if (prevHover && prevHover !== slug && expandedSlug !== prevHover) {
        startHoverClose(prevHover);
      }
      return null;
    });
    setExpandedSlug(slug);
  };

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-2 lg:h-[calc(100dvh-4.5rem)] lg:flex-row lg:items-stretch lg:gap-3 lg:overflow-hidden`}
    >
      <aside
        ref={sidebarAsideRef}
        className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-sky-400/20 max-h-[38vh] shrink-0 lg:h-full lg:max-h-[calc(100dvh-4.5rem)] lg:w-[15.5rem] lg:shrink-0 xl:w-[17rem] ${counselorHubClasses.subsection} !p-0`}
        aria-label="상담관리 메뉴"
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className="shrink-0 border-b border-sky-400/25 bg-gradient-to-r from-sky-600/25 via-sky-500/15 to-transparent px-3 py-2">
          <p className="text-sm font-bold text-white">상담관리</p>
          <p className="text-[11px] leading-tight text-sky-200/60">대분류 · 중분류 · 소분류</p>
        </div>
        <nav
          ref={sidebarNavRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 py-1.5"
        >
          {sidebarCategories.map((category) => {
            const pinnedExpanded = expandedSlug === category.slug;
            const hoverExpanded = hoverExpandedSlug === category.slug;
            const hoverClosing = hoverClosingSlugs.has(category.slug);
            const borderOnly = borderOnlySlugs.has(category.slug);
            const showSubmenuPanel = pinnedExpanded || hoverExpanded;
            const showCategoryExpanded =
              pinnedExpanded || hoverExpanded || hoverClosing || borderOnly;
            const closingLayoutMinHeight = closingLayoutMinHeights[category.slug];
            const categoryEntryHref = getCategoryEntryHref(category, adminUser);

            const categorySelected = activeCategorySlug === category.slug;
            const pathNorm = (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
            const categoryEntryHrefNorm = categoryEntryHref.replace(/\/+$/, '') || '';
            const middleActive = isMiddleTierActiveInCategory(
              category,
              pathNorm,
              pathname,
              search,
              adminUser,
            );
            const hideCategoryBgWhenFlatMiddleSelected =
              (category.slug === COUNSELOR_DISPATCH_MGMT_SLUG && pathNorm === '/counselor/clients') ||
              (category.slug === COUNSELOR_ASSESSMENT_CODE_SLUG &&
                pathNorm === '/counselor/assessments');
            const categoryLinkActive =
              categorySelected &&
              !hideCategoryBgWhenFlatMiddleSelected &&
              !middleActive &&
              !activeNested &&
              pathNorm === categoryEntryHrefNorm;
            const categoryEntryActive = categoryLinkActive;

            const categoryNavActive = categorySelected || middleActive;

            const categoryFrameClass = categoryNavActive
              ? category.slug === COUNSELOR_DISPATCH_MGMT_SLUG
                ? 'border-cyan-400/45 ring-1 ring-inset ring-cyan-400/20'
                : category.slug === COUNSELOR_ASSESSMENT_CODE_SLUG
                  ? 'border-violet-400/40 ring-1 ring-inset ring-violet-400/18'
                  : category.slug === COUNSELOR_TEST_MGMT_SLUG
                    ? 'border-emerald-400/35 ring-1 ring-inset ring-emerald-400/15'
                    : 'border-sky-400/45 ring-1 ring-inset ring-sky-400/20'
              : 'border-white/10';

            const hoverOnlyClosing =
              (hoverClosing && !pinnedExpanded) || borderOnly;

            return (
              <div
                key={category.slug}
                ref={(node) => {
                  categoryBoxRefs.current[category.slug] = node;
                }}
                className={`mb-1 rounded-lg border ease-in-out ${hoverOnlyClosing ? 'overflow-hidden' : ''} ${
                  showCategoryExpanded ? 'counselor-sidebar-category-expanded' : ''
                } ${
                  hoverOnlyClosing
                    ? 'transition-[border-color,box-shadow,min-height] duration-[2000ms]'
                    : 'transition-[border-color,box-shadow] duration-[2000ms]'
                } ${categoryFrameClass}`}
                style={
                  !pinnedExpanded && closingLayoutMinHeight
                    ? { minHeight: closingLayoutMinHeight }
                    : undefined
                }
                onMouseEnter={() => handleCategoryMouseEnter(category.slug)}
                onMouseLeave={(e) => handleCategoryMouseLeave(category.slug, e)}
              >
                <div
                  className="counselor-sidebar-category-header-row flex shrink-0 items-stretch gap-0.5"
                  onMouseEnter={() => handleCategoryMouseEnter(category.slug)}
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.slug)}
                    className="flex w-7 shrink-0 items-center justify-center rounded text-sky-300/80 hover:bg-white/5 hover:text-sky-100"
                    aria-expanded={showCategoryExpanded}
                    aria-label={`${category.category} ${showCategoryExpanded ? '접기' : '펼치기'}`}
                  >
                    <span className="text-[10px]">{showCategoryExpanded ? '▼' : '▶'}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <AuthLink
                      href={categoryEntryHref}
                      onClick={() => {
                        setHoverExpandedSlug((prevHover) => {
                          if (prevHover && prevHover !== category.slug && expandedSlug !== prevHover) {
                            startHoverClose(prevHover);
                          }
                          return null;
                        });
                        setExpandedSlug(category.slug);
                      }}
                      className={`block rounded-md px-2 py-1.5 font-normal transition-colors hover:bg-white/[0.06] ${
                        categoryLinkActive
                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                          : 'text-slate-200'
                      }`}
                    >
                      <span className="inline-flex min-w-0 items-center">
                        <span className="mr-1 w-5 shrink-0 text-center" aria-hidden>
                          {(category.slug === COUNSELOR_DISPATCH_MGMT_SLUG ||
                          category.slug === COUNSELOR_ASSESSMENT_CODE_SLUG) &&
                          category.subcategories[0]?.icon
                            ? category.subcategories[0].icon
                            : category.icon}
                        </span>
                        <span className="text-xs leading-tight sm:text-[13px]">
                          {stripCategoryNumber(category.category)}
                        </span>
                      </span>
                    </AuthLink>
                  </div>
                </div>

                    <CounselorSidebarSubmenuPanel
                      visible={showSubmenuPanel}
                      onMouseEnter={() => handleCategoryMouseEnter(category.slug)}
                    >
                    {category.subcategories.map((sub) => {
                      if (sub.adminOnly && !adminUser) return null;
                      const visibleItems = sub.items.filter((item) => !item.adminOnly || adminUser);
                      if (visibleItems.length === 0) return null;
                      const flatMiddleTier = Boolean(sub.flatItems);
                      return (
                        <div key={sub.name || visibleItems[0]?.href}>
                          {!flatMiddleTier ? (
                            <p className="px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                              {sub.name.replace(/^\d+[a-z]\.\s*/i, '')}
                            </p>
                          ) : null}
                          <ul className={`space-y-0.5 ${flatMiddleTier ? 'pb-1' : 'pb-1'}`}>
                            {visibleItems.flatMap((item) => {
                              const normalizedItemHref = item.href.replace(/\/+$/, '');
                              const pathNorm = (pathname || '').split('?')[0].replace(/\/+$/, '') || '';
                              const nestedAfter = nestedNavItemsAfter(
                                sub.name,
                                item.href,
                                pathname,
                              );
                              const parentSubmenu =
                                normalizedItemHref === '/counselor/assessments'
                                  ? getAssessmentsParentSubmenuItems({
                                      admin: adminUser,
                                      pathname,
                                      search,
                                    })
                                  : normalizedItemHref === '/counselor/clients'
                                    ? getClientsParentSubmenuItems({
                                        admin: adminUser,
                                        pathname,
                                        search,
                                      })
                                    : [];
                              const flattenNav =
                                category.slug === COUNSELOR_DISPATCH_MGMT_SLUG ||
                                category.slug === COUNSELOR_ASSESSMENT_CODE_SLUG;
                              const contextNested =
                                normalizedItemHref === '/counselor/assessments'
                                  ? getAssessmentListContextNestedItems(pathname, search, {
                                      admin: adminUser,
                                    })
                                  : normalizedItemHref === '/counselor/clients'
                                    ? getClientsListContextNestedItems(pathname, search, {
                                        admin: adminUser,
                                      })
                                    : [];
                              const contextAnchorHref =
                                normalizedItemHref === '/counselor/assessments'
                                  ? '/counselor/assessments'
                                  : normalizedItemHref === '/counselor/clients'
                                    ? '/counselor/clients'
                                    : '';
                              const hasActiveNested =
                                parentSubmenu.some((n) => n.isActive(pathNorm)) ||
                                contextNested.some((n) => n.isActive(pathNorm));
                              const parentExactActive =
                                normalizedItemHref === '/counselor/assessments'
                                  ? pathNorm === '/counselor/assessments'
                                  : normalizedItemHref === '/counselor/clients'
                                    ? pathNorm === '/counselor/clients'
                                    : isMenuItemActive(pathname, item.href);
                              const active = !activeNested && !hasActiveNested && parentExactActive;
                              const rows: React.ReactNode[] = [];
                              const nestedAlign = MENU_NESTED_ALIGN;
                              const nestedPrefix = '\u00A0- ';

                              if (flattenNav) {
                                rows.push(
                                  <li key={`flat-${item.href}`}>
                                    <AuthLink
                                      href={item.href}
                                      onClick={() => {
                                        if (
                                          item.href.replace(/\/+$/, '') === '/counselor/assessments'
                                        ) {
                                          clearAssessmentListSearch();
                                        }
                                      }}
                                      className={`block truncate rounded-md py-1 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${MENU_MIDDLE_ALIGN} ${
                                        active
                                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                      }`}
                                      title={item.description}
                                    >
                                      {item.name}
                                    </AuthLink>
                                  </li>,
                                );
                              }

                              if (!flattenNav) {
                                rows.push(
                                  <li
                                    key={item.href}
                                    onMouseEnter={() => setHoveredMenuHref(item.href)}
                                    onMouseLeave={() =>
                                      setHoveredMenuHref((prev) => (prev === item.href ? null : prev))
                                    }
                                  >
                                    <AuthLink
                                      href={item.href}
                                      onClick={() => {
                                        if (item.href.replace(/\/+$/, '') === '/counselor/assessments') {
                                          clearAssessmentListSearch();
                                        }
                                      }}
                                      className={`block truncate rounded-md py-1 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${MENU_MIDDLE_ALIGN} ${
                                        active
                                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                      }`}
                                      title={item.description}
                                    >
                                      {item.name}
                                    </AuthLink>
                                  </li>,
                                );
                              }

                              for (const nested of parentSubmenu.sort((a, b) => a.order - b.order)) {
                                const nestedActive = nested.isActive(pathNorm);
                                const alignMiddle = nested.menuAlign !== 'nested';
                                const itemMenuAlign = alignMiddle ? MENU_MIDDLE_ALIGN : nestedAlign;
                                const itemPrefix = alignMiddle ? '' : nestedPrefix;
                                rows.push(
                                  <li
                                    key={`${item.href}-${nested.href}`}
                                    onMouseEnter={() => setHoveredMenuHref(item.href)}
                                    onMouseLeave={() =>
                                      setHoveredMenuHref((prev) =>
                                        prev === item.href ? null : prev,
                                      )
                                    }
                                  >
                                    <AuthLink
                                      href={nested.href}
                                      onClick={() => {
                                        if (
                                          nested.href.replace(/\/+$/, '') === '/counselor/assessments'
                                        ) {
                                          clearAssessmentListSearch();
                                        }
                                      }}
                                      className={`block truncate rounded-md py-1 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${itemMenuAlign} ${
                                        nestedActive
                                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                      }`}
                                    >
                                      {itemPrefix}
                                      {nested.label}
                                    </AuthLink>
                                  </li>,
                                );
                              }
                              if (contextAnchorHref && contextNested.length > 0) {
                                for (const ctx of contextNested.sort((a, b) => a.order - b.order)) {
                                  const ctxActive = ctx.isActive(pathNorm);
                                  rows.push(
                                    <li
                                      key={`${item.href}-ctx-${ctx.label}`}
                                      onMouseEnter={() => setHoveredMenuHref(item.href)}
                                      onMouseLeave={() =>
                                        setHoveredMenuHref((prev) =>
                                          prev === item.href ? null : prev,
                                        )
                                      }
                                    >
                                      <AuthLink
                                        href={ctx.href}
                                        onClick={() => {
                                          const idMatch =
                                            ctx.href.match(/assessmentId=([^&]+)/) ||
                                            ctx.href.match(/[?&]id=([^&]+)/);
                                          if (idMatch?.[1]) {
                                            rememberCounselorAssessmentContext(
                                              decodeURIComponent(idMatch[1]),
                                            );
                                          }
                                        }}
                                        className={`block truncate rounded-md py-1 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${nestedAlign} ${
                                          ctxActive
                                            ? 'bg-sky-600/30 font-semibold text-sky-100'
                                            : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                                        }`}
                                      >
                                        {nestedPrefix}
                                        {ctx.label}
                                      </AuthLink>
                                    </li>,
                                  );
                                }
                              }
                              for (const nested of nestedAfter) {
                                const href = nested.buildHref(
                                  pathname.split('?')[0],
                                  search,
                                );
                                const nestedActive =
                                  activeNested?.item.label === nested.label;
                                rows.push(
                                  <li key={`${item.href}-${nested.label}`}>
                                    <AuthLink
                                      href={href}
                                      className={`block truncate rounded-md py-1 pr-2 text-xs font-normal leading-snug transition-colors sm:text-[13px] ${MENU_NESTED_ALIGN} ${
                                        nestedActive
                                          ? 'bg-sky-600/30 font-semibold text-sky-100'
                                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                                      }`}
                                    >
                                      {'\u00A0- '}
                                      {nested.label}
                                    </AuthLink>
                                  </li>,
                                );
                              }
                              return rows;
                            })}
                          </ul>
                        </div>
                      );
                    })}
                    </CounselorSidebarSubmenuPanel>
              </div>
            );
          })}
        </nav>
      </aside>

      <div
        className={`flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:max-h-[calc(100dvh-4.5rem)]`}
      >
        {children}
      </div>
    </div>
  );
}

function isMiddleTierActiveInCategory(
  category: (typeof counselorMenuCategories)[number],
  pathNorm: string,
  pathname: string,
  search: string,
  adminUser: boolean,
): boolean {
  for (const sub of category.subcategories) {
    if (sub.adminOnly && !adminUser) continue;
    const visibleItems = sub.items.filter((item) => !item.adminOnly || adminUser);
    for (const item of visibleItems) {
      const normalizedItemHref = item.href.replace(/\/+$/, '');
      const parentSubmenu =
        normalizedItemHref === '/counselor/assessments'
          ? getAssessmentsParentSubmenuItems({ admin: adminUser, pathname, search })
          : normalizedItemHref === '/counselor/clients'
            ? getClientsParentSubmenuItems({ admin: adminUser, pathname, search })
            : [];
      const contextNested =
        normalizedItemHref === '/counselor/assessments'
          ? getAssessmentListContextNestedItems(pathname, search, { admin: adminUser })
          : normalizedItemHref === '/counselor/clients'
            ? getClientsListContextNestedItems(pathname, search, { admin: adminUser })
            : [];
      const flattenNav =
        category.slug === COUNSELOR_DISPATCH_MGMT_SLUG ||
        category.slug === COUNSELOR_ASSESSMENT_CODE_SLUG;

      if (!flattenNav && isMenuItemActive(pathname, item.href)) {
        return true;
      }
      if (parentSubmenu.some((n) => n.isActive(pathNorm))) return true;
      if (contextNested.some((n) => n.isActive(pathNorm))) return true;
      if (flattenNav && normalizedItemHref === pathNorm) return true;
    }
  }
  return false;
}

function stripCategoryNumber(label: string): string {
  return label.replace(/^\d+\.\s*/, '');
}

function getCategoryEntryHref(
  category: (typeof counselorMenuCategories)[number],
  adminUser: boolean,
): string {
  if (category.slug === 'data' && adminUser) {
    return PERMANENTLY_DELETED_ASSESSMENTS_HREF;
  }
  return getCounselorCategoryEntryHref(category.slug);
}
