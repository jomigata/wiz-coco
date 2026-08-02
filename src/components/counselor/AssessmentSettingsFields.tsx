'use client';

import React, { useMemo, useRef, useState } from 'react';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import {
  FORM_HINT,
  FORM_INPUT,
  FORM_LABEL,
  openDatePicker,
  TEST_PICKER_FILL,
  TEST_PICKER_SCROLL,
} from '@/lib/assessmentFormUi';
import WelcomeMessageSamplePicker from '@/components/counselor/WelcomeMessageSamplePicker';

export interface AssessmentSettingsFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  welcomeMessage: string;
  onWelcomeMessageChange: (value: string) => void;
  usageEndDate: string;
  onUsageEndDateChange: (value: string) => void;
  selectedTestIds: Set<string>;
  onToggleTest: (testId: string) => void;
  disabled?: boolean;
  titleRequired?: boolean;
  /** 수정 화면 등 — 여백·입력 높이 축소 */
  compact?: boolean;
  /** meta: 제목·종료일·메시지 / tests: 검사 선택만 / all: 전체(기본) */
  sections?: 'all' | 'meta' | 'tests';
}

type TestSortKey = 'no' | 'name';
type SortDirection = 'asc' | 'desc';

function TestSortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: TestSortKey;
  activeKey: TestSortKey;
  direction: SortDirection;
  onSort: (key: TestSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:text-sky-200 whitespace-nowrap ${active ? 'text-sky-300' : 'text-slate-400'} ${className}`}
    >
      {label}
      <span className="text-[10px] opacity-80" aria-hidden>
        {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </button>
  );
}

export default function AssessmentSettingsFields({
  title,
  onTitleChange,
  welcomeMessage,
  onWelcomeMessageChange,
  usageEndDate,
  onUsageEndDateChange,
  selectedTestIds,
  onToggleTest,
  disabled = false,
  titleRequired = true,
  compact = false,
  sections = 'all',
}: AssessmentSettingsFieldsProps) {
  const usageEndDateRef = useRef<HTMLInputElement>(null);
  const [testSortKey, setTestSortKey] = useState<TestSortKey>('no');
  const [testSortDir, setTestSortDir] = useState<SortDirection>('asc');
  const showMeta = sections === 'all' || sections === 'meta';
  const showTests = sections === 'all' || sections === 'tests';
  const fieldGap = compact ? 'space-y-4' : 'space-y-4';
  const labelClass = compact ? 'mb-2 block text-sm font-semibold text-slate-300' : FORM_LABEL;
  const inputClass = compact ? `${FORM_INPUT} py-2.5 text-sm` : FORM_INPUT;
  const hintClass = compact ? 'mt-1.5 text-sm text-slate-400 leading-relaxed' : `${FORM_HINT} mt-1.5`;

  const toggleTestSort = (key: TestSortKey) => {
    if (testSortKey === key) {
      setTestSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTestSortKey(key);
      setTestSortDir(key === 'no' ? 'asc' : 'asc');
    }
  };

  const sortedTests = useMemo(() => {
    const list = counselorAssessmentTestOptions.map((t, index) => ({
      ...t,
      no: index + 1,
    }));
    const mult = testSortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (testSortKey === 'no') return mult * (a.no - b.no);
      return mult * a.name.localeCompare(b.name, 'ko');
    });
  }, [testSortKey, testSortDir]);

  return (
    <div
      className={
        sections === 'tests'
          ? 'flex h-full min-h-0 flex-1 flex-col'
          : fieldGap
      }
    >
      {showMeta ? (
        <>
          <div>
            <label htmlFor="assessment-title" className={labelClass}>
              안내 제목 {titleRequired ? <span className="text-red-400">*</span> : null}
            </label>
            <input
              id="assessment-title"
              type="text"
              required={titleRequired}
              maxLength={200}
              className={inputClass}
              placeholder="예: 개인 심리검사"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label htmlFor="usage-end-date" className={labelClass}>
              사용종료일 (선택)
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => openDatePicker(usageEndDateRef)}
                disabled={disabled}
                className="absolute inset-y-0 left-0 z-10 flex w-10 items-center justify-center rounded-l-lg border-r border-white/10 text-sky-400 transition hover:bg-sky-500/10 hover:text-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="사용종료일 달력 열기"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M6 2.5V5M14 2.5V5M3.5 8h13M5 4.5h10a1.1 1.1 0 011.1 1.1v10.4A1.1 1.1 0 0115 17.1H5a1.1 1.1 0 01-1.1-1.1V5.6A1.1 1.1 0 015 4.5z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <input
                id="usage-end-date"
                ref={usageEndDateRef}
                type="date"
                className={`${inputClass} pl-11 pr-2 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden`}
                value={usageEndDate}
                onChange={(e) => onUsageEndDateChange(e.target.value)}
                disabled={disabled}
              />
            </div>
            {!compact ? (
              <p className={hintClass}>비워두면 무기한 사용 가능합니다.</p>
            ) : null}
          </div>

          <div>
            <div className={`flex flex-wrap items-center justify-between gap-2 ${compact ? 'mb-1.5' : 'mb-2'}`}>
              <label htmlFor="welcome-message" className={labelClass}>
                안내 메시지 (선택)
              </label>
              <WelcomeMessageSamplePicker
                inline
                disabled={disabled}
                onPick={onWelcomeMessageChange}
              />
            </div>
            <textarea
              id="welcome-message"
              rows={compact ? 3 : 4}
              className={`${inputClass} ${compact ? 'min-h-[4.5rem] max-h-[4.5rem] resize-none' : 'resize-y'}`}
              placeholder="내담자에게 보여줄 환영/안내 문구"
              value={welcomeMessage}
              onChange={(e) => onWelcomeMessageChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </>
      ) : null}

      {showTests ? (
        <div className={sections === 'tests' ? 'flex min-h-0 flex-1 flex-col' : 'space-y-0'}>
          <div className={`flex items-center justify-end gap-2 shrink-0 ${compact ? 'mb-2' : 'mb-2'}`}>
            <span className="text-xs text-sky-300/90">{selectedTestIds.size}개 선택</span>
          </div>
          <div
            className={`${sections === 'tests' ? TEST_PICKER_FILL : TEST_PICKER_SCROLL} flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-black/10 ${compact ? 'p-2' : 'p-2'}`}
          >
            <div className="grid shrink-0 grid-cols-[2.75rem_1.75rem_minmax(0,1fr)] items-center gap-2 border-b border-white/[0.08] px-2 py-2">
              <TestSortHeader
                label="No."
                sortKey="no"
                activeKey={testSortKey}
                direction={testSortDir}
                onSort={toggleTestSort}
                className="text-slate-300"
              />
              <span className="sr-only">선택</span>
              <TestSortHeader
                label="검사명"
                sortKey="name"
                activeKey={testSortKey}
                direction={testSortDir}
                onSort={toggleTestSort}
                className="justify-start normal-case tracking-normal"
              />
            </div>
            <div
              className={`min-h-0 flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 ${compact ? 'gap-1 p-1.5' : 'gap-1.5 p-2'}`}
            >
              {sortedTests.map((t) => (
                <label
                  key={t.testId}
                  className={`grid cursor-pointer grid-cols-[2.75rem_1.75rem_minmax(0,1fr)] items-center gap-2 rounded-lg border border-transparent transition hover:border-sky-500/20 hover:bg-sky-500/5 ${
                    compact ? 'px-2 py-2' : 'px-2 py-2'
                  }`}
                  title={t.name}
                >
                  <span className="tabular-nums text-sm font-semibold text-slate-300">{t.no}</span>
                  <input
                    type="checkbox"
                    checked={selectedTestIds.has(t.testId)}
                    onChange={() => onToggleTest(t.testId)}
                    disabled={disabled}
                    className="rounded text-sky-500"
                  />
                  <span className={`min-w-0 truncate whitespace-nowrap text-white ${compact ? 'text-sm' : 'text-sm'}`}>
                    {t.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {!compact ? (
            <p className={`${FORM_HINT} mt-2 shrink-0`}>
              이미 제출된 결과가 있어도 안내·검사 구성은 수정할 수 있습니다.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
