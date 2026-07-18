/** 이메일·휴대폰 목록 마스킹 (행 펼침 시 전체 표시) */
import { formatPhoneDisplayOr, formatPhoneMaskedDisplay } from '@/lib/phoneFormat';

export function formatEmailMaskedDisplay(email: string | null | undefined): string {
  const raw = (email || '').trim();
  if (!raw) return '—';
  const at = raw.indexOf('@');
  if (at <= 0) return raw.length <= 2 ? `${raw[0] ?? ''}*` : `${raw.slice(0, 2)}***`;
  const local = raw.slice(0, at);
  const domain = raw.slice(at);
  if (local.length <= 2) return `${local[0] ?? ''}***${domain}`;
  return `${local.slice(0, 2)}***${domain}`;
}

export function displayContactEmail(
  email: string | null | undefined,
  revealed: boolean,
): string {
  const raw = (email || '').trim();
  if (!raw) return '—';
  return revealed ? raw : formatEmailMaskedDisplay(raw);
}

export function displayContactPhone(
  phone: string | null | undefined,
  revealed: boolean,
): string {
  const raw = (phone || '').trim();
  if (!raw) return '—';
  return revealed ? formatPhoneDisplayOr(raw) : formatPhoneMaskedDisplay(raw);
}
