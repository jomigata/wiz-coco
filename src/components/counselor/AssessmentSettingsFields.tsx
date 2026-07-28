'use client';

import React, { useRef } from 'react';
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
  const showMeta = sections === 'all' || sections === 'meta';
  const showTests = sections === 'all' || sections === 'tests';
  const fieldGap = compact ? 'space-y-2' : 'space-y-4';
  const labelClass = compact ? 'mb-1 block text-xs font-semibold text-slate-300' : FORM_LABEL;
  const inputClass = compact ? `${FORM_INPUT} py-2 text-sm` : FORM_INPUT;
  const hintClass = compact ? 'mt-1 text-xs text-slate-500' : `${FORM_HINT} mt-1.5`;

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
            <div className={`flex flex-wrap items-center justify-between gap-2 ${compact ? 'mb-1' : 'mb-2'}`}>
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
              rows={compact ? 2 : 4}
              className={`${inputClass} ${compact ? 'min-h-[3.25rem] max-h-[3.25rem] resize-none' : 'resize-y'}`}
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
          <div className={`flex items-center justify-end gap-2 shrink-0 ${compact ? 'mb-1' : 'mb-1.5'}`}>
            <span className="text-xs text-sky-300/90">{selectedTestIds.size}개 선택</span>
          </div>
          <div
            className={`${sections === 'tests' ? TEST_PICKER_FILL : TEST_PICKER_SCROLL} grid grid-cols-1 ${compact ? 'gap-1 p-2' : 'gap-1.5'}`}
          >
            {counselorAssessmentTestOptions.map((t) => (
              <label
                key={t.testId}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border border-transparent transition hover:border-sky-500/20 hover:bg-sky-500/5 ${
                  compact ? 'px-1.5 py-1' : 'px-2 py-1.5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTestIds.has(t.testId)}
                  onChange={() => onToggleTest(t.testId)}
                  disabled={disabled}
                  className="rounded text-sky-500"
                />
                <span className={`text-white ${compact ? 'text-xs' : 'text-sm'}`}>{t.name}</span>
              </label>
            ))}
          </div>
          {!compact ? (
            <p className={`${FORM_HINT} mt-1.5 shrink-0`}>
              이미 제출된 결과가 있어도 안내·검사 구성은 수정할 수 있습니다.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
