import type { PdfTemplate, ProfileBundle } from '../types/supabase';
import { formatDateRange } from './profile';

const palettes: Record<PdfTemplate, { accent: string; muted: string; font: string }> = {
  clasica: { accent: '#1e3a5f', muted: '#e8eef5', font: 'Georgia, serif' },
  moderna: { accent: '#4f46e5', muted: '#eef2ff', font: 'Arial, sans-serif' },
  minimalista: { accent: '#111827', muted: '#f3f4f6', font: 'Arial, sans-serif' },
};

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};

const nextPaint = (): Promise<void> => new Promise((resolve) => {
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
});

const waitForImages = async (container: HTMLElement): Promise<void> => {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map((image) => {
    if (image.complete) return Promise.resolve();

    return new Promise<void>((resolve) => {
      const finish = (): void => resolve();
      image.addEventListener('load', finish, { once: true });
      image.addEventListener('error', finish, { once: true });
      window.setTimeout(finish, 5000);
    });
  }));
};

export async function exportProfilePdf(data: ProfileBundle, templateId: PdfTemplate): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');
  const palette = palettes[templateId];
  const root = node('main');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = `position:relative;z-index:2147483646;box-sizing:border-box;width:760px;padding:42px;color:#172033;background:#ffffff;font-family:${palette.font};line-height:1.45`;

  const progress = node('div');
  progress.setAttribute('role', 'status');
  progress.textContent = 'Generando PDF…';
  progress.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(15,23,42,.94);color:#ffffff;font:600 16px Arial,sans-serif;letter-spacing:.2px';

  const header = node('header');
  header.style.cssText = `border-bottom:4px solid ${palette.accent};padding-bottom:20px;margin-bottom:24px;display:flex;gap:22px;align-items:center`;
  if (data.profile.photo_url) {
    const photo = node('img');
    photo.alt = '';
    photo.crossOrigin = 'anonymous';
    photo.referrerPolicy = 'no-referrer';
    photo.src = data.profile.photo_url;
    photo.style.cssText = 'width:104px;height:104px;object-fit:cover;border-radius:50%';
    header.append(photo);
  }
  const identity = node('div');
  const name = node('h1', data.profile.full_name);
  name.style.cssText = `font-size:32px;margin:0;color:${palette.accent}`;
  const career = node('p', data.profile.career);
  career.style.cssText = 'font-size:17px;margin:5px 0 0';
  identity.append(name, career);
  header.append(identity);
  root.append(header);

  const addSection = (title: string, render: (container: HTMLElement) => void): void => {
    const section = node('section');
    section.style.cssText = 'margin:0 0 22px;break-inside:avoid-page';
    const heading = node('h2', title.toUpperCase());
    heading.style.cssText = `font:700 14px Arial,sans-serif;letter-spacing:1.5px;color:${palette.accent};background:${palette.muted};padding:7px 10px;margin:0 0 10px`;
    section.append(heading);
    render(section);
    root.append(section);
  };

  const addEntry = (container: HTMLElement, title: string, subtitle: string, detail: string): void => {
    const wrap = node('div');
    wrap.style.cssText = 'margin:0 4px 13px;break-inside:avoid';
    const h = node('strong', title);
    h.style.cssText = 'display:block;font-size:15px';
    const sub = node('span', subtitle);
    sub.style.cssText = 'display:block;color:#526174;font-size:12px;margin:2px 0';
    const body = node('p', detail);
    body.style.cssText = 'white-space:pre-wrap;margin:4px 0 0;font-size:13px';
    wrap.append(h, sub, body);
    container.append(wrap);
  };

  if (data.profile.bio) addSection('Perfil', (section) => section.append(node('p', data.profile.bio)));
  if (data.experiences.length) addSection('Experiencia', (section) => data.experiences.forEach((item) =>
    addEntry(section, item.position, `${item.organization} · ${formatDateRange(item.start_date, item.end_date)}`, item.description)));
  if (data.formations.length) addSection('Formación', (section) => data.formations.forEach((item) =>
    addEntry(section, item.degree, `${item.institution} · ${formatDateRange(item.start_date, item.end_date)}`, item.description)));
  if (data.skills.length) addSection('Habilidades', (section) => {
    const text = data.skills.map((item) => `${item.name}${item.category ? ` (${item.category})` : ''}`).join('  ·  ');
    section.append(node('p', text));
  });
  if (data.projects.length) addSection('Proyectos', (section) => data.projects.forEach((item) =>
    addEntry(section, `${item.name}${item.is_academic ? ' · Académico' : ''}`, [item.role, item.technologies.join(', ')].filter(Boolean).join(' · '), item.description)));
  if (data.recognitions.length) addSection('Reconocimientos', (section) => data.recognitions.forEach((item) =>
    addEntry(section, item.title, [item.issuer, item.awarded_on ?? ''].filter(Boolean).join(' · '), item.description)));
  if (data.contact) addSection('Contacto', (section) => {
    const values = [data.contact?.email, data.contact?.phone, data.contact?.location, data.contact?.linkedin_url, data.contact?.github_url, data.contact?.website_url].filter((value): value is string => Boolean(value));
    section.append(node('p', values.join('  ·  ')));
  });

  document.body.append(root, progress);
  try {
    await document.fonts?.ready;
    await waitForImages(root);
    await nextPaint();

    const bounds = root.getBoundingClientRect();
    if (bounds.width === 0 || root.scrollHeight === 0) {
      throw new Error('No fue posible preparar el contenido del PDF.');
    }

    await html2pdf().set({
      margin: [8, 8, 8, 8], filename: `${data.student.slug}-cv.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 900,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] },
    }).from(root).save();
  } finally {
    progress.remove();
    root.remove();
  }
}
