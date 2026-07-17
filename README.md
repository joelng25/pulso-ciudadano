# Pulso Ciudadano — Encuesta de opinión electoral

Web de registro y votación de opinión (no oficial) con resultados en vivo,
usando [Supabase](https://supabase.com) como base de datos gratuita.

## 1. Crear el backend en Supabase (5 min)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita.
2. Crea un **New project** (elige nombre, contraseña de base de datos y región).
3. En el menú lateral, abre **SQL Editor** → **New query**.
4. Copia y pega todo el contenido del archivo `supabase-setup.sql` de este
   proyecto y dale a **Run**. Esto crea las tablas `votes` y `candidates`
   con los permisos correctos.
5. Ve a **Project Settings** → **API**. Copia dos valores:
   - `Project URL`
   - `anon public` key

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env
```

Abre `.env` y pega ahí los dos valores del paso anterior:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-public
```

Pruébalo local:

```bash
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

## 3. Subir a GitHub

```bash
git init
git add .
git commit -m "Primera versión de Pulso Ciudadano"
```

Crea un repositorio nuevo y vacío en [github.com/new](https://github.com/new)
(sin README, sin .gitignore — ya los tenemos). Luego:

```bash
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

**Importante:** el archivo `.env` está en `.gitignore` a propósito — nunca
subas tus claves a GitHub. Cada plataforma de despliegue (paso 4) te dejará
configurarlas por separado, de forma segura.

## 4. Desplegar la web (gratis)

La forma más simple es **Vercel**:

1. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. **Add New → Project** y selecciona tu repositorio.
3. Vercel detecta Vite automáticamente. Antes de darle a Deploy, abre
   **Environment Variables** y añade:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (los mismos valores de tu `.env`)
4. Dale a **Deploy**. En un minuto tendrás una URL pública tipo
   `https://tu-proyecto.vercel.app`.

(Netlify funciona igual de bien, con el mismo tipo de configuración de
variables de entorno.)

## Notas

- El correo electrónico es único en la base de datos: si alguien intenta
  votar dos veces con el mismo correo, la base de datos lo rechaza y la
  web le muestra su voto original.
- El botón de engranaje (⚙️) en la esquina superior derecha abre el "modo
  administrador" para añadir nuevas listas/candidaturas sin tocar código.
- Al ser un formulario público sin login, cualquiera que conozca la URL
  puede votar con cualquier correo (no se verifica que sea suyo). Si
  necesitas evitar correos falsos o votos automatizados, el siguiente paso
  natural sería añadir autenticación por email (Supabase Auth incluye
  "magic links") — dímelo si quieres que te lo prepare.
