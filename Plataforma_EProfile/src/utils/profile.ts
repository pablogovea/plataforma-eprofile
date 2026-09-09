import type { Json, ProfileBundle } from '../types/supabase';

export function parseProfileBundle(value: Json | null): ProfileBundle | null {
  if (value === null || Array.isArray(value) || typeof value !== 'object') return null;
  const candidate = value as Record<string, Json | undefined>;
  if (!candidate.student || !candidate.profile) return null;
  if (!Array.isArray(candidate.formations) || !Array.isArray(candidate.experiences)) return null;
  if (!Array.isArray(candidate.skills) || !Array.isArray(candidate.recognitions) || !Array.isArray(candidate.projects)) return null;
  return value as unknown as ProfileBundle;
}

export function emptyContact(studentId: string) {
  return {
    id: crypto.randomUUID(), student_id: studentId, email: '', phone: '', linkedin_url: null,
    github_url: null, website_url: null, location: '', updated_at: new Date().toISOString(),
  };
}

export function formatDateRange(start: string | null, end: string | null): string {
  const format = (date: string): string => new Intl.DateTimeFormat('es-MX', { year: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`));
  if (!start && !end) return '';
  if (!start && end) return format(end);
  return `${format(start as string)} - ${end ? format(end) : 'Actualidad'}`;
}

export function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}
