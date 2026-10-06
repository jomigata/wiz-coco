/** 스크롤 힌트 화살표 — 지점 배경 밝기 추정 */

function parseRgbChannel(raw: string): number {
  const v = raw.trim();
  if (v.endsWith('%')) return (parseFloat(v) / 100) * 255;
  return parseFloat(v);
}

function parseBackgroundColor(
  bg: string,
): { r: number; g: number; b: number; a: number } | null {
  if (!bg || bg === 'transparent') return null;
  const rgba = bg.match(/^rgba?\(\s*([^)]+)\s*\)$/i);
  if (!rgba) return null;
  const parts = rgba[1]!.split(',').map((p) => p.trim());
  if (parts.length < 3) return null;
  const r = parseRgbChannel(parts[0]!);
  const g = parseRgbChannel(parts[1]!);
  const b = parseRgbChannel(parts[2]!);
  const a = parts.length >= 4 ? parseFloat(parts[3]!) : 1;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b) || Number.isNaN(a)) return null;
  return { r, g, b, a };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** true → 밝은 배경 → 어두운 화살표 권장 */
export function isLightBackgroundAt(clientX: number, clientY: number): boolean {
  if (typeof document === 'undefined') return false;
  const target = document.elementFromPoint(clientX, clientY);
  if (!target) return false;

  let node: Element | null = target;
  let accR = 0;
  let accG = 0;
  let accB = 0;
  let remA = 1;

  while (node && node !== document.documentElement) {
    const bg = getComputedStyle(node).backgroundColor;
    const parsed = parseBackgroundColor(bg);
    if (parsed && parsed.a > 0.04) {
      const blendA = parsed.a * remA;
      accR += parsed.r * blendA;
      accG += parsed.g * blendA;
      accB += parsed.b * blendA;
      remA *= 1 - parsed.a;
      if (remA < 0.08) break;
    }
    node = node.parentElement;
  }

  if (remA > 0.92) {
    return false;
  }

  const denom = 1 - remA;
  const r = accR / denom;
  const g = accG / denom;
  const b = accB / denom;
  return relativeLuminance(r, g, b) > 0.58;
}
