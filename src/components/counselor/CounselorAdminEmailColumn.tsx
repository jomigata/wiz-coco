import {
  counselorListSortActiveClass,
  counselorListSortIdleClass,
  counselorListTdClass,
  counselorListThClass,
} from '@/lib/counselorListTableStyles';

type SortDirection = 'asc' | 'desc';

type Props = {
  email?: string | null;
  className?: string;
};

export function compareCounselorEmail(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: SortDirection,
): number {
  const mult = dir === 'asc' ? 1 : -1;
  return mult * (a || '').trim().localeCompare((b || '').trim(), 'ko', { sensitivity: 'base' });
}

type SortHeaderProps<T extends string> = {
  emailSortKey: T;
  activeKey: T;
  direction: SortDirection;
  onSort: (key: T) => void;
};

export function CounselorAdminEmailSortHeader<T extends string>({
  emailSortKey,
  activeKey,
  direction,
  onSort,
}: SortHeaderProps<T>) {
  const active = activeKey === emailSortKey;
  return (
    <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-left`}>
      <button
        type="button"
        onClick={() => onSort(emailSortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-200"
      >
        <span>상담사 이메일</span>
        <span
          className={`text-[10px] ${active ? counselorListSortActiveClass : counselorListSortIdleClass}`}
          aria-hidden="true"
        >
          {active ? (direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

/** @deprecated CounselorAdminEmailSortHeader 사용 */
export function CounselorAdminEmailTh() {
  return (
    <th scope="col" className={`${counselorListThClass} whitespace-nowrap text-left`}>
      상담사 이메일
    </th>
  );
}

export function CounselorAdminEmailTd({ email, className = '' }: Props) {
  return (
    <td className={`${counselorListTdClass} text-slate-300 ${className}`.trim()}>
      {email?.trim() || '—'}
    </td>
  );
}
