/**
 * 상담사 승인 신청 — 관리자 알림 API (Flask)
 */
import { getCounselorToken } from '@/lib/assessmentApi';
import type { CounselorProfileData } from '@/types/counselorProfile';

const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export async function notifyAdminCounselorApplication(
  applicationId: string,
  profile: CounselorProfileData,
): Promise<{ emailed: boolean }> {
  const token = await getCounselorToken();
  if (!token) return { emailed: false };

  try {
    const res = await fetch(`${getBaseUrl()}/api/counselor-applications/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        applicationId,
        applicantName: profile.name,
        applicantEmail: profile.email,
        phone: profile.phone,
        specialization: profile.specialization,
        practiceType: profile.practiceType,
        organizationName: profile.organizationName,
      }),
    });
    if (!res.ok) return { emailed: false };
    const data = (await res.json().catch(() => ({}))) as { emailed?: boolean };
    return { emailed: Boolean(data.emailed) };
  } catch {
    return { emailed: false };
  }
}
