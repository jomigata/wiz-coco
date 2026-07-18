import { NextRequest, NextResponse } from 'next/server';

const FLASK_BASE =
  process.env.NEXT_PUBLIC_FLASK_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://wiz-coco.web.app' : 'http://localhost:5000');

/** 로컬 Next 개발 시 Flask B2C API로 프록시 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const res = await fetch(`${FLASK_BASE}/api/b2c/personal-purchase-inquiry`, {
      method: 'POST',
      body: formData,
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[personal-purchase-inquiry proxy]', err);
    return NextResponse.json(
      { success: false, error: '문의 전송에 실패했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
