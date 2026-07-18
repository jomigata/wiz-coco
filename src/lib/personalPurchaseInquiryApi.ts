const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_FLASK_API_URL) {
    return process.env.NEXT_PUBLIC_FLASK_API_URL;
  }
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export type PersonalPurchaseInquiryPayload = {
  name: string;
  email: string;
  phone?: string;
  packageInterest?: string;
  message: string;
  attachments?: File[];
};

export async function submitPersonalPurchaseInquiry(
  payload: PersonalPurchaseInquiryPayload,
): Promise<{ success: boolean; error?: string }> {
  const form = new FormData();
  form.append('name', payload.name);
  form.append('email', payload.email);
  form.append('phone', payload.phone || '');
  form.append('packageInterest', payload.packageInterest || '');
  form.append('message', payload.message);
  for (const file of payload.attachments || []) {
    form.append('attachments', file);
  }

  const res = await fetch(`${getBaseUrl()}/api/b2c/personal-purchase-inquiry`, {
    method: 'POST',
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || '문의 전송에 실패했습니다.' };
  }
  return { success: true };
}
