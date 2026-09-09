import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('No se encontró el elemento #root');

const rootRenderer = createRoot(root);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

function hasValidSupabaseConfig(): boolean {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('TU_PROYECTO') || supabaseKey.includes('REEMPLAZAR')) return false;

  try {
    return new URL(supabaseUrl).protocol === 'https:';
  } catch {
    return false;
  }
}

function SetupError({ detail }: { detail?: string }) {
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
    <section className="w-full max-w-xl rounded-2xl border border-amber-200 bg-white p-6 shadow-lg">
      <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Configuración requerida</p>
      <h1 className="mt-2 text-2xl font-black text-slate-900">No se pudo iniciar EProfile</h1>
      <p className="mt-3 text-slate-600">Crea un archivo llamado <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code> en la raíz del proyecto con estas variables:</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-100">VITE_SUPABASE_URL=https://tu-proyecto.supabase.co{String.raw`\n`}VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...</pre>
      <p className="mt-4 text-sm text-slate-600">Después detén Vite con Ctrl+C y vuelve a ejecutar <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code>.</p>
      {detail && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Detalle: {detail}</p>}
    </section>
  </main>;
}

if (!hasValidSupabaseConfig()) {
  rootRenderer.render(<StrictMode><SetupError /></StrictMode>);
} else {
  void import('./Bootstrap')
    .then(({ Bootstrap }) => rootRenderer.render(<StrictMode><Bootstrap /></StrictMode>))
    .catch((error: unknown) => {
      const detail = error instanceof Error ? error.message : 'Error desconocido al cargar la aplicación.';
      console.error(error);
      rootRenderer.render(<StrictMode><SetupError detail={detail} /></StrictMode>);
    });
}
