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
  sections = 'all',
}: AssessmentSettingsFieldsProps) {
  const usageEndDateRef = useRef<HTMLInputElement>(null);
  const showMeta = sections === 'all' || sections === 'meta';
  const showTests = sections === 'all' || sections === 'tests';

  return (
    <div
      className={
        sections === 'tests'
          ? 'flex h-full min-h-0 flex-1 flex-col'
          : 'space-y-4'
      }
    >
      {showMeta ? (
        <>
          <div>
            <label htmlFor="assessment-title" className={FORM_LABEL}>
              안내 제목 {titleRequired ? <span className="text-red-400">*</span> : null}
            </label>
            <input
              id="assessment-title"
              type="text"
              required={titleRequired}
              maxLength={200}
              className={FORM_INPUT}
              placeholder="예: 개인 심리검사"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label htmlFor="usage-end-date" className={FORM_LABEL}>
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
                className={`${FORM_INPUT} py-2.5 pl-11 pr-2 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden`}
                value={usageEndDate}
                onChange={(e) => onUsageEndDateChange(e.target.value)}
                disabled={disabled}
              />
            </div>
            <p className={`${FORM_HINT} mt-1.5`}>비워두면 무기한 사용 가능합니다.</p>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="welcome-message" className={FORM_LABEL}>
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
              rows={4}
              className={`${FORM_INPUT} resize-y`}
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
          <div className="mb-1.5 flex items-center justify-end gap-2 shrink-0">
            <span className="text-xs text-sky-300/90">{selectedTestIds.size}개 선택</span>
          </div>
          <div
            className={`${sections === 'tests' ? TEST_PICKER_FILL : TEST_PICKER_SCROLL} grid grid-cols-1 gap-1.5`}
          >
            {counselorAssessmentTestOptions.map((t) => (
              <label
                key={t.testId}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition hover:border-sky-500/20 hover:bg-sky-500/5"
              >
                <input
                  type="checkbox"
                  checked={selectedTestIds.has(t.testId)}
                  onChange={() => onToggleTest(t.testId)}
                  disabled={disabled}
                  className="rounded text-sky-500"
                />
                <span className="text-sm text-white">{t.name}</span>
              </label>
            ))}
          </div>
          <p className={`${FORM_HINT} mt-1.5 shrink-0`}>
            이미 제출된 결과가 있어도 안내·검사 구성은 수정할 수 있습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
