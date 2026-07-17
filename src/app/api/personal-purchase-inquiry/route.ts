import { NextRequest, NextResponse } from 'next/server';
import { BUSINESS_LEGAL } from '@/lib/businessLegal';
import { sendEmail } from '@/utils/emailService';

type InquiryBody = {
  name?: string;
  email?: string;
  phone?: string;
  packageInterest?: string;
  message?: string;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  let body: InquiryBody;
  try {
    body = (await request.json()) as InquiryBody;
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  const phone = (body.phone || '').trim();
  const packageInterest = (body.packageInterest || '').trim();
  const message = (body.message || '').trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { success: false, error: '이름, 이메일, 문의 내용은 필수입니다.' },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: '올바른 이메일 주소를 입력해 주세요.' }, { status: 400 });
  }

  const subject = `[WizCoCo] 개인 검사코드 구매 문의 — ${name}`;
  const htmlBody = `
    <h2>개인 검사코드 구매 문의</h2>
    <p><strong>이름:</strong> ${escapeHtml(name)}</p>
    <p><strong>이메일:</strong> ${escapeHtml(email)}</p>
    <p><strong>휴대폰:</strong> ${escapeHtml(phone || '(미입력)')}</p>
    <p><strong>관심 패키지:</strong> ${escapeHtml(packageInterest || '(미선택)')}</p>
    <hr />
    <p><strong>문의 내용</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
  `;

  try {
    await sendEmail(BUSINESS_LEGAL.contactEmail, subject, htmlBody);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[personal-purchase-inquiry]', err);
    return NextResponse.json(
      {
        success: false,
        error: '문의 전송에 실패했습니다. 잠시 후 다시 시도하거나 이메일로 직접 연락해 주세요.',
      },
      { status: 500 },
    );
  }
}
