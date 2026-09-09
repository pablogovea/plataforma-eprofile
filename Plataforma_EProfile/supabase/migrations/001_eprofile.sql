-- Plataforma EProfile - esquema inicial, RLS y publicación atómica.
-- Ejecutar en Supabase SQL Editor como propietario del proyecto.

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$ begin
  create type public.app_role as enum ('estudiante', 'admin_plataforma');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.profile_status as enum ('borrador', 'publicado');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.pdf_template as enum ('clasica', 'moderna', 'minimalista');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'estudiante',
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug citext not null unique check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  career text not null default '' check (char_length(career) <= 160),
  bio text not null default '' check (char_length(bio) <= 1200),
  photo_url text,
  pdf_template public.pdf_template not null default 'clasica',
  status public.profile_status not null default 'borrador',
  published_snapshot jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.formations (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  institution text not null, degree text not null, start_date date, end_date date,
  description text not null default '', sort_order integer not null default 0
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  organization text not null, position text not null, start_date date, end_date date,
  description text not null default '', sort_order integer not null default 0
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  name text not null, category text not null default 'General', level smallint check (level between 1 and 5),
  sort_order integer not null default 0
);
create table if not exists public.recognitions (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  title text not null, issuer text not null default '', awarded_on date, description text not null default '',
  url text, sort_order integer not null default 0
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.students(id) on delete cascade,
  name text not null, description text not null default '', technologies text[] not null default '{}',
  role text not null default '', repository_url text, live_url text, is_academic boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(), student_id uuid not null unique references public.students(id) on delete cascade,
  email text not null default '', phone text not null default '', linkedin_url text, github_url text,
  website_url text, location text not null default '', updated_at timestamptz not null default now()
);

create index if not exists formations_student_order_idx on public.formations(student_id, sort_order);
create index if not exists experiences_student_order_idx on public.experiences(student_id, sort_order);
create index if not exists skills_student_order_idx on public.skills(student_id, sort_order);
create index if not exists recognitions_student_order_idx on public.recognitions(student_id, sort_order);
create index if not exists projects_student_order_idx on public.projects(student_id, sort_order);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists students_touch on public.students;
create trigger students_touch before update on public.students for each row execute function public.touch_updated_at();
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists contacts_touch on public.contacts;
create trigger contacts_touch before update on public.contacts for each row execute function public.touch_updated_at();

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin_plataforma'
  );
$$;

create or replace function public.owns_student(target_student_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.students
    where id = target_student_id and user_id = (select auth.uid()) and is_active
  );
$$;

revoke all on function public.is_platform_admin() from public;
revoke all on function public.owns_student(uuid) from public;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.owns_student(uuid) to authenticated;

alter table public.user_roles enable row level security;
alter table public.students enable row level security;
alter table public.profiles enable row level security;
alter table public.formations enable row level security;
alter table public.experiences enable row level security;
alter table public.skills enable row level security;
alter table public.recognitions enable row level security;
alter table public.projects enable row level security;
alter table public.contacts enable row level security;

drop policy if exists user_roles_read on public.user_roles;
create policy user_roles_read on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or public.is_platform_admin());
drop policy if exists students_read on public.students;
create policy students_read on public.students for select to authenticated
using (user_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
using (public.owns_student(student_id) or public.is_platform_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());

drop policy if exists formations_owner_all on public.formations;
create policy formations_owner_all on public.formations for all to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());
drop policy if exists experiences_owner_all on public.experiences;
create policy experiences_owner_all on public.experiences for all to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());
drop policy if exists skills_owner_all on public.skills;
create policy skills_owner_all on public.skills for all to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());
drop policy if exists recognitions_owner_all on public.recognitions;
create policy recognitions_owner_all on public.recognitions for all to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());
drop policy if exists projects_owner_all on public.projects;
create policy projects_owner_all on public.projects for all to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());
drop policy if exists contacts_owner_all on public.contacts;
create policy contacts_owner_all on public.contacts for all to authenticated
using (public.owns_student(student_id) or public.is_platform_admin())
with check (public.owns_student(student_id) or public.is_platform_admin());

-- Cualquier cambio de contenido vuelve el área de trabajo a borrador, sin borrar el snapshot público anterior.
create or replace function public.mark_profile_draft()
returns trigger language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  sid := coalesce(new.student_id, old.student_id);
  update public.profiles set status = 'borrador' where student_id = sid and status <> 'borrador';
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists formations_draft on public.formations;
drop trigger if exists experiences_draft on public.experiences;
drop trigger if exists skills_draft on public.skills;
drop trigger if exists recognitions_draft on public.recognitions;
drop trigger if exists projects_draft on public.projects;
drop trigger if exists contacts_draft on public.contacts;
create trigger formations_draft after insert or update or delete on public.formations for each row execute function public.mark_profile_draft();
create trigger experiences_draft after insert or update or delete on public.experiences for each row execute function public.mark_profile_draft();
create trigger skills_draft after insert or update or delete on public.skills for each row execute function public.mark_profile_draft();
create trigger recognitions_draft after insert or update or delete on public.recognitions for each row execute function public.mark_profile_draft();
create trigger projects_draft after insert or update or delete on public.projects for each row execute function public.mark_profile_draft();
create trigger contacts_draft after insert or update or delete on public.contacts for each row execute function public.mark_profile_draft();

create or replace function public.profile_content_marks_draft()
returns trigger language plpgsql set search_path = '' as $$
begin
  if row(new.full_name, new.career, new.bio, new.photo_url, new.pdf_template)
     is distinct from row(old.full_name, old.career, old.bio, old.photo_url, old.pdf_template) then
    new.status := 'borrador';
  end if;
  return new;
end;
$$;
drop trigger if exists profile_content_draft on public.profiles;
create trigger profile_content_draft before update on public.profiles for each row execute function public.profile_content_marks_draft();

drop function if exists public.publish_profile(uuid);
create function public.publish_profile(target_student_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb; p public.profiles;
begin
  if not (public.owns_student(target_student_id) or public.is_platform_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  select * into p from public.profiles where student_id = target_student_id for update;
  if p.id is null then raise exception 'Perfil no encontrado' using errcode = 'P0002'; end if;
  if nullif(btrim(p.full_name), '') is null or nullif(btrim(p.career), '') is null then
    raise exception 'Nombre y carrera son obligatorios para publicar' using errcode = '23514';
  end if;

  select jsonb_build_object(
    'student', jsonb_build_object('id', s.id, 'slug', s.slug::text, 'is_active', s.is_active),
    'profile', jsonb_build_object(
      'id', p.id, 'student_id', p.student_id, 'full_name', p.full_name, 'career', p.career,
      'bio', p.bio, 'photo_url', p.photo_url, 'pdf_template', p.pdf_template,
      'status', 'publicado', 'published_at', now(), 'created_at', p.created_at, 'updated_at', p.updated_at
    ),
    'formations', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.formations x where x.student_id = s.id), '[]'::jsonb),
    'experiences', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.experiences x where x.student_id = s.id), '[]'::jsonb),
    'skills', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.skills x where x.student_id = s.id), '[]'::jsonb),
    'recognitions', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.recognitions x where x.student_id = s.id), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order) from public.projects x where x.student_id = s.id), '[]'::jsonb),
    'contact', (select to_jsonb(c) from public.contacts c where c.student_id = s.id)
  ) into result from public.students s where s.id = target_student_id and s.is_active;

  if result is null then raise exception 'La cuenta está inactiva' using errcode = '23514'; end if;
  update public.profiles set published_snapshot = result, published_at = now(), status = 'publicado'
  where student_id = target_student_id;
  return result;
end;
$$;

drop function if exists public.save_profile_bundle(uuid, jsonb);
create function public.save_profile_bundle(target_student_id uuid, payload jsonb)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not (public.owns_student(target_student_id) or public.is_platform_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  update public.profiles set
    full_name = coalesce(payload #>> '{profile,full_name}', ''),
    career = coalesce(payload #>> '{profile,career}', ''),
    bio = coalesce(payload #>> '{profile,bio}', ''),
    photo_url = nullif(payload #>> '{profile,photo_url}', ''),
    pdf_template = coalesce((payload #>> '{profile,pdf_template}')::public.pdf_template, 'clasica'),
    status = 'borrador'
  where student_id = target_student_id;

  delete from public.formations where student_id = target_student_id;
  insert into public.formations(student_id, institution, degree, start_date, end_date, description, sort_order)
  select target_student_id, x.institution, x.degree, nullif(x.start_date, '')::date,
    nullif(x.end_date, '')::date, coalesce(x.description, ''), x.sort_order
  from jsonb_to_recordset(coalesce(payload->'formations', '[]'::jsonb))
    as x(institution text, degree text, start_date text, end_date text, description text, sort_order integer);

  delete from public.experiences where student_id = target_student_id;
  insert into public.experiences(student_id, organization, position, start_date, end_date, description, sort_order)
  select target_student_id, x.organization, x.position, nullif(x.start_date, '')::date,
    nullif(x.end_date, '')::date, coalesce(x.description, ''), x.sort_order
  from jsonb_to_recordset(coalesce(payload->'experiences', '[]'::jsonb))
    as x(organization text, position text, start_date text, end_date text, description text, sort_order integer);

  delete from public.skills where student_id = target_student_id;
  insert into public.skills(student_id, name, category, level, sort_order)
  select target_student_id, x.name, coalesce(x.category, 'General'), x.level, x.sort_order
  from jsonb_to_recordset(coalesce(payload->'skills', '[]'::jsonb))
    as x(name text, category text, level smallint, sort_order integer);

  delete from public.recognitions where student_id = target_student_id;
  insert into public.recognitions(student_id, title, issuer, awarded_on, description, url, sort_order)
  select target_student_id, x.title, coalesce(x.issuer, ''), nullif(x.awarded_on, '')::date,
    coalesce(x.description, ''), nullif(x.url, ''), x.sort_order
  from jsonb_to_recordset(coalesce(payload->'recognitions', '[]'::jsonb))
    as x(title text, issuer text, awarded_on text, description text, url text, sort_order integer);

  delete from public.projects where student_id = target_student_id;
  insert into public.projects(student_id, name, description, technologies, role, repository_url, live_url, is_academic, sort_order)
  select target_student_id, x.name, coalesce(x.description, ''), coalesce(x.technologies, '{}'),
    coalesce(x.role, ''), nullif(x.repository_url, ''), nullif(x.live_url, ''), coalesce(x.is_academic, true), x.sort_order
  from jsonb_to_recordset(coalesce(payload->'projects', '[]'::jsonb))
    as x(name text, description text, technologies text[], role text, repository_url text, live_url text, is_academic boolean, sort_order integer);

  insert into public.contacts(student_id, email, phone, linkedin_url, github_url, website_url, location)
  values (
    target_student_id, coalesce(payload #>> '{contact,email}', ''), coalesce(payload #>> '{contact,phone}', ''),
    nullif(payload #>> '{contact,linkedin_url}', ''), nullif(payload #>> '{contact,github_url}', ''),
    nullif(payload #>> '{contact,website_url}', ''), coalesce(payload #>> '{contact,location}', '')
  ) on conflict (student_id) do update set
    email = excluded.email, phone = excluded.phone, linkedin_url = excluded.linkedin_url,
    github_url = excluded.github_url, website_url = excluded.website_url, location = excluded.location;
  return true;
end;
$$;

drop function if exists public.get_public_profile(text);
create function public.get_public_profile(requested_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select p.published_snapshot
  from public.students s join public.profiles p on p.student_id = s.id
  where lower(s.slug::text) = lower(requested_slug)
    and s.is_active
    and p.published_snapshot is not null;
$$;

revoke all on function public.publish_profile(uuid) from public;
revoke all on function public.save_profile_bundle(uuid, jsonb) from public;
revoke all on function public.get_public_profile(text) from public;
grant execute on function public.publish_profile(uuid) to authenticated;
grant execute on function public.save_profile_bundle(uuid, jsonb) to authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.user_roles, public.students, public.profiles to authenticated;
grant update (full_name, career, bio, photo_url, pdf_template) on public.profiles to authenticated;
grant select, insert, update, delete on public.formations, public.experiences, public.skills, public.recognitions, public.projects, public.contacts to authenticated;

-- Fotos: cree el bucket y limite cada objeto a la carpeta del user_id autenticado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-photos', 'profile-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_photos_insert on storage.objects;
drop policy if exists profile_photos_update on storage.objects;
drop policy if exists profile_photos_delete on storage.objects;
drop policy if exists profile_photos_public_read on storage.objects;
create policy profile_photos_insert on storage.objects for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy profile_photos_update on storage.objects for update to authenticated
using (bucket_id = 'profile-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_platform_admin()))
with check (bucket_id = 'profile-photos');
create policy profile_photos_delete on storage.objects for delete to authenticated
using (bucket_id = 'profile-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_platform_admin()));
create policy profile_photos_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'profile-photos');

-- Tras crear manualmente el primer usuario en Authentication, promuévalo una sola vez:
-- insert into public.user_roles(user_id, role) values ('UUID_DEL_USUARIO', 'admin_plataforma');

commit;
