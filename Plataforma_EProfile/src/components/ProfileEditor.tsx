import { Plus, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import type { Experience, Formation, ProfileBundle, Project, Recognition, Skill } from '../types/supabase';
import { Button, Card, Field, TextArea } from './ui';

interface Props {
  data: ProfileBundle;
  onChange: (data: ProfileBundle) => void;
  onPhoto: (file: File) => Promise<void>;
}

const replaceAt = <T,>(items: T[], index: number, patch: Partial<T>): T[] => items.map((item, current) => current === index ? { ...item, ...patch } : item);
const removeAt = <T,>(items: T[], index: number): T[] => items.filter((_item, current) => current !== index);
const sectionClass = 'grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4';

export function ProfileEditor({ data, onChange, onPhoto }: Props) {
  const updateProfile = (patch: Partial<ProfileBundle['profile']>) => onChange({ ...data, profile: { ...data.profile, ...patch } });
  const photoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void onPhoto(file);
  };

  const addFormation = () => {
    const item: Formation = { id: crypto.randomUUID(), student_id: data.student.id, institution: '', degree: '', start_date: null, end_date: null, description: '', sort_order: data.formations.length };
    onChange({ ...data, formations: [...data.formations, item] });
  };
  const addExperience = () => {
    const item: Experience = { id: crypto.randomUUID(), student_id: data.student.id, organization: '', position: '', start_date: null, end_date: null, description: '', sort_order: data.experiences.length };
    onChange({ ...data, experiences: [...data.experiences, item] });
  };
  const addSkill = () => {
    const item: Skill = { id: crypto.randomUUID(), student_id: data.student.id, name: '', category: 'Técnica', level: null, sort_order: data.skills.length };
    onChange({ ...data, skills: [...data.skills, item] });
  };
  const addRecognition = () => {
    const item: Recognition = { id: crypto.randomUUID(), student_id: data.student.id, title: '', issuer: '', awarded_on: null, description: '', url: null, sort_order: data.recognitions.length };
    onChange({ ...data, recognitions: [...data.recognitions, item] });
  };
  const addProject = () => {
    const item: Project = { id: crypto.randomUUID(), student_id: data.student.id, name: '', description: '', technologies: [], role: '', repository_url: null, live_url: null, is_academic: true, sort_order: data.projects.length };
    onChange({ ...data, projects: [...data.projects, item] });
  };

  return <div className="grid gap-5">
    <Card>
      <h2 className="mb-4 text-lg font-bold">Datos esenciales</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo *" value={data.profile.full_name} maxLength={120} onChange={(event) => updateProfile({ full_name: event.target.value })} />
        <Field label="Carrera o profesión *" value={data.profile.career} maxLength={160} onChange={(event) => updateProfile({ career: event.target.value })} />
        <div className="sm:col-span-2"><TextArea label="Reseña breve" value={data.profile.bio} maxLength={1200} onChange={(event) => updateProfile({ bio: event.target.value })} /></div>
        <Field label="URL de fotografía" type="url" value={data.profile.photo_url ?? ''} onChange={(event) => updateProfile({ photo_url: event.target.value || null })} />
        <label className="grid content-end gap-1.5 text-sm font-medium text-slate-700"><span>Subir fotografía (JPG, PNG o WebP)</span><span className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-3 text-blue-700"><Upload size={17} />Elegir archivo<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={photoSelected} /></span></label>
      </div>
    </Card>

    <Card>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Experiencia</h2><Button className="bg-blue-50 text-blue-700" onClick={addExperience}><Plus size={17} />Agregar</Button></div>
      <div className="grid gap-3">{data.experiences.map((item, index) => <div className={sectionClass} key={item.id}>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Puesto" value={item.position} onChange={(e) => onChange({ ...data, experiences: replaceAt(data.experiences, index, { position: e.target.value }) })} /><Field label="Organización" value={item.organization} onChange={(e) => onChange({ ...data, experiences: replaceAt(data.experiences, index, { organization: e.target.value }) })} /><Field label="Inicio" type="date" value={item.start_date ?? ''} onChange={(e) => onChange({ ...data, experiences: replaceAt(data.experiences, index, { start_date: e.target.value || null }) })} /><Field label="Fin (vacío = actualidad)" type="date" value={item.end_date ?? ''} onChange={(e) => onChange({ ...data, experiences: replaceAt(data.experiences, index, { end_date: e.target.value || null }) })} /></div>
        <TextArea label="Descripción" value={item.description} onChange={(e) => onChange({ ...data, experiences: replaceAt(data.experiences, index, { description: e.target.value }) })} /><Button className="justify-self-end text-red-700 hover:bg-red-50" onClick={() => onChange({ ...data, experiences: removeAt(data.experiences, index) })}><Trash2 size={16} />Eliminar</Button>
      </div>)}</div>
    </Card>

    <Card>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Formación</h2><Button className="bg-blue-50 text-blue-700" onClick={addFormation}><Plus size={17} />Agregar</Button></div>
      <div className="grid gap-3">{data.formations.map((item, index) => <div className={sectionClass} key={item.id}>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Institución" value={item.institution} onChange={(e) => onChange({ ...data, formations: replaceAt(data.formations, index, { institution: e.target.value }) })} /><Field label="Programa o grado" value={item.degree} onChange={(e) => onChange({ ...data, formations: replaceAt(data.formations, index, { degree: e.target.value }) })} /><Field label="Inicio" type="date" value={item.start_date ?? ''} onChange={(e) => onChange({ ...data, formations: replaceAt(data.formations, index, { start_date: e.target.value || null }) })} /><Field label="Fin" type="date" value={item.end_date ?? ''} onChange={(e) => onChange({ ...data, formations: replaceAt(data.formations, index, { end_date: e.target.value || null }) })} /></div>
        <TextArea label="Descripción" value={item.description} onChange={(e) => onChange({ ...data, formations: replaceAt(data.formations, index, { description: e.target.value }) })} /><Button className="justify-self-end text-red-700 hover:bg-red-50" onClick={() => onChange({ ...data, formations: removeAt(data.formations, index) })}><Trash2 size={16} />Eliminar</Button>
      </div>)}</div>
    </Card>

    <Card>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Habilidades</h2><Button className="bg-blue-50 text-blue-700" onClick={addSkill}><Plus size={17} />Agregar</Button></div>
      <div className="grid gap-3">{data.skills.map((item, index) => <div className={`${sectionClass} sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end`} key={item.id}><Field label="Habilidad" value={item.name} onChange={(e) => onChange({ ...data, skills: replaceAt(data.skills, index, { name: e.target.value }) })} /><Field label="Categoría" value={item.category} onChange={(e) => onChange({ ...data, skills: replaceAt(data.skills, index, { category: e.target.value }) })} /><Field label="Nivel (1-5)" type="number" min={1} max={5} value={item.level ?? ''} onChange={(e) => onChange({ ...data, skills: replaceAt(data.skills, index, { level: e.target.value ? Number(e.target.value) : null }) })} /><Button className="text-red-700 hover:bg-red-50" onClick={() => onChange({ ...data, skills: removeAt(data.skills, index) })}><Trash2 size={16} /></Button></div>)}</div>
    </Card>

    <Card>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Proyectos</h2><Button className="bg-blue-50 text-blue-700" onClick={addProject}><Plus size={17} />Agregar</Button></div>
      <div className="grid gap-3">{data.projects.map((item, index) => <div className={sectionClass} key={item.id}>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre" value={item.name} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { name: e.target.value }) })} /><Field label="Tu rol" value={item.role} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { role: e.target.value }) })} /><Field label="Tecnologías (separadas por coma)" value={item.technologies.join(', ')} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { technologies: e.target.value.split(',').map((value) => value.trim()).filter(Boolean) }) })} /><label className="flex items-center gap-2 self-end pb-3 text-sm font-medium"><input type="checkbox" checked={item.is_academic} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { is_academic: e.target.checked }) })} />Proyecto académico</label><Field label="Repositorio" type="url" value={item.repository_url ?? ''} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { repository_url: e.target.value || null }) })} /><Field label="Demo" type="url" value={item.live_url ?? ''} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { live_url: e.target.value || null }) })} /></div>
        <TextArea label="Descripción" value={item.description} onChange={(e) => onChange({ ...data, projects: replaceAt(data.projects, index, { description: e.target.value }) })} /><Button className="justify-self-end text-red-700 hover:bg-red-50" onClick={() => onChange({ ...data, projects: removeAt(data.projects, index) })}><Trash2 size={16} />Eliminar</Button>
      </div>)}</div>
    </Card>

    <Card>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Reconocimientos</h2><Button className="bg-blue-50 text-blue-700" onClick={addRecognition}><Plus size={17} />Agregar</Button></div>
      <div className="grid gap-3">{data.recognitions.map((item, index) => <div className={sectionClass} key={item.id}>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Título" value={item.title} onChange={(e) => onChange({ ...data, recognitions: replaceAt(data.recognitions, index, { title: e.target.value }) })} /><Field label="Emisor" value={item.issuer} onChange={(e) => onChange({ ...data, recognitions: replaceAt(data.recognitions, index, { issuer: e.target.value }) })} /><Field label="Fecha" type="date" value={item.awarded_on ?? ''} onChange={(e) => onChange({ ...data, recognitions: replaceAt(data.recognitions, index, { awarded_on: e.target.value || null }) })} /><Field label="Enlace de evidencia" type="url" value={item.url ?? ''} onChange={(e) => onChange({ ...data, recognitions: replaceAt(data.recognitions, index, { url: e.target.value || null }) })} /></div>
        <TextArea label="Descripción" value={item.description} onChange={(e) => onChange({ ...data, recognitions: replaceAt(data.recognitions, index, { description: e.target.value }) })} /><Button className="justify-self-end text-red-700 hover:bg-red-50" onClick={() => onChange({ ...data, recognitions: removeAt(data.recognitions, index) })}><Trash2 size={16} />Eliminar</Button>
      </div>)}</div>
    </Card>

    <Card>
      <h2 className="mb-4 text-lg font-bold">Contacto</h2>
      {data.contact && <div className="grid gap-4 sm:grid-cols-2"><Field label="Correo público" type="email" value={data.contact.email} onChange={(e) => onChange({ ...data, contact: data.contact ? { ...data.contact, email: e.target.value } : null })} /><Field label="Teléfono" value={data.contact.phone} onChange={(e) => onChange({ ...data, contact: data.contact ? { ...data.contact, phone: e.target.value } : null })} /><Field label="LinkedIn" type="url" value={data.contact.linkedin_url ?? ''} onChange={(e) => onChange({ ...data, contact: data.contact ? { ...data.contact, linkedin_url: e.target.value || null } : null })} /><Field label="GitHub" type="url" value={data.contact.github_url ?? ''} onChange={(e) => onChange({ ...data, contact: data.contact ? { ...data.contact, github_url: e.target.value || null } : null })} /><Field label="Sitio web" type="url" value={data.contact.website_url ?? ''} onChange={(e) => onChange({ ...data, contact: data.contact ? { ...data.contact, website_url: e.target.value || null } : null })} /><Field label="Ubicación" value={data.contact.location} onChange={(e) => onChange({ ...data, contact: data.contact ? { ...data.contact, location: e.target.value } : null })} /></div>}
    </Card>

    <Card>
      <h2 className="mb-4 text-lg font-bold">Plantilla del PDF</h2>
      <div className="grid gap-3 sm:grid-cols-3">{(['clasica', 'moderna', 'minimalista'] as const).map((template) => <label key={template} className={`cursor-pointer rounded-xl border-2 p-4 capitalize ${data.profile.pdf_template === template ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}><input className="sr-only" type="radio" name="template" checked={data.profile.pdf_template === template} onChange={() => updateProfile({ pdf_template: template })} />{template}</label>)}</div>
    </Card>
  </div>;
}
