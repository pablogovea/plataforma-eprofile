import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, CircleUserRound, Eye, FileEdit, Globe2, GraduationCap, LayoutDashboard, LogOut, Rocket, Save, Sparkles, Trophy } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ProfileEditor } from '../components/ProfileEditor';
import { ProfileView } from '../components/ProfileView';
import { Alert, Button, Card, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useEditorProfile } from '../hooks/useProfile';
import type { ProfileBundle } from '../types/supabase';
import { supabase } from '../utils/supabase';

type ViewMode = 'dashboard' | 'editor' | 'preview';

export function StudentAdmin() {
  const { slug = '' } = useParams();
  const { user, role, signOut } = useAuth();
  const { data, loading, error, save, publish } = useEditorProfile(slug);
  const [draft, setDraft] = useState<ProfileBundle | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<ViewMode>('dashboard');

  useEffect(() => { if (data) setDraft(data); }, [data]);

  const completion = useMemo(() => {
    if (!draft) return 0;
    const checks = [draft.profile.full_name, draft.profile.career, draft.profile.bio, draft.profile.photo_url, draft.contact?.email, draft.formations.length, draft.skills.length, draft.projects.length];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  const saveDraft = async (): Promise<boolean> => {
    if (!draft) return false;
    setBusy(true); setMessage(null);
    const saveError = await save(draft);
    setBusy(false);
    setMessage(saveError ? { tone: 'error', text: saveError } : { tone: 'success', text: 'Borrador guardado correctamente.' });
    return !saveError;
  };

  const publishProfile = async () => {
    if (!draft) return;
    if (!draft.profile.full_name.trim() || !draft.profile.career.trim()) {
      setMessage({ tone: 'error', text: 'Completa nombre y carrera antes de publicar.' });
      setView('editor');
      return;
    }
    if (!await saveDraft()) return;
    setBusy(true);
    const publishError = await publish(draft.student.id);
    setBusy(false);
    setMessage(publishError ? { tone: 'error', text: publishError } : { tone: 'success', text: 'Perfil publicado. Tu sitio ya muestra esta versión.' });
  };

  const uploadPhoto = async (file: File) => {
    if (!draft || !user) return;
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ tone: 'error', text: 'La foto debe ser JPG, PNG o WebP y pesar máximo 5 MB.' });
      return;
    }
    setBusy(true);
    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${user.id}/${draft.student.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(path, file, { upsert: true, contentType: file.type });
    setBusy(false);
    if (uploadError) setMessage({ tone: 'error', text: uploadError.message });
    else {
      const { data: publicUrl } = supabase.storage.from('profile-photos').getPublicUrl(path);
      setDraft({ ...draft, profile: { ...draft.profile, photo_url: publicUrl.publicUrl } });
      setMessage({ tone: 'info', text: 'Foto cargada. Guarda el borrador para conservar el cambio.' });
    }
  };

  if (loading) return <Loading label="Preparando tu espacio…" />;
  if (error || !draft) return <main className="mx-auto max-w-xl px-4 py-20"><Alert>{error ?? 'Perfil no disponible'}</Alert></main>;
  if (view === 'preview') return <div><div className="fixed bottom-5 right-5 z-50"><Button className="rounded-full bg-ink px-5 text-white shadow-2xl hover:bg-brand" onClick={() => setView('dashboard')}><ArrowLeft size={17} />Volver al panel</Button></div><ProfileView data={draft} preview /></div>;

  const navItems = [
    { id: 'dashboard' as const, label: 'Resumen', icon: LayoutDashboard },
    { id: 'editor' as const, label: 'Editar perfil', icon: FileEdit },
  ];

  return <div className="min-h-screen bg-[#f4f7fb]">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-white shadow-xl backdrop-blur-xl">
      <div className="ambient-grid absolute inset-0 opacity-30" />
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-electric to-cyan-300 font-black text-ink shadow-lg">E</span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.22em] text-electric">{role === 'admin_plataforma' ? 'Edición como administrador' : 'Mi espacio EProfile'}</p><h1 className="truncate font-bold text-white">/{slug}</h1></div></div>
        <div className="flex items-center gap-2">{role === 'admin_plataforma' && <Link to="/admin" className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10 sm:inline-flex"><ArrowLeft size={16} />Directorio</Link>}<Link to={`/${slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/[.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[.15]"><Globe2 size={17} /><span className="hidden sm:inline">Ver sitio</span></Link><Button aria-label="Cerrar sesión" onClick={() => void signOut()} className="h-11 min-h-0 w-11 px-0 text-white/70 hover:bg-white/10 hover:text-white"><LogOut size={18} /></Button></div>
      </div>
    </header>

    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[230px_1fr] lg:py-9">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <nav className="flex gap-2 rounded-2xl border border-slate-200/70 bg-white p-2 shadow-soft lg:grid">
          {navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setView(id)} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition lg:justify-start ${view === id ? 'bg-ink text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 hover:text-ink'}`}><Icon size={17} />{label}</button>)}
          <button onClick={() => setView('preview')} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition hover:bg-blue-50 hover:text-brand lg:justify-start"><Eye size={17} />Vista previa</button>
        </nav>
        <div className="mt-4 hidden rounded-2xl bg-gradient-to-br from-brand to-indigo-700 p-5 text-white shadow-glow lg:block"><Sparkles className="text-electric" size={20} /><p className="mt-4 font-black">Tu perfil está al {completion}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-electric transition-all duration-700" style={{ width: `${completion}%` }} /></div><p className="mt-3 text-xs leading-5 text-blue-100">Completa cada sección para causar una mejor primera impresión.</p></div>
      </aside>

      <main className="min-w-0">
        {message && <div className="mb-5"><Alert tone={message.tone}>{message.text}</Alert></div>}
        {view === 'dashboard' ? <div className="grid gap-6">
          <section className="reveal relative overflow-hidden rounded-[2rem] bg-ink p-6 text-white shadow-2xl sm:p-8">
            <div className="ambient-grid absolute inset-0 opacity-40" /><div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brand/40 blur-3xl" />
            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-5">{draft.profile.photo_url ? <img src={draft.profile.photo_url} alt="Foto del perfil" className="h-24 w-24 shrink-0 rounded-[1.5rem] border-4 border-white/10 object-cover shadow-xl" /> : <span className="grid h-24 w-24 shrink-0 place-items-center rounded-[1.5rem] bg-white/10 text-white/50"><CircleUserRound size={38} /></span>}<div className="min-w-0"><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${draft.profile.status === 'publicado' ? 'bg-electric text-ink' : 'bg-amber-300 text-amber-950'}`}>{draft.profile.status}</span><h2 className="mt-3 truncate text-3xl font-black tracking-tight">{draft.profile.full_name || 'Completa tu nombre'}</h2><p className="mt-1 truncate text-slate-300">{draft.profile.career || 'Agrega tu carrera profesional'}</p></div></div>
              <Button onClick={() => setView('editor')} className="group shrink-0 bg-white text-ink hover:bg-electric">Editar mi perfil<ArrowRight className="transition group-hover:translate-x-1" size={17} /></Button>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Perfil completo', value: `${completion}%`, icon: BarChart3, surface: 'bg-blue-50 text-brand' },
              { label: 'Proyectos', value: draft.projects.length, icon: Rocket, surface: 'bg-violet-50 text-violet-600' },
              { label: 'Habilidades', value: draft.skills.length, icon: Trophy, surface: 'bg-amber-50 text-amber-600' },
              { label: 'Formación', value: draft.formations.length, icon: GraduationCap, surface: 'bg-emerald-50 text-emerald-600' },
            ].map(({ label, value, icon: Icon, surface }, index) => <Card key={label} className={`interactive-card reveal reveal-delay-${index + 1}`}><span className={`grid h-11 w-11 place-items-center rounded-2xl ${surface}`}><Icon size={20} /></span><p className="mt-5 text-3xl font-black tracking-tight text-ink">{value}</p><p className="mt-1 text-sm font-semibold text-slate-500">{label}</p></Card>)}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
            <Card><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-brand">Estado editorial</p><h3 className="mt-2 text-2xl font-black text-ink">Tu perfil, listo para compartir</h3></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={22} /></span></div><p className="mt-4 max-w-2xl leading-7 text-slate-500">Guarda tus cambios como borrador, revisa la presentación completa y publica solo cuando estés conforme. La versión anterior permanece visible mientras trabajas.</p><div className="mt-6 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void saveDraft()} className="border border-slate-200 text-slate-700 hover:border-brand/30 hover:text-brand"><Save size={17} />Guardar borrador</Button><Button disabled={busy} onClick={() => setView('preview')} className="bg-mist text-brand hover:bg-blue-100"><Eye size={17} />Previsualizar</Button><Button disabled={busy} onClick={() => void publishProfile()} className="bg-brand text-white shadow-glow hover:bg-blue-700"><Rocket size={17} />Publicar ahora</Button></div></Card>
            <Card className="bg-gradient-to-br from-white to-blue-50/70"><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Enlace público</p><p className="mt-3 break-all font-mono text-sm font-bold text-ink">{window.location.origin}/{slug}</p><Link to={`/${slug}`} target="_blank" className="group mt-6 inline-flex items-center gap-2 text-sm font-black text-brand">Abrir mi EProfile<ArrowRight className="transition group-hover:translate-x-1" size={16} /></Link></Card>
          </section>
        </div> : <div className="grid gap-5">
          <div className="reveal flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-soft xl:flex-row xl:items-center xl:justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-brand">Editor de contenido</p><h2 className="mt-1 text-2xl font-black text-ink">Construye tu mejor versión</h2><p className="mt-1 text-sm text-slate-500">Los cambios no serán públicos hasta que presiones Publicar.</p></div><div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void saveDraft()} className="border border-slate-200 bg-white text-slate-700 hover:text-brand"><Save size={17} />Guardar</Button><Button disabled={busy} onClick={() => setView('preview')} className="bg-mist text-brand hover:bg-blue-100"><Eye size={17} />Previsualizar</Button><Button disabled={busy} onClick={() => void publishProfile()} className="bg-brand text-white shadow-glow hover:bg-blue-700"><Rocket size={17} />Publicar</Button></div></div>
          <ProfileEditor data={draft} onChange={setDraft} onPhoto={uploadPhoto} />
        </div>}
      </main>
    </div>
  </div>;
}
