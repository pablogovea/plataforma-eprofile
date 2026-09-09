import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

const json = (payload: Record<string, unknown>, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const textField = (body: Record<string, unknown>, key: string): string => typeof body[key] === 'string' ? body[key].trim() : '';

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: 'Configuración incompleta de la función.' }, 500);

  const authorization = request.headers.get('Authorization') ?? '';
  const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Sesión inválida.' }, 401);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', authData.user.id).maybeSingle();
  if (role?.role !== 'admin_plataforma') return json({ error: 'Solo el administrador de plataforma puede gestionar cuentas.' }, 403);

  try {
    if (request.method === 'GET') {
      const [{ data: students, error: studentsError }, { data: profiles, error: profilesError }, usersResult] = await Promise.all([
        admin.from('students').select('id,user_id,slug,is_active').order('created_at', { ascending: false }),
        admin.from('profiles').select('student_id,full_name,career,status,published_at'),
        admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      ]);
      if (studentsError || profilesError || usersResult.error) throw studentsError ?? profilesError ?? usersResult.error;
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.student_id, profile]));
      const emailMap = new Map(usersResult.data.users.map((user) => [user.id, user.email ?? '']));
      return json({ students: (students ?? []).map((student) => {
        const profile = profileMap.get(student.id);
        return {
          student_id: student.id, user_id: student.user_id, email: emailMap.get(student.user_id) ?? '',
          slug: student.slug, is_active: student.is_active, full_name: profile?.full_name ?? '',
          career: profile?.career ?? '', status: !profile || (!profile.full_name && !profile.career) ? 'vacio' : profile.status,
          published_at: profile?.published_at ?? null,
        };
      }) });
    }

    const parsed = await request.json() as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return json({ error: 'Solicitud inválida.' }, 400);
    const body = parsed as Record<string, unknown>;

    if (request.method === 'POST') {
      const email = textField(body, 'email').toLowerCase();
      const password = textField(body, 'password');
      const slug = textField(body, 'slug').toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return json({ error: 'Correo, contraseña (mínimo 8 caracteres) o slug inválidos.' }, 400);
      }
      const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (createError || !created.user) throw createError ?? new Error('No se pudo crear el usuario.');
      const userId = created.user.id;
      try {
        const { error: roleError } = await admin.from('user_roles').insert({ user_id: userId, role: 'estudiante' });
        if (roleError) throw roleError;
        const { data: student, error: studentError } = await admin.from('students').insert({ user_id: userId, slug, is_active: true }).select('id').single();
        if (studentError || !student) throw studentError ?? new Error('No se pudo crear el estudiante.');
        const { error: seedError } = await admin.from('profiles').insert({ student_id: student.id });
        if (seedError) throw seedError;
        const { error: contactError } = await admin.from('contacts').insert({ student_id: student.id, email });
        if (contactError) throw contactError;
      } catch (error) {
        await admin.auth.admin.deleteUser(userId);
        throw error;
      }
      return json({ message: `Cuenta /${slug} creada correctamente.` }, 201);
    }

    const studentId = textField(body, 'studentId');
    if (!studentId) return json({ error: 'Falta studentId.' }, 400);
    const { data: student, error: studentError } = await admin.from('students').select('id,user_id,slug').eq('id', studentId).maybeSingle();
    if (studentError || !student) return json({ error: 'Estudiante no encontrado.' }, 404);

    if (request.method === 'DELETE') {
      if (student.user_id === authData.user.id) return json({ error: 'No puedes eliminar tu propia cuenta de administrador.' }, 400);
      const { error } = await admin.auth.admin.deleteUser(student.user_id);
      if (error) throw error;
      return json({ message: `Cuenta /${student.slug} eliminada.` });
    }

    if (request.method === 'PATCH') {
      const action = textField(body, 'action');
      if (action === 'activate' || action === 'deactivate') {
        const { error } = await admin.from('students').update({ is_active: action === 'activate' }).eq('id', student.id);
        if (error) throw error;
        return json({ message: action === 'activate' ? 'Cuenta reactivada.' : 'Cuenta desactivada.' });
      }
      if (action === 'reset-password') {
        const password = textField(body, 'password');
        if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
        const { error } = await admin.auth.admin.updateUserById(student.user_id, { password });
        if (error) throw error;
        return json({ message: 'Contraseña actualizada.' });
      }
      return json({ error: 'Acción no reconocida.' }, 400);
    }
    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado.';
    return json({ error: message }, 500);
  }
});
