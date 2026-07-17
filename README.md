# Pulso Ciudadano

Web de sondeo de opinión electoral (no oficial): la gente se registra, marca su
preferencia entre listas/candidaturas y puede ver los resultados agregados en
tiempo real.

> ⚠️ Este proyecto es una **encuesta de opinión independiente**, no un proceso
> electoral oficial ni un sistema de votación certificado.

## Funcionalidades

- **Registro de votantes** — con Google (un clic) o con nombre, correo y
  región/ciudad escritos a mano.
- **Una persona, un voto** — el correo es único a nivel de base de datos, así
  que no se puede votar dos veces (y si lo intentas, te muestra tu elección
  original).
- **Votación por listas** — interfaz tipo papeleta.
- **Resultados en vivo** — gráfico de barras, recuento estilo "marcas de
  conteo manual" y desglose de participación por región.

## Stack técnico

| Parte      | Tecnología                                  |
| ---------- | ------------------------------------------- |
| Frontend   | React 18 + Vite                             |
| Estilos    | Tailwind CSS + estilos personalizados       |
| Gráficos   | Recharts                                    |
| Iconos     | lucide-react                                |
| Backend/BD | [Supabase](https://supabase.com) (Postgres) |
| Despliegue | Vercel / Netlify                            |

## Empezar

### 1. Backend (Supabase)

1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta el contenido de [`supabase-setup.sql`](./supabase-setup.sql).
3. Copia tu `Project URL` y tu clave `anon public` desde **Project Settings → API**.

### 2. Frontend (local)

```bash
npm install
cp .env.example .env
# pega tus claves de Supabase en .env
npm run dev
```

### 3. Desplegar

Conecta el repo a [Vercel](https://vercel.com) o [Netlify](https://netlify.com),
añade las mismas variables de entorno (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`) en el panel del proyecto, y despliega.

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

## Activar "Continuar con Google"

Esto requiere dos configuraciones externas (una en Google, una en Supabase):

### A. Crear credenciales en Google Cloud

1. Ve a [console.cloud.google.com](https://console.cloud.google.com) → crea o
   selecciona un proyecto.
2. **APIs & Services → OAuth consent screen** → configúralo como _External_,
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

Con eso, el botón "Continuar con Google" del sitio ya funciona.

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

## Editar las listas/candidaturas

Como ya no hay modo administrador en la interfaz, para añadir o cambiar
listas entra a Supabase → **Table Editor** → tabla `candidates` y edita las
filas directamente (o usa el SQL Editor con `insert into candidates (label, sort_order) values (...)`).

## Seguridad y limitaciones

- No hay autenticación por correo (magic link) — cualquiera con la URL puede
  votar con cualquier correo, sin verificarlo. Para un sondeo más riguroso,
  el siguiente paso sería añadir Supabase Auth con verificación por email.
- Las políticas de Row Level Security de Supabase permiten lectura e
  inserción pública, ya que es una encuesta abierta sin login.

## Licencia

MIT — úsalo, modifícalo y despliega tu propia versión libremente.
