import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Edit3, KeyRound, LogOut, Plus, Power, PowerOff, RefreshCw, Trash2, Users } from 'lucide-react';
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

  return <div className="min-h-screen bg-slate-100">
    <header className="border-b bg-ink text-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-300">EProfile</p><h1 className="text-xl font-bold">Administración de plataforma</h1></div><Button onClick={() => void signOut()} className="bg-white/10 text-white hover:bg-white/20"><LogOut size={17} />Salir</Button></div></header>
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-7">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Card><div className="mb-4 flex items-center gap-2"><Plus className="text-blue-600" size={20} /><h2 className="text-lg font-bold">Crear cuenta de estudiante</h2></div><form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end" onSubmit={createStudent}><Field required label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><Field required label="Contraseña temporal" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /><Field required label="Ruta (slug)" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" hint="Solo minúsculas, números y guiones." value={slug} onChange={(e) => setSlug(e.target.value)} /><Button disabled={busy} type="submit" className="bg-blue-600 text-white"><Plus size={17} />Crear</Button></form></Card>
      <Card><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><Users className="text-blue-600" size={20} /><h2 className="text-lg font-bold">Perfiles ({students.length})</h2></div><Button className="text-slate-600 hover:bg-slate-100" onClick={() => void load()}><RefreshCw size={17} />Actualizar</Button></div>
        {loading ? <Loading label="Cargando cuentas…" /> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">Estudiante</th><th className="px-3 py-3">Ruta</th><th className="px-3 py-3">Perfil</th><th className="px-3 py-3">Cuenta</th><th className="px-3 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y">{students.map((student) => <tr key={student.student_id}><td className="px-3 py-4"><strong className="block">{student.full_name || 'Sin nombre'}</strong><span className="text-xs text-slate-500">{student.email}</span></td><td className="px-3 py-4 font-mono text-xs">/{student.slug}</td><td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${student.status === 'publicado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{student.status}</span></td><td className="px-3 py-4">{student.is_active ? <span className="text-emerald-700">Activa</span> : <span className="text-red-700">Inactiva</span>}</td><td className="px-3 py-4"><div className="flex justify-end gap-1"><Link title="Editar como administrador" to={`/${student.slug}/admin`} className="grid h-10 w-10 place-items-center rounded-lg text-blue-700 hover:bg-blue-50"><Edit3 size={17} /></Link><Button title="Reiniciar contraseña" disabled={busy} onClick={() => void resetPassword(student)} className="h-10 min-h-0 w-10 p-0 text-slate-600 hover:bg-slate-100"><KeyRound size={17} /></Button><Button title={student.is_active ? 'Desactivar' : 'Reactivar'} disabled={busy} onClick={() => void setActive(student)} className="h-10 min-h-0 w-10 p-0 text-amber-700 hover:bg-amber-50">{student.is_active ? <PowerOff size={17} /> : <Power size={17} />}</Button><Button title="Eliminar" disabled={busy} onClick={() => void deleteStudent(student)} className="h-10 min-h-0 w-10 p-0 text-red-700 hover:bg-red-50"><Trash2 size={17} /></Button></div></td></tr>)}</tbody></table>{students.length === 0 && <p className="py-10 text-center text-slate-500">Todavía no hay estudiantes.</p>}</div>}
      </Card>
    </main>
  </div>;
}
