import type { AppRole } from '@/utils/roleUtils';

/** backend/config.py BOOTSTRAP_ADMIN_EMAILS 와 동일하게 유지 */
export const BOOTSTRAP_ADMIN_EMAILS = ['jomigata@gmail.com', 'wizcocoai@gmail.com'] as const;

export function normalizeAccountEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

export function getBootstrapRoleForEmail(email: string | null | undefined): AppRole | null {
  const e = normalizeAccountEmail(email);
  if (!e) return null;
  if ((BOOTSTRAP_ADMIN_EMAILS as readonly string[]).includes(e)) return 'admin';
  return null;
}

export function isBootstrapAdminEmail(email: string | null | undefined): boolean {
  return getBootstrapRoleForEmail(email) === 'admin';
}
