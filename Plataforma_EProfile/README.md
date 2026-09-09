# Plataforma EProfile

Aplicación móvil primero para publicar tarjetas profesionales digitales por una ruta permanente, administrar borradores y generar CV, QR y vCard desde una sola fuente de datos.

## Arquitectura

- React + TypeScript + Vite y Tailwind CSS.
- Supabase Auth, Postgres con RLS, Storage y una Edge Function administrativa.
- `profiles.published_snapshot` conserva la última versión pública. Editar vuelve el área de trabajo a `borrador`, pero el visitante continúa viendo el snapshot anterior hasta la siguiente publicación.
- El navegador usa únicamente la publishable key. La service role key existe solo dentro de la Edge Function de Supabase.

## Puesta en marcha

1. Instala las dependencias con `npm install`.
2. Crea el archivo `.env` desde la configuración incluida. En PowerShell:

```powershell
Copy-Item .env.example .env
```

   El nombre debe ser exactamente `.env`, no `.env.txt`. Si Vite ya estaba abierto, detenlo con `Ctrl+C` y vuelve a ejecutar `npm run dev` para que lea las variables.
3. Abre el SQL Editor de Supabase y ejecuta `supabase/migrations/001_eprofile.sql` completo.
4. Crea el primer usuario administrador desde Authentication > Users. Después, ejecuta en SQL Editor, reemplazando el correo por el de esa cuenta:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin_plataforma'::public.app_role
from auth.users
where email = 'administrador@tu-dominio.com';
```

5. Vincula la CLI y despliega la función segura de cuentas:

```bash
npx supabase login
npx supabase link --project-ref chqvslrdisnzfboskcsv
npx supabase functions deploy admin-users
```

6. Ejecuta `npm run dev` y abre la URL indicada por Vite.

## Rutas

- `/:slug`: perfil público; solo consume el snapshot publicado.
- `/:slug/admin`: editor del propietario o de un administrador de plataforma.
- `/admin`: altas, listado, activación, desactivación, eliminación, reinicio de contraseña y acceso asistido a cualquier perfil.

## Flujo de prueba

1. Inicia sesión en `/admin` con la cuenta promovida.
2. Crea un estudiante con correo, contraseña temporal y slug.
3. Abre la acción de edición, completa nombre y carrera y guarda el borrador.
4. Comprueba que la ruta pública todavía no enseña el borrador.
5. Previsualiza, publica y abre `/:slug` en una ventana privada.
6. Edita nuevamente sin publicar: la ruta pública conserva la versión publicada anterior.
7. Verifica QR, descarga PDF y exportación vCard.

## Seguridad y operación

- Los estudiantes no pueden consultar ni mutar filas de otro estudiante; las políticas comparan `auth.uid()` con el propietario.
- `admin_plataforma` puede asistir cualquier perfil, pero la gestión de Auth se valida otra vez dentro de la Edge Function.
- Desactivar una cuenta oculta inmediatamente su ruta pública y hace que sus políticas de propietario fallen.
- La eliminación borra el usuario de Auth; las claves foráneas con `on delete cascade` retiran el contenido asociado.
- Las fotografías se limitan a 5 MB y a JPEG, PNG o WebP.
- Para respaldo, programe copias de Postgres desde Supabase y conserve el bucket `profile-photos`.

## Verificación local

```bash
npm run build
npm audit
```

La compilación usa TypeScript estricto. El proyecto no contiene contraseñas ni service role keys.
