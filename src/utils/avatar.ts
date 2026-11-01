/**
 * Safe avatar handling utility to prevent passing empty strings to img src attributes
 */
export const DEFAULT_STUDENT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';

export const DEFAULT_TEACHER_AVATAR =
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80';

export const DEFAULT_ADMIN_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80';

export { SCHOOL_LOGO_URL } from './schoolLogo.ts';

export function safeAvatar(
  url?: string | null,
  fallback: string = DEFAULT_STUDENT_AVATAR
): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  return url;
}

