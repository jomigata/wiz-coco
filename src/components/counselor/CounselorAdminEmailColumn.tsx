import { counselorListTdClass, counselorListThClass } from '@/lib/counselorListTableStyles';

type Props = {
  email?: string | null;
  className?: string;
};

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
