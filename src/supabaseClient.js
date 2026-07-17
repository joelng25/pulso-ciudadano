import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si faltan las variables de entorno, createClient() lanza un error y
// deja la página en blanco sin ninguna pista. En vez de eso, usamos una
// URL de relleno (las llamadas fallarán, pero de forma controlada) y
// exponemos isSupabaseConfigured para mostrar un aviso claro en la interfaz.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env (local) o las variables de entorno de tu plataforma de despliegue (Vercel/Netlify)."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
