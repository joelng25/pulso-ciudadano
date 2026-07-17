# Guía de instalación y despliegue

Instrucciones completas para montar tu propia copia de Pulso Ciudadano.

## 1. Backend (Supabase)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de [`supabase-setup.sql`](./supabase-setup.sql).
3. Copia tu `Project URL` y tu clave `anon public` desde **Project Settings → API**.

## 2. Frontend (local)

```bash
npm install
cp .env.example .env
# pega tus claves de Supabase en .env
npm run dev
```

## 3. Desplegar

Conecta el repo a [Vercel](https://vercel.com) o [Netlify](https://netlify.com),
añade las mismas variables de entorno (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) en el panel del proyecto, y despliega.

## 4. Activar "Continuar con Google" (opcional)

Esto requiere dos configuraciones externas (una en Google, una en Supabase):

### A. Crear credenciales en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) → crea o
   selecciona un proyecto.
2. **APIs & Services → OAuth consent screen** → configúralo como *External*,
   rellena nombre de la app y correo de soporte.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Tipo de aplicación: **Web application**.
   - En **Authorized redirect URIs** añade:
     ```
     https://TU-PROYECTO.supabase.co/auth/v1/callback
     ```
     (sustituye `TU-PROYECTO` por el ref de tu proyecto Supabase, lo ves en
     la URL de tu dashboard).
4. Guarda y copia el **Client ID** y el **Client Secret**.

### B. Activarlo en Supabase

1. En tu proyecto Supabase: **Authentication → Providers → Google**.
2. Actívalo y pega el **Client ID** y **Client Secret** del paso anterior.
3. En **Authentication → URL Configuration**, añade en **Redirect URLs**
   tanto tu URL de producción (`https://tu-app.vercel.app`) como
   `http://localhost:5173` (para probar en local).
4. Guarda.

### Si ya tenías el proyecto de Supabase creado antes de este cambio

Las políticas de seguridad (RLS) cambiaron de `to anon` a `to public` para
cubrir también a la gente que entra con Google. Ejecuta esto una vez en el
**SQL Editor** de Supabase:

```sql
drop policy "public read candidates" on candidates;
drop policy "public read votes" on votes;
drop policy "public insert votes" on votes;

create policy "public read candidates" on candidates for select to public using (true);
create policy "public read votes" on votes for select to public using (true);
create policy "public insert votes" on votes for insert to public with check (true);
```

### Si ya tenías el proyecto de Supabase creado antes de la opción "cambiar mi voto"

Cambiar el voto usa `upsert`, que necesita permiso de `UPDATE` además de `INSERT`.
Ejecuta esto una vez en el **SQL Editor** de Supabase:

```sql
create policy "public update votes" on votes
  for update to public using (true) with check (true);
```

## 5. Editar las listas/candidaturas

No hay modo administrador en la interfaz. Para añadir o cambiar listas, entra
a Supabase → **Table Editor** → tabla `candidates` y edita las filas
directamente (o usa el SQL Editor con
`insert into candidates (label, sort_order) values (...)`).

## 6. Cambiar los colores del gráfico

Cada candidatura puede tener su propio color, editable en cualquier momento:

1. Supabase → **Table Editor** → tabla `candidates`.
2. En la columna `color`, escribe un código hexadecimal, por ejemplo `#0056A3`.
3. Guarda. Al recargar la web, el gráfico de barras usa ese color.

Si dejas la celda `color` vacía, esa candidatura usa un color de la paleta
genérica por defecto.

## Estructura del proyecto

```
├── src/
│   ├── App.jsx           # Componente principal (registro, voto, resultados)
│   ├── main.jsx          # Punto de entrada de React
│   ├── supabaseClient.js # Cliente de Supabase
│   └── index.css         # Tailwind
├── supabase-setup.sql    # Script para crear las tablas en Supabase
├── .env.example           # Plantilla de variables de entorno
└── vite.config.js
```

## Seguridad y limitaciones

- No hay autenticación por correo (magic link) — cualquiera con la URL puede
  votar con cualquier correo, sin verificarlo. Para un sondeo más riguroso,
  el siguiente paso sería añadir Supabase Auth con verificación por email.
- Las políticas de Row Level Security de Supabase permiten lectura e
  inserción pública, ya que es una encuesta abierta sin login.
