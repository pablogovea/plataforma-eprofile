import type { ProfileBundle } from '../types/supabase';

const escapeVCard = (value: string): string => value
  .replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

export function exportVCard(data: ProfileBundle): void {
  const { profile, contact } = data;
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${escapeVCard(profile.full_name)}`,
    `TITLE:${escapeVCard(profile.career)}`,
  ];
  if (contact?.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(contact.email)}`);
  if (contact?.phone) lines.push(`TEL;TYPE=CELL:${escapeVCard(contact.phone)}`);
  if (contact?.website_url) lines.push(`URL:${escapeVCard(contact.website_url)}`);
  if (contact?.location) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(contact.location)};;;;`);
  lines.push(`NOTE:${escapeVCard(profile.bio)}`, 'END:VCARD');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${data.student.slug}.vcf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
