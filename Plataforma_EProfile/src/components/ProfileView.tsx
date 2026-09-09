import { Award, Briefcase, Download, ExternalLink, Github, Globe, GraduationCap, Linkedin, Mail, MapPin, Phone, QrCode, Sparkles, UserRound, Wrench } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import type { ProfileBundle } from '../types/supabase';
import { formatDateRange, safeExternalUrl } from '../utils/profile';
import { Button, Card } from './ui';

interface Props {
  data: ProfileBundle;
  preview?: boolean;
  onPdf?: () => void;
  onVCard?: () => void;
}

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <Card><h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900">{icon}{title}</h2>{children}</Card>;
}

function ExternalAnchor({ href, children }: { href: string | null; children: ReactNode }) {
  const safe = safeExternalUrl(href);
  if (!safe) return null;
  return <a className="inline-flex items-center gap-1.5 text-blue-700 hover:underline" href={safe} target="_blank" rel="noreferrer">{children}<ExternalLink size={14} /></a>;
}

export function ProfileView({ data, preview = false, onPdf, onVCard }: Props) {
  const { profile, formations, experiences, skills, recognitions, projects, contact } = data;
  const profileUrl = `${window.location.origin}/${data.student.slug}`;
  const hasContact = Boolean(contact && (contact.email || contact.phone || contact.linkedin_url || contact.github_url || contact.website_url || contact.location));

  return <div className="min-h-screen bg-slate-50 pb-16">
    {preview && <div className="sticky top-0 z-20 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">Vista previa del borrador: todavía no es pública.</div>}
    <header className="relative overflow-hidden bg-ink text-white">
      <div className="absolute -right-28 -top-32 h-80 w-80 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-5 py-14 text-center sm:flex-row sm:text-left">
        {profile.photo_url ? <img className="h-36 w-36 shrink-0 rounded-3xl border-4 border-white/20 object-cover shadow-2xl" src={profile.photo_url} alt={`Fotografía de ${profile.full_name}`} /> : <div className="grid h-36 w-36 shrink-0 place-items-center rounded-3xl bg-white/10"><UserRound size={54} /></div>}
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[.24em] text-blue-300">EProfile</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{profile.full_name || 'Perfil sin nombre'}</h1>
          <p className="mt-2 text-xl text-slate-200">{profile.career || 'Carrera pendiente'}</p>
          {profile.bio && <p className="mt-5 max-w-2xl leading-7 text-slate-300">{profile.bio}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
            {onPdf && <Button onClick={onPdf} className="bg-white text-slate-900 hover:bg-blue-50"><Download size={17} />Descargar CV</Button>}
            {onVCard && <Button onClick={onVCard} className="border border-white/30 bg-white/10 text-white hover:bg-white/20"><UserRound size={17} />Guardar contacto</Button>}
          </div>
        </div>
      </div>
    </header>

    <main className="mx-auto grid max-w-5xl gap-5 px-4 py-8 sm:px-6">
      {experiences.length > 0 && <Section title="Experiencia" icon={<Briefcase size={22} className="text-blue-600" />}><div className="grid gap-6">{experiences.map((item) => <article key={item.id}><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-bold">{item.position}</h3><span className="text-xs font-medium text-slate-500">{formatDateRange(item.start_date, item.end_date)}</span></div><p className="text-sm font-medium text-blue-700">{item.organization}</p>{item.description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p>}</article>)}</div></Section>}

      {formations.length > 0 && <Section title="Formación" icon={<GraduationCap size={22} className="text-blue-600" />}><div className="grid gap-6">{formations.map((item) => <article key={item.id}><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-bold">{item.degree}</h3><span className="text-xs font-medium text-slate-500">{formatDateRange(item.start_date, item.end_date)}</span></div><p className="text-sm font-medium text-blue-700">{item.institution}</p>{item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}</article>)}</div></Section>}

      {skills.length > 0 && <Section title="Habilidades" icon={<Wrench size={22} className="text-blue-600" />}><div className="flex flex-wrap gap-2">{skills.map((item) => <span key={item.id} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800">{item.name}<span className="ml-1 text-blue-500">· {item.category}</span></span>)}</div></Section>}

      {projects.length > 0 && <Section title="Proyectos" icon={<Sparkles size={22} className="text-blue-600" />}><div className="grid gap-4 sm:grid-cols-2">{projects.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-bold">{item.name}</h3>{item.is_academic && <span className="rounded bg-violet-100 px-2 py-1 text-[10px] font-bold uppercase text-violet-700">Académico</span>}</div>{item.role && <p className="mt-1 text-xs font-semibold text-blue-700">{item.role}</p>}<p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>{item.technologies.length > 0 && <p className="mt-3 text-xs text-slate-500">{item.technologies.join(' · ')}</p>}<div className="mt-4 flex gap-4 text-sm"><ExternalAnchor href={item.repository_url}><Github size={15} />Código</ExternalAnchor><ExternalAnchor href={item.live_url}><Globe size={15} />Demo</ExternalAnchor></div></article>)}</div></Section>}

      {recognitions.length > 0 && <Section title="Reconocimientos" icon={<Award size={22} className="text-blue-600" />}><div className="grid gap-4">{recognitions.map((item) => <article key={item.id}><h3 className="font-bold">{item.title}</h3><p className="text-sm text-blue-700">{[item.issuer, item.awarded_on].filter(Boolean).join(' · ')}</p>{item.description && <p className="mt-1 text-sm text-slate-600">{item.description}</p>}<ExternalAnchor href={item.url}>Ver evidencia</ExternalAnchor></article>)}</div></Section>}

      {hasContact && contact && <Section title="Contacto" icon={<Mail size={22} className="text-blue-600" />}><div className="grid gap-3 text-sm sm:grid-cols-2">{contact.email && <a className="flex items-center gap-2 hover:text-blue-700" href={`mailto:${encodeURIComponent(contact.email)}`}><Mail size={17} />{contact.email}</a>}{contact.phone && <a className="flex items-center gap-2 hover:text-blue-700" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={17} />{contact.phone}</a>}{contact.location && <span className="flex items-center gap-2"><MapPin size={17} />{contact.location}</span>}<ExternalAnchor href={contact.linkedin_url}><Linkedin size={17} />LinkedIn</ExternalAnchor><ExternalAnchor href={contact.github_url}><Github size={17} />GitHub</ExternalAnchor><ExternalAnchor href={contact.website_url}><Globe size={17} />Sitio web</ExternalAnchor></div></Section>}

      {!preview && <Card className="grid items-center gap-6 sm:grid-cols-[1fr_auto]"><div><h2 className="flex items-center gap-2 text-xl font-bold"><QrCode className="text-blue-600" />Comparte esta EProfile</h2><p className="mt-2 text-sm text-slate-600">El código siempre apunta a esta ruta pública, incluso cuando el perfil se actualiza.</p><p className="mt-3 break-all text-xs font-medium text-blue-700">{profileUrl}</p></div><div className="w-fit rounded-xl border bg-white p-3"><QRCodeSVG value={profileUrl} size={150} level="H" title={`QR de ${profile.full_name}`} /></div></Card>}
    </main>
  </div>;
}
