import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Activity, Edit3, KeyRound, LogOut, Plus, Power, PowerOff, RefreshCw, ShieldCheck, Sparkles, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Field, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import type { AdminStudentSummary } from '../types/supabase';
import { supabase } from '../utils/supabase';

interface AdminResponse { students?: AdminStudentSummary[]; error?: string; message?: string }

export function SuperAdmin() {
  const { signOut } = useAuth();
  const [students, setStudents] = useState<AdminStudentSummary[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [slug, setSlug] = useState('');
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
    if (!window.confirm(`Eliminar definitivamente la cuenta /${student.slug} y todo su contenido?`)) return;
    setBusy(true);
    const response = await invoke('DELETE', { studentId: student.student_id });
    setBusy(false);
    if (response.error) setMessage({ tone: 'error', text: response.error }); else { setMessage({ tone: 'success', text: 'Cuenta eliminada.' }); await load(); }
  };

  const publishedCount = students.filter((student) => student.status === 'publicado').length;
  const activeCount = students.filter((student) => student.is_active).length;

  return <div className="min-h-screen overflow-hidden bg-[#f4f7fb]">
    <header className="relative overflow-hidden bg-ink text-white">
      <div className="ambient-grid absolute inset-0 opacity-30" />
      <div className="absolute -right-24 -top-40 h-96 w-96 rounded-full bg-brand/30 blur-3xl" />
      <div className="absolute left-1/3 top-0 h-44 w-44 rounded-full bg-electric/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-7 sm:py-9">
        <div className="reveal">
          <div className="mb-2 flex items-center gap-2 text-electric"><ShieldCheck size={16} /><p className="text-[11px] font-extrabold uppercase tracking-[.28em]">EProfile Control</p></div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Administración de plataforma</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-300">Gestiona identidades, publicaciones y accesos desde un solo espacio.</p>
        </div>
        <Button onClick={() => void signOut()} className="border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/20"><LogOut size={17} /><span className="hidden sm:inline">Salir</span></Button>
      </div>
    </header>
    <main className="relative mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:py-10">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <section className="-mt-12 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Perfiles totales', value: students.length, icon: Users, tone: 'text-brand', surface: 'bg-blue-50' },
          { label: 'Publicados', value: publishedCount, icon: Sparkles, tone: 'text-violet-600', surface: 'bg-violet-50' },
          { label: 'Cuentas activas', value: activeCount, icon: Activity, tone: 'text-emerald-600', surface: 'bg-emerald-50' },
        ].map((stat, index) => <Card key={stat.label} className={`reveal reveal-delay-${index + 1} flex items-center gap-4 border-white/70 bg-white/95 shadow-xl shadow-slate-900/5 backdrop-blur`}>
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${stat.surface} ${stat.tone}`}><stat.icon size={21} /></span>
          <div><p className="text-2xl font-black tracking-tight text-ink">{stat.value}</p><p className="text-xs font-semibold text-slate-500">{stat.label}</p></div>
        </Card>)}
      </section>
      <Card className="interactive-card overflow-hidden border-0 p-0 shadow-soft">
        <div className="grid gap-6 bg-gradient-to-r from-brand to-indigo-600 px-6 py-6 text-white lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <div><div className="mb-3 grid h-10 w-10 place-items-center rounded-2xl bg-white/15"><Plus size={20} /></div><h2 className="text-xl font-black">Nueva identidad digital</h2><p className="mt-2 text-sm leading-relaxed text-blue-100">Crea el acceso y reserva una ruta única para el siguiente perfil.</p></div>
          <form className="grid gap-3 rounded-3xl bg-white p-4 text-ink shadow-2xl sm:grid-cols-2 lg:grid-cols-2" onSubmit={createStudent}>
            <Field required label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field required label="Contraseña temporal" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="sm:col-span-2"><Field required label="Ruta pública (slug)" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" hint="Solo minúsculas, números y guiones." value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
            <Button disabled={busy} type="submit" className="sm:col-span-2 bg-ink text-white hover:bg-slate-800"><Plus size={17} />Crear cuenta</Button>
          </form>
        </div>
      </Card>
      <Card className="border-0 p-0 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-brand"><Users size={19} /></span><div><h2 className="font-black text-ink">Directorio de perfiles</h2><p className="text-xs text-slate-500">Estado editorial y acceso de cada estudiante</p></div></div><Button className="text-slate-600 hover:bg-slate-100" onClick={() => void load()}><RefreshCw size={16} />Actualizar</Button></div>
        {loading ? <div className="p-8"><Loading label="Cargando cuentas…" /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50/80 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-500"><tr><th className="px-6 py-4">Estudiante</th><th className="px-4 py-4">Ruta</th><th className="px-4 py-4">Perfil</th><th className="px-4 py-4">Cuenta</th><th className="px-6 py-4 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-slate-100">{students.map((student) => <tr key={student.student_id} className="group transition-colors hover:bg-blue-50/40"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand to-indigo-600 text-sm font-black text-white">{(student.full_name || student.email).charAt(0).toUpperCase()}</span><div><strong className="block text-ink">{student.full_name || 'Sin nombre'}</strong><span className="text-xs text-slate-500">{student.email}</span></div></div></td><td className="px-4 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-[11px] text-slate-700">/{student.slug}</span></td><td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${student.status === 'publicado' ? 'bg-emerald-100 text-emerald-800' : student.status === 'borrador' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{student.status}</span></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-2 font-semibold ${student.is_active ? 'text-emerald-700' : 'text-red-700'}`}><span className={`h-2 w-2 rounded-full ${student.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />{student.is_active ? 'Activa' : 'Inactiva'}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-1"><Link title="Editar como administrador" to={`/${student.slug}/admin`} className="grid h-10 w-10 place-items-center rounded-xl text-brand transition-all hover:-translate-y-0.5 hover:bg-blue-100"><Edit3 size={17} /></Link><Button title="Reiniciar contraseña" disabled={busy} onClick={() => void resetPassword(student)} className="h-10 min-h-0 w-10 rounded-xl p-0 text-slate-600 hover:bg-slate-100"><KeyRound size={17} /></Button><Button title={student.is_active ? 'Desactivar' : 'Reactivar'} disabled={busy} onClick={() => void setActive(student)} className="h-10 min-h-0 w-10 rounded-xl p-0 text-amber-700 hover:bg-amber-50">{student.is_active ? <PowerOff size={17} /> : <Power size={17} />}</Button><Button title="Eliminar" disabled={busy} onClick={() => void deleteStudent(student)} className="h-10 min-h-0 w-10 rounded-xl p-0 text-red-700 hover:bg-red-50"><Trash2 size={17} /></Button></div></td></tr>)}</tbody></table>{students.length === 0 && <div className="grid place-items-center py-16 text-center"><span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Users size={24} /></span><p className="font-semibold text-slate-500">Todavía no hay estudiantes.</p></div>}</div>}
      </Card>
    </main>
  </div>;
}
