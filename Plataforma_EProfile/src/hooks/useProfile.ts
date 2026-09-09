import { useCallback, useEffect, useState } from 'react';
import type { Json, ProfileBundle } from '../types/supabase';
import { emptyContact, parseProfileBundle } from '../utils/profile';
import { supabase } from '../utils/supabase';

interface ProfileState {
  data: ProfileBundle | null;
  loading: boolean;
  error: string | null;
}

export function usePublicProfile(slug: string) {
  const [state, setState] = useState<ProfileState>({ data: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });
    void supabase.rpc('get_public_profile', { requested_slug: slug }).then(({ data, error }) => {
      if (!active) return;
      const bundle = parseProfileBundle(data);
      setState({ data: bundle, loading: false, error: error?.message ?? (bundle ? null : 'Perfil no encontrado o no publicado') });
    });
    return () => { active = false; };
  }, [slug]);
  return state;
}

export function useEditorProfile(slug: string) {
  const [state, setState] = useState<ProfileState>({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    const { data: student, error: studentError } = await supabase.from('students').select('*').eq('slug', slug).maybeSingle();
    if (studentError || !student) {
      setState({ data: null, loading: false, error: studentError?.message ?? 'No puedes administrar este perfil' });
      return;
    }
    const [profileResult, formationsResult, experiencesResult, skillsResult, recognitionsResult, projectsResult, contactResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('student_id', student.id).single(),
      supabase.from('formations').select('*').eq('student_id', student.id).order('sort_order'),
      supabase.from('experiences').select('*').eq('student_id', student.id).order('sort_order'),
      supabase.from('skills').select('*').eq('student_id', student.id).order('sort_order'),
      supabase.from('recognitions').select('*').eq('student_id', student.id).order('sort_order'),
      supabase.from('projects').select('*').eq('student_id', student.id).order('sort_order'),
      supabase.from('contacts').select('*').eq('student_id', student.id).maybeSingle(),
    ]);
    const firstError = [profileResult.error, formationsResult.error, experiencesResult.error, skillsResult.error, recognitionsResult.error, projectsResult.error, contactResult.error].find(Boolean);
    if (firstError || !profileResult.data) {
      setState({ data: null, loading: false, error: firstError?.message ?? 'No se pudo cargar el perfil' });
      return;
    }
    const { published_snapshot: _snapshot, ...profile } = profileResult.data;
    void _snapshot;
    setState({
      data: {
        student: { id: student.id, slug: student.slug, is_active: student.is_active },
        profile,
        formations: formationsResult.data ?? [], experiences: experiencesResult.data ?? [], skills: skillsResult.data ?? [],
        recognitions: recognitionsResult.data ?? [], projects: projectsResult.data ?? [],
        contact: contactResult.data ?? emptyContact(student.id),
      },
      loading: false,
      error: null,
    });
  }, [slug]);

  useEffect(() => { void load(); }, [load]);

  const save = async (bundle: ProfileBundle): Promise<string | null> => {
    const payload = bundle as unknown as Json;
    const { error } = await supabase.rpc('save_profile_bundle', { target_student_id: bundle.student.id, payload });
    if (!error) await load();
    return error?.message ?? null;
  };

  const publish = async (studentId: string): Promise<string | null> => {
    const { error } = await supabase.rpc('publish_profile', { target_student_id: studentId });
    if (!error) await load();
    return error?.message ?? null;
  };

  return { ...state, reload: load, save, publish };
}
