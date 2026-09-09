import {
  ArrowDownRight, Award, Briefcase, Download, ExternalLink, Github, Globe,
  GraduationCap, Linkedin, Mail, MapPin, Phone, QrCode, Sparkles, UserRound, Wrench,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReactNode } from 'react';
import type { ProfileBundle } from '../types/supabase';
import { formatDateRange, safeExternalUrl } from '../utils/profile';
import { Button } from './ui';

interface Props {
  data: ProfileBundle;
  preview?: boolean;
  onPdf?: () => void;
  onVCard?: () => void;
}

interface SectionProps {
  title: string;
  eyebrow: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

function Section({ title, eyebrow, icon, children, className = '' }: SectionProps) {
  return <section className={`reveal interactive-card overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white shadow-soft ${className}`}>
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-brand">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">{title}</h2>
      </div>
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-mist text-brand">{icon}</div>
    </div>
    <div className="p-5 sm:p-7">{children}</div>
  </section>;
}

function ExternalAnchor({ href, children, inverted = false }: { href: string | null; children: ReactNode; inverted?: boolean }) {
  const safe = safeExternalUrl(href);
  if (!safe) return null;
  return <a
    className={`group inline-flex items-center gap-2 font-semibold transition hover:-translate-y-0.5 ${inverted ? 'text-white/80 hover:text-electric' : 'text-brand hover:text-blue-800'}`}
    href={safe}
    target="_blank"
    rel="noreferrer"
  >{children}<ExternalLink className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" size={14} /></a>;
}

function Stat({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 backdrop-blur">
    <strong className="block text-2xl font-black text-white">{String(value).padStart(2, '0')}</strong>
    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
  </div>;
}

export function ProfileView({ data, preview = false, onPdf, onVCard }: Props) {
  const { profile, formations, experiences, skills, recognitions, projects, contact } = data;
  const profileUrl = `${window.location.origin}/${data.student.slug}`;
  const hasContact = Boolean(contact && (contact.email || contact.phone || contact.linkedin_url || contact.github_url || contact.website_url || contact.location));
  const skillsByCategory = skills.reduce<Record<string, typeof skills>>((groups, skill) => {
    const category = skill.category || 'General';
    groups[category] = [...(groups[category] ?? []), skill];
    return groups;
  }, {});

  return <div className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-700">
    {preview && <div className="sticky top-0 z-40 bg-electric px-4 py-2.5 text-center text-sm font-bold text-ink shadow-lg">Vista previa del borrador · Los cambios todavía no son públicos</div>}

    <header className="relative isolate overflow-hidden bg-ink text-white">
      <div className="ambient-grid absolute inset-0 -z-10" />
      <div className="noise absolute inset-0 -z-10 opacity-[.055]" />
      <div className="pulse-soft absolute -right-24 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full bg-brand/50 blur-[110px]" />
      <div className="absolute -bottom-40 left-[12%] -z-10 h-80 w-80 rounded-full bg-electric/20 blur-[100px]" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="#inicio" className="group flex items-center gap-3" aria-label="Ir al inicio del perfil">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-ink transition group-hover:rotate-6"><Sparkles size={19} /></span>
          <span><strong className="block text-sm tracking-[.14em]">EPROFILE</strong><small className="text-slate-400">/{data.student.slug}</small></span>
        </a>
        <a href="#contacto" className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2.5 text-sm font-semibold text-white/80 backdrop-blur transition hover:border-electric/50 hover:text-electric sm:inline-flex">Contacto <ArrowDownRight size={16} /></a>
      </nav>

      <div id="inicio" className="mx-auto grid min-h-[650px] max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1fr_380px] lg:pb-24 lg:pt-14">
        <div className="reveal max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-electric/25 bg-electric/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-electric">
            <span className="h-1.5 w-1.5 rounded-full bg-electric shadow-[0_0_14px_#70f0d4]" /> Perfil profesional
          </div>
          <h1 className="text-balance text-5xl font-black leading-[.98] tracking-[-.045em] sm:text-6xl lg:text-7xl">{profile.full_name || 'Perfil sin nombre'}</h1>
          <p className="mt-6 max-w-2xl text-xl font-medium leading-8 text-blue-100 sm:text-2xl">{profile.career || 'Carrera pendiente'}</p>
          {profile.bio && <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{profile.bio}</p>}
          <div className="mt-9 flex flex-wrap gap-3">
            {onPdf && <Button onClick={onPdf} className="rounded-full bg-electric px-5 text-ink shadow-[0_14px_34px_-14px_rgba(112,240,212,.75)] hover:bg-white"><Download size={17} />Descargar CV</Button>}
            {onVCard && <Button onClick={onVCard} className="rounded-full border border-white/20 bg-white/[.07] px-5 text-white backdrop-blur hover:border-white/40 hover:bg-white/[.12]"><UserRound size={17} />Guardar contacto</Button>}
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
            <Stat value={projects.length} label="Proyectos" />
            <Stat value={experiences.length} label="Experiencias" />
            <Stat value={skills.length} label="Habilidades" />
          </div>
        </div>

        <div className="reveal reveal-delay-2 relative mx-auto w-full max-w-[360px] lg:mx-0">
          <div className="float-slow absolute -left-7 -top-7 h-24 w-24 rounded-[2rem] border border-electric/30 bg-electric/10 backdrop-blur" />
          <div className="absolute -bottom-5 -right-5 h-32 w-32 rounded-full bg-brand shadow-glow" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[3rem_3rem_3rem_1rem] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur">
            {profile.photo_url
              ? <img className="h-full w-full rounded-[2.55rem_2.55rem_2.55rem_.65rem] object-cover" src={profile.photo_url} alt={`Fotografía de ${profile.full_name}`} />
              : <div className="grid h-full w-full place-items-center rounded-[2.55rem_2.55rem_2.55rem_.65rem] bg-white/[.07]"><UserRound className="text-white/50" size={82} /></div>}
          </div>
        </div>
      </div>
    </header>

    <main className="relative mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-8 sm:py-16 lg:grid-cols-12">
      {experiences.length > 0 && <Section title="Experiencia" eyebrow="Trayectoria" icon={<Briefcase size={22} />} className="lg:col-span-7">
        <div className="relative space-y-8 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-gradient-to-b before:from-brand before:to-blue-100">
          {experiences.map((item, index) => <article className="relative pl-8" key={item.id}>
            <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-4 border-white bg-brand shadow-[0_0_0_3px_#dfe7ff]" />
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand">{String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 text-lg font-black text-ink">{item.position}</h3></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{formatDateRange(item.start_date, item.end_date)}</span>
            </div>
            <p className="mt-1 font-semibold text-blue-700">{item.organization}</p>
            {item.description && <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-slate-600">{item.description}</p>}
          </article>)}
        </div>
      </Section>}

      {formations.length > 0 && <Section title="Formación" eyebrow="Base académica" icon={<GraduationCap size={22} />} className="reveal-delay-1 lg:col-span-5">
        <div className="space-y-4">{formations.map((item) => <article className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:bg-mist" key={item.id}>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{formatDateRange(item.start_date, item.end_date)}</span>
          <h3 className="mt-2 text-lg font-black text-ink">{item.degree}</h3><p className="mt-1 font-semibold text-brand">{item.institution}</p>
          {item.description && <p className="mt-3 text-[15px] leading-6 text-slate-600">{item.description}</p>}
        </article>)}</div>
      </Section>}

      {projects.length > 0 && <Section title="Proyectos seleccionados" eyebrow="Ideas en acción" icon={<Sparkles size={22} />} className="lg:col-span-12">
        <div className="grid gap-4 md:grid-cols-2">{projects.map((item, index) => <article key={item.id} className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition duration-300 hover:border-brand/30 hover:bg-white hover:shadow-glow sm:p-6">
          <div className="absolute right-4 top-2 text-6xl font-black tracking-tighter text-slate-200/70 transition group-hover:text-blue-100">{String(index + 1).padStart(2, '0')}</div>
          <div className="relative pr-14">{item.is_academic && <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">Académico</span>}<h3 className="mt-3 text-xl font-black tracking-tight text-ink">{item.name}</h3>{item.role && <p className="mt-1 text-sm font-bold text-brand">{item.role}</p>}</div>
          <p className="relative mt-4 text-[15px] leading-7 text-slate-600">{item.description}</p>
          {item.technologies.length > 0 && <div className="relative mt-5 flex flex-wrap gap-2">{item.technologies.map((technology) => <span key={technology} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{technology}</span>)}</div>}
          <div className="relative mt-5 flex gap-5 text-sm"><ExternalAnchor href={item.repository_url}><Github size={16} />Código</ExternalAnchor><ExternalAnchor href={item.live_url}><Globe size={16} />Demo</ExternalAnchor></div>
        </article>)}</div>
      </Section>}

      {skills.length > 0 && <Section title="Caja de herramientas" eyebrow="Capacidades" icon={<Wrench size={22} />} className="lg:col-span-7">
        <div className="grid gap-6 sm:grid-cols-2">{Object.entries(skillsByCategory).map(([category, categorySkills]) => <div key={category}><h3 className="mb-3 text-sm font-black uppercase tracking-[.14em] text-ink">{category}</h3><div className="flex flex-wrap gap-2">{categorySkills.map((item) => <span key={item.id} className="rounded-xl bg-mist px-3 py-2 text-sm font-semibold text-blue-800 transition hover:-translate-y-0.5 hover:bg-blue-100">{item.name}</span>)}</div></div>)}</div>
      </Section>}

      {recognitions.length > 0 && <Section title="Reconocimientos" eyebrow="Hitos" icon={<Award size={22} />} className="reveal-delay-1 lg:col-span-5">
        <div className="space-y-5">{recognitions.map((item) => <article key={item.id} className="border-l-2 border-electric pl-4"><h3 className="font-black text-ink">{item.title}</h3><p className="mt-1 text-sm font-semibold text-brand">{[item.issuer, item.awarded_on].filter(Boolean).join(' · ')}</p>{item.description && <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>}<ExternalAnchor href={item.url}>Ver evidencia</ExternalAnchor></article>)}</div>
      </Section>}

      {hasContact && contact && <section id="contacto" className="reveal relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-9 lg:col-span-8">
        <div className="ambient-grid absolute inset-0 opacity-50" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[.2em] text-electric">Contacto</p><h2 className="mt-2 max-w-lg text-3xl font-black tracking-tight">Conectemos y construyamos algo con intención.</h2>
        <div className="mt-7 grid gap-4 text-sm sm:grid-cols-2">
          {contact.email && <a className="flex items-center gap-3 font-semibold text-white/80 transition hover:text-electric" href={`mailto:${encodeURIComponent(contact.email)}`}><Mail size={18} />{contact.email}</a>}
          {contact.phone && <a className="flex items-center gap-3 font-semibold text-white/80 transition hover:text-electric" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}><Phone size={18} />{contact.phone}</a>}
          {contact.location && <span className="flex items-center gap-3 font-semibold text-white/80"><MapPin size={18} />{contact.location}</span>}
          <ExternalAnchor href={contact.linkedin_url} inverted><Linkedin size={18} />LinkedIn</ExternalAnchor><ExternalAnchor href={contact.github_url} inverted><Github size={18} />GitHub</ExternalAnchor><ExternalAnchor href={contact.website_url} inverted><Globe size={18} />Sitio web</ExternalAnchor>
        </div></div>
      </section>}

      {!preview && <section className="reveal reveal-delay-2 grid items-center gap-6 rounded-[2rem] border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-6 shadow-soft sm:grid-cols-[1fr_auto] sm:p-8 lg:col-span-4">
        <div><QrCode className="mb-5 text-brand" size={30} /><h2 className="text-2xl font-black tracking-tight text-ink">Lleva este perfil contigo</h2><p className="mt-2 text-sm leading-6 text-slate-600">Escanea y vuelve a esta EProfile desde cualquier dispositivo.</p><p className="mt-4 break-all text-xs font-bold text-brand">{profileUrl}</p></div>
        <div className="w-fit rounded-3xl border border-slate-200 bg-white p-3 shadow-lg"><QRCodeSVG value={profileUrl} size={142} level="H" title={`QR de ${profile.full_name}`} /></div>
      </section>}
    </main>

    <footer className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 pb-10 pt-3 text-sm text-slate-500 sm:px-8"><span className="font-bold tracking-[.12em] text-ink">EPROFILE</span><span>Perfil de {profile.full_name}</span></footer>
  </div>;
}
