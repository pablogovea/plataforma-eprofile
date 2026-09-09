import type { PdfTemplate, ProfileBundle } from '../types/supabase';
import { formatDateRange } from './profile';

type PdfStyle = { accent: string; accentSoft: string; ink: string; muted: string; font: string; headingFont: string };

const styles: Record<PdfTemplate, PdfStyle> = {
  clasica: { accent: '#18324b', accentSoft: '#edf1f3', ink: '#192630', muted: '#65727c', font: 'Georgia, Times New Roman, serif', headingFont: 'Arial, sans-serif' },
  moderna: { accent: '#5b5cf6', accentSoft: '#e9fdf8', ink: '#091426', muted: '#536176', font: 'Arial, Helvetica, sans-serif', headingFont: 'Arial, Helvetica, sans-serif' },
  minimalista: { accent: '#087f68', accentSoft: '#eef8f5', ink: '#111827', muted: '#6b7280', font: 'Arial, Helvetica, sans-serif', headingFont: 'Arial, Helvetica, sans-serif' },
};

const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};

const nextPaint = (): Promise<void> => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

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

const makePhoto = (url: string | null, cssText: string): HTMLImageElement | null => {
  if (!url) return null;
  const photo = node('img');
  photo.alt = '';
  photo.crossOrigin = 'anonymous';
  photo.referrerPolicy = 'no-referrer';
  photo.src = url;
  photo.style.cssText = cssText;
  return photo;
};

const appendText = (parent: HTMLElement, tag: 'p' | 'span' | 'strong', text: string, cssText: string): HTMLElement => {
  const element = node(tag, text);
  element.style.cssText = cssText;
  parent.append(element);
  return element;
};

const contactValues = (data: ProfileBundle): string[] => {
  if (!data.contact) return [];
  return [data.contact.email, data.contact.phone, data.contact.location, data.contact.linkedin_url, data.contact.github_url, data.contact.website_url]
    .filter((value): value is string => Boolean(value));
};

const renderClassic = (root: HTMLElement, data: ProfileBundle, theme: PdfStyle): void => {
  const masthead = node('header');
  masthead.style.cssText = `display:flex;align-items:center;gap:26px;padding:6px 0 26px;border-bottom:1px solid ${theme.accent};margin-bottom:24px`;
  const photo = makePhoto(data.profile.photo_url, `width:112px;height:132px;object-fit:cover;border:1px solid ${theme.accent};padding:4px;background:#fff`);
  if (photo) masthead.append(photo);
  const identity = node('div');
  identity.style.cssText = 'flex:1';
  appendText(identity, 'span', 'CURRICULUM VITAE', `font:700 10px ${theme.headingFont};letter-spacing:3.2px;color:${theme.accent}`);
  const name = node('h1', data.profile.full_name);
  name.style.cssText = `font:400 35px/1.08 ${theme.font};letter-spacing:-.5px;color:${theme.ink};margin:9px 0 7px`;
  identity.append(name);
  appendText(identity, 'p', data.profile.career, `font:italic 16px/1.35 ${theme.font};color:${theme.muted};margin:0`);
  masthead.append(identity);
  root.append(masthead);

  const addSection = (title: string, render: (container: HTMLElement) => void): void => {
    const section = node('section');
    section.style.cssText = 'margin:0 0 23px';
    const heading = node('div');
    heading.style.cssText = 'display:flex;align-items:center;gap:12px;margin:0 0 12px';
    appendText(heading, 'strong', title.toUpperCase(), `white-space:nowrap;font:700 11px ${theme.headingFont};letter-spacing:2.4px;color:${theme.accent}`);
    const line = node('span');
    line.style.cssText = `height:1px;background:${theme.accent};opacity:.35;flex:1`;
    heading.append(line);
    section.append(heading);
    render(section);
    root.append(section);
  };

  const addEntry = (container: HTMLElement, title: string, subtitle: string, detail: string): void => {
    const entry = node('article');
    entry.style.cssText = 'display:grid;grid-template-columns:148px 1fr;gap:18px;margin:0 0 14px;break-inside:avoid';
    appendText(entry, 'span', subtitle, `white-space:pre-line;font:400 11px/1.45 ${theme.headingFont};color:${theme.muted}`);
    const content = node('div');
    appendText(content, 'strong', title, `display:block;font:700 15px/1.3 ${theme.font};color:${theme.ink}`);
    if (detail) appendText(content, 'p', detail, `white-space:pre-wrap;font:400 12px/1.55 ${theme.headingFont};color:#3f4c57;margin:5px 0 0`);
    entry.append(content);
    container.append(entry);
  };

  if (data.profile.bio) addSection('Perfil profesional', (section) => { appendText(section, 'p', data.profile.bio, `font:400 13px/1.65 ${theme.font};margin:0;color:#33424d`); });
  if (data.experiences.length) addSection('Experiencia', (section) => data.experiences.forEach((item) => addEntry(section, item.position, `${formatDateRange(item.start_date, item.end_date)}\n${item.organization}`, item.description)));
  if (data.formations.length) addSection('Formación', (section) => data.formations.forEach((item) => addEntry(section, item.degree, `${formatDateRange(item.start_date, item.end_date)}\n${item.institution}`, item.description)));
  if (data.projects.length) addSection('Proyectos seleccionados', (section) => data.projects.forEach((item) => addEntry(section, item.name, [item.role, item.technologies.join(', ')].filter(Boolean).join('\n'), item.description)));
  if (data.skills.length) addSection('Competencias', (section) => { appendText(section, 'p', data.skills.map((item) => item.name).join('  ·  '), `font:400 12px/1.8 ${theme.headingFont};margin:0;color:#33424d`); });
  if (data.recognitions.length) addSection('Reconocimientos', (section) => data.recognitions.forEach((item) => addEntry(section, item.title, [item.awarded_on ?? '', item.issuer].filter(Boolean).join('\n'), item.description)));
  const contacts = contactValues(data);
  if (contacts.length) addSection('Contacto', (section) => { appendText(section, 'p', contacts.join('   ·   '), `font:400 11px/1.7 ${theme.headingFont};margin:0;color:${theme.muted};overflow-wrap:anywhere`); });
};

const renderModern = (root: HTMLElement, data: ProfileBundle, theme: PdfStyle): void => {
  const hero = node('header');
  hero.style.cssText = `position:relative;overflow:hidden;display:flex;align-items:center;gap:28px;background:linear-gradient(135deg,#071427 0%,#18296b 68%,${theme.accent} 100%);color:#fff;margin:-42px -42px 30px;padding:45px 42px 36px`;
  const orb = node('span');
  orb.style.cssText = 'position:absolute;width:180px;height:180px;border-radius:50%;right:-55px;top:-80px;background:rgba(112,240,212,.22);border:1px solid rgba(255,255,255,.18)';
  hero.append(orb);
  const photo = makePhoto(data.profile.photo_url, 'position:relative;width:112px;height:112px;border-radius:28px;object-fit:cover;border:3px solid rgba(255,255,255,.92);box-shadow:12px 12px 0 rgba(112,240,212,.65)');
  if (photo) hero.append(photo);
  const identity = node('div');
  identity.style.cssText = 'position:relative;flex:1';
  appendText(identity, 'span', 'EPROFILE / PORTFOLIO', `font:700 10px ${theme.headingFont};letter-spacing:3px;color:#70f0d4`);
  const name = node('h1', data.profile.full_name);
  name.style.cssText = `font:800 34px/1.05 ${theme.headingFont};letter-spacing:-1px;margin:9px 0 8px;color:#fff`;
  identity.append(name);
  appendText(identity, 'p', data.profile.career, `font:500 15px/1.4 ${theme.headingFont};color:#dbeafe;margin:0`);
  hero.append(identity);
  root.append(hero);

  const addSection = (title: string, number: string, render: (container: HTMLElement) => void): void => {
    const section = node('section');
    section.style.cssText = 'margin:0 0 24px';
    const heading = node('div');
    heading.style.cssText = 'display:flex;align-items:center;gap:10px;margin:0 0 12px';
    appendText(heading, 'span', number, `display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:${theme.accent};color:#fff;font:700 10px ${theme.headingFont}`);
    appendText(heading, 'strong', title, `font:800 13px ${theme.headingFont};letter-spacing:.3px;color:${theme.ink}`);
    section.append(heading);
    render(section);
    root.append(section);
  };

  const addCard = (container: HTMLElement, title: string, eyebrow: string, detail: string): void => {
    const card = node('article');
    card.style.cssText = 'position:relative;margin:0 0 10px;padding:14px 16px 14px 20px;border:1px solid #e2e8f0;border-radius:13px;background:#fff;break-inside:avoid;box-shadow:0 6px 18px rgba(15,23,42,.05)';
    const stripe = node('span');
    stripe.style.cssText = `position:absolute;left:0;top:13px;bottom:13px;width:4px;border-radius:0 4px 4px 0;background:${theme.accent}`;
    card.append(stripe);
    appendText(card, 'span', eyebrow, `display:block;font:700 9px ${theme.headingFont};letter-spacing:1px;text-transform:uppercase;color:${theme.accent};margin-bottom:4px`);
    appendText(card, 'strong', title, `display:block;font:800 14px/1.3 ${theme.headingFont};color:${theme.ink}`);
    if (detail) appendText(card, 'p', detail, `white-space:pre-wrap;font:400 11.5px/1.55 ${theme.headingFont};color:${theme.muted};margin:6px 0 0`);
    container.append(card);
  };

  let index = 1;
  const next = (): string => String(index++).padStart(2, '0');
  if (data.profile.bio) addSection('En pocas palabras', next(), (section) => { appendText(section, 'p', data.profile.bio, `font:500 13px/1.65 ${theme.headingFont};color:#34435a;margin:0;padding:16px 18px;background:${theme.accentSoft};border-radius:14px`); });
  if (data.projects.length) addSection('Proyectos destacados', next(), (section) => data.projects.forEach((item) => addCard(section, item.name, [item.role, item.technologies.join(' / ')].filter(Boolean).join(' · '), item.description)));
  if (data.experiences.length) addSection('Trayectoria', next(), (section) => data.experiences.forEach((item) => addCard(section, item.position, `${item.organization} · ${formatDateRange(item.start_date, item.end_date)}`, item.description)));
  if (data.formations.length) addSection('Formación', next(), (section) => data.formations.forEach((item) => addCard(section, item.degree, `${item.institution} · ${formatDateRange(item.start_date, item.end_date)}`, item.description)));
  if (data.skills.length) addSection('Stack y habilidades', next(), (section) => {
    const grid = node('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:7px';
    data.skills.forEach((item) => { appendText(grid, 'span', item.name, `font:700 10px ${theme.headingFont};padding:7px 10px;border-radius:999px;background:#edf1ff;color:#3730a3;border:1px solid #dfe3ff`); });
    section.append(grid);
  });
  if (data.recognitions.length) addSection('Logros', next(), (section) => data.recognitions.forEach((item) => addCard(section, item.title, [item.issuer, item.awarded_on ?? ''].filter(Boolean).join(' · '), item.description)));
  const contacts = contactValues(data);
  if (contacts.length) addSection('Conectemos', next(), (section) => { appendText(section, 'p', contacts.join('  ·  '), `font:600 10.5px/1.7 ${theme.headingFont};margin:0;padding:13px 16px;border-radius:12px;background:#071427;color:#dbeafe;overflow-wrap:anywhere`); });
};

const renderMinimal = (root: HTMLElement, data: ProfileBundle, theme: PdfStyle): void => {
  const header = node('header');
  header.style.cssText = 'display:grid;grid-template-columns:1fr auto;gap:28px;align-items:start;margin:0 0 30px';
  const identity = node('div');
  const marker = node('span');
  marker.style.cssText = `display:block;width:52px;height:5px;background:${theme.accent};margin:0 0 19px`;
  identity.append(marker);
  const name = node('h1', data.profile.full_name);
  name.style.cssText = `font:300 39px/1.04 ${theme.headingFont};letter-spacing:-1.8px;color:${theme.ink};margin:0 0 9px`;
  identity.append(name);
  appendText(identity, 'p', data.profile.career, `font:600 12px ${theme.headingFont};letter-spacing:1.4px;text-transform:uppercase;color:${theme.accent};margin:0`);
  header.append(identity);
  const photo = makePhoto(data.profile.photo_url, 'width:94px;height:94px;border-radius:50%;object-fit:cover;filter:grayscale(100%);border:1px solid #d1d5db');
  if (photo) header.append(photo);
  root.append(header);

  const addSection = (title: string, render: (container: HTMLElement) => void): void => {
    const section = node('section');
    section.style.cssText = 'display:grid;grid-template-columns:128px 1fr;gap:22px;margin:0 0 19px;break-inside:avoid';
    const label = node('h2', title.toUpperCase());
    label.style.cssText = `font:700 9px/1.4 ${theme.headingFont};letter-spacing:2px;color:${theme.accent};margin:2px 0 0`;
    const content = node('div');
    render(content);
    section.append(label, content);
    root.append(section);
  };

  const addEntry = (container: HTMLElement, title: string, subtitle: string, detail: string): void => {
    const entry = node('article');
    entry.style.cssText = 'padding:0 0 10px;margin:0 0 10px;border-bottom:1px solid #e5e7eb;break-inside:avoid';
    appendText(entry, 'strong', title, `display:block;font:600 14px/1.3 ${theme.headingFont};color:${theme.ink}`);
    appendText(entry, 'span', subtitle, `display:block;font:500 10px/1.5 ${theme.headingFont};color:${theme.accent};margin:3px 0 0`);
    if (detail) appendText(entry, 'p', detail, `white-space:pre-wrap;font:400 11.5px/1.6 ${theme.headingFont};color:${theme.muted};margin:7px 0 0`);
    container.append(entry);
  };

  if (data.profile.bio) addSection('Perfil', (content) => { appendText(content, 'p', data.profile.bio, `font:400 13px/1.72 ${theme.headingFont};color:#374151;margin:0`); });
  if (data.experiences.length) addSection('Experiencia', (content) => data.experiences.forEach((item) => addEntry(content, item.position, `${item.organization} — ${formatDateRange(item.start_date, item.end_date)}`, item.description)));
  if (data.formations.length) addSection('Educación', (content) => data.formations.forEach((item) => addEntry(content, item.degree, `${item.institution} — ${formatDateRange(item.start_date, item.end_date)}`, item.description)));
  if (data.projects.length) addSection('Proyectos', (content) => data.projects.forEach((item) => addEntry(content, item.name, [item.role, item.technologies.join(' · ')].filter(Boolean).join(' — '), item.description)));
  if (data.skills.length) addSection('Habilidades', (content) => { appendText(content, 'p', data.skills.map((item) => item.name).join('  /  '), `font:500 11px/1.8 ${theme.headingFont};color:#374151;margin:0`); });
  if (data.recognitions.length) addSection('Distinciones', (content) => data.recognitions.forEach((item) => addEntry(content, item.title, [item.issuer, item.awarded_on ?? ''].filter(Boolean).join(' — '), item.description)));
  const contacts = contactValues(data);
  if (contacts.length) addSection('Contacto', (content) => { appendText(content, 'p', contacts.join('\n'), `white-space:pre-line;font:400 10.5px/1.8 ${theme.headingFont};color:${theme.muted};margin:0;overflow-wrap:anywhere`); });
};

export async function exportProfilePdf(data: ProfileBundle, templateId: PdfTemplate): Promise<void> {
  const { default: html2pdf } = await import('html2pdf.js');
  const theme = styles[templateId];
  const root = node('main');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = `position:relative;z-index:2147483646;box-sizing:border-box;width:800px;padding:42px;color:${theme.ink};background:#fff;font-family:${theme.font};line-height:1.45`;

  const progress = node('div');
  progress.setAttribute('role', 'status');
  progress.textContent = 'Diseñando tu PDF…';
  progress.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(7,17,31,.94);color:#fff;font:700 15px Arial,sans-serif;letter-spacing:.4px';

  if (templateId === 'clasica') renderClassic(root, data, theme);
  if (templateId === 'moderna') renderModern(root, data, theme);
  if (templateId === 'minimalista') renderMinimal(root, data, theme);

  const footer = node('footer');
  footer.style.cssText = `margin-top:12px;padding-top:9px;border-top:1px solid #e5e7eb;text-align:right;font:700 8px ${theme.headingFont};letter-spacing:1.4px;color:${theme.muted}`;
  footer.textContent = `EPROFILE  /  ${data.student.slug.toUpperCase()}`;
  root.append(footer);

  document.body.append(root, progress);
  try {
    await document.fonts?.ready;
    await waitForImages(root);
    await nextPaint();
    const bounds = root.getBoundingClientRect();
    if (bounds.width === 0 || root.scrollHeight === 0) throw new Error('No fue posible preparar el contenido del PDF.');

    await html2pdf().set({
      margin: [0, 0, 0, 0],
      filename: `${data.student.slug}-cv.pdf`,
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0, windowWidth: 900, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: ['article'] },
    }).from(root).save();
  } finally {
    progress.remove();
    root.remove();
  }
}
