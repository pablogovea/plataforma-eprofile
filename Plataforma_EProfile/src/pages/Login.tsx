import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Fingerprint, LayoutDashboard, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import type { AppRole } from '../types/supabase';
import { supabase } from '../utils/supabase';

export function Login() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    if (message) {
      setBusy(false);
      setError(message);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      setBusy(false);
      setError('No fue posible recuperar la sesión. Intenta nuevamente.');
      return;
    }

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    const signedRole = roleData?.role as AppRole | undefined;
    const requestedPath = (location.state as { from?: string } | null)?.from;

    if (signedRole === 'admin_plataforma') {
      navigate(requestedPath?.includes('/admin') ? requestedPath : '/admin', { replace: true });
      return;
    }

    const { data: student } = await supabase.from('students').select('slug').eq('user_id', userId).maybeSingle();
    setBusy(false);
    if (student?.slug) navigate(`/${student.slug}/admin`, { replace: true });
    else setError('Tu cuenta todavía no tiene un perfil asignado. Contacta al administrador.');
  };

  return <main className="relative isolate min-h-screen overflow-hidden bg-ink px-4 py-6 sm:px-6 lg:grid lg:place-items-center">
    <div className="ambient-grid absolute inset-0 -z-20 opacity-80" />
    <div className="aurora aurora-one absolute -right-40 -top-44 -z-10 h-[34rem] w-[34rem] rounded-full bg-brand/45 blur-[110px]" />
    <div className="aurora aurora-two absolute -bottom-48 -left-32 -z-10 h-[30rem] w-[30rem] rounded-full bg-electric/20 blur-[110px]" />
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.06] shadow-[0_40px_120px_-35px_rgba(0,0,0,.75)] backdrop-blur-xl lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden min-h-[700px] overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="noise absolute inset-0 opacity-[.05]" />
        <div className="relative reveal">
          <Link to="/" className="inline-flex items-center gap-3 font-black tracking-[.18em]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-electric text-ink"><Fingerprint size={22} /></span>EPROFILE</Link>
          <p className="mt-20 text-xs font-black uppercase tracking-[.28em] text-electric">Tu identidad, en un solo lugar</p>
          <h1 className="mt-5 max-w-xl text-5xl font-black leading-[1.02] tracking-[-.045em]">Convierte tu experiencia en una presencia profesional.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Actualiza tu perfil, revisa cómo se verá y publica una versión lista para compartir con empresas, docentes y contactos.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[
            { icon: LayoutDashboard, label: 'Panel claro' },
            { icon: UserRoundCheck, label: 'Perfil editable' },
            { icon: ShieldCheck, label: 'Acceso seguro' },
          ].map(({ icon: Icon, label }, index) => <div key={label} className={`reveal reveal-delay-${index + 1} rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur`}><Icon className="mb-3 text-electric" size={20} /><p className="text-sm font-bold">{label}</p></div>)}
        </div>
      </section>
      <section className="relative bg-white px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
        <Link to={slug ? `/${slug}` : '/'} className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand"><ArrowLeft className="transition group-hover:-translate-x-1" size={16} />Volver</Link>
        <div className="reveal mt-12">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-indigo-600 text-white shadow-glow"><LockKeyhole size={25} /></div>
          <p className="mt-7 text-xs font-black uppercase tracking-[.22em] text-brand">Acceso a EProfile</p>
          <h2 className="mt-2 text-4xl font-black tracking-[-.035em] text-ink">Bienvenido de vuelta</h2>
          <p className="mt-3 text-[15px] leading-6 text-slate-500">Ingresa con tu cuenta. Te llevaremos automáticamente al panel que corresponde a tu rol.</p>
        </div>
        <form className="mt-9 grid gap-5" onSubmit={submit}>
          {error && <Alert>{error}</Alert>}
          <label className="grid gap-2 text-sm font-bold text-slate-700">Correo<span className="group relative"><Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand" size={18} /><input className="min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-4 outline-none transition hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-4 focus:ring-blue-100" type="email" autoComplete="email" required placeholder="nombre@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} /></span></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Contraseña<span className="group relative"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand" size={18} /><input className="min-h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-12 pr-12 outline-none transition hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-4 focus:ring-blue-100" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required minLength={8} placeholder="Tu contraseña" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
          <Button type="submit" disabled={busy} className="group mt-2 min-h-14 rounded-2xl bg-gradient-to-r from-brand to-indigo-600 text-base text-white shadow-glow hover:shadow-[0_24px_60px_-22px_rgba(49,92,244,.8)]">{busy ? <><Sparkles className="animate-spin" size={18} />Preparando tu panel…</> : <>Iniciar sesión<ArrowRight className="transition group-hover:translate-x-1" size={18} /></>}</Button>
        </form>
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={15} />Tu sesión está protegida por Supabase Auth.</div>
      </section>
    </div>
  </main>;
}
