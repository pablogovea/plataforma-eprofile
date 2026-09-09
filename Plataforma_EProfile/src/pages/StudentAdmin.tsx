import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, Globe2, LogOut, Save } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ProfileEditor } from '../components/ProfileEditor';
import { ProfileView } from '../components/ProfileView';
import { Alert, Button, Loading } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useEditorProfile } from '../hooks/useProfile';
import type { ProfileBundle } from '../types/supabase';
import { supabase } from '../utils/supabase';

export function StudentAdmin() {
  const { slug = '' } = useParams();
  const { user, role, signOut } = useAuth();
  const { data, loading, error, save, publish } = useEditorProfile(slug);
  const [draft, setDraft] = useState<ProfileBundle | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => { if (data) setDraft(data); }, [data]);

  const saveDraft = async (): Promise<boolean> => {
    if (!draft) return false;
    setBusy(true); setMessage(null);
    const saveError = await save(draft);
    setBusy(false);
    setMessage(saveError ? { tone: 'error', text: saveError } : { tone: 'success', text: 'Borrador guardado.' });
    return !saveError;
  };

  const publishProfile = async () => {
    if (!draft) return;
    if (!draft.profile.full_name.trim() || !draft.profile.career.trim()) {
      setMessage({ tone: 'error', text: 'Completa nombre y carrera antes de publicar.' });
      return;
    }
    const saved = await saveDraft();
    if (!saved) return;
    setBusy(true);
    const publishError = await publish(draft.student.id);
    setBusy(false);
    setMessage(publishError ? { tone: 'error', text: publishError } : { tone: 'success', text: 'Perfil publicado. La ruta pública ya muestra esta versión.' });
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

  if (loading) return <Loading label="Cargando panel…" />;
  if (error || !draft) return <main className="mx-auto max-w-xl px-4 py-20"><Alert>{error ?? 'Perfil no disponible'}</Alert></main>;
  if (preview) return <div><div className="fixed bottom-4 right-4 z-30"><Button className="bg-slate-900 text-white shadow-xl" onClick={() => setPreview(false)}><ArrowLeft size={17} />Volver al editor</Button></div><ProfileView data={draft} preview /></div>;

  return <div className="min-h-screen bg-slate-100">
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">EProfile · {role === 'admin_plataforma' ? 'Modo administrador' : 'Mi perfil'}</p><h1 className="font-bold">/{slug}</h1></div>
        <div className="flex flex-wrap gap-2"><Link to={`/${slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><Globe2 size={17} />Ver sitio</Link><Button onClick={() => void signOut()} className="text-slate-600 hover:bg-slate-100"><LogOut size={17} />Salir</Button></div>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold">Estado: <span className={draft.profile.status === 'publicado' ? 'text-emerald-700' : 'text-amber-700'}>{draft.profile.status}</span></p><p className="text-xs text-slate-500">La versión pública anterior se conserva mientras editas.</p></div>
        <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void saveDraft()} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><Save size={17} />Guardar borrador</Button><Button disabled={busy} onClick={() => setPreview(true)} className="border border-blue-200 bg-blue-50 text-blue-700"><Eye size={17} />Previsualizar</Button><Button disabled={busy} onClick={() => void publishProfile()} className="bg-blue-600 text-white hover:bg-blue-700"><CheckCircle2 size={17} />Publicar</Button></div>
      </div>
      {message && <div className="mb-5"><Alert tone={message.tone}>{message.text}</Alert></div>}
      <ProfileEditor data={draft} onChange={setDraft} onPhoto={uploadPhoto} />
    </main>
  </div>;
}
