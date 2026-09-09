import { LogIn } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ProfileView } from '../components/ProfileView';
import { Alert, Loading } from '../components/ui';
import { usePublicProfile } from '../hooks/useProfile';
import { exportProfilePdf } from '../utils/exportPdf';
import { exportVCard } from '../utils/exportVCard';

export function PublicProfile() {
  const { slug = '' } = useParams();
  const { data, loading, error } = usePublicProfile(slug);
  if (loading) return <Loading label="Cargando EProfile…" />;
  if (error || !data) {
    return <main className="mx-auto grid min-h-screen max-w-lg place-content-center gap-4 px-4 text-center">
      <Alert>{error ?? 'Perfil no encontrado'}</Alert>
      <Link className="text-sm font-semibold text-blue-600 hover:underline" to={`/${slug}/admin/login`}><LogIn className="inline" size={15} /> Acceso del estudiante</Link>
    </main>;
  }
  return <ProfileView data={data} onPdf={() => void exportProfilePdf(data, data.profile.pdf_template)} onVCard={() => exportVCard(data)} />;
}
