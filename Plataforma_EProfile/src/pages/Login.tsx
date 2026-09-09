import { useState, type FormEvent } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Alert, Button, Card, Field } from '../components/ui';

export function Login() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const destination = slug ? `/${slug}/admin` : '/admin';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
    else navigate((location.state as { from?: string } | null)?.from ?? destination, { replace: true });
  };

  return <main className="grid min-h-screen place-items-center bg-ink px-4 py-10">
    <Card className="w-full max-w-md p-7">
      <Link to={slug ? `/${slug}` : '/'} className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={16} />Volver</Link>
      <p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">EProfile</p>
      <h1 className="mt-2 text-3xl font-black">{slug ? 'Panel del estudiante' : 'Administración'}</h1>
      <p className="mt-2 text-sm text-slate-500">Inicia sesión con la cuenta asignada por el administrador.</p>
      <form className="mt-7 grid gap-4" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field label="Correo" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <Field label="Contraseña" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" disabled={busy} className="mt-2 bg-blue-600 text-white hover:bg-blue-700"><LogIn size={18} />{busy ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </Card>
  </main>;
}
