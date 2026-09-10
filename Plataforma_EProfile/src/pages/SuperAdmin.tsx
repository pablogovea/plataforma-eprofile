import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, BarChart3, Edit3, ExternalLink, KeyRound, LogOut, Plus, Power, PowerOff, RefreshCw, Search, ShieldCheck, Sparkles, Trash2, UserRoundX, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Field, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import type { AdminStudentSummary } from '../types/supabase';
import { supabase } from '../utils/supabase';

interface AdminResponse { students?: AdminStudentSummary[]; error?: string; message?: string }
type Filter = 'todos' | 'publicados' | 'borradores' | 'inactivos';

export function SuperAdmin() {
  const { signOut } = useAuth();
  const [students, setStudents] = useState<AdminStudentSummary[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const invoke = async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: Record<string, string>): Promise<AdminResponse> => {
    const { data, error } = await supabase.functions.invoke<AdminResponse>('admin-users', { method, body });
    if (error) return { error: error.message };
    return data ?? { error: 'La función no devolvió una respuesta.' };
  };

  const load = useCallback(async () => {
    setLoading(true);
    const response = await invoke('GET');
    setLoading(false);
    if (response.error) setMessage({ tone: 'error', text: response.error });
    else setStudents(response.students ?? []);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createStudent = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    const response = await invoke('POST', { email: email.trim(), password, slug: slug.trim().toLowerCase() });
    setBusy(false);
    if (response.error) setMessage({ tone: 'error', text: response.error });
    else { setEmail(''); setPassword(''); setSlug(''); setMessage({ tone: 'success', text: response.message ?? 'Cuenta creada.' }); await load(); }
  };

  const setActive = async (student: AdminStudentSummary) => {
    setBusy(true);
    const response = await invoke('PATCH', { action: student.is_active ? 'deactivate' : 'activate', studentId: student.student_id });
    setBusy(false);
    if (response.error) setMessage({ tone: 'error', text: response.error }); else await load();
  };

  const resetPassword = async (student: AdminStudentSummary) => {
    const temporaryPassword = window.prompt(`Nueva contraseña temporal para ${student.email} (mínimo 8 caracteres):`);
    if (!temporaryPassword) return;
    setBusy(true);
    const response = await invoke('PATCH', { action: 'reset-password', studentId: student.student_id, password: temporaryPassword });
    setBusy(false);
    setMessage(response.error ? { tone: 'error', text: response.error } : { tone: 'success', text: response.message ?? 'Contraseña actualizada.' });
  };

  const deleteStudent = async (student: AdminStudentSummary) => {
    if (!window.confirm(`¿Eliminar definitivamente la cuenta /${student.slug} y todo su contenido?`)) return;
    setBusy(true);
    const response = await invoke('DELETE', { studentId: student.student_id });
    setBusy(false);
    if (response.error) setMessage({ tone: 'error', text: response.error }); else { setMessage({ tone: 'success', text: 'Cuenta eliminada.' }); await load(); }
  };

  const metrics = useMemo(() => {
    const published = students.filter((student) => student.status === 'publicado').length;
    const active = students.filter((student) => student.is_active).length;
    return { published, active, drafts: students.length - published, inactive: students.length - active, rate: students.length ? Math.round((published / students.length) * 100) : 0 };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    return students.filter((student) => {
      const textMatch = !term || [student.full_name, student.email, student.slug, student.career].some((value) => value.toLowerCase().includes(term));
      const filterMatch = filter === 'todos' || (filter === 'publicados' && student.status === 'publicado') || (filter === 'borradores' && student.status !== 'publicado') || (filter === 'inactivos' && !student.is_active);
      return textMatch && filterMatch;
    });
  }, [filter, query, students]);

  return <div className="min-h-screen overflow-hidden bg-[#f4f7fb]">
    <header className="relative overflow-hidden bg-ink text-white"><div className="ambient-grid absolute inset-0 opacity-30" /><div className="absolute -right-24 -top-40 h-96 w-96 rounded-full bg-brand/30 blur-3xl" /><div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-8 sm:px-6 sm:py-10"><div className="reveal"><div className="mb-2 flex items-center gap-2 text-electric"><ShieldCheck size={16} /><p className="text-[11px] font-extrabold uppercase tracking-[.28em]">EProfile Control</p></div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Centro de administración</h1><p className="mt-2 max-w-xl text-sm text-slate-300">Supervisa identidades, publicaciones y accesos desde un solo espacio.</p></div><Button onClick={() => void signOut()} className="border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20"><LogOut size={17} /><span className="hidden sm:inline">Cerrar sesión</span></Button></div></header>

    <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 sm:py-10">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <section className="-mt-14 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: 'Perfiles totales', value: students.length, icon: Users, style: 'bg-blue-50 text-brand' },
        { label: 'Publicados', value: metrics.published, icon: Sparkles, style: 'bg-violet-50 text-violet-600' },
        { label: 'Cuentas activas', value: metrics.active, icon: Activity, style: 'bg-emerald-50 text-emerald-600' },
        { label: 'Por publicar', value: metrics.drafts, icon: BarChart3, style: 'bg-amber-50 text-amber-600' },
      ].map(({ label, value, icon: Icon, style }, index) => <Card key={label} className={`interactive-card reveal reveal-delay-${index + 1} flex items-center gap-4 border-white/70 bg-white/95 shadow-xl shadow-slate-900/5 backdrop-blur`}><span className={`grid h-12 w-12 place-items-center rounded-2xl ${style}`}><Icon size={21} /></span><div><p className="text-2xl font-black tracking-tight text-ink">{value}</p><p className="text-xs font-semibold text-slate-500">{label}</p></div></Card>)}</section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_.6fr]"><Card className="relative overflow-hidden border-0 bg-ink text-white"><div className="ambient-grid absolute inset-0 opacity-30" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-electric">Salud de la plataforma</p><h2 className="mt-2 text-2xl font-black">{metrics.rate}% de perfiles publicados</h2><p className="mt-2 text-sm text-slate-300">{metrics.drafts === 0 ? 'Todo el directorio está publicado.' : `${metrics.drafts} perfil${metrics.drafts === 1 ? '' : 'es'} requiere revisión o publicación.`}</p></div><div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#70f0d4 ${metrics.rate * 3.6}deg, rgba(255,255,255,.12) 0deg)` }}><div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-lg font-black">{metrics.rate}%</div></div></div></Card><Card className="border-0"><div className="flex items-start justify-between"><div><p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Atención</p><p className="mt-2 text-3xl font-black text-ink">{metrics.inactive}</p><p className="text-sm font-semibold text-slate-500">cuentas inactivas</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><UserRoundX size={21} /></span></div><button onClick={() => setFilter('inactivos')} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-brand">Revisar accesos<ExternalLink size={15} /></button></Card></section>

      <Card className="interactive-card overflow-hidden border-0 p-0 shadow-soft"><div className="grid gap-6 bg-gradient-to-r from-brand to-indigo-600 px-6 py-6 text-white lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div><div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-white/15"><Plus size={20} /></div><h2 className="text-xl font-black">Nueva identidad digital</h2><p className="mt-2 text-sm leading-relaxed text-blue-100">Crea el acceso y reserva una ruta única para el siguiente perfil.</p></div><form className="grid gap-3 rounded-3xl bg-white p-4 text-ink shadow-2xl sm:grid-cols-2" onSubmit={createStudent}><Field required label="Correo" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /><Field required label="Contraseña temporal" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /><div className="sm:col-span-2"><Field required label="Ruta pública (slug)" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" hint="Solo minúsculas, números y guiones." value={slug} onChange={(event) => setSlug(event.target.value)} /></div><Button disabled={busy} type="submit" className="sm:col-span-2 bg-ink text-white hover:bg-slate-800"><Plus size={17} />Crear cuenta</Button></form></div></Card>

      <Card className="border-0 p-0 shadow-soft">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-brand"><Users size={19} /></span><div><h2 className="font-black text-ink">Directorio de perfiles</h2><p className="text-xs text-slate-500">{filteredStudents.length} de {students.length} perfiles visibles</p></div></div><Button className="text-slate-600 hover:bg-slate-100" onClick={() => void load()}><RefreshCw size={16} />Actualizar</Button></div><div className="mt-5 flex flex-col gap-3 md:flex-row"><label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input aria-label="Buscar perfiles" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo, carrera o ruta…" className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-blue-100" /></label><div className="flex gap-2 overflow-x-auto">{(['todos', 'publicados', 'borradores', 'inactivos'] as const).map((value) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black capitalize transition ${filter === value ? 'bg-ink text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:text-ink'}`}>{value}</button>)}</div></div></div>
        {loading ? <div className="p-8"><Loading label="Cargando cuentas…" /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-500"><tr><th className="px-6 py-4">Estudiante</th><th className="px-4 py-4">Ruta</th><th className="px-4 py-4">Perfil</th><th className="px-4 py-4">Cuenta</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredStudents.map((student) => <StudentRow key={student.student_id} student={student} busy={busy} onReset={resetPassword} onActive={setActive} onDelete={deleteStudent} />)}</tbody></table>{filteredStudents.length === 0 && <div className="grid place-items-center py-16 text-center"><span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Search size={24} /></span><p className="font-semibold text-slate-500">No encontramos perfiles con esos filtros.</p></div>}</div>}
      </Card>
    </main>
  </div>;
}

function StudentRow({ student, busy, onReset, onActive, onDelete }: { student: AdminStudentSummary; busy: boolean; onReset: (student: AdminStudentSummary) => Promise<void>; onActive: (student: AdminStudentSummary) => Promise<void>; onDelete: (student: AdminStudentSummary) => Promise<void> }) {
  return <tr className="group transition-colors hover:bg-blue-50/40"><td className="px-6 py-4"><div className="flex items-center gap-3">{student.photo_url ? <img src={student.photo_url} alt="" className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white shadow" /> : <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand to-indigo-600 text-sm font-black text-white">{(student.full_name || student.email).charAt(0).toUpperCase()}</span>}<div><strong className="block text-ink">{student.full_name || 'Sin nombre'}</strong><span className="text-xs text-slate-500">{student.email}</span>{student.career && <span className="mt-0.5 block max-w-[250px] truncate text-[11px] text-slate-400">{student.career}</span>}</div></div></td><td className="px-4 py-4"><Link target="_blank" to={`/${student.slug}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 transition hover:bg-blue-100 hover:text-brand">/{student.slug}<ExternalLink size={12} /></Link></td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${student.status === 'publicado' ? 'bg-emerald-100 text-emerald-800' : student.status === 'borrador' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{student.status}</span></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-2 font-semibold ${student.is_active ? 'text-emerald-700' : 'text-red-700'}`}><span className={`h-2 w-2 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />{student.is_active ? 'Activa' : 'Inactiva'}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-1"><Link title="Editar como administrador" to={`/${student.slug}/admin`} className="grid h-10 w-10 place-items-center rounded-xl text-brand transition hover:-translate-y-0.5 hover:bg-blue-100"><Edit3 size={17} /></Link><Button title="Reiniciar contraseña" disabled={busy} onClick={() => void onReset(student)} className="h-10 min-h-0 w-10 rounded-xl p-0 text-slate-600 hover:bg-slate-100"><KeyRound size={17} /></Button><Button title={student.is_active ? 'Desactivar' : 'Reactivar'} disabled={busy} onClick={() => void onActive(student)} className="h-10 min-h-0 w-10 rounded-xl p-0 text-amber-700 hover:bg-amber-50">{student.is_active ? <PowerOff size={17} /> : <Power size={17} />}</Button><Button title="Eliminar" disabled={busy} onClick={() => void onDelete(student)} className="h-10 min-h-0 w-10 rounded-xl p-0 text-red-700 hover:bg-red-50"><Trash2 size={17} /></Button></div></td></tr>;
}
