# 🗳️ Pulso Ciudadano

Web de sondeo de opinión electoral (no oficial): la gente se registra, marca su
preferencia entre listas/candidaturas y puede ver los resultados agregados en
tiempo real.

> ⚠️ Este proyecto es una **encuesta de opinión independiente**, no un proceso
> electoral oficial ni un sistema de votación certificado.

## ✨ Funcionalidades

- **Registro de votantes** — nombre, correo y región/ciudad.
- **Una persona, un voto** — el correo es único a nivel de base de datos, así
  que no se puede votar dos veces (y si lo intentas, te muestra tu elección
  original).
- **Votación por listas** — interfaz tipo papeleta.
- **Resultados en vivo** — gráfico de barras, recuento estilo "marcas de
  conteo manual" y desglose de participación por región.

## 🧱 Stack técnico

| Parte      | Tecnología                         |
|------------|-------------------------------------|
| Frontend   | React 18 + Vite                     |
| Estilos    | Tailwind CSS + estilos personalizados |
| Gráficos   | Recharts                            |
| Iconos     | lucide-react                        |
| Backend/BD | [Supabase](https://supabase.com) (Postgres) |
| Despliegue | Vercel / Netlify                    |

## 🚀 Empezar

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

## 📁 Estructura del proyecto

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

## ✏️ Editar las listas/candidaturas

Como ya no hay modo administrador en la interfaz, para añadir o cambiar
listas entra a Supabase → **Table Editor** → tabla `candidates` y edita las
filas directamente (o usa el SQL Editor con `insert into candidates (label, sort_order) values (...)`).

## 🔒 Seguridad y limitaciones

- No hay autenticación por correo (magic link) — cualquiera con la URL puede
  votar con cualquier correo, sin verificarlo. Para un sondeo más riguroso,
  el siguiente paso sería añadir Supabase Auth con verificación por email.
- Las políticas de Row Level Security de Supabase permiten lectura e
  inserción pública, ya que es una encuesta abierta sin login.

## 📜 Licencia

MIT — úsalo, modifícalo y despliega tu propia versión libremente.
