import { IdCard, LogOut } from 'lucide-react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Button } from './components/ui';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { PublicProfile } from './pages/PublicProfile';
import { StudentAdmin } from './pages/StudentAdmin';
import { SuperAdmin } from './pages/SuperAdmin';

function Home() {
  return <main className="grid min-h-screen place-items-center bg-ink px-4 text-white"><div className="max-w-xl text-center"><IdCard className="mx-auto mb-5 text-blue-400" size={54} /><p className="text-sm font-bold uppercase tracking-[.25em] text-blue-300">Plataforma EProfile</p><h1 className="mt-3 text-4xl font-black sm:text-5xl">Tu presentación profesional en un solo enlace.</h1><p className="mt-5 text-slate-300">Abre la ruta que te asignó el administrador o accede al panel de plataforma.</p><Link className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 font-semibold text-slate-900" to="/admin">Administrar plataforma</Link></div></main>;
}

function NoAccess() {
  const { signOut } = useAuth();
  return <main className="grid min-h-screen place-items-center px-4 text-center"><div><h1 className="text-2xl font-bold">Sin acceso</h1><p className="mt-2 text-slate-600">La cuenta iniciada no tiene permiso para esta ruta.</p><Button className="mt-5 bg-slate-900 text-white" onClick={() => void signOut()}><LogOut size={17} />Cerrar sesión</Button></div></main>;
}

function NotFound() {
  return <main className="grid min-h-screen place-items-center px-4 text-center"><div><p className="text-7xl font-black text-slate-200">404</p><h1 className="text-2xl font-bold">Ruta no encontrada</h1><Link className="mt-4 inline-block text-blue-700 hover:underline" to="/">Volver al inicio</Link></div></main>;
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/admin/login" element={<Login />} />
    <Route path="/:slug/admin/login" element={<Login />} />
    <Route path="/admin" element={<ProtectedRoute roles={['admin_plataforma']}><SuperAdmin /></ProtectedRoute>} />
    <Route path="/:slug/admin" element={<ProtectedRoute roles={['estudiante', 'admin_plataforma']}><StudentAdmin /></ProtectedRoute>} />
    <Route path="/sin-acceso" element={<NoAccess />} />
    <Route path="/:slug" element={<PublicProfile />} />
    <Route path="*" element={<NotFound />} />
  </Routes></BrowserRouter>;
}
