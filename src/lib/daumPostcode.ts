/** Daum/Kakao 우편번호 서비스 — https://postcode.map.daum.net/guide */

export type DaumPostcodeResult = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: 'R' | 'J';
  buildingName?: string;
  apartment?: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeResult) => void;
        onclose?: (state: string) => void;
        width?: string | number;
        height?: string | number;
      }) => { open: (opts?: { q?: string; left?: number; top?: number }) => void };
    };
  }
}

const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

let scriptLoadPromise: Promise<void> | null = null;

export function loadDaumPostcodeScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저에서만 주소 찾기를 사용할 수 있습니다.'));
  }
  if (window.daum?.Postcode) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('주소 찾기 스크립트를 불러오지 못했습니다.')), {
        once: true,
      });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('주소 찾기 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/** 선택된 우편번호 결과 → 저장용 한 줄 주소 (우편번호 + 도로명/지번) */
export function formatDaumPostcodeAddress(data: DaumPostcodeResult): string {
  const base = data.userSelectedType === 'R' ? data.roadAddress : data.jibunAddress;
  const extra = data.buildingName?.trim();
  const withBuilding = extra && !base.includes(extra) ? `${base} ${extra}` : base;
  const zip = data.zonecode?.trim();
  return zip ? `(${zip}) ${withBuilding}` : withBuilding;
}

export async function openDaumPostcodeSearch(onComplete: (data: DaumPostcodeResult) => void): Promise<void> {
  await loadDaumPostcodeScript();
  if (!window.daum?.Postcode) {
    throw new Error('주소 찾기를 초기화하지 못했습니다.');
  }
  new window.daum.Postcode({
    oncomplete: onComplete,
  }).open();
}
