'use client';

import React, { useMemo, useState } from 'react';
import { counselorAssessmentTestOptions } from '@/data/counselorAssessmentTests';
import {
  FORM_HINT,
  FORM_INPUT,
  FORM_LABEL,
  TEST_PICKER_SCROLL,
} from '@/lib/assessmentFormUi';
import UsageEndDateField from '@/components/counselor/UsageEndDateField';
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
  /** 입력 필드 커스텀 클래스 (수정 화면 강조 등) */
  inputClassName?: string;
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
  inputClassName,
}: AssessmentSettingsFieldsProps) {
  const [testSortKey, setTestSortKey] = useState<TestSortKey>('no');
  const [testSortDir, setTestSortDir] = useState<SortDirection>('asc');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const showMeta = sections === 'all' || sections === 'meta';
  const showTests = sections === 'all' || sections === 'tests';
  const fieldGap = compact ? 'space-y-4' : 'space-y-4';
  const labelClass = compact ? 'mb-2 block text-sm font-semibold text-slate-300' : FORM_LABEL;
  const inputClass =
    inputClassName ||
    (compact ? `${FORM_INPUT} py-2.5 text-sm` : FORM_INPUT);
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

  const filteredTests = useMemo(() => {
    const q = testSearchQuery.trim().toLowerCase();
    const base = q ? sortedTests.filter((t) => t.name.toLowerCase().includes(q)) : sortedTests;
    const picked = base.filter((t) => selectedTestIds.has(t.testId));
    const rest = base.filter((t) => !selectedTestIds.has(t.testId));
    return [...picked, ...rest];
  }, [sortedTests, testSearchQuery, selectedTestIds]);

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
            <UsageEndDateField
              id="usage-end-date"
              value={usageEndDate}
              onChange={onUsageEndDateChange}
              disabled={disabled}
              compact={compact}
            />
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
        <div className={sections === 'tests' ? 'flex h-full min-h-0 flex-1 flex-col' : 'space-y-0'}>
          <div className={`flex shrink-0 flex-wrap items-center justify-between gap-2 ${compact ? 'mb-2' : 'mb-2'}`}>
            <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                <svg
                  className="h-4 w-4 text-slate-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="search"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                placeholder="검사명 검색"
                disabled={disabled}
                className={`${inputClass} py-2 pl-8 pr-3 text-sm`}
                aria-label="검사명 검색"
              />
            </div>
            <span className="shrink-0 rounded-md border border-sky-400/45 bg-sky-500/20 px-2.5 py-1 text-sm font-semibold text-sky-100 tabular-nums">
              {selectedTestIds.size}개 선택
            </span>
          </div>
          <div
            className={`${
              sections === 'tests'
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : TEST_PICKER_SCROLL
            } rounded-lg border border-white/[0.08] bg-black/10 ${compact ? 'p-2' : 'p-2'}`}
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
                className="justify-start text-slate-300"
              />
            </div>
            <div
              className={`min-h-0 flex-1 overflow-y-auto grid grid-cols-1 xl:grid-cols-2 ${compact ? 'gap-1 p-1.5' : 'gap-1.5 p-2'}`}
            >
              {filteredTests.length === 0 ? (
                <p className="col-span-full px-2 py-4 text-center text-sm text-slate-500">
                  {testSearchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 검사가 없습니다.'}
                </p>
              ) : (
                filteredTests.map((t) => (
                <label
                  key={t.testId}
                  className={`grid cursor-pointer grid-cols-[2.75rem_1.75rem_minmax(0,1fr)] items-center gap-2 rounded-lg border border-transparent transition hover:border-sky-500/20 hover:bg-sky-500/5 ${
                    compact ? 'px-2 py-2' : 'px-2 py-2'
                  }`}
                  title={t.name}
                >
                  <span className="tabular-nums text-sm font-semibold text-slate-100">{t.no}</span>
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
                ))
              )}
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
